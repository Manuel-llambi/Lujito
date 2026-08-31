---
name: verify-implementation
description: "Trigger: terminé la implementación, verificar implementación, cerrar la tarea, arrancar el loop de E2E. Corre la verificación del repo y, si queda en verde, encadena plan-test-cases → generate-tests → healer."
license: Apache-2.0
metadata:
  author: "manuel-agui"
  version: "1.0"
---

## Contrato de activación

Cargar apenas termina la implementación de una tarea o feature — cuando el usuario dice que terminó, o cuando una ejecución TDD deja su último ciclo en verde. Es el nodo de entrada del loop de verificación E2E: este skill no solo verifica, también encadena las tres etapas siguientes y decide si el loop vuelve a implementación.

## Reglas duras

- Nunca afirmar que la suite está en verde sin haber corrido los comandos y visto la salida. Pegar el resultado real, nunca un resumen de memoria.
- La verificación base es `npm run typecheck && npm test`. Sumar `npm run test:e2e` cuando el cambio toca páginas, rutas o navegación.
- Un test que pasó en su primera corrida no cuenta como verificado: comprobarlo por mutación — romper a propósito lo que debería detectar, confirmar que falla SOLO ese test, restaurar.
- Nunca restaurar una mutación con `git checkout`: pisa trabajo sin commitear y no repone archivos que todavía no están versionados. Deshacer con Edit.
- Si la verificación queda en rojo, parar acá. El loop no arranca sobre una base rota.
- Nunca lanzar `generate-tests` y `healer` en paralelo: el healer necesita el script ya escrito en disco.
- El loop corre una feature a la vez, contra una sola carpeta de spec.

## Puertas de decisión

| Resultado | Acción |
|---|---|
| `typecheck` o `test` en rojo | Parar, reportar la salida cruda, volver a implementación |
| Verde, pero hay tests que nunca se vieron en rojo | Mutar, confirmar el rojo aislado, restaurar con Edit |
| Verde y mutación confirmada | Invocar `plan-test-cases` |
| El reporte del healer culpa al código | Cerrar el loop: volver a implementación con los hallazgos |
| El reporte del healer culpa a los tests | Volver a `plan-test-cases` o `generate-tests` con la corrección |
| El reporte no encuentra defectos | Cerrar el loop y presentar el reporte al usuario |

## Pasos de ejecución

1. Identificar la carpeta de spec en `docs/specs/` que corresponde al trabajo recién implementado.
2. Correr la verificación base y, si aplica, la E2E. Pegar la salida real.
3. Verificar por mutación cada test nuevo que nunca se vio en rojo.
4. Invocar el skill `plan-test-cases` pasándole la ruta de la carpeta de spec.
5. Lanzar el subagente `generate-tests` con la ruta del plan. Esperar a que termine.
6. Lanzar el subagente `healer` con el plan y el script generado. Esperar el reporte.
7. Leer el veredicto del reporte y aplicar la puerta de decisión que corresponda.

## Contrato de salida

Reportar: comandos corridos y su resultado real, qué se verificó por mutación, las rutas del plan, del script generado y del reporte, y el veredicto del healer con la decisión de cierre del loop — volver a implementación, corregir los tests, o terminar.

## Referencias

- `.claude/Skills/plan-test-cases/SKILL.md` — etapa 2 del loop.
- `.claude/agents/generate-tests.md` — etapa 3, escribe el script Playwright.
- `.claude/agents/healer.md` — etapa 4, corre y diagnostica.
- `CLAUDE.md` — comandos de verificación, regla de mutación y estado del spec.
