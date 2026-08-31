---
name: brainstorming
description: "Trigger: brainstorm, idea para una nueva feature, antes de implementar, diseñar una feature. Convierte una idea vaga en un diseño aprobado mediante un diálogo de una pregunta a la vez, antes de escribir código."
license: Apache-2.0
metadata:
  version: "1.0"
---

## Contrato de activación

Cargar este skill antes de escribir código, scaffoldear un proyecto, o empezar la implementación de una funcionalidad o cambio de comportamiento nuevo — sin importar cuán simple parezca el pedido. Saltear solo para fixes triviales de una línea sin ninguna ambigüedad de diseño (typo, valor de config, una tarea ya completamente especificada).

## Reglas duras

- NO escribir código, scaffoldear archivos, ni escribir ningún documento de spec/requirements hasta que el usuario haya aprobado explícitamente el diseño. Aplica a todo proyecto, incluidos los "simples" — los supuestos no examinados en trabajo "simple" son los que más esfuerzo desperdiciado causan.
- Hacer exactamente UNA pregunta de clarificación por mensaje. Nunca agrupar varias preguntas en un mismo turno.
- Preferir preguntas de opción múltiple; abiertas solo cuando las opciones genuinamente no encajan.
- Toda propuesta presenta 2-3 approaches con sus trade-offs y una recomendación explícita — nunca entregar una sola opción sin examinar alternativas.
- YAGNI sin piedad: recortar features innecesarias de cada approach antes de presentarlo.
- Diseñar en unidades pequeñas y de propósito único, con interfaces claras. Una unidad cuyo interior no se puede cambiar sin romper a quien la usa, o un archivo que crece demasiado, es señal de que los límites necesitan trabajo.
- Si la feature incluye superficie visual (HTML, componentes, páginas), las decisiones de diseño deben respetar los patrones visuales y de estilo ya establecidos en el proyecto en vez de inventar estilos ad hoc.
- El alcance de este skill es solo clarificación y diseño. Escribir el documento de spec, guardar archivos bajo `docs/`, commitear, e invocar cualquier otro skill quedan todos fuera de alcance — este skill termina en el momento en que el diseño queda aprobado.

## Puertas de decisión

| Situación | Acción |
|---|---|
| El pedido abarca 2+ subsistemas independientes (ej. "chat + facturación + analytics") | Dejar de refinar detalles; descomponer en sub-proyectos primero, hacer brainstorming solo del primero |
| El código existente en el área tocada tiene problemas reales (archivo inflado, responsabilidades mezcladas) que afectan este trabajo | Incluir un fix puntual en el diseño |
| El problema del código existente no está relacionado con este trabajo | Dejarlo afuera — nada de refactors no relacionados |
| La sección de diseño es directa | Unas pocas oraciones, y después preguntar "¿va bien hasta acá?" |
| La sección de diseño es compleja (arquitectura, flujo de datos, manejo de errores) | Hasta ~250 palabras, y después preguntar "¿va bien hasta acá?" |

## Pasos de ejecución

1. Explorar el contexto del proyecto: leer archivos relevantes, docs, commits recientes, patrones existentes.
2. Preguntar de a una — propósito, restricciones, criterios de éxito — hasta que la forma de la feature quede clara.
3. Proponer 2-3 approaches con trade-offs; encabezar con la recomendación y el porqué.
4. Presentar el diseño en secciones (arquitectura, componentes, flujo de datos, manejo de errores, testing), con el nivel de detalle según las Puertas de decisión; conseguir aprobación después de cada sección.
5. Una vez aprobadas todas las secciones, parar — sin escribir archivos, sin commit, sin invocar otro skill.

## Contrato de salida

Terminar resumiendo el diseño completamente aprobado e indicando que está listo para pasar a `/specify`, que lo formaliza en `docs/specs/<YYYY-MM-DD>-<feature>/requirements.md` y `design.md` (sin commitear acá). Ese handoff — más las fases posteriores de `/specify` — es lo que lleva el trabajo a **"Spec lista para ejecución TDD."** Escribir archivos e invocar `/specify` quedan ambos fuera de alcance de este skill; solo anunciar el handoff, no ejecutarlo.
