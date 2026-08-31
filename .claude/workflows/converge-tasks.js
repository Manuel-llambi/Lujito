export const meta = {
  name: 'converge-tasks',
  description: 'Converge a spec tasks.md to CRITERIA MET with parallel read-only planners and one sequential writer',
  whenToUse: 'A spec folder has approved requirements.md and design.md, and its tasks.md must be bootstrapped or re-converged until every task reaches CRITERIA MET. Pass the spec folder as args, or omit it to let the scout resolve the only candidate.',
  phases: [
    { title: 'Scout', detail: 'resolve the spec folder and read the task index' },
    { title: 'Outline', detail: 'draft the task index when no usable list exists' },
    { title: 'Draft', detail: 'one planner per task writes its section' },
    { title: 'Evaluate', detail: 'one read-only planner per task, in parallel' },
    { title: 'Synthesize', detail: 'merge the proposals and rebuild both tables' },
    { title: 'Persist', detail: 'the single writer applies the patch set' },
  ],
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Everything below is generic: no spec, feature or task ID is hardcoded. The
// only project-specific knowledge lives in the prompts, which describe the
// tasks.md section layout that .claude/Skills/specify/assets/tasks-template.md
// defines.

const opts = args && typeof args === 'object' && !Array.isArray(args)
  ? args
  : { specFolder: typeof args === 'string' ? args : '' }

const specHint = opts.specFolder || ''
// One planner per task is the default. Raise it to trade per-task focus for a
// smaller agent count on very large specs.
const TASKS_PER_PLANNER = Math.max(1, opts.tasksPerPlanner || 1)
// One round by default: the writer's output over a 200 KB file gets inspected
// before anything is allowed to patch it three more times. Raise it once the
// patch quality is trusted for this spec.
const MAX_ROUNDS = Math.max(1, opts.maxRounds || 1)
// Mirrors the planning-task escalation rule: three consecutive NEEDS ITERATION
// on one task means a structural gap in the spec, not a hard task.
const MAX_ATTEMPTS_PER_TASK = 3
// Section bodies are ~5 KB each. Chunking keeps every writer call bounded and,
// far more importantly, keeps writers strictly sequential.
const SECTIONS_PER_WRITE = 6

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const TASK_INDEX_ITEM = {
  type: 'object',
  required: ['id', 'title', 'done'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    done: { type: 'boolean' },
    requisitos: { type: 'array', items: { type: 'string' } },
    dependsOn: { type: 'array', items: { type: 'string' } },
  },
}

const SCOUT_SCHEMA = {
  type: 'object',
  required: ['specFolder', 'requirementsOk', 'designOk', 'mode', 'tasks', 'blockers'],
  properties: {
    specFolder: { type: 'string', description: 'Repo-relative path of the spec folder' },
    requirementsOk: { type: 'boolean' },
    designOk: { type: 'boolean' },
    mode: { enum: ['from-scratch', 'iterative'] },
    tasksPath: { type: 'string' },
    tasks: { type: 'array', items: TASK_INDEX_ITEM },
    blockers: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const OUTLINE_SCHEMA = {
  type: 'object',
  required: ['tasks', 'headerText', 'resumenTable'],
  properties: {
    // The outline stays deliberately thin. Full section bodies are drafted by
    // the fan-out, because one agent cannot emit a 200 KB document.
    tasks: { type: 'array', items: TASK_INDEX_ITEM },
    headerText: { type: 'string', description: 'Title plus the Estado/Fecha/Requisitos/Diseño block' },
    resumenTable: { type: 'string', description: 'Full body of the "## Resumen de tareas" section' },
    coberturaTable: { type: 'string', description: 'Full body of the "## Cobertura de requisitos" section' },
    findings: { type: 'array', items: { type: 'string' } },
    userDecisions: { type: 'array', items: { type: 'string' } },
  },
}

const STRUCTURAL_OP = {
  type: 'object',
  required: ['op', 'detail'],
  properties: {
    op: { enum: ['split', 'merge', 'remove', 'new'] },
    detail: { type: 'string' },
    // Ready-to-persist bodies for tasks this op creates. The synthesizer
    // assigns their IDs; the script pulls the text from here.
    proposedSections: { type: 'array', items: { type: 'string' } },
  },
}

const PROPOSAL = {
  type: 'object',
  required: ['taskId', 'verdict', 'changed', 'newSectionText', 'summaryRow', 'findings', 'userDecisions'],
  properties: {
    taskId: { type: 'string' },
    verdict: { enum: ['CRITERIA MET', 'NEEDS ITERATION'] },
    changed: { type: 'boolean' },
    newSectionText: { type: 'string', description: 'Full replacement section, or "" when changed is false' },
    summaryRow: { type: 'string', description: 'This task\'s row for the Resumen table' },
    requisitos: { type: 'array', items: { type: 'string' } },
    dependsOn: { type: 'array', items: { type: 'string' } },
    structuralOps: { type: 'array', items: STRUCTURAL_OP },
    findings: { type: 'array', items: { type: 'string' } },
    userDecisions: { type: 'array', items: { type: 'string' } },
    next: { type: 'string' },
  },
}

const BATCH_SCHEMA = {
  type: 'object',
  required: ['proposals'],
  properties: { proposals: { type: 'array', items: PROPOSAL } },
}

const MERGE_SCHEMA = {
  type: 'object',
  required: ['allConverged', 'taskIndex', 'resumenTable', 'openItems', 'conflicts'],
  properties: {
    allConverged: { type: 'boolean' },
    taskIndex: { type: 'array', items: TASK_INDEX_ITEM },
    resumenTable: { type: 'string' },
    coberturaTable: { type: 'string' },
    removals: { type: 'array', items: { type: 'string' } },
    newTasks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'fromTaskId', 'fromOpIndex', 'fromSectionIndex'],
        properties: {
          id: { type: 'string', description: 'Next free ID — never reuse a retired one' },
          title: { type: 'string' },
          afterId: { type: 'string', description: 'Insert the new section right after this task' },
          fromTaskId: { type: 'string' },
          fromOpIndex: { type: 'integer' },
          fromSectionIndex: { type: 'integer' },
        },
      },
    },
    openItems: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' } },
  },
}

