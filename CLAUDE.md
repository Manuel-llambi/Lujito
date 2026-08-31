# CLAUDE.md

Este archivo le da contexto a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Qué es hoy este repositorio

**Todavía no hay código de aplicación** — no hay `package.json`, ni `src/`, ni repositorio git. Lo que existe
es el tooling de Claude Code para un flujo spec-driven con TDD (tres subagentes, cinco skills de proyecto y un
registro de skills generado), más **el spec completo de la primera feature** en `docs/specs/`.

Los contratos de los agentes fueron escritos contra una **app de finanzas en Next.js + Playwright**
("Finanzas Cumzi", dominio en español: `monto`, categorías como `Comida`) y todavía referencian archivos que
no existen en este directorio: `package.json`, `playwright.config.ts`, `e2e/acceso.spec.ts`, servidor de
desarrollo en el puerto **3100**. Tratá esas referencias como la forma del proyecto destino, no como hechos
actuales — verificá antes de actuar sobre ellas. `docs/specs/` **sí** existe ya.

## Spec activo — pipeline de gastos desde emails del banco

`docs/specs/2026-08-25-pipeline-gastos-email/`

Primera y única feature del proyecto. Convierte cada aviso de consumo que Santander manda por email en un
gasto categorizado e imputado a uno o más meses, y lo muestra en un dashboard.

| Documento | Estado |
|---|---|
| `requirements.md` | Aprobado — 10 requisitos, 69 criterios EARS numerados |
| `design.md` | Aprobado |
| `tasks.md` | 52 tareas (T1–T52) creadas por el `planner` en modo bootstrap, en convergencia tarea por tarea |

El estado vivo de la convergencia está en el **Resumen de tareas** de `tasks.md` — no lo dupliques acá, se
pudre. La Fase 3 cierra solo con 52/52 en `CRITERIA MET`.

### Stack decidido

Next.js (App Router) · Postgres/Supabase · **Inngest** como workflow durable (cada paso es una función
TypeScript versionada en el repo, no un editor visual) · Gmail API con OAuth · Claude API.

Pipeline de cuatro pasos: `ingest → extraer → categorizar → imputar`. El **dashboard no es un paso**: es una
lectura sobre la tabla `imputaciones`.

### Invariantes del diseño — no relitigar sin leer `design.md`

Estas decisiones ya se discutieron y tienen justificación escrita. Si vas a cambiarlas, leé primero la sección
"Decisiones de diseño y trade-offs".

- **La extracción es un parser determinista, no una llamada a un modelo.** El aviso del banco es una tabla con
  etiquetas fijas (`Monto`, `Cuotas`, `Comercio`, `Fecha`, `Hora`). La IA se usa **solo** para inferir la
  categoría de un comercio desconocido, que es el único problema genuinamente ambiguo.
- **Buscar los campos por texto de etiqueta normalizado, nunca por posición en el árbol HTML.** El aviso de
  crédito viene con HTML mal formado y el de débito mete saltos de línea alrededor de las etiquetas.
- **El asunto no discrimina débito de crédito** — los dos dicen `Pagaste $X`. El discriminador es el párrafo
  de la tarjeta y la presencia de la fila `Cuotas`.
- **Ningún camino de error produce un monto.** Si el parser falla, el gasto va a `needs_review` y queda fuera
  de los totales. Nunca un cero, nunca una estimación (criterio 2.12).
- **`gastos` e `imputaciones` son tablas distintas.** Una compra es un hecho; su impacto mensual son N hechos.
  Débito, crédito en una cuota y crédito en N cuotas recorren el mismo código sin un solo condicional.
- **Montos en `numeric`/`Decimal`, jamás en punto flotante.** La suma de las cuotas debe dar exactamente el
  total; el centavo del redondeo va a la última.
- **La aritmética de meses opera sobre cadenas `AAAA-MM`, no sobre `Date`.** La conversión de zona horaria
  (`America/Argentina/Buenos_Aires`) ocurre una sola vez, en `mesDe`.
