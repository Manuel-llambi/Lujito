---
name: planning-task
description: "Trigger: crear tasks.md, iterar tasks.md, planificar tareas del spec, retomar planeación, bootstrap de tareas. Convierte un requirements.md y design.md ya aprobados en un tasks.md 100% convergido, lanzando el subagente planner en modo bootstrap y luego una tarea por invocación hasta que todas obtengan veredicto CRITERIA MET."
license: Apache-2.0
metadata:
  version: "1.0"
---

## Contrato de activación

Cargar este skill cuando haya que crear o re-converger el `tasks.md` de un spec — como Fase 3 de `/specify`, después de un cambio en `requirements.md`/`design.md`, o para retomar una planeación que quedó a mitad. Requiere que `requirements.md` y `design.md` ya estén aprobados en la carpeta del spec.

## Reglas duras

- Nunca editar `tasks.md` a mano. El `planner` (`.claude/agents/planner.md`) es **read-only**: juzga y devuelve el texto de reemplazo, pero no tiene `Edit` ni `Write`. La única escritura pasa por el agente `tasks-writer` (`.claude/agents/tasks-writer.md`).
- **Un solo escritor a la vez, siempre.** Esa es la regla que hay que proteger, y es exactamente por eso que el planner es read-only: dos escrituras concurrentes sobre este archivo compartido lo corrompen.
- Los planners **sí** corren en paralelo, justamente porque no escriben. El fan-out lo orquesta el workflow `converge-tasks` (`.claude/workflows/converge-tasks.js`): N planners juzgan a la vez, una barrera junta las propuestas, el rol `sintetizar` las fusiona, y recién ahí escribe el `tasks-writer`.
- Un solo planner en rol `bootstrap` cuando `tasks.md` no existe o no tiene ninguna tarea todavía — nunca más de uno para el índice inicial.
- Ningún agente carga `tasks.md` entero: un spec convergido supera los 200 KB. Se lee por secciones y se escribe por parches.
- Decision log y Outcome de cada tarea quedan vacíos: se completan en la ejecución TDD, no en esta fase.
- Meta de salida: **100%** de las tareas con veredicto `CRITERIA MET` de esta sesión — una convergencia parcial no cierra el skill.

## Puertas de decisión

| Situación | Acción |
|---|---|
| No hay `requirements.md`/`design.md` aprobados en la carpeta | Parar y derivar a `/specify` o `/brainstorming` primero |
| No existe `tasks.md`, o existe sin tareas | Lanzar un planner en modo `bootstrap`; releer `tasks.md` para obtener los IDs reales que creó |
| Hay tareas con veredicto pendiente | Encolar cada ID del Resumen de tareas y lanzar un planner en modo `T<n>` por invocación |
| Veredicto `NEEDS ITERATION` | Reinvocar el planner para la misma tarea con el `SIGUIENTE` que indicó el veredicto anterior |
| `NEEDS ITERATION` 3 veces seguidas para la misma tarea | Dejar de iterarla y exponer el hallazgo al usuario — señal de un hueco estructural en el spec, no de una tarea difícil |
| El veredicto divide una tarea o reporta tareas nuevas | Agregarlas a la cola: todavía no convergieron |
| El planner reporta un hallazgo que solo el usuario puede resolver | Pausar el loop, preguntar, y recién ahí reinvocar esa tarea con la respuesta |
| Todas las tareas en `CRITERIA MET` | Presentar `tasks.md` convergido para aprobación del usuario |

## Pasos de ejecución

1. Confirmar que la carpeta de spec (`docs/specs/<fecha>-<feature>/`) tiene `requirements.md` y `design.md` aprobados.
2. Lanzar el workflow: `Workflow({ name: "converge-tasks", args: { specFolder: "docs/specs/<fecha>-<feature>" } })`. El workflow resuelve solo el router (bootstrap vs. iterativo), el fan-out por tarea, la síntesis y las escrituras.
3. Leer el reporte que devuelve. `status: "converged"` cierra la fase; `status: "partial"` no.
4. Si vuelve `partial`, resolver primero `userDecisions` y `openItems` con el usuario — son los huecos que ningún planner puede cerrar solo — y recién ahí volver a correr el workflow.
5. No terminar hasta que el 100% de las tareas tenga veredicto `CRITERIA MET`.

Parámetros útiles de `args`: `maxRounds` (**1 por defecto** — una ronda por corrida, para revisar lo que escribió el `tasks-writer` antes de dejarlo parchear de nuevo; subirlo encadena rondas sin supervisión) y `tasksPerPlanner` (1 por defecto — subirlo agrupa tareas por planner y baja la cantidad de agentes en specs muy grandes, a costa de foco por tarea).

Con `maxRounds: 1` una sola corrida casi nunca converge al 100%: el flujo normal es correr, revisar el diff de `tasks.md`, y volver a correr. El workflow retoma solo desde el estado real del archivo.

## Contrato de salida

Reportar el estado final de `tasks.md` (100% convergido, o qué tarea/hallazgo sigue bloqueando y qué debe decidir el usuario) y la ruta de la carpeta del spec. Con `tasks.md` aprobado por el usuario, el alcance de este skill termina — la ejecución TDD que completa Decision log y Outcome no es parte de este skill.

## Referencias

- `.claude/workflows/converge-tasks.js` — el workflow de fan-out que orquesta todo: scout → router → N planners en paralelo → barrera → síntesis → escritor único. Genérico: sirve para cualquier spec.
- `.claude/agents/planner.md` — contrato del subagente read-only que juzga y propone (roles `bootstrap`, `T<n>` y `sintetizar`, formato de veredicto).
- `.claude/agents/tasks-writer.md` — el único agente con permiso de escritura sobre `tasks.md`. Transcribe un patch set ya decidido; no juzga ni redacta.
- `.claude/skills/specify/assets/tasks-template.md` — estructura de `tasks.md` que usa el planner en modo bootstrap.
- `.claude/skills/specify/SKILL.md` — flujo completo de spec (requirements → design → tasks); este skill cubre solo la fase de tasks.
