# Tareas — Hábitos

**Estado:** Borrador
**Fecha:** 2026-09-02
**Requisitos:** ./requirements.md
**Diseño:** ./design.md

## Resumen de tareas

| ID | Tarea | Requisitos | Estado |
|----|-------|------------|--------|
| T1 | Dominio: tipos de hallazgo (`tiposHabitos.ts`) y `calcularCategoriaDominante` | 2.3, 2.4, 2.12, 3.1, 3.2, 4.1, 4.6 | [x] Hecho |
| T2 | Dominio: `calcularVariacionCategoria` | 2.5, 2.6, 2.12, 3.1, 3.2, 4.1, 4.6 | [x] Hecho |
| T3 | Dominio: `calcularRitmoGasto` | 2.7, 2.8, 2.12, 3.1, 3.2, 4.1, 4.6 | [x] Hecho |
| T4 | Dominio: `calcularComerciosRecurrentes` | 2.9, 2.10, 2.11, 2.12, 3.1, 3.2, 4.1, 4.6 | [x] Hecho |
| T5 | Dominio: `rangoDeMes` (mes `AAAA-MM` → rango `[desde, hasta)` UTC) | 2.7, 2.9 | [x] Hecho |
| T6 | Infra: `RepositorioGastos.gastosEntreFechas` | 2.7, 2.9, 2.11 | [x] Hecho |
| T7 | Infra: puerto de redacción con fallback y timeout (`redactarHallazgo`) | 4.3, 4.4, 4.5 | [x] Hecho |
| T8 | Infra: cliente real de redacción sobre Claude (`clienteRedaccionHttp`) | 4.6 | [x] Hecho |
| T9 | UI: pestaña "Hábitos" en `BottomNavBar` + `IconoHabitos` | 1.1, 1.2, 1.3 | [x] Hecho |
| T10 | UI: `PantallaHabitos` + `SeccionHallazgos`/`SeccionRecomendaciones` + estado vacío | 1.2, 5.1, 5.2, 5.3, 6.1, 6.2 | [x] Hecho |
| T11 | Ruta `/habitos`: `obtenerHallazgosHabitos` + `app/habitos/page.tsx` | 1.1, 2.1, 2.2, 2.12, 4.2, 4.4 | [x] Hecho |

## Cobertura de requisitos

| Criterio | Tareas | Criterio | Tareas |
|---|---|---|---|
| 1.1 | T9, T11 | 2.12 | T1, T2, T3, T4, T11 |
| 1.2 | T9, T10 | 3.1 | T1, T2, T3, T4 |
| 1.3 | T9 | 3.2 | T1, T2, T3, T4 |
| 2.1 | T11 | 4.1 | T1, T2, T3, T4 |
| 2.2 | T11 | 4.2 | T11 |
| 2.3 | T1 | 4.3 | T7 |
| 2.4 | T1 | 4.4 | T7, T11 |
| 2.5 | T2 | 4.5 | T7 |
| 2.6 | T2 | 4.6 | T1, T2, T3, T4, T8 |
| 2.7 | T3, T5, T6 | 5.1 | T10 |
| 2.8 | T3 | 5.2 | T10 |
| 2.9 | T4, T5, T6 | 5.3 | T10 |
| 2.10 | T4 | 6.1 | T10 |
| 2.11 | T4, T6 | 6.2 | T10 |

## T1 — Dominio: tipos de hallazgo y hallazgo de categoría dominante — [x] Hecho

**Requisitos:** 2.3, 2.4, 2.12, 3.1, 3.2, 4.1, 4.6
**Depende de:** ninguno

**Descripción:**

Crear `dominio/habitos/tiposHabitos.ts` con los tipos compartidos por las cuatro reglas de hallazgo y por la
redacción: la interfaz `CampoRedactable` (`textoRespaldo`, `recomendacionRespaldo`), las cuatro interfaces de
hallazgo (`HallazgoCategoriaDominante`, `HallazgoVariacionCategoria`, `HallazgoRitmoGasto`,
`HallazgoComercioRecurrente`) y la unión discriminada `Hallazgo` por el campo `tipo`, tal como los define
`design.md` en la sección "`dominio/habitos/tiposHabitos.ts`". Usar `Decimal` de `decimal.js` para los
montos y `Categoria` de `dominio/categorizacion/categorizarPorReglas`, nunca `number` ni punto flotante para
plata.

Crear `dominio/habitos/calcularCategoriaDominante.ts` con la función pura:

```ts
export function calcularCategoriaDominante(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
): HallazgoCategoriaDominante | null
```

Devuelve `null` si `totalesMesFoco` está vacío o si dos o más categorías empatan en el total más alto (2.4).
En caso contrario, arma el `HallazgoCategoriaDominante` con `categoria`, `totalCategoria`, `totalMes` (suma
de todos los totales recibidos) y `porcentaje` (0–100, redondeado) de la categoría ganadora (2.3). Junto con
el hallazgo, calcula en el mismo paso `textoRespaldo` y `recomendacionRespaldo` como template strings
determinísticos en tono informal con modismos rioplatenses (voseo, expresiones coloquiales — 4.6), sin
esperar a ninguna llamada al modelo (4.1) — la recomendación es 1:1 con el hallazgo y se calcula por la
misma regla, nunca por separado (3.1). Si la función devuelve `null` (empate o sin datos), no existe
recomendación asociada (3.2) porque no hay hallazgo del cual derivarla. Esta función no depende de ninguna
otra regla de hallazgo — su posible fallo (devolver `null`) no debe impedir el cálculo de las demás (2.12),
propiedad que garantiza el hecho de ser una función pura e independiente, sin estado compartido ni excepción
lanzada.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.3. WHEN el mes en foco tiene al menos una imputación con categoría asignada THE SYSTEM SHALL calcular el hallazgo de categoría dominante como la categoría cuyo total imputado en el mes en foco sea el más alto.
- 2.4. IF dos o más categorías empatan en el total más alto del mes en foco THEN THE SYSTEM SHALL no calcular el hallazgo de categoría dominante.
- 2.12. THE SYSTEM SHALL calcular cada uno de los cuatro hallazgos de forma independiente, de modo que la imposibilidad de calcular uno no impida calcular los demás.
- 3.1. WHEN THE SYSTEM calcula un hallazgo THE SYSTEM SHALL calcular junto con él una recomendación determinística, definida por la misma regla que calculó el hallazgo.
- 3.2. THE SYSTEM SHALL no calcular una recomendación para un hallazgo que no fue calculado.
- 4.1. THE SYSTEM SHALL calcular un texto de respaldo determinístico para cada hallazgo y cada recomendación en el mismo momento en que se calculan, antes de solicitar cualquier redacción al modelo.
- 4.6. THE SYSTEM SHALL redactar el texto de cada hallazgo y recomendación, tanto el generado por el modelo como el texto de respaldo, en tono informal con modismos argentinos rioplatenses (voseo, expresiones coloquiales), consistente con la variante de español ya usada en la aplicación.

**Decision log:**

Tipos de hallazgo definidos literalmente como en `design.md`. `calcularCategoriaDominante` desempata con
`Decimal.equals` sobre el total más alto (no float `===`), y redondea el porcentaje con `ROUND_HALF_UP` a
entero. Los textos de respaldo usan un formateador de moneda local (`Intl.NumberFormat('es-AR')`) en vez de
`app/tokens/formatearMoneda`, para no crear una dependencia `dominio/` → `app/`.

**Outcome:**

`tiposHabitos.ts` y `calcularCategoriaDominante.ts` creados con TDD (RED confirmado, mutación del caso de
empate confirmada — falla solo ese test). `npm run typecheck && npm test`: 0 errores de tipos, 377/377 tests
en verde (52 archivos), incluidos los 4 nuevos de esta tarea.

## T2 — Dominio: hallazgo de variación por categoría — [x] Hecho