- **La fecha del gasto sale del cuerpo del aviso, nunca del header `Date` del email.**
- **Toda la lógica que decide plata vive en funciones puras** bajo `dominio/`, sin red ni base de datos. El
  reloj y el conjunto de reglas se inyectan. Los `step.run` del workflow no tienen lógica: leen, llaman a una
  función pura, escriben.
- Tres categorías fijas y un enum cerrado para la IA: `Salidas`, `Comida`, `Extras` (más `Sin categorizar`
  como destino de falla). Cada confirmación del usuario genera una regla, así la bandeja se apaga sola.

### Pendientes conocidos

- **Fixtures faltantes.** El diseño exige tres avisos reales anonimizados en el repo: débito, crédito (el del
  HTML mal formado) y **uno que no sea un aviso de consumo**, para el caso `descartado`. Los dos primeros los
  aportó el usuario en conversación; el tercero falta. Bloquea la implementación de T2–T5 y T30–T32.
- **Pregunta abierta del spec.** En una compra de más de una cuota, ¿el campo `Monto` del aviso es el total o
  el valor de cada cuota? El supuesto vigente (`total_de_la_compra`) está aislado en la función
  `resolverMontoTotal`: cuando llegue un aviso real de una compra en cuotas, se cambia una constante y un test.
- **Reglas semilla.** Falta la lista de comercios por categoría; `tasks.md` (T17) siembra solo las categorías.
- **Criterio 1.5 sin superficie asignada.** `design.md` define la sección "Errores del sistema" dentro de
  `/revision`, pero 1.5 traza únicamente a T26 (el adaptador de Gmail). Ninguna tarea dibuja esa sección
  todavía; resolverlo al converger T45.

## Comandos

Contrato de verificación que asume el flujo (una vez que exista el código de la app):

```bash
npm run typecheck && npm test     # verificación base, obligatoria antes del loop E2E
npm run test:e2e                  # sumarlo cuando el cambio toca páginas, rutas o navegación
npx playwright test e2e/<archivo>.spec.ts   # lo que corre el healer — compila y sirve en :3100, tarda minutos
```

Tooling de skills vendorizado que **sí** es ejecutable hoy (Python 3, sin dependencias):

```bash
python ".claude/Skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain ux
python ".claude/Skills/ui-ux-pro-max/scripts/search.py" "<query>" --design-system -p "Project Name"
gentle-ai skill-registry refresh --force   # regenera .atl/skill-registry.md
```

## El pipeline

Dos loops encadenados. Cada etapa tiene un límite de alcance duro — el valor del diseño está en lo que cada
etapa tiene **prohibido** hacer.

```
/brainstorming → /specify ─┬→ requirements.md  (EARS, puerta de aprobación)
                           ├→ design.md        (puerta de aprobación)
                           └→ /planning-task → agente planner → tasks.md (puerta de aprobación)
                                    ↓
                            Ejecución TDD (completa Decision log + Outcome)
                                    ↓
/verify-implementation → /plan-test-cases → agente generate-tests → agente healer → veredicto
```

**Artefactos**: viven en `docs/specs/<YYYY-MM-DD>-<feature-slug>/` — `requirements.md`, `design.md`,
`tasks.md`, `E2E-test-cases-plan.md`, `E2E-test-cases-report.md`. Los templates están en
`.claude/Skills/specify/assets/` y `.claude/Skills/plan-test-cases/assets/`: copiarlos, nunca escribir estos
documentos desde cero.

### Los límites de etapa que importan

- **brainstorming** no escribe ningún archivo. Termina cuando el diseño queda aprobado y anuncia el handoff a
  `/specify` — no lo invoca.
- **specify** escribe solo `requirements.md` y `design.md`. Nunca edita `tasks.md` a mano ni llama al planner
  directamente: la Fase 3 se delega enteramente a `planning-task`.
