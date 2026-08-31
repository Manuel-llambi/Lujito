---
name: plan-test-cases
description: "Trigger: plan de test cases, armar casos E2E, E2E-test-cases-plan. Deriva del spec exactamente tres casos E2E — un happy path y dos de fallo — y los escribe en E2E-test-cases-plan.md."
license: Apache-2.0
metadata:
  author: "manuel-agui"
  version: "1.0"
---

## Contrato de activación

Cargar como etapa 2 del loop de verificación, invocado por `verify-implementation`, o directamente cuando haya que armar o rehacer el plan de casos E2E de un spec. Requiere una carpeta `docs/specs/<fecha>-<feature>/` con `requirements.md` y `design.md`.

## Reglas duras

- Exactamente **tres** casos: uno de camino feliz y dos de fallo. Ni más ni menos.
- Cada caso traza a al menos un criterio numerado `N.M` de `requirements.md`. Un caso que no traza no entra al plan.
- Los casos se derivan del spec, nunca del código ni de los tests ya existentes. Leer el código solo para nombrar selectores y rutas reales, jamás para decidir qué comportamiento es correcto.
- No duplicar cobertura de las suites que ya viven en `e2e/`. Si el caso feliz ya está cubierto, elegir otro camino del spec y decirlo en el plan.
- «Fallo» significa entrada inválida, estado ausente o ruta inexistente — comportamiento que el spec define y que debe degradar de forma prevista. Nunca inventar un fallo que el spec no cubre.
- El plan declara el **nombre exacto del archivo destino** en `e2e/`; `generate-tests` lo respeta al pie de la letra.
- Escribir solo `E2E-test-cases-plan.md`. Este skill no toca código, ni tests, ni el resto del spec.
- El plan es prosa y tablas: pasos y aserciones en lenguaje natural, sin código Playwright.
- El archivo va enteramente en español, como el resto de los artefactos de spec.

## Puertas de decisión

| Situación | Acción |
|---|---|
| Falta `requirements.md` o `design.md` | Parar y derivar a `/specify` |
| El spec no define ningún camino de fallo | Reportarlo como hueco de spec y pedir decisión al usuario |
| Ya existe `E2E-test-cases-plan.md` con contenido | Reescribirlo entero, no acumular versiones |
| El feature no tiene requisitos numerados propios | Trazar contra el diseño de origen y marcarlo explícito en el plan |

## Pasos de ejecución

1. Leer `requirements.md` y `design.md` completos; anotar los criterios numerados.
2. Listar `e2e/` para saber qué ya está cubierto.
3. Elegir el camino feliz de mayor valor y los dos fallos mejor definidos por el spec.
4. Escribir el plan siguiendo `assets/test-cases-plan-template.md`, con precondiciones, pasos, resultado esperado y traza por caso.
5. Guardarlo como `E2E-test-cases-plan.md` en la carpeta del spec.

## Contrato de salida

Devolver la ruta del plan, los tres títulos de caso con su traza `N.M`, el nombre del archivo destino en `e2e/`, y cualquier hueco de spec encontrado.

## Referencias

- `assets/test-cases-plan-template.md` — estructura obligatoria del plan.
- `.claude/agents/generate-tests.md` — consumidor del plan.
- `CLAUDE.md` — decisiones cerradas del producto y comandos de verificación.