**Requisitos:** 2.5, 2.6, 2.12, 3.1, 3.2, 4.1, 4.6
**Depende de:** T1

**Descripción:**

Implementar `dominio/habitos/calcularVariacionCategoria.ts` con la firma exacta de `design.md`
(sección "dominio/habitos/calcularVariacionCategoria.ts"):

```ts
export function calcularVariacionCategoria(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
  totalesMesAnterior: { categoria: Categoria; total: Decimal }[] | null,
): HallazgoVariacionCategoria[]
```

Función pura, sin I/O, que reusa el tipo `HallazgoVariacionCategoria` definido en T1
(`dominio/habitos/tiposHabitos.ts`). Reglas de cálculo:

- Si `totalesMesAnterior` es `null` (no hay mes calendario anterior con imputaciones), devuelve `[]`
  sin calcular nada (2.6).
- Si no es `null`, calcula un hallazgo por cada categoría presente en `totalesMesFoco` o en
  `totalesMesAnterior` (unión de categorías, no intersección) — una categoría ausente en uno de los
  dos meses cuenta como total `0` en ese lado (2.5).
- `variacionPct` es `null` cuando `totalMesAnterior` es `0` (categoría nueva este mes, división por
  cero evitada explícitamente) — nunca `Infinity` ni `NaN`.
- Cada hallazgo trae ya resueltos `textoRespaldo` y `recomendacionRespaldo` (interfaz
  `CampoRedactable`), calculados en el mismo momento que el hallazgo, antes de cualquier llamada a un
  modelo (4.1) — la recomendación se deriva por la misma regla que decide el hallazgo, nunca por un
  cálculo separado (3.1), y no existe si el hallazgo tampoco existe: con `totalesMesAnterior: null` o
  con la unión de categorías vacía, el resultado es `[]` y no hay recomendaciones sueltas (3.2).
- El texto de respaldo y la recomendación de respaldo van en tono informal con modismos argentinos
  rioplatenses (voseo, expresiones coloquiales), igual que el resto del texto de la app (4.6) — por
  ejemplo referirse a un aumento marcado con algo como "se te fue de mambo en `<categoria>` este mes"
  en vez de un texto neutro tipo "gasto incrementado".
- Esta regla se invoca de forma independiente de las otras tres (`calcularCategoriaDominante`,
  `calcularRitmoGasto`, `calcularComerciosRecurrentes`): no debe lanzar ni depender de que las demás
  se hayan podido calcular — la imposibilidad de calcular esta no afecta a las otras y viceversa
  (2.12, cubierto en conjunto con T1/T3/T4; esta tarea es responsable únicamente de que
  `calcularVariacionCategoria` en sí misma nunca lance excepciones y siempre devuelva `[]` o un array
  de hallazgos, nunca `null`/`undefined`).

Ciclo TDD: un test que falla nombrable (p. ej. "con mes anterior null devuelve []"), la
implementación mínima que lo hace pasar, y verificación con `npm run typecheck && npm test`.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.5. WHEN existe al menos un mes calendario anterior al mes en foco con imputaciones THE SYSTEM SHALL calcular, para cada categoría con imputaciones en el mes en foco o en el mes anterior, la variación porcentual entre el total imputado de esa categoría en ambos meses.
- 2.6. IF no existe un mes calendario anterior al mes en foco con imputaciones THEN THE SYSTEM SHALL no calcular el hallazgo de variación por categoría.
- 2.12. THE SYSTEM SHALL calcular cada uno de los cuatro hallazgos de forma independiente, de modo que la imposibilidad de calcular uno no impida calcular los demás.
- 3.1. WHEN THE SYSTEM calcula un hallazgo THE SYSTEM SHALL calcular junto con él una recomendación determinística, definida por la misma regla que calculó el hallazgo.
- 3.2. THE SYSTEM SHALL no calcular una recomendación para un hallazgo que no fue calculado.
- 4.1. THE SYSTEM SHALL calcular un texto de respaldo determinístico para cada hallazgo y cada recomendación en el mismo momento en que se calculan, antes de solicitar cualquier redacción al modelo.
- 4.6. THE SYSTEM SHALL redactar el texto de cada hallazgo y recomendación, tanto el generado por el modelo como el texto de respaldo, en tono informal con modismos argentinos rioplatenses (voseo, expresiones coloquiales), consistente con la variante de español ya usada en la aplicación.

**Decision log:**

`calcularVariacionCategoria` arma la unión de categorías con dos `Map<Categoria, Decimal>` y un `Set` sobre
ambas claves, en vez de iterar arrays con `.find()` — evita O(n²) y deja explícito que una categoría ausente
en un lado resuelve a `new Decimal(0)` por `??`. `variacionPct` usa `Decimal.ROUND_HALF_UP` a entero, igual
que el porcentaje de T1. Los textos de respaldo distinguen cuatro casos (aumento, baja, estable, categoría
nueva) reusando el mismo formateador local `Intl.NumberFormat('es-AR')` de T1.

**Outcome:**

`calcularVariacionCategoria.ts` creado con TDD (RED confirmado, mutación de la guarda de división por cero
confirmada — falla solo ese test, 6/7 pasan). `npm run typecheck && npm test`: 0 errores de tipos, 413/413
tests en verde (56 archivos), incluidos los 7 nuevos de esta tarea.

## T3 — Dominio: hallazgo de ritmo de gasto proyectado — [x] Hecho

**Requisitos:** 2.7, 2.8, 2.12, 3.1, 3.2, 4.1, 4.6
**Depende de:** T1

**Descripción:**

Implementa `dominio/habitos/calcularRitmoGasto.ts`, la tercera de las cuatro reglas puras de
`dominio/habitos/`, con la firma que fija `design.md`:

```ts
export function calcularRitmoGasto(
  gastosMesFoco: { fechaGasto: Date; montoTotal: Decimal }[],
  gastosMesesAnteriores: { fechaGasto: Date; montoTotal: Decimal }[][], // uno por mes anterior disponible
  hoy: Date,
): HallazgoRitmoGasto | null
```

Compara el total imputado en el mes en foco hasta el día calendario de `hoy` (en la zona de
referencia) contra el promedio del total imputado hasta ese mismo número de día en cada mes anterior
disponible. Antes de sumar los gastos de cada mes anterior, los filtra para quedarse solo con los que
caen hasta el mismo día calendario que `hoy` — no compara contra el mes anterior cerrado completo,
porque eso sesgaría la proyección a favor de los meses anteriores. Devuelve `null` si
`gastosMesesAnteriores.length < 2` (2.8), sin lanzar ni devolver un hallazgo parcial. Cuando el
promedio de los meses anteriores da `0`, `variacionPct` es `null` en vez de una división por cero.