- **planning-task** tampoco edita `tasks.md`. Toda escritura pasa por el agente `planner`: una invocación
  `bootstrap` y después **una tarea por invocación, estrictamente secuencial**. Planners en paralelo corrompen
  el archivo compartido. El bootstrap siempre termina en `NEEDS ITERATION` por diseño; la convergencia ocurre
  tarea por tarea.
- **plan-test-cases** deriva exactamente **tres** casos — uno feliz y dos de fallo — del spec, nunca del
  código. El código se lee solo para nombrar selectores y rutas reales. Declara el nombre exacto del archivo
  destino en `e2e/`, que `generate-tests` debe respetar al pie de la letra.
- **generate-tests** escribe un único `.spec.ts` y nunca lo corre. La división es deliberada: un agente que
  corre sus propias aserciones las ajusta hasta que pasen, que es exactamente el defecto que el healer existe
  para detectar.
- **healer** es de solo lectura sobre el repo. El único archivo que puede crear o modificar es
  `E2E-test-cases-report.md`. Tiene Bash para correr Playwright, no para escribir — nada de `>`, `tee`,
  `sed -i`, `cp`, `mv`, `rm`, `git checkout/stash/restore`. Diagnostica la culpa (Test / Código / Plan /
  Indeterminado) y recomienda; nunca arregla.

### Protocolos de veredicto

Los agentes devuelven mensajes finales estructurados al orquestador, no prosa para el usuario:

- `planner` → `VEREDICTO / TAREA / CAMBIOS / HALLAZGOS / SIGUIENTE`, con veredicto `CRITERIA MET` o
  `NEEDS ITERATION`. Tres `NEEDS ITERATION` seguidos sobre la misma tarea significan un hueco estructural del
  spec — escalar al usuario y dejar de iterar.
- `healer` → `REPORTE / CORRIDA / CULPA DOMINANTE / SIGUIENTE / BLOQUEOS`.

La Fase 3 de `/specify` y `/planning-task` cierran solo con el **100%** de las tareas en `CRITERIA MET`. Una
convergencia parcial no cuenta como fase completa.

### Reglas de verificación

- Nunca afirmar que está en verde sin pegar la salida real del comando.
- Un test que pasó en su primera corrida no está verificado. Mutar lo que debería detectar, confirmar que
  falla **solo ese test**, restaurar.
- Restaurar las mutaciones con Edit, nunca con `git checkout`: pisa trabajo sin commitear y no repone archivos
  que todavía no están versionados.
- Una verificación base en rojo detiene el loop. La cadena E2E nunca arranca sobre una base rota.

## Convención de idioma

Los artefactos de spec (`requirements.md`, `design.md`, `tasks.md`, el plan y el reporte E2E) se escriben
**enteramente en español**, sin importar el idioma de la conversación, preservando literalmente los
identificadores de dominio. Es un override deliberado del proyecto sobre el default habitual de artefactos en
inglés. Las palabras clave EARS (`WHEN` / `IF...THEN` / `WHILE` / `WHERE` / `SHALL`) quedan en inglés por ser
notación estándar. Los criterios de aceptación van numerados `N.M` para que diseño, tareas y casos E2E puedan
trazar de vuelta hasta ellos.

## Trampas de la estructura del repositorio

- `.claude/agents/` es el directorio de agentes vivo. `agents/` y `.claude/agents copy/` son duplicados
  **byte a byte** — editar `.claude/agents/` y o bien borrar las copias, o bien mantenerlas en sync a
  propósito.
- El directorio es `.claude/Skills/` (con S mayúscula), pero `.atl/skill-registry.md` y varias referencias en
  los SKILL.md apuntan a `.claude/skills/`. Solo resuelve porque las rutas de Windows son insensibles a
  mayúsculas; se rompe en un filesystem sensible a mayúsculas.
- `.atl/skill-registry.md` es generado — indexa tanto los skills de proyecto como los de usuario en
  `~/.claude/skills` y `~/.agents/skills`. Es un índice para delegadores: pasarle a los subagentes las rutas
  exactas de `SKILL.md` en vez de resumirles el contenido del skill.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