const WRITE_SCHEMA = {
  type: 'object',
  required: ['ok', 'applied', 'notApplied', 'verification'],
  properties: {
    ok: { type: 'boolean' },
    applied: { type: 'array', items: { type: 'string' } },
    notApplied: { type: 'array', items: { type: 'string' } },
    verification: { type: 'string', description: 'Real heading counts and sync checks, not an intention' },
  },
}

// ---------------------------------------------------------------------------
// Shared prompt fragments
// ---------------------------------------------------------------------------

const LAYOUT = `
Layout de \`tasks.md\` (definido por .claude/Skills/specify/assets/tasks-template.md):
- \`# Tareas — <feature>\` y un bloque de metadatos (Estado, Fecha, Requisitos, Diseño).
- \`## Resumen de tareas\` — tabla | ID | Tarea | Requisitos | Estado |.
- \`## Cobertura de requisitos\` — tabla que cruza cada criterio numerado contra las tareas que lo cubren.
- Una \`## T<n> — <título>\` por tarea, con **Requisitos:**, **Depende de:**, **Descripción:**,
  **Criterios de aceptación**, **Decision log:** y **Outcome:**.
Una sección va desde su heading hasta la línea anterior al \`## \` siguiente.`

const NO_WRITE = `
REGLA DURA: sos read-only. No tenés Edit ni Write. Corrés en paralelo con otros planners
sobre este mismo archivo — cualquier intento de escribirlo lo corrompe. Tu salida estructurada
ES el entregable: un único agente tasks-writer la persiste después, en solitario.`