Como las otras reglas de `dominio/habitos/`, calcula `textoRespaldo` y `recomendacionRespaldo` en el
mismo cómputo que produce el hallazgo (4.1), nunca en un paso posterior ni delegado al modelo — la
recomendación es una función determinística del mismo dato que decidió el hallazgo (3.1: por ejemplo,
"vas más rápido que tu ritmo habitual" sugiere frenar el gasto discrecional del resto del mes; "vas más
lento" no genera alarma). Si la función devuelve `null`, no hay `recomendacionRespaldo` que mostrar
(3.2) — el llamador nunca sintetiza una recomendación para un hallazgo no calculado. Los dos textos van
en tono informal con modismos rioplatenses (voseo, coloquialismos), igual que el resto de la copy de la
app (4.6) — no un tono neutro que después el modelo tendría que reescribir.

El cumplimiento de 2.12 (independencia entre las cuatro reglas) no se testea acá con una prueba propia:
lo satisface la firma misma — `calcularRitmoGasto` no recibe ni depende del resultado de las otras tres
reglas, así que su fallo o éxito no puede propagarse. La prueba de integración de esa independencia
vive en el contenedor `obtenerHallazgosHabitos` (T11), que invoca las cuatro reglas de forma aislada.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.7 — Con al menos dos meses anteriores disponibles, `calcularRitmoGasto` devuelve un
  `HallazgoRitmoGasto` cuyo `totalHastaHoyMesFoco` es la suma de los gastos del mes en foco con
  `fechaGasto` hasta el día calendario de `hoy` (zona de referencia), y cuyo
  `promedioHastaMismoDiaMesesAnteriores` es el promedio, entre los meses anteriores disponibles, del
  total de gastos de cada uno filtrados hasta ese mismo número de día.
- 2.8 — Con menos de dos meses anteriores disponibles (`gastosMesesAnteriores.length` en `0` o `1`),
  `calcularRitmoGasto` devuelve `null`.
- 2.12 — La firma de `calcularRitmoGasto` no recibe el resultado de ninguna otra regla de
  `dominio/habitos/` ni retorna un valor del que otra regla dependa: es invocable y verificable de forma
  aislada.
- 3.1 — Cuando `calcularRitmoGasto` devuelve un hallazgo no-`null`, el hallazgo trae
  `recomendacionRespaldo` ya resuelto, calculado por la misma función a partir de la comparación entre
  `totalHastaHoyMesFoco` y `promedioHastaMismoDiaMesesAnteriores` (por ejemplo, distinta redacción según
  el ritmo esté por encima, por debajo, o dentro de un margen del promedio).
- 3.2 — Cuando `calcularRitmoGasto` devuelve `null`, no hay `recomendacionRespaldo` que leer — el tipo
  de retorno no admite un hallazgo parcial con recomendación pero sin los demás campos.
- 4.1 — `textoRespaldo` y `recomendacionRespaldo` quedan resueltos en el mismo `HallazgoRitmoGasto` que
  devuelve `calcularRitmoGasto`, sin ninguna llamada a red ni al cliente de redacción — la función es
  pura y sincrónica.
- 4.6 — `textoRespaldo` y `recomendacionRespaldo` están redactados en tono informal con modismos
  rioplatenses (voseo, expresiones coloquiales), no en tono neutro.
- Caso límite adicional (parte del tipo `HallazgoRitmoGasto` fijado en T1): cuando
  `promedioHastaMismoDiaMesesAnteriores` es `0`, `variacionPct` es `null` en vez de `Infinity` o `NaN`.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

`diaCalendario` usa `Intl.DateTimeFormat('en-CA', { timeZone: ZONA_REFERENCIA, day: 'numeric' })` en vez de
`Date.getDate()`, para extraer el día en la zona de referencia y no en la del proceso — mismo patrón de
`componerFechaGasto.ts` pero solo con la parte `day`. `variacionPct` redondea con `Decimal.ROUND_HALF_UP` a
entero, consistente con T1/T2. El texto de respaldo distingue tres bandas (por encima, por debajo, o dentro
de `MARGEN_RITMO_NORMAL_PCT = ±10%` del promedio) más el caso `variacionPct: null` (promedio en 0).

**Outcome:**

`CRITERIA MET`. TDD real (RED confirmado renombrando el archivo de implementación, GREEN 7/7, mutación del
filtro de corte por día calendario confirmada fuerte). `npm run typecheck && npm test`: 417/417 tests en
verde (56 archivos).

## T4 — Dominio: hallazgo de comercios recurrentes — [x] Hecho

**Requisitos:** 2.9, 2.10, 2.11, 2.12, 3.1, 3.2, 4.1, 4.6
**Depende de:** T1

**Descripción:**

`dominio/habitos/calcularComerciosRecurrentes.ts`: la función pura

```ts
export function calcularComerciosRecurrentes(
  gastosMesFoco: { comercio: string | null; montoTotal: Decimal }[],
): HallazgoComercioRecurrente[]
```

que agrupa los gastos del mes en foco por comercio y devuelve un `HallazgoComercioRecurrente` (tipo ya
declarado por T1 en `dominio/habitos/tiposHabitos.ts`) por cada comercio con dos o más gastos, con
`cantidadGastos` y `totalComercio` (suma exacta en `Decimal`, nunca en punto flotante), y con
`textoRespaldo`/`recomendacionRespaldo` ya resueltos (Req. 4.1) para que la redacción con IA de T7 tenga
siempre algo que mostrar aunque falle.

**Qué significa "el mismo comercio" es el contrato de esta tarea, no un detalle de implementación.** El
glosario de `requirements.md` define "comercio recurrente" por **texto normalizado** (criterio 5.7 del
spec de pipeline: mayúsculas, sin acentos, espacios consecutivos colapsados) — no por igualdad literal de
la columna `comercio`. `WWWAYSACOMAR` y `wwwaysacomar ` (con espacio final, si el banco lo dejara pasar en
otro aviso) son el mismo comercio para este hallazgo. La agrupación se hace sobre esa clave normalizada;
el campo `comercio` del hallazgo devuelto usa el texto **original** (sin normalizar) del primer gasto del
grupo en el orden de entrada, para no mostrarle al usuario un identificador en mayúsculas forzadas si el
resto de la UI no lo hace. La normalización se implementa localmente en este archivo (mismos cuatro pasos
que `dominio/categorizacion/categorizarPorReglas.ts`, que no exporta su función interna `normalizar` y no
se importa entre features): duplicar cuatro líneas puras es más barato que crear una dependencia cruzada
no prevista por `design.md`.

`gastosMesFoco` ya llega ordenado por `fecha_gasto` ascendente (design.md, SQL de `gastosEntreFechas`),
así que la agrupación por clave normalizada preserva ese orden de aparición; sobre eso, el resultado se
ordena por `totalComercio` descendente (contrato de `design.md`) con `Array.prototype.sort`, que es
estable — un empate en el total preserva el orden de primera aparición y el resultado es determinista sin
necesitar un desempate explícito.

Cada hallazgo nace con su recomendación (Req. 3.1): la misma función que agrupa y cuenta arma
`recomendacionRespaldo` a partir de los mismos datos (comercio, `cantidadGastos`, `totalComercio`), nunca
una llamada aparte ni una IA decidiéndola. Como la función nunca calcula un hallazgo para un comercio que
no repite, tampoco calcula una recomendación para él (Req. 3.2) — es una consecuencia directa de que ambos
campos viven en el mismo objeto que solo se construye cuando el comercio repite.

`textoRespaldo` y `recomendacionRespaldo` van en tono informal con modismos rioplatenses (voseo, léxico
coloquial) — Req. 4.6 aplica al texto de respaldo tanto como al redactado por el modelo, así que la mezcla
con el texto que devuelva Claude en T7/T8 sea uniforme si la redacción con IA falla a mitad de pantalla.
El contenido exacto del texto (qué palabras usa) es una decisión de implementación de este ciclo, pero
debe incluir el nombre del comercio, `cantidadGastos` y el monto total formateado como los datos
verificables.

**Lo que T4 no hace.** No lee de la base ni arma los rangos de fecha — eso es T6 (`gastosEntreFechas`) y
T11 (el contenedor que arma `gastosMesFoco` con `rangoDeMes` de T5). No redacta con IA — eso es T7/T8. No
decide qué hacer si `gastosMesFoco` está vacío más allá de devolver `[]`: no lanza, no registra nada,
simplemente no hay comercios que agrupar.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.9 — con dos gastos de comercio `WWWAYSACOMAR` (montos `1000` y `500`) y uno de otro comercio en
  `gastosMesFoco`, el resultado incluye un `HallazgoComercioRecurrente` con `comercio: 'WWWAYSACOMAR'`,
  `cantidadGastos: 2` y `totalComercio` igual a `1500` en `Decimal` (no en `number`), verificado con
  `.equals()` de `decimal.js` y no con `toString()` a secas, para que un error de redondeo en punto
  flotante no pase la aserción por casualidad.
- 2.9, normalización — dos gastos con comercio `WWWAYSACOMAR` y `WWWAYSACOMAR ` (espacio final) cuentan
  como el mismo comercio: el resultado tiene un único hallazgo con `cantidadGastos: 2`, no dos hallazgos
  de `cantidadGastos: 1` cada uno.
- 2.10 — con `gastosMesFoco` donde ningún comercio se repite (todos únicos, incluido el caso de un solo
  gasto), la función devuelve `[]`.
- 2.10, borde — arreglo vacío (`[]`) también devuelve `[]`, sin lanzar.
- 2.11 — un gasto con `comercio: null` se excluye del agrupamiento: si ese es el único gasto "repetido"
  en apariencia (por ejemplo, dos gastos con `comercio: null` y montos distintos), el resultado es `[]`,
  no un hallazgo de comercio `null`.
- 2.12 — la función no lanza ni depende de un estado compartido con las otras tres reglas: se invoca de
  forma aislada en el test (sin pasar por `calcularCategoriaDominante`, `calcularVariacionCategoria` ni
  `calcularRitmoGasto`) y produce el resultado esperado, dejando explícito que su fallo o su éxito no
  puede acoplarse al de las demás reglas cuando T11 las orqueste.
- 3.1 — cada `HallazgoComercioRecurrente` calculado trae `recomendacionRespaldo` no vacío en el mismo
  objeto, calculado en la misma pasada (no `undefined`, no placeholder).
- 3.2 — para un comercio que no repite, no existe ningún objeto de recomendación asociado: al no generarse
  el hallazgo, tampoco existe el campo — se verifica indirectamente por la ausencia del hallazgo completo
  en el resultado (2.10).
- 4.1 — `textoRespaldo` y `recomendacionRespaldo` están presentes y son determinísticos: dos invocaciones
  con la misma entrada devuelven exactamente el mismo texto, sin aleatoriedad ni timestamp embebido.
- 4.6 — `textoRespaldo` y `recomendacionRespaldo` usan alguna marca de voseo rioplatense verificable en el
  test (por ejemplo, conjugación en "vos" tipo "gastaste"/"te repetiste" en vez de "usted gastó"), y
  ambos incluyen el nombre del comercio y el monto total formateado.
- Orden — con tres comercios recurrentes de totales distintos, el resultado queda ordenado por
  `totalComercio` descendente.
- Este ciclo no incorpora ninguna dependencia nueva: agrupa con una `Map` o un objeto plano y suma con
  `decimal.js`, ya presente en el proyecto (Req. de diseño, `dominio/habitos/tiposHabitos.ts`).
- Verificación: `npm run typecheck && npm test` en verde, test colocado junto al archivo
  (`calcularComerciosRecurrentes.test.ts`).

**Decision log:**

Normalización reimplementada localmente (mayúsculas, NFD, sin marcas diacríticas, espacios colapsados,
trim) — mismos 4 pasos que `categorizarPorReglas.ts`, sin importarla. Agrupación con
`Map<string, { comercioOriginal, gastos: Decimal[] }>`, preservando el texto original del primer gasto de
cada grupo en orden de entrada. Orden final por `totalComercio` descendente con `Array.prototype.sort`
(estable), sin desempate explícito. El caso de test de "espacio final" no ejercitaba el paso de colapso de
espacios porque `.trim()` ya lo cubre por separado — se agregó un caso adicional con espacios internos
consecutivos para que la mutación de verificación probara genuinamente ese paso.

**Outcome:**

CRITERIA MET — typecheck y `npm test -- calcularComerciosRecurrentes` en verde (11/11), mutación de
normalización probada y restaurada (la primera mutación resultó débil por el solapamiento con `.trim()`;
corregida con un caso de espacios internos).

## T5 — Dominio: `rangoDeMes` (mes `AAAA-MM` → rango de fechas UTC) — [x] Hecho

**Requisitos:** 2.7, 2.9
**Depende de:** ninguno

**Descripción:**

Implementar `rangoDeMes(mes: Mes): { desde: Date; hasta: Date }` en `dominio/habitos/rangoDeMes.ts`, función pura sin I/O que traduce un mes calendario `AAAA-MM` al rango `[desde, hasta)` de instantes UTC que le corresponde en la zona de referencia (`ZONA_REFERENCIA = 'America/Argentina/Buenos_Aires'`, importada de `dominio/normalizacion/componerFechaGasto.ts`), con `hasta` exclusivo. `desde` es la medianoche del primer día del mes en la zona de referencia; `hasta` es la medianoche del primer día del mes siguiente, calculado con `sumarMeses(mes, 1)` de `dominio/imputacion/sumarMeses.ts` — nunca sumando o restando días sobre un `Date` a mano. Usa `TZDate` de `@date-fns/tz` para construir cada límite como hora de pared en la zona de referencia y convertirlo a instante UTC, mismo patrón que ya usa `componerFechaGasto.ts`.

Esta función es el único punto del sistema que traduce un `Mes` a un rango de fechas UTC (design.md, sección `dominio/habitos/rangoDeMes.ts`); la reutilizan `RepositorioGastos.gastosEntreFechas` (T6) y `obtenerHallazgosHabitos` (T11) para filtrar `gastos.fecha_gasto` sin reimplementar la conversión de zona horaria. No calcula ni filtra gastos — eso es responsabilidad de T6 y T11.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.7 (ritmo de gasto proyectado) — `rangoDeMes` debe producir el rango exacto del mes en foco y de cada mes anterior para que `calcularRitmoGasto` (T3) reciba, vía `gastosEntreFechas`, únicamente los gastos de cada mes calendario correspondiente en la zona de referencia — nunca uno corrido por la diferencia de huso horario. Caso de verificación: `rangoDeMes('2026-08')` da `desde = 2026-08-01T03:00:00.000Z` (medianoche del 1/8 en Buenos Aires, offset fijo −03:00) y `hasta = 2026-09-01T03:00:00.000Z`, exclusivo.
- 2.9 (comercio recurrente) — el límite `hasta` debe excluir con precisión el primer instante del mes siguiente para que `calcularComerciosRecurrentes` (T4) agrupe "dentro del mes en foco" sin filtrar de más ni de menos en el borde. Caso de verificación de borde de año: `rangoDeMes('2026-12')` da `hasta = 2027-01-01T03:00:00.000Z`, y un gasto con `fecha_gasto = 2027-01-01T02:59:59.000Z` (todavía diciembre en Buenos Aires) cae dentro del rango, mientras que uno a las `03:00:00.000Z` exactas ya no.
- Caso adicional de cobertura obligatoria: `rangoDeMes('2026-01')` — primer mes del rango de un año, sin mes anterior en el mismo año — da `desde = 2026-01-01T03:00:00.000Z` y `hasta = 2026-02-01T03:00:00.000Z`, verificando que la delegación en `sumarMeses` no introduce un desborde de año al sumar 1.

**Decision log:**

Implementación siguió el precedente exacto de `componerFechaGasto.ts`: `TZDate` con año/mes-índice-0/día/hora
en la zona de referencia, convertido a `Date` UTC con `new Date(tzDate.getTime())`. `desde` usa directamente
`mes`; `hasta` usa `sumarMeses(mes, 1)` y reparsea el string resultante — nunca se suma/resta sobre un
`Date`. No se necesitó `Intl.DateTimeFormat` de verificación round-trip (a diferencia de
`componerFechaGasto`) porque el día siempre es `1`, que nunca desborda en ningún mes/calendario.

**Outcome:**

`CRITERIA MET`. Los tres casos de verificación exigidos (`2026-08`, borde de año `2026-12`→`2027-01`, primer
mes `2026-01`) pasan exactamente con los timestamps especificados. Mutación de `sumarMeses(mes, 1)` →
`sumarMeses(mes, 0)` en el cálculo de `hasta` rompe los 3 tests del archivo y ningún otro, confirmando que el
test ejercita la delegación real en `sumarMeses`. `npm run typecheck && npm test` en verde (377/377).

## T6 — Infra: RepositorioGastos.gastosEntreFechas

**Requisitos:** 2.7, 2.9, 2.11
**Depende de:** ninguno

**Descripción:**

Extender `infra/db/repositorioGastos.ts` (`RepositorioGastos`, actualmente en la interfaz que ya definen T18/T22/T23/T36) con un nuevo método de solo lectura `gastosEntreFechas(desde: Date, hasta: Date): Promise<{ comercio: string | null; montoTotal: Decimal; fechaGasto: Date }[]>`, tal como lo especifica `design.md` en la sección `infra/db/repositorioGastos.ts (extensión)`. Es la única fuente de datos que necesitan `calcularRitmoGasto` (T3) y `calcularComerciosRecurrentes` (T4) — a diferencia de la categoría dominante y la variación por categoría, que leen `vista_gastos_mensuales` vía `RepositorioImputaciones.totalesPorMesYCategoria` (ya existente, Req. 9.1), estos dos hallazgos necesitan `gastos.fecha_gasto` y `gastos.monto_total` directo, porque una imputación de una cuota N>1 no tiene un "día del mes" propio dentro del mes que impacta (ver "Decisiones de diseño" de `design.md`).

La consulta es exactamente la que fija el diseño:

```sql
SELECT comercio, monto_total, fecha_gasto
FROM gastos
WHERE estado <> 'needs_review' AND fecha_gasto >= $1 AND fecha_gasto < $2
ORDER BY fecha_gasto ASC
```

El filtro `estado <> 'needs_review'` excluye los gastos sin datos confiables del cálculo de hábitos, igual que ya hace `pendientesDeConfirmacion` para la bandeja. El rango es `[desde, hasta)` — límite inferior inclusivo, superior exclusivo — para que encadene sin solapamiento ni hueco con `rangoDeMes` (T5), que ya produce los `Date` en ese mismo formato. `monto_total` se mapea a `Decimal` con el mismo patrón que `filaAGasto` (nunca aritmética en punto flotante); `fecha_gasto` se mapea a `Date` tal como ya hace `filaAGasto` para ese campo. Un gasto con `monto_total` o `fecha_gasto` en `NULL` (estado `pendiente`/`extraido` sin datos completos) no debería poder cumplir el filtro `fecha_gasto >= $1 AND fecha_gasto < $2` si `fecha_gasto` es `NULL`, así que la fila nunca aparece — no hace falta un `COALESCE` ni un valor de relleno.

Esta tarea toca únicamente `infra/db/repositorioGastos.ts` y su archivo de test `infra/db/repositorioGastos.test.ts` (una nueva `describe` siguiendo el mismo estilo que las de T18/T22/T23/T36, contra `basePostgresDeTest`). No toca `dominio/habitos/` (T1–T5) ni el contenedor `obtenerHallazgosHabitos` (T11), que es quien va a invocar este método — esta tarea deja el método disponible pero sin ningún llamador todavía.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.7, 2.9 (ritmo de gasto proyectado, comercio recurrente) — `gastosEntreFechas` es el único punto que traduce `[desde, hasta)` en filas de `gastos`; si el rango filtrara de más o de menos, `calcularRitmoGasto` (T3) y `calcularComerciosRecurrentes` (T4) recibirían un conjunto de gastos equivocado sin que la función pura tenga forma de detectarlo. Caso de verificación: un gasto con `fecha_gasto` exactamente igual a `hasta` NO aparece en el resultado; uno con `fecha_gasto` un milisegundo antes de `hasta` SÍ aparece; uno con `fecha_gasto` exactamente igual a `desde` SÍ aparece. El resultado viene ordenado por `fecha_gasto` ascendente.
- 2.11 (comercio recurrente, exclusión de gastos sin comercio) — el método NO filtra por `comercio IS NOT NULL`: la exclusión es responsabilidad de `calcularComerciosRecurrentes` (T4), no de esta consulta. Caso de verificación: un gasto con `comercio: null` dentro del rango pedido aparece en el resultado con ese campo en `null` — si el método lo omitiera, T4 no tendría con qué distinguir "no hay comercios repetidos" de "el método se comió un gasto".
- Caso adicional de cobertura obligatoria: un gasto en estado `needs_review` dentro del rango de fechas pedido NO aparece en el resultado, aunque su `fecha_gasto` esté dentro de `[desde, hasta)`.
- `montoTotal` en el resultado es una instancia de `Decimal` (nunca `number` ni el `string` crudo de la columna), construida con el mismo patrón que `filaAGasto`.

Nota: 2.8 y 2.10 (menos de dos meses anteriores con datos / ningún comercio repetido) son decisiones que toman `calcularRitmoGasto` y `calcularComerciosRecurrentes` sobre la cantidad y forma de los datos que reciben — no algo que `gastosEntreFechas` decida o pueda romper por sí solo, así que no trazan a esta tarea (mismo criterio que aplicó T20 del spec de pipeline de emails al sacar 4.3 de su propia traza).

**Decision log:**

El campo `comercio: null` de `GastoNormalizado` no es alcanzable vía `crear`/`actualizarDatos` (el tipo de
dominio exige `string`); el test de ese caso usa un `INSERT` directo sobre `gastos`, igual que ya hacen los
tests de restricciones de T18. El caso de exclusión por `needs_review` necesita un gasto needs_review CON
`fecha_gasto`/`monto_total` poblados (no solo `crearParaRevision` con campos vacíos), para que el test ejerza
realmente el filtro `estado <> 'needs_review'` y no pase por casualidad porque la fila nunca hubiera cumplido
el filtro de fecha — se logra encadenando `crearParaRevision` + `actualizarDatos` (T40). Fuera de
`needs_review`, `monto_total` y `fecha_gasto` siempre llegan completos juntos, así que el mapeo castea a
`Decimal`/`Date` no nulos sin `COALESCE` ni chequeo adicional.

**Outcome:**

`gastosEntreFechas` implementado y verificado (RED → GREEN → mutación de rango probada y restaurada). 56/56
tests en `repositorioGastos.test.ts`, 384/384 en el proyecto completo, typecheck limpio.

## T7 — Infra: puerto de redacción con fallback y timeout (redactarHallazgo) — [x] Hecho

**Requisitos:** 4.3, 4.4, 4.5

**Depende de:** T1

**Descripción:** Crear `infra/ia/redactarHallazgo.ts` con el mismo patrón puerto/adaptador que `infra/ia/inferirCategoria.ts` (puerto inyectado, sin credenciales ni red en el test): la interfaz `ClienteRedaccion` (`redactar(solicitud: SolicitudRedaccion): Promise<RespuestaRedaccion>`), los tipos `SolicitudRedaccion`, `RespuestaRedaccion`, `HallazgoRedactado`, la constante `TIMEOUT_REDACCION_MS = 4000`, y la función `redactarHallazgo(hallazgo: Hallazgo, cliente: ClienteRedaccion): Promise<HallazgoRedactado>`. Es un único intento con timeout — nunca reintenta y nunca lanza: ante falla del cliente o vencimiento del timeout, resuelve con `texto: hallazgo.textoRespaldo` y `recomendacionTexto: hallazgo.recomendacionRespaldo` (`fuente: 'respaldo'`); ante una respuesta a tiempo, resuelve con el texto del modelo (`fuente: 'modelo'`). No toca ningún campo numérico, la `categoria` ni el `comercio` del `Hallazgo` recibido — lo devuelve tal cual dentro de `HallazgoRedactado.hallazgo`; la función solo produce las dos cadenas de texto. Que nunca lance es la precondición para que el contenedor (T11) pueda correr varias invocaciones en paralelo con `Promise.all` sin que la falla de una aborte a las demás (Req. 4.4) — la orquestación en paralelo en sí queda fuera del alcance de esta tarea. La única dependencia real es `dominio/habitos/tiposHabitos.ts` (T1), de donde salen `Hallazgo` y `CampoRedactable` — el test puede construir un doble mínimo de cualquiera de los cuatro variantes de `Hallazgo` sin que existan todavía las funciones de cálculo de T2–T4 (`design.md`, sección `infra/ia/redactarHallazgo.ts`, lista como única dependencia `dominio/habitos/tiposHabitos`).

**Criterios de aceptación (trazados desde requirements.md):**

1. Dado un `ClienteRedaccion` cuyo `redactar` resuelve dentro del timeout con `{ texto, recomendacionTexto }`, `redactarHallazgo` devuelve un `HallazgoRedactado` con `fuente: 'modelo'` y esos mismos valores de texto.
2. Dado un `ClienteRedaccion` cuyo `redactar` rechaza (lanza / promesa rechazada), `redactarHallazgo` no propaga la excepción: resuelve con `fuente: 'respaldo'`, `texto: hallazgo.textoRespaldo`, `recomendacionTexto: hallazgo.recomendacionRespaldo` (Req. 4.3).
3. Dado un `ClienteRedaccion` cuya promesa no resuelve dentro de `TIMEOUT_REDACCION_MS`, `redactarHallazgo` resuelve igualmente — sin esperar indefinidamente — con el texto de respaldo; el test usa fake timers, sin depender de tiempo real (Req. 4.3).
4. Tanto en el caso de éxito como en el de respaldo, `HallazgoRedactado.hallazgo` es exactamente el objeto `Hallazgo` recibido, sin ninguno de sus campos numéricos, su `categoria` ni su `comercio` alterados — la redacción produce únicamente las cadenas `texto`/`recomendacionTexto` (Req. 4.5).
5. `redactarHallazgo` nunca lanza una excepción bajo ningún resultado del cliente (éxito, rechazo, timeout) — se verifica con `await expect(...).resolves...` en los tres casos, nunca con un `try/catch` alrededor de la llamada de test (Req. 4.4, condición necesaria para que el llamador corra invocaciones en paralelo sin que una falla aborte a las demás).
6. `TIMEOUT_REDACCION_MS` está exportado con el valor `4000` fijado en el diseño.

**Decision log:**

Timeout implementado con `Promise.race` contra un timer construido con `setTimeout` (no `AbortController`,
ya que `ClienteRedaccion.redactar` no expone una señal de cancelación en su firma — la promesa perdedora del
cliente queda colgada pero sin efecto observable). Se agregó un helper privado `serializarDatosHallazgo`
para construir `SolicitudRedaccion.datos` a partir del hallazgo (strips `tipo`/`textoRespaldo`/
`recomendacionRespaldo`, `Decimal` vía `.toString()`) — T8 puede ajustarlo si el prompt real necesita otra
forma de serialización.

**Outcome:**

Hecho. `infra/ia/redactarHallazgo.ts` + `infra/ia/redactarHallazgo.test.ts` (8 tests). `npm run typecheck &&
npm test -- infra/ia/redactarHallazgo.test.ts` en verde. Mutación de verificación sobre el `catch` del
`Promise.race`: rompió exactamente los 3 tests que ejercitan el camino de rechazo, restaurada con Edit.

## T8 — Infra: cliente real de redacción sobre Claude (clienteRedaccionHttp) — [x] Hecho

**Requisitos:** 4.6

**Depende de:** T7

**Descripción:** Crear `infra/ia/clienteRedaccionHttp.ts` con `crearClienteRedaccionHttp(apiKey: string): ClienteRedaccion`, mismo patrón puerto/adaptador que `infra/ia/clienteClaudeHttp.ts` (modelo fijo `claude-sonnet-5`, `tool_choice` forzado a una única tool). La tool `redactar_hallazgo` expone un `input_schema` que exige `texto` y `recomendacionTexto` como strings. Las instrucciones de sistema fijan tono informal con modismos rioplatenses (voseo, expresiones coloquiales) y prohíben inventar cifras: el prompt arma el mensaje de usuario solo a partir de `SolicitudRedaccion.tipo` y `SolicitudRedaccion.datos`, sin agregar ni omitir campos. Igual que `crearClienteClaudeHttp`, un solo intento por llamada — el reintento/timeout ya los maneja `redactarHallazgo` (T7) por afuera — y sin test de integración contra la red real por falta de credenciales en este entorno.

**Criterios de aceptación (trazados desde requirements.md):**

- [ ] (4.6) Dado un `Hallazgo` de cualquiera de los cuatro tipos, cuando `crearClienteRedaccionHttp(apiKey).redactar(solicitud)` se invoca con una solicitud válida, el cliente llama a `messages.create` con `system` conteniendo instrucciones de tono informal/rioplatense y con `tool_choice` forzado a `redactar_hallazgo`, y devuelve `{ texto, recomendacionTexto }` extraídos del bloque `tool_use` — sin modificar los valores numéricos, la categoría o el comercio recibidos en `datos` (consistente con 4.5, verificado en T7).
- [ ] Si Claude no devuelve el `tool_use` esperado, o lo devuelve con `texto`/`recomendacionTexto` de tipo distinto a `string`, el cliente lanza un error (nunca devuelve un texto inventado ni un valor no-string) — el manejo de esa falla como respaldo es responsabilidad de `redactarHallazgo` (T7), no de este adaptador.
- [ ] El prompt de usuario que arma el cliente se construye únicamente a partir de `solicitud.tipo` y las claves/valores de `solicitud.datos` — ningún dato adicional del sistema (fecha actual, otros hallazgos, etc.) se filtra al mensaje.
- [ ] Verificación: `npm run typecheck && npm test` en verde; sin test de integración contra la red real de Claude (mismo criterio documentado para `clienteClaudeHttp.test.ts`, si existiera).

**Decision log:**

Mismo patrón puerto/adaptador que `crearClienteClaudeHttp`: modelo fijo `claude-sonnet-5`, `tool_choice`
forzado a la única tool `redactar_hallazgo` (`input_schema` exige `texto`/`recomendacionTexto` como
`string`). Las instrucciones de sistema fijan tono voseo/rioplatense y prohíben explícitamente inventar
cifras. El prompt de usuario (`construirMensajeUsuario`) serializa únicamente `solicitud.tipo` + las
entradas de `solicitud.datos` — no recibe ningún otro dato del sistema. Un solo intento por llamada, sin
reintento propio (T7 maneja timeout/fallback). Sin test de integración contra la red real de Claude.

**Outcome:**

CRITERIA MET. `crearClienteRedaccionHttp(apiKey)` implementado y consumido como `ClienteRedaccion` de T7.
Ciclo TDD completo: RED → GREEN (429/429 tests, 58 archivos, typecheck limpio) → mutación de la validación
de tipos probada (falla exactamente los 2 tests dirigidos) y restaurada con Edit.

## T9 — UI: pestaña "Hábitos" en BottomNavBar — [x] Hecho

**Requisitos:** 1.1, 1.2, 1.3
**Depende de:** ninguno

**Descripción:**

Sumar la tercera pestaña "Hábitos" a `app/components/BottomNavBar.tsx`, que hoy solo conoce "Inicio" y
"Bandeja" (`type Pestana = 'inicio' | 'bandeja'`). El diseño (`design.md`, sección `BottomNavBar.tsx
(modificación)`) fija el contrato: ampliar `Pestana` a `'inicio' | 'bandeja' | 'habitos'`, agregar un
tercer `<Link href="/habitos">` con el mismo patrón visual y de accesibilidad que los dos existentes
(`data-testid="nav-habitos"`, `aria-current="page"` cuando `activa === 'habitos'`, mismas clases de
color activo/inactivo), y sin badge — Hábitos no tiene noción de "pendientes". Requiere un ícono nuevo
`IconoHabitos` en `app/components/iconos.tsx`, mismo estilo SVG inline `viewBox="0 0 20 20"` que
`IconoInicio`/`IconoBandeja`.

Esta tarea toca únicamente `BottomNavBar.tsx` e `iconos.tsx`. No crea la ruta `/habitos` ni
`PantallaHabitos` (T10, T11) — el componente se testea aislado, con la prop `activa` ya soportando el
valor `'habitos'` aunque todavía no exista ningún consumidor real que la pase.

**Ciclo TDD:**

1. **Test que falla:** un test de componente nuevo, `app/components/BottomNavBar.test.tsx` (no existe
   hoy — se crea en esta tarea), que renderiza `<BottomNavBar cantidadPendientes={0} activa="habitos" />`
   y falla porque hoy no hay ningún `data-testid="nav-habitos"` en el árbol ni la etiqueta "Hábitos".
2. **Implementación mínima:** ampliar `Pestana`, agregar el tercer `<Link>` e `IconoHabitos`.
3. **Verificación:** `npm run typecheck && npm test`.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.1 — El componente renderiza un `<Link href="/habitos" data-testid="nav-habitos">` con el texto
  "Hábitos" visible, siguiendo el mismo patrón de navegación (`next/link`) que ya usan "Inicio" y
  "Bandeja" — no hay `onClick` con `router.push` ni ninguna otra forma de navegación.
- 1.2 — Con `activa="habitos"`, el `<Link>` de Hábitos tiene `aria-current="page"` y la clase de color
  activo (`text-acento`); con `activa="inicio"` o `activa="bandeja"`, el `<Link>` de Hábitos **no**
  tiene `aria-current` y usa la clase inactiva (`text-texto-muted`) — mismo criterio binario que ya
  aplican "Inicio" y "Bandeja" entre sí.
- 1.3 — Con `activa="habitos"`, los `<Link data-testid="nav-inicio">` y `<Link
  data-testid="nav-bandeja">` siguen presentes en el árbol, con sus `href` (`/dashboard`, `/bandeja`) y
  su comportamiento de badge (`IndicadorPendientes` sobre "Bandeja" cuando `cantidadPendientes > 0`)
  intactos — un test existente de regresión reusa el mismo render con `cantidadPendientes={3}` y
  verifica que el indicador sigue apareciendo sobre "Bandeja" y nunca sobre "Hábitos".
- Verificación: `npm run typecheck && npm test` en verde. Esta tarea no agrega ninguna dependencia
  externa nueva.

**Decision log:**

Ícono `IconoHabitos` elegido como un trazo de línea de tendencia con marca ascendente (path stroke, mismo
estilo que `IconoBandeja`) en vez de un ícono de check — coherente con la semántica de "hábitos/tendencias de
gasto" que introduce esta feature, sin sumar ninguna dependencia de íconos externa.

**Outcome:**

CRITERIA MET. `Pestana` ampliado a `'inicio' | 'bandeja' | 'habitos'`; tercer `<Link href="/habitos"
data-testid="nav-habitos">` agregado sin badge; `IconoHabitos` agregado en `iconos.tsx`. Ciclo TDD completo:
RED (4/4 fallando por ausencia de `nav-habitos`) → GREEN (76/76 tests de componentes, typecheck limpio) →
mutación de `aria-current` probada y restaurada. Criterios 1.1, 1.2, 1.3 cubiertos por
`BottomNavBar.test.tsx`. No se tocó `/habitos` ni `PantallaHabitos` (T10/T11), según alcance.

## T10 — UI: PantallaHabitos con secciones y estado vacío — [x] Hecho

**Requisitos:** 1.2, 5.1, 5.2, 5.3, 6.1, 6.2

**Depende de:** T7, T9

**Descripción:**

Crear `app/components/habitos/PantallaHabitos.tsx`, componente de presentación puro (sin `'use client'`, sin fetch) que recibe `hallazgos: HallazgoRedactado[]` (tipo de `infra/ia/redactarHallazgo.ts`, T7) y `cantidadPendientes: number`, y arma el layout de `/habitos`: `<TopAppBar />`, el contenido central (dos secciones o estado vacío) y `<BottomNavBar activa="habitos" cantidadPendientes={cantidadPendientes} />` (T9). Junto con `PantallaHabitos.tsx`, crear los dos subcomponentes de sección que declara `design.md` — `app/components/habitos/SeccionHallazgos.tsx` y `app/components/habitos/SeccionRecomendaciones.tsx` —, cada uno recibiendo `{ hallazgos: HallazgoRedactado[] }` y renderizando una tarjeta por ítem (título de sección fijo, mismo patrón `<section>` + `<h3>` que `SeccionCategorias`). Cada tarjeta reusa literalmente la clase `rounded-3xl border border-texto-muted/15 bg-superficie` que ya usa `SeccionCategorias` en `app/components/SeccionCategorias.tsx` — nunca un estilo de tarjeta nuevo — y muestra `texto` (en `SeccionHallazgos`) o `recomendacionTexto` (en `SeccionRecomendaciones`) de cada `HallazgoRedactado`. Si `hallazgos.length === 0`, `PantallaHabitos` no renderiza ninguna de las dos secciones: en su lugar muestra un mensaje explícito de datos insuficientes (texto fijo, ej. "Todavía no hay datos suficientes para mostrar hábitos"), y de todos modos sigue renderizando `<BottomNavBar activa="habitos" cantidadPendientes={cantidadPendientes} />` debajo del mensaje. La activación visual de la pestaña "Hábitos" (borde/color activo, `aria-current="page"`) ya la resuelve `BottomNavBar` internamente (T9); acá solo hace falta pasarle `activa="habitos"` en los dos casos (con datos y en estado vacío) para satisfacer 1.2 en esta pantalla. No hay estado de interacción que gestionar (no hay selector de mes ni toggle), así que el componente es un Server Component candidato — sin `'use client'`, igual que especifica `design.md`.

**Criterios de aceptación (trazados desde requirements.md):**

- 5.1: WHEN `hallazgos` tiene al menos un ítem, `PantallaHabitos` renderiza una sección "Hallazgos" con una tarjeta por cada `HallazgoRedactado` recibido, mostrando su `texto`.
- 5.2: WHEN `hallazgos` tiene al menos un ítem, `PantallaHabitos` renderiza una sección "Recomendaciones" con una tarjeta por cada `HallazgoRedactado` recibido, mostrando su `recomendacionTexto`.
- 5.3: Las tarjetas de ambas secciones usan la misma clase de borde/tipografía/superficie (`rounded-3xl border border-texto-muted/15 bg-superficie`) que ya usan las tarjetas de `/dashboard` (`SeccionCategorias`) — no se define ningún estilo de tarjeta nuevo.
- 6.1: IF `hallazgos.length === 0` THEN `PantallaHabitos` muestra un mensaje explícito de datos insuficientes en lugar de las secciones "Hallazgos" y "Recomendaciones".
- 6.2: WHILE se muestra el mensaje de datos insuficientes, `PantallaHabitos` sigue renderizando `<BottomNavBar activa="habitos" cantidadPendientes={cantidadPendientes} />`.
- 1.2: EN ambos casos (con hallazgos y en estado vacío), `PantallaHabitos` renderiza `<BottomNavBar activa="habitos" .../>`, dejando la pestaña "Hábitos" marcada como activa (comportamiento visual ya cubierto por T9; acá se verifica que `PantallaHabitos` efectivamente le pasa `activa="habitos"`).

**Decision log:**

`PantallaHabitos` mantiene el estado vacío con un simple `<p>` de texto fijo, sin envolverlo en `<section>` —
no hay título ni lista que agrupar. `SeccionHallazgos`/`SeccionRecomendaciones` usan el índice del `.map`
como `key` — `Hallazgo` no trae un identificador estable (es un cálculo derivado, no una fila con PK), y el
orden no cambia entre renders porque `PantallaHabitos` no tiene estado propio. La clase de tarjeta se reusa
literalmente desde `SeccionCategorias`, con `p-4` agregado (ahí el padding vive en el `<button>` interno;
acá la tarjeta no es interactiva, así que va directo en el contenedor).

**Outcome:**

CRITERIA MET. TDD real: RED confirmado, GREEN 6/6, mutación de la condición vacío/con-datos confirmada
fuerte (rompió exactamente los 3 tests de contenido de sección, dejó intactos los 3 de estado vacío/activa).
`npm run typecheck && npm test`: 429/429 tests en verde (58 archivos).

## T11 — Ruta /habitos: contenedor obtenerHallazgosHabitos y page.tsx — [x] Hecho

**Requisitos:** 1.1, 2.1, 2.2, 2.12, 4.2, 4.4

**Depende de:** T1, T2, T3, T4, T5, T6, T7, T8, T10

**Descripción:**

Cierra la ruta `/habitos`. Dos piezas, mismo patrón que `app/dashboard/obtenerFilasDashboard.ts` +
`app/dashboard/page.tsx`:

- `app/habitos/obtenerHallazgosHabitos.ts`: exporta `MESES_VENTANA_HABITOS = 6` y
  `obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, ahora): Promise<Hallazgo[]>`.
  Pide `totalesPorMesYCategoria(desde, hasta)` sobre la ventana; si no hay ninguna fila devuelve `[]`
  sin llamar a ninguna regla (Req. 2.2). Si hay datos, deriva `mesEnFoco` (el mes más reciente presente)
  y la lista de meses anteriores presentes. Arma los datos de entrada de cada regla de `dominio/habitos/`
  (T1–T4): totales por categoría del mes en foco y del mes inmediatamente anterior para
  `calcularCategoriaDominante`/`calcularVariacionCategoria`; rangos de fecha vía `rangoDeMes` (T5) +
  `gastosEntreFechas` (T6) del mes en foco y de cada mes anterior disponible para
  `calcularRitmoGasto`/`calcularComerciosRecurrentes`. Llama a las cuatro funciones puras de forma
  independiente (Req. 2.12: el fallo/`null` de una no bloquea a las demás) y aplana el resultado en un
  único `Hallazgo[]`.
- `app/habitos/page.tsx`: Server Component, mismo patrón de raíz de composición que
  `app/dashboard/page.tsx` (mismo `Pool` construido desde `process.env.DATABASE_URL`, mismos
  repositorios de `infra/db/`, más `crearClienteRedaccionHttp` de T8 construido desde la API key de
  entorno). Llama `obtenerHallazgosHabitos`, y si el resultado no está vacío, redacta cada hallazgo con
  `redactarHallazgo` (T7) **en paralelo** vía `Promise.all` (Req. 4.2, 4.4: la solicitud al modelo se
  hace por cada hallazgo calculado, y la falla de una no impide resolver las demás — `redactarHallazgo`
  nunca lanza, así que ninguna reordena ni cancela a las otras). Pasa el `HallazgoRedactado[]` resultante
  y `cantidadPendientes` (vía `obtenerCantidadPendientes`, reuso sin cambios) a `<PantallaHabitos />`
  (T10). Si `obtenerHallazgosHabitos` devuelve `[]`, no llama a `redactarHallazgo` y pasa `hallazgos: []`
  directo — `PantallaHabitos` ya resuelve el estado vacío (Req. 6.1, cerrado en T10).

El acceso de navegación (Req. 1.1: tocar la pestaña "Hábitos" navega a `/habitos`) queda satisfecho por
la existencia de la ruta bajo `app/habitos/page.tsx` — Next.js App Router resuelve el `href` que T9 ya
dejó apuntando a `/habitos` en `BottomNavBar`; esta tarea no agrega lógica de ruteo propia.

**Ciclo TDD:**

- Rojo: test de integración liviana de `obtenerHallazgosHabitos` contra la base de test
  (`infra/db/testUtils/basePostgresDeTest.ts`, mismo estilo que la estrategia de testing de
  `design.md`), con los repositorios reales — sin mockear el SQL. Siembra `gastos`/`imputaciones` en al
  menos tres meses calendario consecutivos (para habilitar las cuatro reglas) y verifica que:
  (a) `mesEnFoco` resuelto es el mes más reciente con imputaciones dentro de la ventana;
  (b) el `Hallazgo[]` devuelto contiene los tipos esperables para esa siembra (categoría dominante,
  variación, ritmo, comercio recurrente) con los valores numéricos correctos;
  (c) con la base vacía de imputaciones, devuelve `[]` sin lanzar (Req. 2.2).
- Verde: implementación mínima de `obtenerHallazgosHabitos.ts` que arma los rangos, llama a
  `gastosEntreFechas`/`totalesPorMesYCategoria` y a las cuatro reglas de `dominio/habitos/`, y aplana
  el resultado.
- `page.tsx` se agrega como wiring sin test unitario propio, mismo patrón sin precedente de
  `app/dashboard/page.tsx` (no tiene `page.test.tsx`): la composición server-side de Next.js queda
  cubierta por el caso E2E feliz de `/habitos` que `/plan-test-cases` deriva después, no por esta tarea.
- Verificación: `npm run typecheck && npm test`.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.1: la ruta `/habitos` existe y resuelve a `PaginaHabitos`, de modo que el `href` de la pestaña
  "Hábitos" (T9) navega a una pantalla real.
- 2.1: `obtenerHallazgosHabitos` calcula los hallazgos sobre el mes en foco cuando `page.tsx` la invoca
  al abrir `/habitos`.
- 2.2: si no existe ninguna imputación en la ventana de `MESES_VENTANA_HABITOS` meses,
  `obtenerHallazgosHabitos` devuelve `[]` sin invocar ninguna de las cuatro reglas.
- 2.12: las cuatro reglas se llaman de forma independiente — un test que fuerza que una de ellas no
  pueda calcular su hallazgo (p. ej. sin mes anterior) confirma que las otras tres igual aparecen en el
  `Hallazgo[]` resultante.
- 4.2: cuando `obtenerHallazgosHabitos` devuelve al menos un hallazgo, `page.tsx` solicita a
  `redactarHallazgo` una redacción para cada uno.
- 4.4: la redacción de cada hallazgo corre en una llamada independiente (`Promise.all` sobre invocaciones
  separadas de `redactarHallazgo`, no una llamada combinada), de modo que la falla de una no impide
  resolver el texto redactado o de respaldo de las demás.

**Decision log:**

`obtenerHallazgosHabitos` distingue dos nociones de "mes anterior": el inmediatamente anterior
(`sumarMeses(mesEnFoco, -1)`, usado solo por categoría dominante/variación, `null` si hay un hueco puntual) y
todos los meses anteriores presentes en la ventana (usados por ritmo de gasto vía `gastosEntreFechas`,
toleran huecos). Las cuatro reglas se invocan secuencialmente pero de forma independiente — son funciones
puras y síncronas, así que no hace falta `Promise.all` a ese nivel; el paralelismo real (4.2/4.4) vive en
`page.tsx` sobre `redactarHallazgo`. `page.tsx` sigue el patrón exacto de `app/dashboard/page.tsx` para la
lectura de `ANTHROPIC_API_KEY`. Ninguna incompatibilidad entre las piezas de T1-T10: todas las firmas
coincidieron exactamente con `design.md` tal como ya estaban implementadas.

**Outcome:**

CRITERIA MET. TDD real: RED confirmado, GREEN 3/3, mutación de `mesEnFoco` (min en vez de max) confirmada —
rompió exactamente los 2 tests que dependen de la resolución de mes, restaurada con Edit. `npm run
typecheck && npm test`: 432/432 tests en verde (59 archivos). `page.tsx` agregado como wiring sin test
unitario propio, mismo patrón que `app/dashboard/page.tsx`.

**Spec cerrado: 11/11 tareas en CRITERIA MET.**
