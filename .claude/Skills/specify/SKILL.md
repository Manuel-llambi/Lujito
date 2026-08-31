---
name: specify
description: "Trigger: spec this out, escribir requirements, definir la feature, before we build, escribir el spec. Convierte una idea aprobada en requirements.md (EARS), design.md (arquitectura) y tasks.md (checklist de implementación con decision log), cada uno con su propia aprobación."
license: Apache-2.0
metadata:
  version: "1.0"
---

## Contrato de activación

Cargar este skill cuando el usuario quiera formalizar una idea de feature en specs escritas antes de implementar — frases como "spec this out", "escribir el spec", "definir la feature", o continuando desde un diseño aprobado en `/brainstorming`. Saltear para bug fixes o coding exploratorio.

## Reglas duras

- Escribir `requirements.md`, `design.md` y `tasks.md` enteramente en español, sin importar el idioma de la conversación; hablar con el usuario siempre en su propio idioma.
- Nunca crear `design.md` antes de que el usuario haya aprobado explícitamente `requirements.md`. Nunca crear `tasks.md` antes de que el usuario haya aprobado explícitamente `design.md`.
- Todo criterio de aceptación debe usar notación EARS (`WHEN`/`IF...THEN`/`WHILE`/`WHERE`/`SHALL`, en inglés por ser notación estándar), numerado (Requirement N → criterios N.1, N.2…) para que `design.md` y `tasks.md` puedan trazar de vuelta hasta él.
- El alcance son tres artefactos: `requirements.md`, `design.md` y `tasks.md`. Los primeros dos los escribe este skill directamente; `tasks.md` se delega enteramente al skill `planning-task` (`.claude/skills/planning-task/SKILL.md`), que a su vez lanza al subagente `planner` — este skill nunca edita `tasks.md` a mano ni invoca al planner directamente.
- La Fase 3 no cierra hasta que `planning-task` reporte el 100% de las tareas de `tasks.md` en `CRITERIA MET` — una convergencia parcial no cuenta como fase completa.
- Cada tarea en `tasks.md` debe referenciar al menos un criterio de requirement, y tener el tamaño de un solo ciclo TDD (test que falla → implementación → test que pasa).
- Dejar vacíos el Decision log y el Outcome de cada tarea al crear `tasks.md` — se completan durante la ejecución TDD, no durante la planificación.
- Copiar los templates de `assets/` en vez de escribir los documentos desde cero.
- Si la feature incluye superficie visual (HTML, componentes, páginas), `design.md` debe fundamentar sus decisiones visuales en los patrones de estilo ya establecidos en el proyecto en vez de definir estilos propios desde cero.

## Puertas de decisión

| Situación | Acción |
|---|---|
| Viene de un diseño aprobado en `/brainstorming` | Reusar sus decisiones de arquitectura/flujo de datos como input ya resuelto para `design.md`; no re-interrogar al usuario |
| La idea es vaga | Preguntar primero con preguntas de clarificación puntuales; exponer lo no resuelto en "Open questions" en vez de inventar requirements |
| El diseño revela un vacío en los requirements | Actualizar `requirements.md`, no diseñar por encima en silencio |
| Una tarea no traza limpiamente a ningún requirement | Flaguearla — o falta el requirement, o la tarea está fuera de alcance; no agregar tareas sin trazabilidad |
| `planning-task` reporta que quedó bloqueado (hueco de spec, 3 iteraciones sin converger, pregunta abierta) | Pausar, resolver con el usuario, y recién ahí reinvocar `planning-task` con la respuesta |

## Pasos de ejecución

1. Reunir suficiente contexto para escribir criterios de aceptación con sentido; preguntar de a una si la idea es vaga.
2. Copiar `assets/requirements-template.md` a `docs/specs/<YYYY-MM-DD>-<feature-slug>/requirements.md` y completarlo usando notación EARS (`WHEN`/`IF...THEN`/`WHILE`/`WHERE`/`SHALL`).
3. Parar. Presentar los requirements para revisión y esperar aprobación explícita antes de continuar.
4. Copiar `assets/design-template.md` a la misma carpeta como `design.md`. Fundamentar cada componente, modelo de datos y camino de error en un requirement numerado.
5. Parar. Presentar el diseño para revisión y esperar aprobación explícita.
6. Invocar el skill `planning-task` (Skill tool) pasándole la ruta de la carpeta del spec. Ese skill se encarga del ciclo completo — bootstrap y luego iteración tarea por tarea con el subagente `planner` — hasta que todas las tareas converjan. No terminar esta fase hasta que `planning-task` reporte el 100% de las tareas en `CRITERIA MET`.
7. Parar. Presentar la lista de tareas ya convergida para revisión y esperar aprobación explícita.

## Contrato de salida

Terminar indicando el estado de los tres documentos (aprobado o pendiente de cambios) y la carpeta donde están. Una vez aprobado `tasks.md`, el alcance de este skill termina — la ejecución TDD completa el Decision log y el Outcome de cada tarea a medida que se trabaja, pero esa ejecución no es parte de este skill.

## Referencias

- `assets/requirements-template.md` — estructura de requirements basada en EARS.
- `assets/design-template.md` — estructura de documento de arquitectura/diseño.
- `assets/tasks-template.md` — estructura de checklist de tareas con decision log y outcome por tarea.
- `.claude/skills/planning-task/SKILL.md` — skill que ejecuta la Fase 3 (planeación y convergencia de `tasks.md`), invocando al subagente `planner` en modos `bootstrap` y `T<n>`.