const BIG_FILE = `
\`tasks.md\` puede superar los 200 KB. NO lo leas entero: usá Grep con \`^## \` para ubicar los
headings y sus líneas, y Read con offset/limit para traer solo las tablas del principio y la
sección exacta que te toca.`

function specBlock(folder) {
  return `Carpeta del spec: \`${folder}\`
- Requisitos: \`${folder}/requirements.md\`
- Diseño: \`${folder}/design.md\`
- Tareas: \`${folder}/tasks.md\``
}

// ---------------------------------------------------------------------------
// Phase 1 — Scout
// ---------------------------------------------------------------------------

phase('Scout')

const scout = await agent(
  `Reconocé el estado de planificación de un spec. Es un relevamiento de solo lectura: no modifiques nada.

${specHint
    ? `Carpeta del spec indicada por el usuario: \`${specHint}\`. Verificá que exista.`
    : 'No se indicó carpeta. Listá `docs/specs/` y elegí la única candidata con requirements.md y design.md. Si hay más de una, devolvela como blocker en vez de adivinar.'}

Determiná:
1. \`specFolder\` — la ruta repo-relativa resuelta.
2. \`requirementsOk\` / \`designOk\` — si cada archivo existe y tiene contenido real (no un template sin completar).
3. \`mode\` — \`from-scratch\` si no existe \`tasks.md\` o no tiene ninguna sección \`## T\`; \`iterative\` en caso contrario.
4. \`tasks\` — el índice de tareas leído de la tabla \`## Resumen de tareas\` y de los headings \`## T<n>\`.
   Incluí TODAS las tareas, marcando \`done: true\` las que estén \`[x] Hecho\`. Array vacío si el modo es from-scratch.
5. \`blockers\` — todo lo que impida planificar: falta requirements.md o design.md, hay varias carpetas candidatas,
   la tabla de resumen y los headings no coinciden. Array vacío si no hay ninguno.

${BIG_FILE}
${LAYOUT}`,
  { agentType: 'Explore', schema: SCOUT_SCHEMA, label: 'scout', phase: 'Scout' },
)

if (!scout) {
  return { status: 'failed', reason: 'El scout no devolvió resultado.' }
}
if (!scout.requirementsOk || !scout.designOk) {
  return {
    status: 'blocked',
    reason: 'requirements.md y design.md tienen que estar aprobados antes de planificar tareas. Derivar a /specify o /brainstorming.',
    specFolder: scout.specFolder,
    blockers: scout.blockers || [],
  }
}
if ((scout.blockers || []).length) {
  return { status: 'blocked', reason: 'El scout encontró bloqueos.', specFolder: scout.specFolder, blockers: scout.blockers }
}

const specFolder = scout.specFolder
const tasksPath = scout.tasksPath || `${specFolder}/tasks.md`
const report = { openItems: [], findings: [], userDecisions: [], writes: [], rounds: [] }

log(`Spec: ${specFolder} · modo: ${scout.mode} · ${(scout.tasks || []).length} tareas en el índice`)

// ---------------------------------------------------------------------------
// Phase 2 — Router: bootstrap the file when there is no usable list
// ---------------------------------------------------------------------------

let index = (scout.tasks || []).slice()

if (scout.mode === 'from-scratch') {
  phase('Outline')

  // The outline is deliberately thin — IDs, titles and traces only. Full
  // section bodies come from the fan-out below, because no single agent can
  // emit a whole large tasks.md without truncating it.
  const outline = await agent(
    `Rol: **bootstrap**, primera mitad. Redactá el ÍNDICE de tareas de este spec — todavía no las secciones detalladas.

${specBlock(specFolder)}

Leé \`requirements.md\` y \`design.md\` completos y descomponé el diseño en una lista de tareas ordenada,
aplicando desde el arranque los cuatro criterios (tamaño de un ciclo TDD, alineación con el spec,
completitud de cobertura, necesidad contra el código que YA existe en el repo).

Devolvé:
- \`tasks\`: una entrada por tarea con \`id\` (T1, T2, …), \`title\`, \`requisitos\` (criterios numerados que traza),
  \`dependsOn\`, y \`done: false\`.
- \`headerText\`: el título y el bloque de metadatos, con Estado "Borrador".
- \`resumenTable\`: el cuerpo completo de \`## Resumen de tareas\`, con todas las tareas en \`[ ] Pendiente\`.
- \`coberturaTable\`: el cuerpo de \`## Cobertura de requisitos\`, cruzando cada criterio numerado de
  requirements.md contra las tareas que lo cubren.

${NO_WRITE}
${LAYOUT}`,
    { agentType: 'planner', schema: OUTLINE_SCHEMA, label: 'outline', phase: 'Outline' },
  )

  if (!outline || !(outline.tasks || []).length) {
    return { status: 'failed', reason: 'El bootstrap no produjo un índice de tareas.', specFolder }
  }

  index = outline.tasks
  report.findings.push(...(outline.findings || []))
  report.userDecisions.push(...(outline.userDecisions || []))
  log(`Bootstrap: ${index.length} tareas en el índice. Redactando secciones en paralelo.`)

  // Fan out the section drafting: each agent emits ~5 KB, never the whole file.
  phase('Draft')
  const drafts = (await parallel(
    index.map((t) => () =>
      agent(
        `Rol: **bootstrap**, segunda mitad. Redactá la sección detallada de UNA sola tarea.

${specBlock(specFolder)}

Tarea: **${t.id} — ${t.title}**
Requisitos que traza: ${(t.requisitos || []).join(', ') || 'derivalos de requirements.md'}
Depende de: ${(t.dependsOn || []).join(', ') || 'ninguno'}

Índice completo de tareas del spec, para que respetes el alcance ajeno y las dependencias:
${index.map((x) => `- ${x.id} — ${x.title}`).join('\n')}

Leé \`requirements.md\` y \`design.md\`, y relevá el código existente con Glob/Grep.
Devolvé UNA propuesta en \`proposals\` con:
- \`taskId\`: "${t.id}"
- \`changed\`: true
- \`newSectionText\`: la sección COMPLETA, arrancando exactamente en \`## ${t.id} — ${t.title}\` y terminando
  antes del \`## \` siguiente. Con **Requisitos:**, **Depende de:**, **Descripción:**, **Criterios de aceptación
  (trazados desde requirements.md):**, y **Decision log:** / **Outcome:** VACÍOS — se completan en la ejecución TDD.
- \`summaryRow\`: su fila de la tabla de Resumen.
- \`verdict\`: "NEEDS ITERATION" — un bootstrap nunca es definitivo.

${NO_WRITE}
${LAYOUT}`,
        { agentType: 'planner', schema: BATCH_SCHEMA, label: `draft:${t.id}`, phase: 'Draft' },
      ),
    ),
  ))
    .filter(Boolean)
    .flatMap((r) => r.proposals || [])

  const missing = index.filter((t) => !drafts.some((d) => d.taskId === t.id))
  if (missing.length) log(`Sin borrador: ${missing.map((t) => t.id).join(', ')} — quedan como pendientes para la ronda 1.`)

  // First and only full-document write. From here on the file is patched.
  phase('Persist')
  const created = await agent(
    `Creá \`${tasksPath}\` desde cero con el patch set \`fullDocument\`.

Orden exacto del archivo:
1. Este encabezado, literal:
---8<---
${outline.headerText}
---8<---
2. \`## Resumen de tareas\` seguido de:
---8<---
${outline.resumenTable}
---8<---
3. \`## Cobertura de requisitos\` seguido de:
---8<---
${outline.coberturaTable || '(sin tabla de cobertura — anotalo en notApplied)'}
---8<---
4. Las ${drafts.length} secciones de tarea, en este orden de ID: ${drafts.map((d) => d.taskId).join(', ')}.
   El texto de cada una viene abajo, delimitado. Copialo VERBATIM, sin reescribir una coma.

${drafts.map((d) => `=== SECCIÓN ${d.taskId} ===\n${d.newSectionText}\n=== FIN ${d.taskId} ===`).join('\n\n')}

Escribí en UTF-8. Después verificá los cinco chequeos de tu contrato y reportá los conteos reales.
Los marcadores \`---8<---\` y \`=== … ===\` son delimitadores de este mensaje: NO van al archivo.`,
    { agentType: 'tasks-writer', schema: WRITE_SCHEMA, label: 'write:bootstrap', phase: 'Persist' },
  )
  report.writes.push({ step: 'bootstrap', ok: !!(created && created.ok), verification: created && created.verification })
  if (!created || !created.ok) {
    return { status: 'failed', reason: 'No se pudo crear tasks.md en el bootstrap.', specFolder, detail: created }
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — Convergence loop
// ---------------------------------------------------------------------------
// One planner per task, in parallel, all read-only. A barrier collects every
// proposal (the synthesizer genuinely needs them all at once: it resolves
// cross-task conflicts and rebuilds both tables). Then a single writer, run
// sequentially in bounded chunks, applies the patch set.

const converged = new Set()
const attempts = {}
let allConverged = false
let round = 0

while (round < MAX_ROUNDS && !allConverged) {
  round += 1

  const queue = index.filter((t) => !t.done && !converged.has(t.id) && (attempts[t.id] || 0) < MAX_ATTEMPTS_PER_TASK)

  const stalled = index.filter((t) => !t.done && !converged.has(t.id) && (attempts[t.id] || 0) >= MAX_ATTEMPTS_PER_TASK)
  for (const t of stalled) {
    const item = `${t.id} — ${MAX_ATTEMPTS_PER_TASK} NEEDS ITERATION seguidos. Es un hueco estructural del spec, no una tarea difícil: lo decide el usuario.`
    if (!report.openItems.includes(item)) report.openItems.push(item)
  }

  if (!queue.length) {
    allConverged = stalled.length === 0
    if (stalled.length) log(`Ronda ${round}: nada evaluable — ${stalled.length} tarea(s) escaladas al usuario.`)
    break
  }

  const batches = []
  for (let i = 0; i < queue.length; i += TASKS_PER_PLANNER) batches.push(queue.slice(i, i + TASKS_PER_PLANNER))

  phase('Evaluate')
  log(`Ronda ${round}/${MAX_ROUNDS}: ${queue.length} tarea(s) sin converger en ${batches.length} planner(s) paralelos.`)

  const summaryList = index.map((x) => `- ${x.id} — ${x.title}${x.done ? ' [HECHO — intocable]' : ''}`).join('\n')

  const proposals = (await parallel(
    batches.map((batch) => () =>
      agent(
        `Rol: **evaluar tarea**. Juzgá y corregí ${batch.length === 1 ? 'esta tarea' : 'estas tareas'} contra los cuatro criterios.

${specBlock(specFolder)}

${batch.length === 1 ? 'Tarea a evaluar' : 'Tareas a evaluar'}: ${batch.map((t) => `**${t.id} — ${t.title}**`).join(', ')}

Índice completo del spec (contexto de dependencias y alcance ajeno — NO propongas cambios a otras tareas):
${summaryList}

Procedimiento:
1. Leé \`requirements.md\` y \`design.md\` completos.
2. Traé del \`tasks.md\` solo las tablas del principio (\`## Resumen de tareas\`, \`## Cobertura de requisitos\`)
   y la sección exacta de cada tarea que te toca.
3. Relevá el código real con Glob/Grep antes de juzgar necesidad.
4. Aplicá los cuatro criterios: tamaño (un ciclo TDD), alineación con el spec, completitud de cobertura, necesidad.

Por cada tarea devolvé una entrada en \`proposals\`:
- Si ya cumple los cuatro criterios: \`verdict: "CRITERIA MET"\`, \`changed: false\`, \`newSectionText: ""\`.
  No reescribas para dejar huella.
- Si la corregís: \`changed: true\` y \`newSectionText\` con la sección COMPLETA de reemplazo.
  Preservá **Decision log** y **Outcome** LITERALMENTE tal como están hoy en el archivo.
- Si hay que partirla, fusionarla o eliminarla: declaralo en \`structuralOps\`. Para \`split\` y \`new\`,
  poné en \`proposedSections\` el texto completo de cada sección nueva, con el heading en \`## TNUEVA — <título>\`
  como marcador — el sintetizador asigna el ID real.
- \`findings\`: huecos del spec o conflictos con tareas \`[x] Hecho\`.
- \`userDecisions\`: solo lo que el usuario tiene que decidir.

Ronda ${round} de ${MAX_ROUNDS}. Convergé rápido: un NEEDS ITERATION sin un bloqueo concreto y resoluble
cuesta una ronda entera de fan-out.

${NO_WRITE}
${BIG_FILE}
${LAYOUT}`,
        {
          agentType: 'planner',
          schema: BATCH_SCHEMA,
          label: `plan:${batch.map((t) => t.id).join('+')}`,
          phase: 'Evaluate',
        },
      ),
    ),
  ))
    .filter(Boolean)
    .flatMap((r) => r.proposals || [])

  if (!proposals.length) {
    log(`Ronda ${round}: ningún planner devolvió propuesta. Corto el loop.`)
    report.openItems.push(`Ronda ${round}: el fan-out no devolvió propuestas — revisar manualmente.`)
    break
  }

  const dropped = queue.filter((t) => !proposals.some((p) => p.taskId === t.id))
  if (dropped.length) log(`Ronda ${round}: sin propuesta para ${dropped.map((t) => t.id).join(', ')} — reencolan.`)

  // The synthesizer never sees section bodies. It merges decisions, not text.
  const forSynth = proposals.map((p) => ({
    taskId: p.taskId,
    verdict: p.verdict,
    changed: p.changed,
    summaryRow: p.summaryRow,
    requisitos: p.requisitos || [],
    dependsOn: p.dependsOn || [],
    findings: p.findings || [],
    userDecisions: p.userDecisions || [],
    structuralOps: (p.structuralOps || []).map((op, i) => ({
      opIndex: i,
      op: op.op,
      detail: op.detail,
      sectionCount: (op.proposedSections || []).length,
    })),
  }))

  phase('Synthesize')

  const merge = await agent(
    `Rol: **sintetizar**. Fusioná las propuestas de la ronda ${round} en un plan de merge coherente.

${specBlock(specFolder)}

Recibís los veredictos y las operaciones estructurales SIN el cuerpo de las secciones — a propósito.
Fusionás decisiones, no texto: el texto de cada sección ya está resuelto y lo aplica el escritor.

Propuestas de esta ronda:
${JSON.stringify(forSynth, null, 2)}

Índice de tareas antes de esta ronda:
${JSON.stringify(index.map((t) => ({ id: t.id, title: t.title, done: t.done })), null, 2)}

Tu trabajo:
1. Resolver los conflictos entre propuestas que se ignoraron mutuamente: dos tareas que reclaman el mismo
   criterio de aceptación, una eliminación que deja huérfana una dependencia, dos particiones que chocan.
   Todo conflicto que resolvés va a \`conflicts\` con la resolución que elegiste.
2. Asignar IDs a las tareas nuevas que nacen de \`split\` o \`new\`: SIEMPRE el siguiente libre después del
   ID más alto que existió, NUNCA reusando uno retirado. Por cada una devolvé en \`newTasks\` su \`id\`,
   \`title\`, \`afterId\` (después de qué sección va), y \`fromTaskId\`/\`fromOpIndex\`/\`fromSectionIndex\`
   para que el script recupere su texto.
3. Reconstruir \`resumenTable\` completa, en orden de ejecución, respetando dependencias.
4. Reconstruir \`coberturaTable\` cruzando cada criterio numerado de \`requirements.md\` (leelo del disco)
   contra las tareas que lo cubren. Una tabla desincronizada de las secciones es un merge fallido.
5. Devolver \`taskIndex\`: el índice completo posterior al merge, incluyendo las tareas nuevas y sin las
   eliminadas. Las tareas \`[x] Hecho\` van con \`done: true\` y no se tocan.
6. \`allConverged\`: true SOLO si toda tarea no-Hecho tiene veredicto CRITERIA MET en esta ronda y no queda
   ninguna operación estructural pendiente. Una tarea nueva nacida de una partición NUNCA nace convergida.
7. \`openItems\`: lo que queda abierto para el usuario.

${NO_WRITE}
${LAYOUT}`,
    { agentType: 'planner', schema: MERGE_SCHEMA, label: `synthesize:R${round}`, phase: 'Synthesize' },
  )

  if (!merge) {
    log(`Ronda ${round}: el sintetizador falló. No escribo nada — un merge a medias corrompe el archivo.`)
    report.openItems.push(`Ronda ${round}: el sintetizador no devolvió resultado; los cambios de la ronda se descartaron.`)
    break
  }

  // --- Deterministic reduction: pure script code, zero tokens. -------------
  const patches = []
  for (const p of proposals) {
    if (p.changed && p.newSectionText && p.newSectionText.trim()) {
      patches.push({ kind: 'replace', taskId: p.taskId, text: p.newSectionText })
    }
  }
  for (const nt of merge.newTasks || []) {
    const src = proposals.find((p) => p.taskId === nt.fromTaskId)
    const op = src && (src.structuralOps || [])[nt.fromOpIndex]
    const raw = op && (op.proposedSections || [])[nt.fromSectionIndex]
    if (!raw) {
      report.openItems.push(`Tarea nueva ${nt.id} declarada por ${nt.fromTaskId} pero sin texto de sección — no se insertó.`)
      continue
    }
    const text = raw.replace(/^##\s+\S+\s+—/, `## ${nt.id} —`)
    patches.push({ kind: 'insert', taskId: nt.id, text, afterId: nt.afterId })
  }

  phase('Persist')
  log(`Ronda ${round}: ${patches.length} sección(es) a escribir, ${(merge.removals || []).length} a eliminar.`)

  // Sequential on purpose. `await` inside the loop is the single-writer guarantee.
  for (let i = 0; i < patches.length; i += SECTIONS_PER_WRITE) {
    const chunk = patches.slice(i, i + SECTIONS_PER_WRITE)
    const n = Math.floor(i / SECTIONS_PER_WRITE) + 1
    const res = await agent(
      `Aplicá este patch set a \`${tasksPath}\` con un splice determinista por heading. Sos el único escritor corriendo.

${chunk
        .map((c) =>
          c.kind === 'replace'
            ? `--- REEMPLAZAR la sección de ${c.taskId} por: ---\n${c.text}\n--- FIN ${c.taskId} ---`
            : `--- INSERTAR sección nueva ${c.taskId}, justo después de la sección de ${c.afterId || '(al final)'} ---\n${c.text}\n--- FIN ${c.taskId} ---`,
        )
        .join('\n\n')}

Copiá cada texto VERBATIM: no reescribas, no completes, no reordenes. Los marcadores \`--- … ---\`
son delimitadores de este mensaje y NO van al archivo. Escribí en UTF-8 y preservá los finales de línea.
Después corré los cinco chequeos de tu contrato sobre el archivo ya escrito y reportá los conteos reales.`,
      { agentType: 'tasks-writer', schema: WRITE_SCHEMA, label: `write:R${round}.${n}`, phase: 'Persist' },
    )
    report.writes.push({ step: `R${round}.${n}`, ok: !!(res && res.ok), verification: res && res.verification })
    if (res && (res.notApplied || []).length) report.openItems.push(...res.notApplied.map((x) => `R${round}.${n}: ${x}`))
  }

  // Tables and removals land last, once every section is in place.
  const tablesRes = await agent(
    `Actualizá las tablas de \`${tasksPath}\`${(merge.removals || []).length ? ' y eliminá las secciones retiradas' : ''}. Sos el único escritor corriendo.

1. Reemplazá el cuerpo de \`## Resumen de tareas\` por:
--- RESUMEN ---
${merge.resumenTable}
--- FIN RESUMEN ---
${merge.coberturaTable
      ? `2. Reemplazá el cuerpo de \`## Cobertura de requisitos\` por:\n--- COBERTURA ---\n${merge.coberturaTable}\n--- FIN COBERTURA ---`
      : '2. Dejá `## Cobertura de requisitos` como está.'}
${(merge.removals || []).length ? `3. Eliminá enteras las secciones de: ${merge.removals.join(', ')}.` : ''}

Los marcadores \`--- … ---\` son delimitadores de este mensaje y NO van al archivo.
Verificá al final que toda fila del Resumen tenga sección y toda sección tenga fila, y reportá los conteos reales.`,
    { agentType: 'tasks-writer', schema: WRITE_SCHEMA, label: `write:R${round}.tablas`, phase: 'Persist' },
  )
  report.writes.push({ step: `R${round}.tablas`, ok: !!(tablesRes && tablesRes.ok), verification: tablesRes && tablesRes.verification })

  // --- Round bookkeeping --------------------------------------------------
  for (const p of proposals) {
    if (p.verdict === 'CRITERIA MET') {
      converged.add(p.taskId)
      attempts[p.taskId] = 0
    } else {
      attempts[p.taskId] = (attempts[p.taskId] || 0) + 1
      converged.delete(p.taskId)
    }
    report.findings.push(...(p.findings || []).map((f) => `${p.taskId}: ${f}`))
    report.userDecisions.push(...(p.userDecisions || []).map((d) => `${p.taskId}: ${d}`))
  }
  for (const nt of merge.newTasks || []) converged.delete(nt.id)
  for (const rid of merge.removals || []) converged.delete(rid)

  index = (merge.taskIndex || index).filter((t) => !(merge.removals || []).includes(t.id))
  report.openItems.push(...(merge.openItems || []), ...(merge.conflicts || []).map((c) => `Conflicto resuelto: ${c}`))
  report.rounds.push({
    round,
    evaluated: proposals.length,
    criteriaMet: proposals.filter((p) => p.verdict === 'CRITERIA MET').length,
    written: patches.length,
    newTasks: (merge.newTasks || []).length,
    removed: (merge.removals || []).length,
  })

  allConverged = !!merge.allConverged && index.filter((t) => !t.done && !converged.has(t.id)).length === 0
  log(`Ronda ${round}: ${report.rounds[report.rounds.length - 1].criteriaMet}/${proposals.length} en CRITERIA MET.`)
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const pending = index.filter((t) => !t.done && !converged.has(t.id))
if (!allConverged && round >= MAX_ROUNDS && pending.length) {
  report.openItems.push(
    `Tope de ${MAX_ROUNDS} rondas alcanzado con ${pending.length} tarea(s) sin converger: ${pending.map((t) => t.id).join(', ')}. Volvé a correr el workflow o subí maxRounds.`,
  )
}

const uniq = (xs) => Array.from(new Set(xs))

return {
  status: allConverged ? 'converged' : 'partial',
  specFolder,
  tasksPath,
  rounds: report.rounds,
  totalTasks: index.length,
  converged: index.filter((t) => t.done || converged.has(t.id)).length,
  pending: pending.map((t) => `${t.id} — ${t.title}`),
  findings: uniq(report.findings),
  userDecisions: uniq(report.userDecisions),
  openItems: uniq(report.openItems),
  writes: report.writes,
  // The planning-task contract closes only at 100% CRITERIA MET.
  note: allConverged
    ? 'tasks.md convergido al 100%. Presentar al usuario para aprobación.'
    : 'Convergencia parcial: NO cuenta como fase completa. Resolver los openItems y volver a correr.',
}
