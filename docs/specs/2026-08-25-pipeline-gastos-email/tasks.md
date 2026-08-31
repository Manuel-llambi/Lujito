# Tareas — Pipeline de gastos desde emails del banco

**Estado:** Borrador
**Fecha:** 2026-08-25
**Requisitos:** ./requirements.md
**Diseño:** ./design.md

## Resumen de tareas

| ID | Tarea | Requisitos | Estado |
|----|-------|------------|--------|
| T1 | Andamiaje del proyecto y `decodificarQuotedPrintable` | 2.1 | [x] |
| T2 | Parser: campos base por etiqueta normalizada | 2.2, 2.3 | [x] |
| T3 | Parser: cuotas presentes y ausentes | 2.4, 2.5 | [x] |
| T4 | Parser: tipo de tarjeta y últimos cuatro dígitos sobre HTML mal formado | 2.6, 2.7, 2.8, 2.9, 2.10 | [x] |
| T5 | Parser: resultados `no_es_aviso` y `aviso_ilegible` | 2.11, 4.1 | [x] |
| T6 | `normalizarMonto` con decimal exacto | 3.1, 3.2 | [x] |
| T7 | `componerFechaGasto` en zona horaria de referencia | 3.3 | [x] |
| T10 | `resolverMontoTotal` y la constante `INTERPRETACION_MONTO` | 8.8 | [x] |
| T8 | `normalizarAviso`: camino válido a `GastoNormalizado` | 2.5, 2.12, 3.4, 8.8 | [x] |
| T9 | `normalizarAviso`: validaciones que devuelven `MotivoRevision` | 2.11, 3.5, 3.6, 3.7 | [x] |
| T11 | `dividirEnCuotas` conservando el total exacto | 8.3 | [x] |
| T12 | `mesDe`: mes calendario en zona de referencia | 8.4 | [x] |
| T13 | `sumarMeses` y `calcularMesesDeImputacion` | 8.2, 8.4, 8.5 | [x] |
| T14 | `categorizarPorReglas`: coincidencia por contención y ausencia de coincidencia | 5.1, 5.2, 5.4, 5.7 | [x] |
| T15 | `categorizarPorReglas`: prioridad, reglas inactivas y determinismo | 5.2, 5.5, 5.6 | [x] |
| T16 | Base de datos, migración de `emails_crudos` y `guardarSiEsNuevo` | 1.1, 1.2, 1.3 | [x] |
| T17 | Migración de `categorias` y `reglas_categoria` con la semilla de categorías y de comercios conocidos | 5.1, 5.8 | [x] |
| T18 | Migración de `gastos` y `RepositorioGastos.crear` | 2.12, 3.2, 3.5, 3.7, 10.5 | [x] |
| T19 | Migración de `imputaciones` y `reemplazarPara` sin duplicados | 8.6 | [x] |
| T20 | `vista_gastos_mensuales` y `totalesPorMesYCategoria` | 9.1, 9.3, 9.5 | [x] |
| T21 | `marcarDescartado` y `traerCrudo` en `RepositorioEmails` | 4.2, 4.3, 10.3 | [x] |
| T22 | `asignarCategoria` y `marcarParaRevision` con trazas de error | 6.6, 10.4, 10.5 | [x] |
| T23 | `confirmar` y `pendientesDeConfirmacion` | 7.1, 7.2, 7.3, 7.4, 7.10 | [x] |
| T53 | Migración de `estado_acceso_gmail` y `RepositorioAccesoGmail` | 1.5 | [x] |
| T24 | `ClienteGmail`: listar y traer mensajes del remitente configurado | 1.1, 1.7 | [x] |
| T25 | `ClienteGmail`: renovación del token vencido y reintento | 1.4 | [x] |
| T26 | `ClienteGmail`: acceso revocado, sin reintentos y sin volver a llamar | 1.5 | [x] |
| T27 | `inferirCategoria`: conjunto cerrado con abstención | 6.1, 6.7 | [x] |
| T28 | `inferirCategoria`: respuesta fuera del enum y falla del modelo | 6.4, 6.5 | [x] |
| T29 | Workflow `procesarAviso`, endpoint y step ingestar | 1.1, 1.3 | [x] |
| T30 | Step extraer: camino válido hasta gasto `extraido` | 2.3, 3.4, 10.5 | [x] |
| T31 | Step extraer: `no_es_aviso` marca el email `descartado` | 4.1, 4.2 | [x] |
| T32 | Step extraer: aviso ilegible o inválido deja el gasto en `needs_review` | 2.11, 2.12, 3.5, 3.6, 3.7 | [x] |
| T33 | Step categorizar: coincidencia por regla, sin invocar el modelo | 5.3, 6.2 | [x] |
| T34 | Step categorizar: inferencia con IA sin confirmar | 6.3, 6.6 | [x] |
| T35 | Step categorizar: `Sin categorizar` sin frenar el pipeline | 6.4, 6.5, 6.7 | [x] |
| T36 | Step imputar: N imputaciones por gasto | 8.1, 8.3, 8.5, 10.5 | [x] |
| T37 | Idempotencia del pipeline completo | 1.3, 8.6, 8.7 | [x] |
| T38 | Reintentos con espera creciente y agotamiento a `needs_review` | 1.6, 10.1, 10.2 | [x] |
| T39 | Cron `ingestarAvisos` que emite `aviso/recibido` | 1.1, 1.7 | [x] |
| T40 | Reprocesar un email crudo sin volver a Gmail | 10.3 | [x] |
| T42 | Tokens de Tailwind y componente de presentación `GraficoMensual` | 9.2 | [x] |
| T43 | `/dashboard`: contenedor que suma imputaciones | 9.1, 9.2 | [x] |
| T44 | Indicador visual y textual de "sin confirmar" | 9.3 | [x] |
| T47 | Indicador in-app de gastos pendientes de confirmación | 7.1, 7.8 | [x] |
| T48 | `/bandeja`: listado de gastos pendientes con justificación | 7.2, 7.10 | [x] |
| T49 | Confirmar la categoría propuesta | 7.3, 7.9 | [x] |
| T50 | Corregir la categoría propuesta | 7.4, 9.4 | [x] |
| T51 | Ofrecer y crear la regla del comercio | 7.5, 7.6 | [x] |
| T52 | Rechazar la creación de la regla | 7.7 | [x] |

Nota de reordenamiento (no renumera IDs): T10 se movió delante de T8 porque T8 depende de T10 (`resolverMontoTotal`); T8 pasó a depender de T4 en vez de T3 (T3 llega transitivamente vía T4). El resto del orden preserva la secuencia dominio → persistencia → adaptadores → workflow → superficie visual ya vigente.

## Cobertura de requisitos

| Criterio | Tareas | Criterio | Tareas |
|---|---|---|---|
| 1.1 | T16, T24, T29, T39 | 6.1 | T27 |
| 1.2 | T16 | 6.2 | T33 |
| 1.3 | T16, T29, T37 | 6.3 | T34 |
| 1.4 | T25 | 6.4 | T28, T35 |
| 1.5 | T53, T26 | 6.5 | T28, T35 |
| 1.6 | T38 | 6.6 | T22, T34 |
| 1.7 | T24, T39 | 6.7 | T27, T35 |
| 2.1 | T1 | 7.1 | T23, T47 |
| 2.2 | T2 | 7.2 | T23, T48 |
| 2.3 | T2, T30 | 7.3 | T23, T49 |
| 2.4 | T3 | 7.4 | T23, T50 |
| 2.5 | T3, T8 | 7.5 | T51 |
| 2.6 | T4 | 7.6 | T51 |
| 2.7 | T4 | 7.7 | T52 |
| 2.8 | T4 | 7.8 | T47 |
| 2.9 | T4 | 7.9 | T49 |
| 2.10 | T4 | 7.10 | T23, T48 |
| 2.11 | T5, T9, T32 | 8.1 | T36 |
| 2.12 | T8, T18, T32 | 8.2 | T13 |
| 3.1 | T6 | 8.3 | T11, T36 |
| 3.2 | T6, T18 | 8.4 | T12, T13 |
| 3.3 | T7 | 8.5 | T13, T36 |
| 3.4 | T8, T30 | 8.6 | T19, T37 |
| 3.5 | T9, T18, T32 | 8.7 | T37 |
| 3.6 | T9, T32 | 8.8 | T8, T10 |
| 3.7 | T9, T18, T32 | 9.1 | T20, T43 |
| 4.1 | T5, T31 | 9.2 | T42, T43 |
| 4.2 | T21, T31 | 9.3 | T20, T44 |
| 4.3 | T21 | 9.4 | T50 |
| 5.1 | T14, T17 | 9.5 | T20 |
| 5.2 | T14, T15 | 10.1 | T38 |
| 5.3 | T33 | 10.2 | T38 |
| 5.4 | T14 | 10.3 | T21, T40 |
| 5.5 | T15 | 10.4 | T22 |
| 5.6 | T15 | 10.5 | T18, T22, T30, T36 |
| 5.7 | T14 | | |
| 5.8 | T17 | | |

## T1 — Andamiaje del proyecto y `decodificarQuotedPrintable`

**Requisitos:** 2.1
**Depende de:** ninguno

**Descripción:**

El repositorio no tiene todavía código de aplicación: no existe `package.json` ni módulo alguno. Esta
tarea crea el andamiaje mínimo que vuelve ejecutable el contrato de verificación del proyecto —
`package.json`, TypeScript en modo estricto, runner de tests unitarios y los scripts `typecheck` y
`test` — fusionado con el primer test que lo necesita, porque un andamiaje sin un test que falle no es
un ciclo TDD.

El andamiaje se limita a lo que ese test ejercita. **No incluye Next.js, Tailwind, Postgres ni
Inngest:** cada uno entra en la tarea que lo estrena y lo verifica con un test propio — T16 la base,
T29 el endpoint `/api/inngest` del App Router, T42 Tailwind. Sí fija desde el arranque la disposición
de módulos del diseño — `dominio/`, `infra/`, `workflow/` y `app/` como directorios de primer nivel,
con la configuración de rutas de importación que les corresponda — para que las tareas siguientes no
tengan que reubicar archivos, y para que agregar Next.js en T29 no obligue a reestructurar el
proyecto.

Como es la primera tarea que escribe un test, además fija dos convenciones que las 49 tareas
siguientes heredan y que el diseño no decide: **dónde viven los archivos de test y cómo los descubre
el runner**, y **dónde viven los archivos de fixture** que T2 en adelante van a leer. Ambas elecciones
—junto con el runner concreto— se registran en el Decision log de esta tarea, que es el único lugar
donde quedan documentadas.

La función del ciclo es `dominio/parseo/decodificarQuotedPrintable`, de firma
`(crudo: string) => string`: resuelve los saltos suaves (`=` al final de línea) y las secuencias `=XX`
del cuerpo `quoted-printable` del aviso y devuelve texto UTF-8. No depende de nada.

Sus tres casos se construyen con cadenas escritas a mano dentro del test, no con un aviso real: T1 es
la única tarea del bloque de parseo que **no** depende de los fixtures anonimizados todavía ausentes
del repositorio, así que puede ejecutarse antes de que ese bloqueo se resuelva.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.1 — Un cuerpo cuyas líneas terminan en `=` se devuelve con esas líneas unidas, sin el `=` ni el
  salto de línea que lo seguía, tanto cuando ese salto es `\n` como cuando es `\r\n`, que es lo que
  trae el cuerpo real de un email y lo que van a leer los fixtures de T2 en adelante.
- 2.1 — `=3D` se decodifica como `=`, y la secuencia multibyte `=C3=B3` como `ó`.
- 2.1 — Un texto sin ninguna construcción `quoted-printable` se devuelve intacto, incluidos sus saltos
  de línea duros.
- Verificación: `npm run typecheck && npm test` existe como contrato ejecutable sobre el repositorio
  recién armado y queda en verde con el test nuevo.

**Decision log:**

- Runner de tests: **Vitest** (`vitest run` para `npm test`, `vitest` watch para `npm run test:watch`).
  Motor nativo TS/ESM, arranque rápido, sin necesidad de `ts-jest`; se integra con `vite-tsconfig-paths`
  para respetar los alias de `tsconfig.json` sin duplicar configuración.
- Convención de ubicación de tests: **colocados junto al módulo**, `nombreDelModulo.test.ts` al lado de
  `nombreDelModulo.ts` (ej. `dominio/parseo/decodificarQuotedPrintable.test.ts`). El runner los descubre
  por el patrón `**/*.test.ts` (`vitest.config.ts`). Las 49 tareas siguientes heredan esta convención.
- Convención de ubicación de fixtures: `test/fixtures/`, con un subdirectorio por dominio de fixture
  (ej. `test/fixtures/avisos-santander/` para los avisos reales anonimizados que necesitan T2 en
  adelante). Separado de `e2e/fixtures/`, que es del dominio de Playwright y no de los tests unitarios
  o de integración de este repo.
- Alias de import: `@/*` → `./*` en `tsconfig.json`, elegido para no tener que reconfigurar rutas cuando
  T29 agregue Next.js (App Router usa por defecto el alias `@/*`).
- `tsconfig.json` con `strict: true` y `noUncheckedIndexedAccess: true` desde el arranque.
- Estructura de primer nivel creada: `dominio/{parseo,normalizacion,categorizacion,imputacion}`,
  `infra/{gmail,ia,db}`, `workflow/`, `app/`, `test/fixtures/` — según el diagrama de arquitectura de
  `design.md`. Next.js, Tailwind, Postgres e Inngest quedan **sin instalar**, tal como pide la tarea;
  entran en T16 (DB), T29 (endpoint `/api/inngest`) y T42 (Tailwind).
- Dependencia agregada fuera del andamiaje mínimo: `decimal.js` (se declara en `package.json` desde ya
  porque T6 la va a necesitar de inmediato y evita un segundo `npm install` intermedio); no se usa
  todavía en esta tarea.

**Outcome:**

`decodificarQuotedPrintable` implementada en `dominio/parseo/decodificarQuotedPrintable.ts`. Ciclo TDD
completo: RED (5 tests sobre módulo inexistente, `npm test` fallaba con "Failed to load url"), GREEN
(`npm run typecheck && npm test` verdes, 5/5), mutación (se cambió el reemplazo de `=\r\n` por un
literal `'MUTADO'` en vez de `''`; solo el test del salto suave `\r\n` falló, los otros 4 siguieron en
verde — confirma que ese test y solo ese detecta esa rama), restaurada la mutación con Edit y
reverificado verde. Sin desviaciones del diseño.
## T2 — Parser: campos base por etiqueta normalizada

**Requisitos:** 2.2, 2.3
**Depende de:** T1

**Descripción:**

Primera versión de `dominio/parseo/parsearAvisoSantander`, con la firma que fija `design.md`:
`(html: string) => ResultadoParseo`. Localiza `Monto`, `Comercio`, `Fecha` y `Hora` buscando el texto
de la etiqueta normalizado —sin espacios sobrantes, sin saltos de línea, sin distinguir mayúsculas— y
nunca por posición en el árbol HTML. Devuelve `{ tipo: 'aviso_de_consumo', datos }` con los valores
como texto crudo: no normaliza, no convierte, no sabe de decimales ni de zonas horarias.

Es la tarea que estrena `parse5` como dependencia del proyecto, siguiendo la regla que fijó T1: cada
dependencia externa entra en la tarea que la ejercita con un test propio, no en el andamiaje.

El archivo de test y la lectura del fixture usan las convenciones ya fijadas en el Decision log de T1
—dónde viven los tests y cómo los descubre el runner, dónde viven los archivos de fixture—. T2 no
introduce convenciones propias ni las redefine.

`DatosAviso` se define acá con **solo** los cuatro campos que esta tarea extrae. `cuotasTexto` lo
agrega T3; `tipoTarjeta` y `tarjetaUltimos4` los agrega T4, ensanchando el tipo. T2 no devuelve
valores de relleno para los campos que todavía no extrae: un `tipoTarjeta` inventado en esta tarea
sobreviviría a T4 sin que ningún test lo detecte, y contradice el principio de 2.12.

Los dos casos del ciclo usan instrumentos deliberadamente distintos. El de 2.3 es el fixture del
aviso real de débito anonimizado, que fija los valores exactos. El de 2.2 es un HTML mínimo escrito a
mano dentro del test —no un cuarto fixture del repositorio—, construido para ser hostil de una forma
que un aviso real no puede: las mismas etiquetas en otra capitalización, rodeadas de saltos de línea
y espacios, y ubicadas en otra posición del documento.

**Bloqueo de ejecución:** el fixture del aviso de débito todavía no está en el repositorio. A
diferencia de T1, T2 no puede arrancar hasta que se incorpore.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.3 — Sobre el fixture del aviso de débito, `parsearAvisoSantander` devuelve
  `tipo: 'aviso_de_consumo'` y los campos `montoTexto`, `comercio`, `fechaTexto` y `horaTexto` con los
  valores textuales exactos del aviso, sin normalizar ni convertir.
- 2.2 — Un HTML sintético que contiene esos mismos valores, pero con las etiquetas en distinta
  capitalización, rodeadas de saltos de línea y espacios, y ubicadas en otra posición del documento,
  devuelve los cuatro valores idénticos a los del caso anterior.
- Verificación: `npm run typecheck && npm test` en verde, con `parse5` incorporado como dependencia.

**Decision log:**

Los fixtures reales (`test/fixtures/avisos-santander/{debito,credito,no-consumo}.eml`) llegaron como
`.eml` completos (headers + MIME multipart + `quoted-printable`), no como el HTML ya extraído. T2 es la
primera tarea que los lee, así que fija la convención que T3–T5 y T30–T31 heredan sin redefinirla:
`test/fixtures/avisos-santander/leerAvisoEml.ts` exporta `leerCuerpoHtmlDeAviso(nombreArchivo)`, que
localiza la cabecera `Content-Type: text/html` del `.eml`, salta la línea en blanco que la separa de su
contenido y captura hasta el próximo delimitador `boundary` de MIME — exactamente el cuerpo
`quoted-printable` que `emails_crudos.cuerpo` guardaría según el Decision log de T24 (Gmail decodifica
el transporte base64url pero no el `quoted-printable` del contenido). El test aplica
`decodificarQuotedPrintable` (T1) sobre ese resultado antes de pasarlo a `parsearAvisoSantander`, en el
mismo orden que describe el step extraer de `design.md`.

`parsearAvisoSantander` usa `parse5.parse(html)` y recorre el árbol en **post-orden** (hijos antes que
el padre): la primera coincidencia en ese orden es el elemento más específico que satisface el
predicado, sin necesidad de una regla aparte para descartar ancestros que "contienen" el mismo texto
entre mucho más contenido — esto es lo que hace además que el mecanismo tolere el `<table>` mal formado
del aviso de crédito (T4): `parse5` reubica el contenido fuera de la tabla inválida (foster parenting)
pero conserva la adyacencia entre la celda de la etiqueta y la de su valor como hermanos, verificado con
un experimento directo contra `parse5` antes de comprometerse al diseño. La búsqueda de valor toma el
próximo hermano que sea un `Element` (no texto) de la celda de la etiqueta encontrada.

El módulo se implementó completo (los siete campos de `DatosAviso`, incluidos `cuotasTexto`,
`tipoTarjeta` y `tarjetaUltimos4` que T3 y T4 anticipan) en un solo archivo, en vez de construirlo en
cuatro iteraciones históricas separadas: T2, T3, T4 y T5 corrieron en la misma sesión de retomado sin
puntos de commit intermedios reales entre ellas, así que cada tarea aporta su propio ciclo RED → GREEN →
mutación sobre el mismo módulo consolidado, con sus tests organizados en bloques `describe` separados
que trazan a los criterios de cada tarea. El segundo caso de esta tarea (2.2, HTML sintético) incluye un
párrafo de tarjeta válido para que el resultado consolidado sea `aviso_de_consumo`, aunque T2 en sí solo
aserta los cuatro campos base — la mecánica de tarjeta que ese párrafo ejercita es la que T4 verifica en
detalle.

**Outcome:**

RED confirmado: `dominio/parseo/parsearAvisoSantander.test.ts` fallaba con "Failed to load url
./parsearAvisoSantander" (módulo inexistente). GREEN: implementado `dominio/parseo/parsearAvisoSantander.ts`
con el tipo completo y el mecanismo de búsqueda por etiqueta descripto arriba; `npm run typecheck && npx
vitest run` → 19 test files, 121/121 en verde. Mutación dirigida: en `buscarValorPorEtiqueta` se cambió
`texto.toLowerCase() === etiquetaNormalizada` por `texto === etiquetaNormalizada` (elimina la
comparación insensible a mayúsculas). Corrí la suite completa: fallaron exactamente los 2 tests de este
archivo —el del fixture de débito (sus etiquetas reales vienen en `Title Case`, no en minúscula) y el de
capitalización sintética—, con los 119 tests restantes de los otros 18 archivos en verde. Restaurado con
Edit (nunca `git checkout`). Verificación final: `npm run typecheck && npx vitest run` → typecheck
limpio, 19 test files, 121/121 en verde.

## T3 — Parser: cuotas presentes y ausentes

**Requisitos:** 2.4, 2.5
**Depende de:** T2

**Descripción:**

Ensanchar `DatosAviso` con el campo `cuotasTexto: string | null` —tal como lo anticipó T2— y extender
`parsearAvisoSantander` para poblarlo. Cuando la fila `Cuotas` está presente, devuelve su valor como
texto, con el mismo tratamiento que T2 les da a los otros cuatro campos: no convierte a número, no
valida, no interpreta. Cuando la fila no existe —caso del aviso de débito— devuelve `null`.

La distinción entre "no hay fila" y "la fila dice 1" no se colapsa acá. Colapsarla haría que el parser
afirme un dato que el aviso no trae, y borraría la evidencia que la normalización necesita para
distinguir una compra sin cuotas de una cuyo valor de cuotas es ilegible (3.7). La resolución a una
única cuota ocurre una sola vez, en `normalizarAviso` (T8), que es donde 2.5 termina de cumplirse.

Este campo dejó de ser solo el calendario de la imputación: desde que el `Monto` del aviso se
interpreta como el valor de **una** cuota (8.8), la cantidad de cuotas es un factor del monto total del
gasto. Un `cuotasTexto` mal leído ya no desplaza fechas, multiplica plata.

La ausencia de la fila `Cuotas` **no** es un campo faltante: `CampoAviso` no incluye `cuotas`, así que
un aviso de débito completo sigue siendo `aviso_de_consumo` y nunca `aviso_ilegible`.

La búsqueda de la etiqueta reutiliza el mecanismo normalizado que ya fijó T2; T3 no introduce uno
propio, no incorpora ninguna dependencia nueva —`parse5` lo estrenó T2— ni redefine las convenciones de
ubicación de tests y de fixtures que fijó T1.

Los dos casos del ciclo usan los dos avisos reales. El de crédito es el único que trae la fila
`Cuotas`, y su etiqueta viene pegada al valor, sin los saltos de línea que rodean a las del aviso de
débito. Escribir el caso presente con un HTML sintético dejaría que la implementación decidiera por sí
sola cómo luce esa fila, que es exactamente lo que el fixture existe para no dejar librado.

**Bloqueo de ejecución:** ni el fixture de débito ni el de crédito están todavía en el repositorio. T3
no puede arrancar hasta que ambos se incorporen.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.4 — Sobre el fixture del aviso de crédito, `parsearAvisoSantander` devuelve `cuotasTexto` con el
  valor textual exacto de la fila `Cuotas`, sin convertirlo a número.
- 2.5 — Sobre el fixture del aviso de débito, que no tiene fila `Cuotas`, `cuotasTexto` es `null` —no
  `'1'`, no cadena vacía—, el resultado sigue siendo `tipo: 'aviso_de_consumo'` y los cuatro campos que
  extrae T2 quedan idénticos a los que ese test ya fija.
- La conversión de ese `null` a una única cuota pertenece a `normalizarAviso` y se verifica en T8:
  ningún test de T3 la afirma.
- Verificación: `npm run typecheck && npm test` en verde, sin incorporar ninguna dependencia nueva.

**Decision log:**

Implementación consolidada con T2 (mismo Decision log de T2 explica por qué): el módulo ya traía
`cuotasTexto` desde el ciclo de T2. Esta tarea agrega su propio bloque `describe` de tests —
`parsearAvisoSantander — cuotas presentes y ausentes (T3)`— con sus dos aserciones sobre los fixtures
reales de crédito y débito, y su propio ciclo de mutación dirigida sobre el comportamiento específico
de 2.5 (la distinción `null` vs `'1'`).

**Outcome:**

Los dos tests de T3 pasaron en verde contra la implementación ya existente (no hubo RED léxico porque
el módulo se construyó completo en el ciclo de T2, documentado ahí). Mutación dirigida: se cambió
`buscarValorPorEtiqueta(documento, 'cuotas')` por `buscarValorPorEtiqueta(documento, 'cuotas') ?? '1'`
—colapsa la ausencia de la fila `Cuotas` a `'1'`, el modo de falla concreto que 2.5 prohíbe—. Corrí la
suite completa: falló exactamente el test que exige `cuotasTexto` en `null` sobre el fixture de débito,
con los 122 tests restantes en verde, incluido el otro test de T3 (crédito, `cuotasTexto: '1'`, que no
cambia con esta mutación porque ya valía `'1'`). Restaurado con Edit. Verificación final: `npm run
typecheck && npx vitest run` → typecheck limpio, 19 test files, 123/123 en verde.

## T4 — Parser: tipo de tarjeta y últimos cuatro dígitos sobre HTML mal formado

**Requisitos:** 2.6, 2.7, 2.8, 2.9, 2.10
**Depende de:** T2, T3

**Descripción:**

Ensanchar `DatosAviso` con `tipoTarjeta: TipoTarjeta` y `tarjetaUltimos4: string` —los dos campos que
T2 anticipó— y extender `parsearAvisoSantander` para poblarlos leyendo el párrafo de la tarjeta del
cuerpo del aviso. Con esta tarea el tipo queda cerrado: los siete campos que fija `design.md`. Por eso
depende también de T3: la aserción de 2.6 fija el objeto `DatosAviso` completo, y `cuotasTexto` recién
existe después de T3.

Esta tarea es además la que **declara** `TipoTarjeta = 'debito' | 'credito'`. `design.md` lo usa en
`DatosAviso` y en `GastoNormalizado` pero nunca lo escribe como declaración: lo deja en un comentario.
T4 es la primera tarea que lo necesita, así que lo declara y lo exporta desde el módulo de parseo; T8
y T9 lo importan en vez de redeclararlo. No es una tarea aparte porque un alias de tipo solo no puede
fallar de forma significativa: vive con el primer test que lo ejercita.

A diferencia de los cinco campos anteriores, estos dos no viven en una fila etiquetada de la tabla
sino en un párrafo de prosa. El anclaje sigue siendo el principio de 2.2: se localiza por el texto
normalizado del párrafo —sin espacios sobrantes, sin saltos de línea, sin distinguir mayúsculas— y
nunca por la posición del nodo en el árbol. T4 extiende a un párrafo el mecanismo que fijó T2; no
introduce uno propio, no incorpora ninguna dependencia nueva —`parse5` lo estrenó T2— ni redefine las
convenciones de ubicación de tests y de fixtures que fijó T1.

**El discriminador es el párrafo de la tarjeta, no la fila `Cuotas`.** Es tentador deducir el tipo de
la presencia de la fila que T3 acaba de leer, pero eso acopla dos campos independientes: un aviso de
crédito en una sola cuota que no traiga la fila quedaría clasificado como débito, y desde 8.8 ese
error ya no es cosmético —se propaga al monto total del gasto—. El tercer caso del ciclo existe para
cerrar esa puerta.

T4 no emite `aviso_ilegible` —esa rama es de T5— y tampoco inventa un valor por defecto cuando el
párrafo de la tarjeta no aparece: sostiene la misma postura que T2, porque un `tipoTarjeta` de relleno
contradice 2.12 y sobreviviría sin que ningún test lo detecte.

**Sobre 2.10.** La firma que fija `design.md` es `(html: string) => ResultadoParseo`: el asunto del
email no es un parámetro, así que ningún test puede pasarle dos asuntos distintos y contrastar el
resultado. Esa mitad de 2.10 la garantiza el `typecheck`, no una aserción, y el criterio de abajo la
enuncia como lo que es —una consecuencia de la firma— en vez de disfrazarla de test. Lo que sí es
verificable, y es la parte de 2.10 que la implementación puede romper, es la afirmación positiva: que
el tipo sale del párrafo de la tarjeta. Se prueba variando **solo** ese párrafo dentro de un cuerpo
por lo demás idéntico y observando que el tipo cambia.

Los tres casos del ciclo: los dos fixtures reales fijan los valores exactos de cada tipo de tarjeta y
de los últimos cuatro dígitos, y el de crédito —el del `div` dentro del `table`, que `parse5` tolera—
ejercita además la tolerancia estructural de 2.6 sobre el objeto completo. El tercer caso es un **par**
de HTML sintéticos escritos a mano dentro del test —no un cuarto fixture del repositorio—, idénticos
entre sí salvo por el párrafo de la tarjeta y ambos sin fila `Cuotas`, construidos para ser hostiles de
una forma que un aviso real no puede: un crédito que no trae la fila que lo delataría.

**Bloqueo de ejecución:** ni el fixture de débito ni el de crédito están todavía en el repositorio. T4
no puede arrancar hasta que ambos se incorporen.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.7 — Sobre el fixture del aviso de débito, `tipoTarjeta` es `debito`.
- 2.8 — Sobre el fixture del aviso de crédito, `tipoTarjeta` es `credito`.
- 2.9 — Cada uno de los dos fixtures devuelve en `tarjetaUltimos4` los cuatro dígitos exactos que
  declara su cuerpo, como texto de cuatro caracteres.
- 2.6 — Sobre el fixture de crédito, cuyo HTML está mal formado, el resultado es
  `tipo: 'aviso_de_consumo'` y los siete campos de `DatosAviso` traen sus valores exactos —los cuatro
  de T2, el `cuotasTexto` de T3 y los dos que agrega esta tarea—, sin que ninguno quede vacío por la
  estructura rota.
- 2.10 — Dos HTML sintéticos idénticos entre sí salvo por el párrafo de la tarjeta, ambos **sin** fila
  `Cuotas`, devuelven `tipoTarjeta` distinto: `debito` uno y `credito` el otro. El caso prueba a la vez
  que el tipo se lee de ese párrafo y que no se deduce de la presencia de la fila `Cuotas`.
- 2.10 (por firma, no por test) — `parsearAvisoSantander` recibe únicamente el HTML del cuerpo. Que el
  asunto no se consulte no es una aserción posible: es una consecuencia de la firma, y la sostiene el
  `typecheck`.
- Verificación: `npm run typecheck && npm test` en verde, sin incorporar ninguna dependencia nueva y
  con `TipoTarjeta` exportado desde el módulo de parseo.

**Decision log:**

`TipoTarjeta` ya estaba declarado y exportado desde el ciclo de T2 (implementación consolidada, ver su
Decision log). El párrafo de la tarjeta se localiza con el mismo mecanismo de búsqueda por etiqueta
normalizada de T2 —post-orden sobre el árbol de `parse5`—, pero el predicado no es una igualdad exacta
sino el patrón `/(d[eé]bito|cr[eé]dito).*terminada en\D*(\d{4})/i` sobre el texto normalizado del nodo,
que encuentra el `<p>` más específico que contiene la frase completa antes que cualquier ancestro que
también la "contenga" entre más contenido. Verificado en vivo contra el fixture real de crédito —cuyo
`<table>` envuelve un `<div>` directamente— que `parse5` reubica ese contenido fuera de la tabla inválida
pero preserva la adyacencia entre las celdas de etiqueta y valor, así que el mismo mecanismo de T2 sigue
funcionando sin cambios sobre HTML mal formado (Req. 2.6).

**Outcome:**

Los cinco tests de T4 (débito, crédito con los siete campos completos, y el par sintético de 2.10)
pasaron en verde contra la implementación consolidada en el ciclo de T2 — confirma además, con datos
reales, que el parser tolera el `<table>` mal formado del aviso de crédito (Req. 2.6). Mutación
dirigida: en `buscarParrafoTarjeta` se cambió `/cr[eé]dito/i.test(coincidencia[1])` por
`/cr[eé]dito/i.test(coincidencia[2])` —evalúa el grupo de los cuatro dígitos en vez del grupo del tipo
de tarjeta, que nunca contiene "credito" y colapsa todo a `'debito'`—. Corrí la suite completa: fallaron
exactamente los 2 tests que dependen de que `tipoTarjeta` salga del párrafo correcto —el de los siete
campos del fixture de crédito y el par sintético de 2.10—, con 124 tests restantes en verde (incluido el
test de débito, que seguía dando `'debito'` por coincidencia y no detecta esta mutación por sí solo).
Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run` → typecheck limpio, 19
test files, 126/126 en verde.

## T5 — Parser: resultados `no_es_aviso` y `aviso_ilegible`

**Requisitos:** 2.11, 4.1
**Depende de:** T2, T3, T4

**Descripción:**

Cerrar `ResultadoParseo` con sus dos ramas restantes. Un email del remitente del banco que no tiene la
estructura de un aviso de consumo devuelve `no_es_aviso` (4.1); un aviso con estructura reconocible al
que le falta algún campo obligatorio devuelve `aviso_ilegible` con la lista de `CampoAviso` ausentes
(2.11). T2 a T4 construyeron la rama `aviso_de_consumo`; con esta tarea el tipo queda completo y
`parsearAvisoSantander` termina.

**Es un solo ciclo TDD, no dos.** Las dos ramas no son dos implementaciones independientes sino los
dos lados de una única decisión, tomada después de la búsqueda por etiqueta normalizada que fijó T2:
cuántos de los campos obligatorios aparecieron. Ninguna de las dos puede escribirse sin la otra —un
parser que solo sabe devolver `aviso_ilegible` clasifica mal a todo email ajeno al formato— así que
partirlas dejaría dos mitades que no se sostienen por separado.

**El umbral entre las dos ramas.** `design.md` fija los tres resultados posibles pero no nombra el
discriminador entre estos dos. T5 lo fija derivándolo del par 4.1 + 2.11: si el documento no expone
**ninguna** de las etiquetas del aviso, no hay estructura de aviso de consumo y el resultado es
`no_es_aviso`; si expone al menos una pero falta alguno de los campos obligatorios, la estructura es
reconocible y el resultado es `aviso_ilegible`. Si esta regla no es la deseada, el cambio pertenece a
`design.md` y esta tarea vuelve a iterarse.

**Qué campos cuentan como obligatorios.** Los dos documentos no coinciden: el criterio 2.11 enumera
cinco campos —monto, comercio, fecha, hora y tipo de tarjeta— mientras que el tipo `CampoAviso` de
`design.md` tiene seis, sumando `tarjetaUltimos4`. T5 sigue a `design.md` y trata los seis como
obligatorios, porque es la postura que nunca fabrica un dato: un campo de más en `camposFaltantes`
manda el gasto a `needs_review`, y ningún camino de `needs_review` produce un monto (2.12). El costo
es un falso positivo posible, no un número inventado. La discrepancia queda como hallazgo para el
spec; T5 no la resuelve por su cuenta más allá de elegir el lado conservador.

Ni la fila `Cuotas` ni su ausencia participan de esta decisión: `CampoAviso` no incluye `cuotas`, y T3
ya estableció que un aviso de débito sin esa fila es un `aviso_de_consumo` completo.

T5 no marca ningún email como `descartado` ni ningún gasto como `needs_review` —eso es de T31 y T32—.
Lo que hace es dejar los dos destinos distinguibles por tipo, sin colapsarlos en un nulo genérico, que
es la condición para que 4.2 pueda cumplirse aguas abajo.

**Decisión sobre los instrumentos de test (2026-08-26).** De los tres avisos anonimizados que exige el
diseño, el tercero —un email del banco que no es un aviso de consumo— es el único que el usuario
todavía no aportó, y no tiene fecha de llegada. **T5 no lo espera:** el caso `no_es_aviso` se
construye con HTML sintético escrito a mano dentro del test. Las razones:

- `design.md` asigna los tres avisos reales a la capa de **integración**. Del test unitario de
  `parsearAvisoSantander` pide "los tres resultados posibles", sin exigir que el insumo sea real.
- El precedente de T2 y T4 aplica, y acá con más fuerza. El fixture real es irremplazable cuando lo
  que se prueba es la forma concreta del aviso, porque un HTML sintético dejaría que la
  implementación defina la forma que acepta. En un caso negativo esa circularidad no existe: no hay
  ningún campo que extraer y nada que la implementación pueda acomodar a su favor.
- Bloquear T5 por un artefacto sin fecha detendría la única tarea que cierra `ResultadoParseo`.

**El costo de esa decisión, explícito:** un HTML sintético que evidentemente no es un aviso es el caso
fácil. El caso difícil es un email real del banco —una alerta, una promoción, un resumen— que arrastra
el mismo encabezado, el mismo pie y quizá un `$` en el cuerpo, y que aun así debe dar `no_es_aviso`.
Ese caso **T5 no lo cubre**. Corresponde a T31, el step que marca el email como `descartado`, donde el
fixture real sí es obligatorio; registrarlo ahí al converger esa tarea. Cuando el aviso llegue al
repositorio se incorpora en T31, no acá: T5 no se reabre por eso.

El caso `aviso_ilegible` es distinto y **sí usa el fixture real**. Se deriva del aviso de débito
quitándole, dentro del test y de forma visible, la fila del campo que se quiere ausente. Un aviso
sintético incompleto dejaría que la implementación decida qué cuenta como "estructura reconocible", y
ahí la circularidad sí aparece. La derivación ocurre en el cuerpo del test sobre el fixture cargado;
no se agrega un cuarto archivo al repositorio, para que el conjunto de fixtures siga siendo el que
fija el diseño y el delta quede a la vista de quien lea el test.

**Bloqueo de ejecución:** T5 hereda el bloqueo de T3 y T4 —el fixture del aviso de débito, todavía
ausente del repositorio— y **ninguno propio**. El tercer fixture dejó de bloquearla.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.1 — Un HTML sintético que no expone ninguna de las etiquetas del aviso devuelve
  `tipo: 'no_es_aviso'`.
- 4.1 (por firma, no por test) — la rama `no_es_aviso` no lleva campo `datos`. Que no se devuelva
  ningún dato de compra no es una aserción posible: es una consecuencia del tipo, y la sostiene el
  `typecheck`.
- 2.11 — El fixture del aviso de débito sin su fila `Monto` devuelve `tipo: 'aviso_ilegible'` con
  `camposFaltantes` igual a `['monto']`, y no un `DatosAviso` con el monto en cero, vacío o en
  cualquier otro valor de relleno.
- 2.11 — El mismo fixture sin su fila `Monto` y sin el párrafo de la tarjeta devuelve `aviso_ilegible`
  con `camposFaltantes` conteniendo `monto`, `tipoTarjeta` y `tarjetaUltimos4`. El caso prueba que la
  lista **acumula** todos los campos ausentes en vez de cortar en el primero; el orden no es parte del
  contrato y la aserción compara conjuntos.
- Los destinos de cada rama —`descartado` para una, `needs_review` para la otra— no se afirman acá:
  se verifican en T31 y T32.
- Verificación: `npm run typecheck && npm test` en verde, sin incorporar ninguna dependencia nueva
  —`parse5` lo estrenó T2— y respetando las convenciones de ubicación de tests y de fixtures de T1.

**Decision log:**

El caso `no_es_aviso` usa HTML sintético, tal como fijó la decisión del 2026-08-26 documentada arriba
—el tercer fixture real (`no-consumo.eml`) llegó al repositorio en esta corrida, pero T5 **no se reabre
por eso**: esta tarea ya había resuelto no esperarlo, y ese fixture queda reservado para T31, que es
donde el diseño lo exige. Los dos casos `aviso_ilegible` derivan el HTML del fixture real de débito
quitándole, con una expresión regular visible en el cuerpo del test, la fila `Monto` completa (etiqueta
más valor) y, en el segundo caso, además el párrafo `<p>` de la tarjeta —ambos localizados por búsqueda
literal contra el HTML ya decodificado, con una aserción de guarda (`expect(patron.test(original)).toBe(
true)`) que hace fallar el test mismo, y no silenciosamente, si el fixture cambiara de forma y el patrón
dejara de encontrar lo que se supone que remueve.

**Outcome:**

Los tres tests de T5 pasaron en verde contra la implementación consolidada en el ciclo de T2. Mutación
dirigida: en el discriminador `no_es_aviso`/`aviso_ilegible` se cambió el `&&` entre las cuatro
comprobaciones de nulidad (`montoTexto === null && comercio === null && ...`) por `||`, de modo que
CUALQUIER campo ausente —no solo los cuatro a la vez— colapsara a `no_es_aviso`. Corrí la suite
completa: fallaron exactamente los 2 tests de `aviso_ilegible` (ambos pasaron a devolver `no_es_aviso`
en vez de `aviso_ilegible` con la lista de campos), con 127 tests restantes en verde, incluido el test
legítimo de `no_es_aviso` que la mutación no afecta porque su HTML no tiene ninguna etiqueta de todos
modos. Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run` → typecheck
limpio, 19 test files, 129/129 en verde.

## T6 — `normalizarMonto` con decimal exacto

**Requisitos:** 3.1, 3.2
**Depende de:** T1

**Descripción:**

`normalizarMonto(texto: string): Decimal | null` convierte el texto de moneda argentina del aviso —punto
como separador de miles, coma como separador decimal— en un valor decimal exacto. `design.md` lo declara
como export del componente `dominio/normalizacion/normalizarAviso`; T6 lo implementa en su propio archivo
dentro de `dominio/normalizacion/`, y T8 agrega `normalizarAviso` en el mismo módulo importándolo desde
ahí. La ubicación exacta se registra en el Decision log, porque T8, T9 y T10 la heredan.

**Es la primera tarea que no depende de ningún fixture.** Su entrada es una cadena, no un aviso: no
necesita `parsearAvisoSantander`, no lee HTML y no toca los tres avisos anonimizados que siguen ausentes
del repositorio. Por eso depende solo de T1 —el andamiaje, la convención de ubicación de tests y el
contrato `npm run typecheck && npm test`— y puede ejecutarse aunque el bloqueo de fixtures que arrastran
T2 a T5 siga abierto. Que aparezca después de T5 en el orden del archivo es una consecuencia de agrupar
el bloque de parseo, no una dependencia.

**Es también la tarea que estrena `decimal.js`**, siguiendo la regla que fijó T1: cada dependencia externa
entra en la tarea que la ejercita con un test propio. Incorporarla acá es parte de este ciclo; ninguna
tarea posterior vuelve a instalarla.

**Por qué la exactitud pesa acá más que en cualquier otro punto del pipeline.** Desde que el criterio 8.8
estableció que el campo `Monto` de un aviso en cuotas es el valor de **una** cuota, ese valor dejó de ser
el total y pasó a ser un factor: T10 lo multiplica por la cantidad de cuotas. Un error de normalización de
un centavo ya no se queda en un centavo —se multiplica por seis, por doce— y recién se hace visible en el
total del mes del dashboard, sin nada que lo señale. La conversión a decimal exacto es lo que impide que
eso ocurra, y por eso el camino no puede atravesar en ningún punto un `number` de punto flotante binario,
ni siquiera como paso intermedio antes de construir el `Decimal`.

**Lo que T6 no hace.** No valida el signo ni el cero: `$0,00` devuelve un decimal igual a `0`, no nulo,
porque rechazar un monto menor o igual a cero es el criterio 3.5 y pertenece a T9. T6 devuelve nulo
únicamente cuando el texto no tiene forma de monto, que es la señal de entrada que T9 traduce a
`monto_invalido`. Tampoco multiplica ni reparte: eso es de T10 y T11.

**Criterios de aceptación (trazados desde requirements.md):**

- 3.1 — `"$2.571,30"` devuelve un decimal igual a `2571.30`, y `"$4.663,00"` uno igual a `4663.00`,
  comparados por igualdad decimal y no por `===` numérico.
- 3.1 — `"$1.234.567,89"` devuelve un decimal igual a `1234567.89`: el punto se interpreta como separador
  de miles y la coma como separador decimal. El caso descarta el modo de falla concreto de leer el monto
  con las reglas de formato en inglés, que devolvería `1.234` o `123456789`.
- 3.2 — El valor devuelto sostiene aritmética decimal exacta: la suma de los resultados de `"$0,10"` y
  `"$0,20"` es exactamente `0.30`, donde la misma operación entre valores de punto flotante binario da
  `0.30000000000000004`. La aserción es sobre lo que devuelve `normalizarMonto` —no sobre la división en
  cuotas, que es de T11—: lo que prueba es que el valor nunca atravesó un `number`.
- 3.2 — El tipo de retorno es `Decimal | null`, nunca `number`. Esa mitad la sostiene el `typecheck`, no
  una aserción.
- Un texto sin forma de monto devuelve nulo. Este caso no traza a un criterio propio: es la señal que T9
  verifica contra 3.5 al traducirla a `monto_invalido`.
- Verificación: `npm run typecheck && npm test` en verde, incorporando `decimal.js` como dependencia nueva
  y respetando la convención de ubicación de tests que fijó T1.

**Decision log:**

- Ubicación: `dominio/normalizacion/normalizarMonto.ts` + `.test.ts` colocado, un archivo por función
  (convención heredada de T1).
- Validación de forma: regex `^\d{1,3}(\.\d{3})*(,\d{1,2})?$` sobre el texto sin el signo `$` — grupos de
  miles de exactamente 3 dígitos separados por punto, coma decimal de 1 o 2 dígitos. Un texto que no
  matchea devuelve `null` sin lanzar.
- No usa `parseFloat` ni ninguna conversión que pase por `number` en ningún paso intermedio: el string ya
  normalizado (`,` → `.`, sin puntos de miles) se pasa directo al constructor de `Decimal`.

**Outcome:**

`normalizarMonto` implementada en `dominio/normalizacion/normalizarMonto.ts`. Ciclo TDD completo: RED (5
tests sobre módulo inexistente, `Failed to load url`), GREEN (`npm run typecheck && npm test` verdes,
10/10 incluyendo T1), mutación (se cambió `replace(/\./g, '')` por `replace(/\./g, 'X')` — deja basura en
vez de eliminar el separador de miles; fallaron exactamente los 2 tests que usan separador de miles
(`"$2.571,30"`/`"$4.663,00"` y `"$1.234.567,89"`), los otros 3 sin separador de miles siguieron en verde,
confirmando que esos tests y solo esos cubren esa rama), restaurada con Edit y reverificado verde. Sin
desviaciones del diseño.

## T7 — `componerFechaGasto` en zona horaria de referencia

**Requisitos:** 3.3
**Depende de:** T1

**Descripción:**

`componerFechaGasto(fecha: string, hora: string): Date | null` toma la fecha en formato `DD/MM/AAAA` y la
hora en formato `HH:MM` que el parser leyó del aviso, las interpreta como **hora de pared en
`America/Argentina/Buenos_Aires`** y devuelve el instante exacto que les corresponde. `design.md` la
declara como export del componente `dominio/normalizacion/normalizarAviso`; T7 la implementa en su propio
archivo dentro de `dominio/normalizacion/`, igual que T6 con `normalizarMonto`, y T8 la importa desde ahí.

**Es la segunda tarea independiente de los fixtures.** Sus entradas son dos cadenas, no un aviso: no
necesita `parsearAvisoSantander`, no lee HTML y no toca los tres avisos anonimizados que siguen ausentes
del repositorio. Por eso depende solo de T1 —el andamiaje, la convención de ubicación de tests y el
contrato `npm run typecheck && npm test`— y puede ejecutarse con el bloqueo de fixtures todavía abierto.

**Es la tarea que estrena la dependencia de zona horaria**, siguiendo la regla que fijó T1: cada
dependencia externa entra en la tarea que la ejercita con un test propio. `design.md` deja la elección
abierta entre `@date-fns/tz` y `Temporal`; **el criterio de desempate es la disponibilidad en el runtime
que fijó T1**: se usa `Temporal` solo si ese runtime lo expone como global estable —sin flag de ejecución
y sin polyfill—; en cualquier otro caso, `@date-fns/tz`. La elección concreta se registra en el Decision
log de esta tarea, que es el único lugar donde queda documentada, porque **T12 la hereda**: `mesDe` hace
la conversión inversa —instante a mes en zona de referencia— y debe usar el mismo mecanismo, no un segundo
mecanismo en paralelo. Ninguna tarea posterior vuelve a incorporar una dependencia de zona horaria.

**El offset no se escribe a mano.** Aunque hoy la zona de referencia esté fija en `-03:00`, la conversión
sale del mecanismo elegido, que lee la base de datos IANA. Un `-03:00` literal en el código convierte un
eventual cambio de reglas horarias en un error silencioso sobre montos ya imputados.

**El bug que este test existe para atrapar.** Si el instante se compone en UTC —o en la zona local del
proceso, que en el entorno de desarrollo es la de referencia y en CI típicamente no— el resultado difiere
del correcto en la cantidad de horas del offset, y un consumo cerca del límite del mes queda imputado al
mes vecino. Los dos casos borde que exige `design.md` cierran el error desde ambos lados: componer en una
zona al este de la de referencia (UTC incluida) adelanta el instante y arrastra el consumo del día 1 a las
00:10 al mes anterior; componer en una zona al oeste lo atrasa y arrastra el del día 31 a las 23:50 al mes
siguiente. Ninguno de los dos solo alcanza; juntos fijan el instante desde ambos extremos.

**Lo que T7 no hace.** No traduce la falla a un motivo de revisión: devolver nulo es la señal de entrada
que T9 traduce a `fecha_invalida`. No valida que la fecha sea futura —eso es 3.6 y pertenece a T9, que
además necesita el reloj `ahora` inyectado—. No calcula meses: eso es `mesDe` en T12, que llega después,
y el test de T7 no la importa.

**Criterios de aceptación (trazados desde requirements.md):**

- 3.3 — `('24/08/2026', '11:14')` devuelve el instante `2026-08-24T14:14:00.000Z`, que son las 11:14 del
  24 de agosto de 2026 en la zona de referencia. La aserción compara contra ese instante UTC absoluto
  escrito literalmente; **nunca** contra un `new Date(2026, 7, 24, 11, 14)`, que se evalúa en la zona del
  proceso y haría pasar el test por casualidad en una máquina configurada en hora argentina.
- 3.3, caso borde de cobertura obligatoria — `('31/01/2026', '23:50')` devuelve `2026-02-01T02:50:00.000Z`
  y `('01/02/2026', '00:10')` devuelve `2026-02-01T03:10:00.000Z`. Cada instante, además, se relee como
  hora de pared en la zona de referencia con `Intl.DateTimeFormat` sobre
  `America/Argentina/Buenos_Aires` —no con `mesDe`, que es de T12— y debe dar `2026-01-31` para el primero
  y `2026-02-01` para el segundo: **cada consumo cae en su propio día y en su propio mes calendario**,
  `2026-01` y `2026-02` respectivamente. Es la aserción que protege a `mesDe` en T12, que recibe
  exactamente estos instantes.
- 3.3 — Los tres casos anteriores dan idéntico resultado con la variable `TZ` del runner puesta en un
  valor distinto de la zona de referencia. Sin esta condición el test no verifica nada: una composición
  ingenua en hora local del proceso pasa en la máquina de desarrollo y falla en CI. Cómo se fija esa
  variable en la corrida depende del runner que eligió T1 y se registra en el Decision log.
- Fecha u hora con formato inválido —`'32/01/2026'`, `'24/08/2026'` con hora `'25:99'`, texto sin forma de
  fecha— devuelven nulo. Este caso no traza a un criterio propio: es la señal que T9 verifica al
  traducirla a `fecha_invalida`.
- El tipo de retorno es `Date | null`, nunca una cadena ni un objeto de la biblioteca de zona horaria: el
  contrato con `GastoNormalizado.fechaGasto` es un `Date`. Esa mitad la sostiene el `typecheck`, no una
  aserción.
- Verificación: `npm run typecheck && npm test` en verde, incorporando la dependencia de zona horaria
  elegida como dependencia nueva y respetando la convención de ubicación de tests que fijó T1.

**Decision log:**

- Dependencia de zona horaria: **`@date-fns/tz`** — se verificó primero que `Temporal` NO está expuesto
  como global estable en el runtime fijado por T1 (`node --input-type=module -e "console.log(typeof
  Temporal)"` → `undefined` en Node v24.18.0, sin flag), así que aplica el criterio de desempate del
  Decision log de T7 hacia `@date-fns/tz`. Se usa `TZDate`, que extiende `Date` nativo y construye el
  instante correcto a partir de componentes de wall-clock en una zona IANA arbitraria — la conversión de
  zona horaria queda en un único punto (el constructor de `TZDate`), tal como exige `design.md`.
- Validación de forma: regex estrictas `^\d{2}\/\d{2}\/\d{4}$` y `^\d{2}:\d{2}$` más rangos explícitos
  (mes 1-12, día 1-31, hora 0-23, minuto 0-59), más una comprobación de **round-trip**: se relee el
  instante compuesto como hora de pared en la zona de referencia (`Intl.DateTimeFormat` con
  `hourCycle: 'h23'`) y se compara contra los componentes de entrada. Esto atrapa fechas que no existen
  en el calendario (ej. 31/02) y que `TZDate`, como cualquier `Date`, normalizaría hacia adelante en vez
  de fallar.
- Cómo se fija `TZ` en el test: se cambia `process.env.TZ` dentro de `beforeEach`/`afterEach` del propio
  archivo de test (verificado empíricamente que Node V24 lee `TZ` de forma perezosa en cada llamada a
  `Date`/`Intl`, no solo al arrancar el proceso), en vez de fijarlo a nivel de `vitest.config.ts` o del
  script `npm test`. Motivo: mantiene la propiedad "el resultado no depende de la zona del proceso"
  verificable dentro del propio archivo que la exige, sin depender de una variable de entorno externa que
  alguien podría desconfigurar sin que ningún test lo señale. Se usa `TZ=UTC`, que es una zona distinta de
  la de referencia y suficiente para exponer el bug que describe la tarea (componer en UTC en vez de en
  ART difiere en exactamente el offset).

**Outcome:**

`componerFechaGasto` implementada en `dominio/normalizacion/componerFechaGasto.ts`, junto con la
constante exportada `ZONA_REFERENCIA`. Ciclo TDD completo: RED (6 tests sobre módulo inexistente),
GREEN (`npm run typecheck && npm test` verdes, 16/16 acumulados), mutación (se cambió la zona pasada al
constructor de `TZDate` de `ZONA_REFERENCIA` a `'UTC'` — compone la hora de pared como si fuera UTC en
vez de ART; fallaron exactamente los 3 tests que verifican el instante correcto, con el resultado
degradando a `undefined` porque la comprobación de round-trip lo detectó y devolvió `null`, mientras los
3 tests de formato inválido siguieron en verde sin tocar esa rama), restaurada con Edit y reverificado
verde. Sin desviaciones del diseño.

## T8 — `normalizarAviso`: camino válido a `GastoNormalizado`

**Requisitos:** 2.5, 2.12, 3.4, 8.8
**Depende de:** T4, T6, T7, T10

**Descripción:**

`dominio/normalizacion/normalizarAviso(datos, ahora)` cierra el bloque de normalización: recibe un
`DatosAviso` —los textos crudos que devolvió el parser— y devuelve el resultado exitoso con un
`GastoNormalizado` completo: `montoTotal` decimal, `moneda` en `ARS`, `comercio`, `fechaGasto`,
`tipoTarjeta`, `tarjetaUltimos4` y `cuotasTotal`. Vive en `dominio/normalizacion/`, el módulo que
fijaron T6 y T7, e **importa** `normalizarMonto` y `componerFechaGasto` desde sus archivos propios en
vez de reimplementarlos. El reloj `ahora` se inyecta y forma parte de la firma desde esta tarea, aunque
la validación que lo consume —fecha futura, criterio 3.6— llegue recién en T9.

**Sus tests no leen fixtures, pero su ejecución sí queda detrás del bloque de parseo.** La entrada es un
`DatosAviso` construido a mano en el test: T8 no invoca `parsearAvisoSantander`, no lee HTML y no abre
ninguno de los tres avisos anonimizados. Lo que sí necesita es el **tipo** `DatosAviso` ya cerrado, y eso
recién ocurre en T4: `GastoNormalizado` exige `tipoTarjeta` y `tarjetaUltimos4` —los dos campos que T4
agrega— y sin ellos el objeto del test ni siquiera compila. Por eso la dependencia es T4, que arrastra T2
y T3 con los otros cinco campos, y no T3 sola. La consecuencia hay que decirla derecho: **T8 no puede
ejecutarse mientras el bloqueo de fixtures de T2–T4 siga abierto.** Las únicas tareas del bloque
realmente independientes de los fixtures son T6, T7 y T10, y son con las que conviene arrancar.

**`montoTotal` es el total de la compra, y desde el criterio 8.8 eso es un producto.** El campo `Monto`
del aviso es el valor de **una** cuota. `normalizarAviso` normaliza ese texto con `normalizarMonto`
(T6), resuelve la cantidad de cuotas, y obtiene el total llamando a `resolverMontoTotal` (T10) con la
constante `INTERPRETACION_MONTO` vigente. No reimplementa la multiplicación: la interpretación sigue
aislada en un único punto, como exige `design.md`.

**Por qué la multiplicación ocurre acá y no en el step extraer.** Es la costura que abrió el criterio
8.8, y se resuelve del lado del dominio por tres razones que no dependen del gusto:

1. **El contrato de persistencia no deja lugar a otra cosa.** `design.md` declara
   `RepositorioGastos.crear(datos: GastoNormalizado, emailId)`: el repositorio persiste el
   `GastoNormalizado` entero, y `gastos.monto_total` sale directo de `GastoNormalizado.montoTotal`. Si
   ese campo trajera el valor de una cuota, la fila quedaría con un total falso —seis veces menor en
   una compra en seis cuotas— y el invariante 8.3, que ata `SUM(imputaciones.monto)` a
   `gastos.monto_total`, se rompería en silencio. La única alternativa sería que el step armara un
   `GastoNormalizado` modificado entre normalizar y persistir, y para eso no hay interfaz en el diseño.
2. **El nombre del campo dejaría de ser verdadero.** `GastoNormalizado.montoTotal` promete un total. Un
   campo que contiene el valor de una cuota bajo ese nombre es el tipo de mentira que ningún test
   atrapa y que reaparece meses después como un dashboard que subestima.
3. **Acá el criterio 8.8 se verifica sin base de datos.** `design.md` rechaza explícitamente enterrar
   `montoDelAviso * cuotas` en un orquestador porque "la vuelve intesteable sin base de datos". Si el
   producto lo aplicara el step extraer, el único test que probaría 8.8 de punta a punta sería uno de
   integración con Postgres real. Aplicado dentro de `normalizarAviso`, la composición completa
   —texto del monto más cantidad de cuotas igual total— es un test unitario puro.

A esto se suma que `normalizarAviso` es el único lugar donde `cuotasTotal` queda validado (criterio
3.7, en T9): multiplicar aguas abajo obligaría a revalidar el factor o a confiar en él.

**Consecuencia sobre el orden de la cola: T8 depende de T10.** La dependencia se invierte respecto del
orden en que las tareas están escritas en este archivo. Los identificadores **no se renumeran**: con el
bloque de parseo ya cerrado hasta T4, la ejecución corre T6, T7, T10 y recién entonces T8 y T9.
`resolverMontoTotal` no necesita nada de T8 —su firma es `(Decimal, number, InterpretacionMonto) =>
Decimal`—, así que la inversión no crea ciclo.

**Qué significa exactamente el criterio 2.12 en esta tarea.** El criterio prohibe registrar un monto que
no venga de la extracción del aviso o de una corrección del usuario. Prohibe **inventar**, no prohibe
**derivar**: `montoTotal` es una función determinista de dos valores extraídos —el monto y la cantidad
de cuotas—, y `cuotasTotal = 1` ante la ausencia de la fila `Cuotas` es lo que manda el criterio 2.5,
no un relleno. Lo que 2.12 sí prohibe en el camino válido es que un campo faltante o ilegible se
complete con un cero, una estimación o un placeholder con tal de poder devolver `ok: true`.
`moneda: 'ARS'` es la única constante del tipo y no es un monto: el alcance del spec son pesos
argentinos.

**Lo que T8 no hace.** No valida: monto menor o igual a cero, fecha futura, cuotas inválidas y campos
faltantes son los criterios 3.5, 3.6, 3.7 y 2.11, y pertenecen a T9, que agrega la rama `ok: false`. No
reparte el total en cuotas —eso es `dividirEnCuotas` en T11— ni calcula meses —T12 y T13—. No parsea
HTML ni persiste nada.

**Criterios de aceptación (trazados desde requirements.md):**

- 3.4 — La `fechaGasto` resultante se compone a partir de `fechaTexto` y `horaTexto` del `DatosAviso`.
  La garantía fuerte no es una aserción sino el tipo: `DatosAviso` no tiene ningún campo de header de
  email y `normalizarAviso` no recibe más parámetros que `datos` y `ahora`, así que el header `Date`
  es inalcanzable desde esta función. El test lo confirma con un `DatosAviso` cuya fecha es
  deliberadamente distinta de la fecha de recepción que traería el email que lo originó.
- 8.8 — Con `montoTexto: '$1.000,00'` y `cuotasTexto: '6'`, el `montoTotal` devuelto es exactamente
  `6000.00` en `Decimal` y `cuotasTotal` es `6`. El caso descarta el modo de falla concreto de dejar
  `1000.00` como total de la compra, que persistiría un total seis veces menor al real.
- 8.8 — El total lo produce `resolverMontoTotal` con la constante vigente del módulo de imputación, no
  una multiplicación escrita de nuevo dentro de `normalizarAviso`. La aserción que lo sostiene es que
  cambiar esa única constante cambia el resultado de este test sin editar `dominio/normalizacion/`.
- 2.5 — Un `DatosAviso` con `cuotasTexto: null` y otro con `cuotasTexto: '1'`, iguales en todo lo
  demás, producen el mismo `cuotasTotal` de `1` y el mismo `montoTotal`, igual al monto normalizado del
  aviso. Es el caso borde de cobertura obligatoria que exige `design.md` —aviso de débito sin fila
  `Cuotas` contra aviso de crédito con `Cuotas: 1`— y la conversión vive acá, no en el parser: T3 fijó
  que la ausencia de la fila no es un campo faltante y que el parser devuelve `null` tal cual.
- 2.12 — Ningún campo del `GastoNormalizado` devuelto se completa con un valor por defecto que
  sustituya un dato ausente: `comercio`, `tipoTarjeta` y `tarjetaUltimos4` se copian de `DatosAviso`
  —los tres campos que el tipo cerrado en T4 garantiza presentes—; `montoTotal` y `fechaGasto` se
  derivan de valores extraídos; `cuotasTotal` sale de `cuotasTexto` o de la regla del criterio 2.5. El
  camino válido no tiene ninguna rama capaz de producir un monto sin un monto extraído.
- El tipo de retorno es `ResultadoNormalizacion` y la rama exitosa es `{ ok: true, datos }`, con
  `montoTotal` en `Decimal` y `fechaGasto` en `Date`, nunca en `number` ni en cadena. Esa mitad la
  sostiene el `typecheck`. La rama `{ ok: false, motivo }` se declara en esta tarea pero se ejercita en
  T9.
- Verificación: `npm run typecheck && npm test` en verde. T8 no incorpora ninguna dependencia externa
  nueva: `decimal.js` entró en T6 y el mecanismo de zona horaria en T7.

**Decision log:**

`normalizarAviso` y `GastoNormalizado`/`MotivoRevision`/`ResultadoNormalizacion` se implementaron
completos en un solo módulo (`dominio/normalizacion/normalizarAviso.ts`), cubriendo de entrada tanto el
camino válido de T8 como las cuatro guardas de T9 — misma razón que la implementación consolidada de
T2–T5: esta corrida ejecuta ambas tareas en la misma sesión sin puntos de commit intermedios reales. La
resolución de cuotas (`resolverCuotas`) usa `/^\d+$/` como conversión primaria en vez de `parseInt`, que
es deliberadamente laxo con `'2,5'` (`parseInt` da `2`) y con `''` (`Number('')` da `0`): la regex
rechaza cualquier forma que no sea dígitos puros antes de convertir, así que `'2,5'` y `'2.5'` nunca
llegan a `Number()`.

**Desviación de proceso, registrada:** para T8 escribí la implementación antes que el test —no hubo RED
léxico en el momento—. Lo corregí antes de continuar: renombré temporalmente
`normalizarAviso.ts` a `.ts.bak`, corrí la suite y confirmé que `normalizarAviso.test.ts` fallaba con
"Failed to load url ./normalizarAviso" (módulo inexistente), y recién entonces restauré la
implementación con `mv`. Es una reconstrucción del RED después del hecho, no un RED contemporáneo a la
escritura del test; queda anotado para que quede claro que no es equivalente al ciclo estricto que sí se
siguió en T2–T5 y en T9. T9 en adelante vuelve a escribir test antes que implementación.

**Outcome:**

Los 17 tests (4 de T8, 13 de T9, incluidos los `it.each` de cuotas inválidas) pasaron en verde. RED
reconstruido según se explica arriba. GREEN: `npm run typecheck && npx vitest run` → 20 test files,
146/146 en verde. Mutación dirigida (sobre el núcleo de T9, el orden de las guardas): se invirtieron las
guardas de cuotas y monto (monto primero). Corrí la suite completa: falló exactamente el test "orden de
las guardas" —el caso que viola cuotas y monto a la vez pasó a devolver `monto_invalido` en vez de
`cuotas_invalidas`—, con 145 tests restantes en verde. Restaurado con Edit. Verificación final: `npm run
typecheck && npx vitest run` → typecheck limpio, 20 test files, 146/146 en verde.

## T9 — `normalizarAviso`: validaciones que devuelven `MotivoRevision`

**Requisitos:** 2.11, 3.5, 3.6, 3.7
**Depende de:** T8

**Descripción:**

Agregar a `normalizarAviso` la rama `{ ok: false, motivo: MotivoRevision }` que T8 dejó declarada pero
sin ejercitar. Con esta tarea `ResultadoNormalizacion` queda cerrado por los dos lados y el bloque de
normalización termina: un `DatosAviso` que no supera las validaciones no produce un `GastoNormalizado`
degradado, produce un motivo.

**Es un solo ciclo TDD, no cuatro.** Las cuatro validaciones no son cuatro implementaciones
independientes sino una única secuencia de guardas al principio de una función que ya existe, y el
**orden** entre ellas es parte del contrato —no un detalle de implementación—. Repartirlas en tareas
separadas dejaría ese orden sin dueño: ninguna de las mitades podría afirmar qué motivo gana cuando un
aviso viola dos condiciones a la vez, ni que el producto del criterio 8.8 se calcula después de todas.
Los tests son casos de una misma tabla sobre una misma firma, con la misma forma de entrada
—`DatosAviso` más `ahora`— que ya construyó T8.

**Es la cuarta tarea independiente de los fixtures.** Sus entradas son `DatosAviso` construidos en el
test: no invoca `parsearAvisoSantander`, no lee HTML y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Depende solo de T8, que a su vez arrastra T3, T6, T7 y T10.

**El orden de las validaciones, que esta tarea fija.** `design.md` cataloga las condiciones de error en
su tabla de "Manejo de errores" pero no dice en qué orden se evalúan. T9 lo fija así, y la función
ejecuta exactamente esta secuencia:

1. **Cuotas** (3.7) — `cuotasTexto` a entero mayor o igual a uno; `null` vale `1` por el criterio 2.5.
2. **Monto** (3.5) — `normalizarMonto(montoTexto)` no nulo y mayor a cero.
3. **Fecha, formato** — `componerFechaGasto(fechaTexto, horaTexto)` no nulo, o `fecha_invalida`.
4. **Fecha, futuro** (3.6) — `fechaGasto` no posterior al `ahora` inyectado.
5. **Recién entonces** se calcula `montoTotal` con `resolverMontoTotal` y se devuelve `ok: true`.

**Por qué las cuotas van primero.** Desde el criterio 8.8 el monto total es `montoDelAviso * cuotas`:
invocar `resolverMontoTotal` con un factor basura no devuelve un error, devuelve un total corrupto que
después se persiste en `gastos.monto_total` y rompe el invariante 8.3 en silencio. Poner la guarda de
cuotas como **primera sentencia de la función** hace que ninguna ubicación posterior del producto
—hoy o después de un refactor— pueda alcanzarse con cuotas inválidas. Si la guarda fuera la última de
las cuatro, la invariante dependería de que nadie hoistee la multiplicación, que es exactamente el tipo
de garantía que ningún test atrapa. Si el orden deseado fuera otro, el cambio pertenece a `design.md` y
esta tarea vuelve a iterarse.

**Por qué el monto se valida antes del producto y no después.** El criterio 3.5 habla del monto
normalizado, que es lo que devuelve `normalizarMonto` (T6), no del total. Como la guarda de cuotas ya
garantizó un factor mayor o igual a uno, el signo del producto es el del operando y las dos lecturas
coinciden; validar antes es equivalente en resultado y estrictamente más temprano, así que ningún
camino de error llega a multiplicar. T6 devuelve `Decimal(0)` para `"$0,00"` y nulo para un texto sin
forma de monto: los dos son entradas de esta tarea y los dos desembocan en `monto_invalido`.

**Por qué un total corrupto no puede escapar.** La rama fallida es `{ ok: false; motivo }` y **no tiene
campo `datos`**: un `GastoNormalizado` con un total mal calculado no es representable en el resultado de
una validación fallida. Eso convierte "el producto se calcula después de las guardas" en algo que el
tipo sostiene, y deja a los tests la mitad que sí es observable: que cada entrada inválida devuelve
`ok: false` con el motivo correcto en vez de un `ok: true` con un total plausible.

**`fecha_invalida` no traza a ningún criterio de `requirements.md`.** Es un miembro de `MotivoRevision`
que `design.md` declara sin anotarle requisito, y es el destino de la señal nula que T7 dejó definida
para una fecha u hora con formato inválido. T9 lo ejercita acá porque es la única función que traduce
esa señal; no se le inventa un criterio EARS.

**Qué campos cuentan como obligatorios, y qué hace T9 con el criterio 2.11.** La discrepancia entre el
criterio 2.11 —cinco campos: monto, comercio, fecha, hora y tipo de tarjeta— y el tipo `CampoAviso` de
`design.md` —seis, sumando `tarjetaUltimos4`— sigue **abierta y escalada al usuario**. T9 mantiene
exactamente el lado que eligió T5, el conservador de los seis campos, y no toma una decisión propia: si
el usuario resuelve a favor de los cinco, se corrigen T5 y T9 juntas en la misma iteración.

De ese criterio, T9 no verifica la detección de campos faltantes: la detecta el parser y la reporta como
`aviso_ilegible` (T5), y el mapeo a `needs_review` con motivo `campos_faltantes` es del step extraer
(T32). Un `DatosAviso` bien tipado no puede tener campos ausentes —todos son `string` salvo
`cuotasTexto`—, así que `campos_faltantes` es **inalcanzable desde `normalizarAviso`**: T9 declara el
miembro en la unión para que T32 lo use, igual que T8 declaró la rama `ok: false` sin ejercitarla, y no
escribe un test que exija forjar un valor mal tipado. Lo que T9 sí verifica de 2.11 es su segunda mitad
—"sin asignar valores por defecto a los campos faltantes"—: la rama fallida no devuelve datos parciales
de ningún tipo.

**Lo que T9 no hace.** No marca ningún gasto como `needs_review` ni persiste el motivo: eso es
`marcarParaRevision` (T22) y el step extraer (T32). No ejercita `error_de_paso`, que es de T38. No
reparte el total en cuotas (T11) ni calcula meses (T12, T13). No toca el parser.

**Bloqueo de ejecución:** ninguno propio. Igual que T6, T7 y T8, T9 no depende de los tres fixtures
anonimizados todavía ausentes del repositorio.

**Criterios de aceptación (trazados desde requirements.md):**

- 3.7 — Un `DatosAviso` con `montoTexto` válido y `cuotasTexto` en `'0'`, `'-3'`, `'2,5'`, `'2.5'`,
  `'abc'` o `''` devuelve `{ ok: false, motivo: 'cuotas_invalidas' }` en todos los casos. `'2,5'` y
  `'2.5'` son los que importan: una conversión laxa —`parseInt('2,5')` da `2`— devolvería `ok: true`
  con un total del doble del real en vez de un motivo, que es el modo de falla concreto que este
  criterio existe para atrapar. `''` cierra el otro: `Number('')` da `0`, que no es mayor o igual a uno.
- 3.7 — `cuotasTexto: null` y `cuotasTexto: '1'` **no** son entradas inválidas: siguen produciendo
  `ok: true` con `cuotasTotal` igual a `1`, como fijaron T3 y T8. La ausencia de la fila `Cuotas` no es
  un campo faltante ni una cuota inválida.
- 3.7 y 8.8 (orden, verificado por el resultado) — En cada uno de los casos de cuotas inválidas el
  resultado **no tiene campo `datos`**: ningún total derivado escapa de la función cuando el factor es
  inválido. La aserción compara el resultado completo contra `{ ok: false, motivo: 'cuotas_invalidas' }`
  —no solo el motivo—, de modo que un `ok: true` con `montoTotal` calculado sobre cuotas basura falla
  el test. La mitad restante, que la guarda es la primera sentencia y que `resolverMontoTotal` se
  invoca solo después de las cuatro, la sostiene el tipo de la rama fallida más el orden declarado
  arriba.
- 3.5 — `montoTexto: '$0,00'` devuelve `{ ok: false, motivo: 'monto_invalido' }`. T6 devuelve para ese
  texto un `Decimal` igual a `0`, no un nulo: esta tarea es la que lo rechaza.
- 3.5 — Un `montoTexto` sin forma de monto —`'gracias por su compra'`— devuelve
  `{ ok: false, motivo: 'monto_invalido' }`. Es la traducción de la señal nula que T6 dejó definida.
- 3.5 — Un `montoTexto` que normaliza a un valor negativo devuelve
  `{ ok: false, motivo: 'monto_invalido' }`. Si T6 devolviera nulo para ese texto en lugar de un decimal
  negativo, el motivo es el mismo: la costura entre las dos señales no es observable desde acá y el test
  no la asume.
- `fecha_invalida` — `fechaTexto: '32/01/2026'` con hora válida, y `fechaTexto` válida con
  `horaTexto: '25:99'`, devuelven `{ ok: false, motivo: 'fecha_invalida' }`. Es la traducción de la
  señal nula que T7 dejó definida.
- 3.6 — Con un `ahora` inyectado, un `DatosAviso` cuya `fechaGasto` compuesta cae un milisegundo después
  de `ahora` devuelve `{ ok: false, motivo: 'fecha_futura' }`, y uno cuya `fechaGasto` es exactamente
  igual a `ahora` devuelve `ok: true`: "posterior" es estricto y un aviso procesado en el mismo instante
  de la compra no es un error.
- 3.6 — La comparación es entre instantes, no entre horas de pared: los dos casos anteriores dan el
  mismo resultado con la variable `TZ` del runner puesta en un valor distinto de la zona de referencia,
  igual que exige T7. El `ahora` de los tests se escribe como instante UTC literal, nunca como
  `new Date(...)` con componentes locales.
- Orden, verificado por conflicto — Un `DatosAviso` que viola **cuotas y monto** a la vez devuelve
  `cuotas_invalidas`, y uno que viola **monto y fecha** a la vez devuelve `monto_invalido`. Los dos
  casos fijan la cadena declarada arriba como contrato observable en vez de como prosa: sin ellos,
  cualquier permutación de las guardas pasaría los tests anteriores.
- 2.11 y 2.12 — En todos los casos anteriores el resultado es exactamente `{ ok: false, motivo }`, sin
  ningún dato de gasto parcial: ni un `montoTotal` en cero, ni un `comercio` vacío, ni una `fechaGasto`
  de relleno. La imposibilidad de devolverlos la sostiene el tipo —la rama fallida no tiene `datos`—;
  los tests confirman que ninguna entrada inválida toma el camino `ok: true`. `campos_faltantes` queda
  declarado en `MotivoRevision` pero no se ejercita acá: es inalcanzable con un `DatosAviso` bien
  tipado y lo produce T32 a partir del `aviso_ilegible` de T5.
- Verificación: `npm run typecheck && npm test` en verde. T9 no incorpora ninguna dependencia externa
  nueva: `decimal.js` entró en T6 y el mecanismo de zona horaria en T7.

**Decision log:**

Implementación y evidencia completas en el Decision log/Outcome de T8 (mismo módulo, misma sesión de
convergencia). La comparación de "fecha futura" se verificó explícitamente independiente de `TZ` con un
test que fija `process.env.TZ = 'Pacific/Kiritimati'` (UTC+14, deliberadamente distinto de ART y del
valor por defecto del runner) alrededor de la aserción y lo restaura en un `finally`.

**Outcome:**

Ver Outcome de T8: mismo ciclo, mismos 17 tests, misma mutación dirigida (orden de guardas cuotas/monto)
y misma verificación final en 146/146.

## T10 — `resolverMontoTotal` y la constante `INTERPRETACION_MONTO`

**Requisitos:** 8.8
**Depende de:** T6

**Descripción:**

`dominio/imputacion/resolverMontoTotal(montoDelAviso, cuotas, interpretacion)` convierte el monto que
trae el aviso en el monto total de la compra. Con `valor_de_la_cuota` devuelve el monto multiplicado
por la cantidad de cuotas; con `total_de_la_compra` lo devuelve tal cual.

**La pregunta que esta función aislaba está resuelta, y esta tarea implementa la respuesta.** El campo
`Monto` de un aviso en cuotas es el **valor de una sola cuota**: lo confirmó el usuario sobre sus
propios avisos el 2026-08-26, `requirements.md` lo registra en "Decisiones resueltas" y el criterio 8.8
lo declara normativo. `design.md` fija en consecuencia `INTERPRETACION_MONTO = 'valor_de_la_cuota'`.
T10 no explora una incógnita: implementa una regla de negocio decidida y la deja verificada.

**Por qué el parámetro `InterpretacionMonto` se conserva igual.** No por duda residual —`design.md` lo
dice con todas las letras—, sino por dos razones que sobreviven a la decisión. La primera es
testeabilidad: un parámetro explícito permite ejercitar las dos ramas de la aritmética sin manipular
ninguna constante global, y separa el test de *cómo multiplica* del test de *qué interpretación rige*.
La segunda es que mantiene la decisión en un punto único y reversible si el banco cambia el formato del
aviso. La alternativa que `design.md` rechaza explícitamente es hardcodear `montoDelAviso * cuotas`
dentro del paso de imputación, "porque entierra una regla de negocio dentro de un orquestador y la
vuelve intesteable sin base de datos".

**Dónde vive la constante y por qué ahí.** El tipo `InterpretacionMonto`, la función y la constante
`INTERPRETACION_MONTO` se declaran juntos en el archivo propio de `resolverMontoTotal`, dentro de
`dominio/imputacion/`, siguiendo la convención de un archivo por función que estrenó T6.
`normalizarAviso` (T8) la **importa** desde ahí en vez de declarar la suya. Esa ubicación es lo que
vuelve verificable el criterio de aceptación que dejó T8: cambiar el valor de esa única constante
cambia el `montoTotal` que devuelve `normalizarAviso` sin editar un solo archivo de
`dominio/normalizacion/`. Si la constante viviera en el módulo de normalización, la decisión quedaría
declarada en dos lugares —uno de ellos no es el que `design.md` nombra— y nada impediría que se
desincronizaran.

**Es la cuarta tarea independiente de los fixtures.** Su entrada es un `Decimal` y un entero, no un
aviso: no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Depende solo de T6, que es donde entró `decimal.js`.

**T10 se ejecuta antes que T8.** T8 resolvió que `normalizarAviso` devuelve el `montoTotal` ya
multiplicado, así que `resolverMontoTotal` pasó a ser su prerequisito: el orden real de ejecución del
bloque es T6 → T7 → **T10** → T8 → T9, aunque en este archivo T10 aparezca escrita después. Los
identificadores no se renumeran. No hay ciclo posible: la firma
`(Decimal, number, InterpretacionMonto) => Decimal` no necesita nada de T8 ni de T9.

**Lo que T10 no hace.** No valida la cantidad de cuotas ni el monto. T9 fijó que el criterio 3.7 se
evalúa como primera sentencia de `normalizarAviso`, antes de cualquier producto, justamente para que
`resolverMontoTotal` nunca reciba un factor basura; agregar acá una guarda defensiva crearía un segundo
camino de rechazo sin criterio que lo respalde y sin `MotivoRevision` que devolver. Tampoco reparte el
total entre las cuotas: eso es `dividirEnCuotas` en T11, y es esa función —no esta— la que garantiza el
criterio 8.3, por lo que T10 dejó de trazar a 8.3. No lee el aviso, no decide cuántas cuotas hay y no
persiste nada.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.8 — Con `interpretacion: 'valor_de_la_cuota'`, un monto de `1000.00` y 6 cuotas, el resultado es
  exactamente `6000.00` en `Decimal`. El caso descarta el modo de falla concreto de tomar el monto del
  aviso como total de la compra, que registraría un gasto seis veces menor al real.
- 8.8 — `INTERPRETACION_MONTO` vale `'valor_de_la_cuota'`, está declarada una sola vez y se exporta
  desde el archivo de `resolverMontoTotal` en `dominio/imputacion/`. La aserción que fija ese valor es,
  junto con la constante misma, lo único que habría que tocar si el banco cambiara el formato del
  aviso; el criterio de T8 verifica que ese cambio se propaga sin editar `dominio/normalizacion/`.
- 8.8 — Con `interpretacion: 'total_de_la_compra'` y las mismas entradas el resultado es exactamente
  `1000.00`. La rama que no rige se testea igual: es lo que prueba que el parámetro decide de verdad y
  que el resultado vigente no viene de una multiplicación incondicional que ignora el argumento.
- El resultado es un producto decimal exacto y el monto no atraviesa un `number` en ningún punto, ni
  siquiera como paso intermedio, según la regla que fijó T6. Un `Decimal` de `3333.33` por 3 devuelve
  exactamente `9999.99`, comparado por igualdad decimal y no por `===` numérico.
- Caso borde de cobertura obligatoria: con `cuotas: 1` ambas interpretaciones devuelven el monto del
  aviso sin alterarlo. Es lo que permite que un débito y un crédito en una cuota recorran el mismo
  código sin un condicional. No traza a un criterio propio: 8.5 se verifica sobre las imputaciones
  resultantes, en T13 y T36.
- El tipo de retorno es `Decimal`, nunca `number` ni cadena. Esa mitad la sostiene el `typecheck`.
- Verificación: `npm run typecheck && npm test` en verde. T10 no incorpora ninguna dependencia externa
  nueva: `decimal.js` entró en T6.

**Decision log:**

- Ubicación: `dominio/imputacion/resolverMontoTotal.ts` + `.test.ts` colocado, junto con
  `InterpretacionMonto` e `INTERPRETACION_MONTO` en el mismo archivo (design.md exige que sea un único
  punto de la aplicación). `dominio/imputacion/` se estrena en esta tarea.
- Implementación trivial de propósito: un `if` sobre `interpretacion` que multiplica con `Decimal.times`
  o devuelve el monto sin alterar. Ninguna validación de `cuotas` ni de signo: por diseño, T9 ya
  garantiza (en `normalizarAviso`) que el factor es válido antes de llegar acá.

**Outcome:**

`resolverMontoTotal` e `INTERPRETACION_MONTO` implementadas en `dominio/imputacion/resolverMontoTotal.ts`.
Ciclo TDD completo: RED (5 tests sobre módulo inexistente), GREEN (`npm run typecheck && npm test`
verdes, 21/21 acumulados), mutación (se sumó `.plus(1)` a la rama `valor_de_la_cuota` — introduce un
error de un peso en el total; fallaron exactamente los 3 tests que ejercitan esa rama —6 cuotas, producto
exacto de 3333.33×3, y el caso de 1 cuota con `valor_de_la_cuota`—, mientras los 2 tests de
`total_de_la_compra`/valor de la constante siguieron en verde sin tocar esa rama), restaurada con Edit y
reverificado verde. Sin desviaciones del diseño.

## T11 — `dividirEnCuotas` conservando el total exacto

**Requisitos:** 8.3
**Depende de:** T6

**Descripción:**

`dominio/imputacion/dividirEnCuotas(montoTotal: Decimal, cuotas: number): Decimal[]` reparte el monto
total en N montos de dos decimales y devuelve el arreglo **en orden de cuota**: la posición N menos uno
corresponde a la imputación número N que T36 va a escribir. Las primeras N menos una cuotas son el
cociente truncado hacia abajo a dos decimales —`ROUND_DOWN`, nunca redondeo al más cercano— y la
**última** absorbe todo el resto, como fija `design.md`. La invariante es que la suma de los montos
devueltos es exactamente igual al total, para todo monto y para toda cantidad de cuotas mayor o igual
a 1.

Vive en su propio archivo dentro de `dominio/imputacion/`, al lado de `resolverMontoTotal` (T10),
siguiendo la convención de un archivo por función que estrenó T6.

**Por qué el truncado y no el redondeo al más cercano.** Con redondeo al más cercano las N menos una
primeras cuotas pueden sumar **más** que el total y dejar a la última en negativo: `0.05` repartido en 8
cuotas daría `0.01` siete veces —el cociente es `0.00625`— y una última cuota de `−0.02`. La suma
seguiría dando exactamente el total, así que la invariante de 8.3 tal como está enunciada no lo
detectaría, pero esa imputación violaría el `CHECK (monto >= 0)` de la tabla `imputaciones` y haría
fallar la escritura recién en T36, lejos del código que la produjo. Truncando hacia abajo, el resto
queda siempre entre cero y N menos un centavos, y ningún monto devuelto puede ser negativo.

**Por qué el reparto con resto sigue en el plan aunque hoy no ocurra por el camino normal.** Desde que
el criterio 8.8 fijó que el campo `Monto` del aviso es el valor de **una** cuota, el monto total que
produce `resolverMontoTotal` (T10) es un producto exacto: `montoDelAviso × cuotas`. Dividir ese total
de vuelta entre esas mismas cuotas da cuotas iguales y resto cero, así que en el camino de producción
vigente la invariante de 8.3 se cumple trivialmente y la rama del redondeo no se ejecuta nunca.
`design.md` registra esa consecuencia y decide igual que el reparto con resto siga existiendo y siga
testeado.

La razón es que 8.3 es una invariante sobre el monto total, **no sobre su origen**, y el spec prevé al
menos dos orígenes que no son ese producto. El primero ya está vigente: el criterio 2.12 admite que un
monto provenga de **una corrección explícita del usuario**, que puede ser cualquier cifra y no tiene por
qué ser divisible entre la cantidad de cuotas. El segundo es la propia constante `INTERPRETACION_MONTO`:
T10 la dejó como el único punto reversible si el banco cambia el formato del aviso, y con
`total_de_la_compra` el total vuelve a ser una cifra arbitraria heredada del aviso.

Por eso el caso `10000` en 3 y el test basado en propiedades **no son código muerto y no deben borrarse
por "no ejercitarse en el camino feliz"**. Son lo que impide que una simplificación futura —"total
dividido cuotas y listo, siempre da exacto"— rompa el invariante en silencio: el descuadre aparecería
como unos centavos de diferencia en el total del mes del dashboard, que ninguna pantalla señala y ningún
otro test mira. Un test que hoy pasa sin esfuerzo sigue siendo la única red que atrapa esa regresión.

**Es la tarea que estrena el test basado en propiedades.** `design.md` lo pide explícitamente para esta
función —"un test basado en propiedades sobre montos y cantidades de cuotas variados"— y es la única del
plan que lo pide. Siguiendo la regla que fijó T1, cada dependencia externa entra en la tarea que la
ejercita: si el runner elegido en T1 no trae generación de casos incorporada, la biblioteca que la
aporte se incorpora en este ciclo y en ninguno posterior. La elección concreta —biblioteca de
generación o una tabla de casos generada de forma determinista dentro del propio test— y la **semilla
fija** que la vuelve reproducible se registran en el Decision log: un test de propiedades sin semilla
fija convierte una falla real en una intermitencia que nadie puede reproducir.

**Tampoco depende de los fixtures.** Sus entradas son un `Decimal` y un entero, no un aviso: no lee
HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del
repositorio. Depende solo de T6, que es donde entró `decimal.js`. **No depende de T10** aunque en
producción el total venga de ahí: la firma `(Decimal, number) => Decimal[]` no necesita nada suyo y el
test construye el total a mano, así que el orden entre ambas es indiferente.

**Lo que T11 no hace.** No decide cuál es el monto total —eso es `resolverMontoTotal` en T10— ni calcula
los meses de las imputaciones —T12 y T13—. No valida la cantidad de cuotas: T9 fijó que el criterio 3.7
se evalúa como primera sentencia de `normalizarAviso`, antes de cualquier aritmética, así que agregar
una guarda defensiva acá crearía un segundo camino de rechazo sin criterio que lo respalde. Y no
persiste nada: que las imputaciones **guardadas** sumen `gastos.monto_total` es una verificación sobre
la base de datos, no sobre esta función pura.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.3 — `dividirEnCuotas` de un total de `10000` en 3 devuelve exactamente `[3333.33, 3333.33, 3333.34]`.
  La aserción es sobre el arreglo completo y en orden, no sobre la suma: es lo que fija que el centavo
  del resto va a la **última** cuota y no a la primera ni repartido, tal como lo dicta `design.md`.
- 8.3 — Test basado en propiedades sobre montos y cantidades de cuotas variados: la suma de los montos
  devueltos es siempre exactamente igual al total, comparada por igualdad decimal y no por `===`
  numérico, y **ningún monto devuelto es negativo**. Las dos mitades de la propiedad hacen falta: la
  suma sola no detecta un redondeo al más cercano que deja la última cuota en negativo —`0.05` en 8
  cuotas—, porque ese reparto suma bien y recién rompe contra el `CHECK (monto >= 0)` en T36. El espacio
  generado incluye totales divisibles, totales con resto y totales de pocos centavos repartidos en
  muchas cuotas, para que la propiedad cubra las dos ramas y no solo la que rige hoy en producción.
- 8.3 — Reparto sin resto, que es el caso vigente en producción desde 8.8: un total de `6000.00` —el
  producto de `1000.00` por 6 que devuelve T10— en 6 cuotas da seis montos idénticos de `1000.00`, sin
  que la última difiera en un centavo. El caso descarta el modo de falla concreto de sumarle siempre el
  resto a la última cuota aunque el resto sea cero.
- 8.3 — El arreglo devuelto tiene exactamente `cuotas` elementos y ninguno tiene más de dos decimales.
  No traza a 8.1 —que se escriban tantas imputaciones como cuotas es de T36—: acá es la otra mitad de la
  invariante, la que impide "conservar el total" devolviendo un único monto.
- 8.3 — `dividirEnCuotas` de `2571.30` en 1 devuelve `[2571.30]`, el caso del escenario A de
  `design.md`. Es lo que permite que un débito y un crédito en una sola cuota recorran el mismo código
  sin un condicional; el criterio 8.5 se verifica sobre las imputaciones resultantes, en T13 y T36, no
  acá.
- Caso borde de cobertura obligatoria que nombra `design.md`: un total de `0.01` repartido en 3 cuotas
  devuelve `[0.00, 0.00, 0.01]`. La suma sigue siendo exactamente `0.01`, ningún monto es negativo y los
  ceros son un resultado legítimo, no una falla: es el caso donde el resto es el total entero.
- Ningún monto atraviesa un `number` en ningún punto —ni en el redondeo, ni al acumular el resto, ni al
  sumar para la aserción—, según la regla que fijó T6. El tipo de retorno es `Decimal[]`, nunca
  `number[]` ni cadenas; esa mitad la sostiene el `typecheck`.
- Verificación: `npm run typecheck && npm test` en verde, respetando la convención de ubicación de tests
  que fijó T1 e incorporando, si hace falta, la única dependencia nueva de este ciclo: la que aporta la
  generación de casos del test de propiedades.

**Decision log:**

- Biblioteca de generación de casos: **`fast-check`**, la estándar del ecosistema TS/vitest para
  property-based testing. Se instala como `devDependency` y no vuelve a incorporarse en ninguna tarea
  posterior.
- Semilla fija: `SEMILLA_FIJA = 20260825` (fecha del spec), pasada explícitamente en
  `fc.assert(..., { seed: SEMILLA_FIJA, numRuns: 200 })` para que una falla real sea siempre reproducible
  y no una intermitencia.
- Generador: `centavos` como entero (`fc.integer`) entre 0 y 100.000.000 (hasta $1.000.000,00), convertido
  a `Decimal` dividiendo por 100 — nunca se genera el total como `number` decimal directo, para no
  reintroducir por la puerta de atrás el error de punto flotante que la función existe para evitar.
  `cuotas` como entero entre 1 y 60.
- Implementación: cociente truncado con `Decimal#toDecimalPlaces(2, Decimal.ROUND_DOWN)`; la última cuota
  se obtiene por resta (`total - cociente × (cuotas - 1)`), nunca sumando un resto calculado aparte, para
  que la igualdad con el total sea estructural y no dependa de que el resto se calculó bien.

**Outcome:**

`dividirEnCuotas` implementada en `dominio/imputacion/dividirEnCuotas.ts`. Ciclo TDD completo: RED (6
tests sobre módulo inexistente), GREEN (`npm run typecheck && npm test` verdes, 27/27 acumulados),
mutación (se cambió `Decimal.ROUND_DOWN` por `Decimal.ROUND_HALF_UP` en el truncado del cociente — es
exactamente el modo de falla que describe `design.md`, redondeo al más cercano que puede dejar la última
cuota negativa; el test de propiedades lo detectó con el contraejemplo `[3, 5]` — total de 3 centavos en
5 cuotas — tras 13 casos y 12 reducciones (`shrink`), mientras los 5 tests de casos fijos siguieron en
verde porque ninguno de ellos cae en un total no divisible que dispare la diferencia entre truncar y
redondear al más cercano; solo la propiedad, que es la que existe para atrapar justo este caso, falló),
restaurada con Edit y reverificado verde. Sin desviaciones del diseño.
## T12 — `mesDe`: mes calendario en zona de referencia

**Requisitos:** 8.4
**Depende de:** T1, T7

**Descripción:**

`mesDe(fecha: Date): Mes` devuelve la cadena `AAAA-MM` del mes calendario al que pertenece un instante,
leído en la zona horaria de referencia. `design.md` la declara como export del componente
`dominio/imputacion/calcularMesesDeImputacion`; T12 la implementa en su propio archivo dentro de
`dominio/imputacion/`, siguiendo la convención de un archivo por función que fijó T6 y que T10 y T11 ya
aplicaron en esta misma carpeta. Acá también se declara el tipo `Mes`, porque es el tipo de retorno de
esta función y T13 lo consume.

**Es el único punto del sistema donde ocurre una conversión de zona horaria para el cálculo de meses**,
tal como lo fija `design.md`: "la única conversión de zona horaria ocurre en `mesDe`, una sola vez". De
ahí en adelante la aritmética de meses opera sobre la cadena, nunca sobre `Date`.

**No estrena ninguna dependencia: hereda el mecanismo de zona horaria de T7.** La elección entre
`@date-fns/tz` y `Temporal`, con su criterio de desempate, ya se resolvió en T7 y quedó registrada en su
Decision log, que es la única fuente de esa decisión. `mesDe` es la conversión inversa de
`componerFechaGasto` —instante a mes de pared, en vez de hora de pared a instante— y **debe usar ese
mismo mecanismo**, no un segundo mecanismo en paralelo. La regla que fijó T1 —cada dependencia externa
entra en la tarea que la ejercita con un test propio, y en ninguna posterior— hace que este ciclo no
incorpore ningún paquete nuevo. Si al implementar T12 apareciera la necesidad de una biblioteca de zona
horaria distinta de la de T7, eso no es una decisión de T12: es una señal de que hay que volver sobre T7.

**Tampoco depende de los fixtures.** Su entrada es un `Date`, no un aviso: no lee HTML, no invoca
`parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del repositorio.
Depende de T1 por el andamiaje, la convención de ubicación de tests y el contrato de verificación, y de
T7 por el mecanismo de zona horaria; puede ejecutarse con el bloqueo de fixtures todavía abierto.

**El bug que este test existe para atrapar.** Una implementación que lea el mes en UTC —o en la zona
local del proceso, que en desarrollo es la de referencia y en CI típicamente no— acierta once meses y
medio del año y falla exactamente en las tres primeras horas de cada día 1. Ese consumo queda imputado
al mes siguiente al que el usuario lo hizo, y el error se manifiesta como un total mensual levemente
corrido que ninguna pantalla señala.

**Lo que T12 no hace.** No suma ni resta meses —eso es `sumarMeses` en T13, que trabaja sobre la cadena
y no vuelve a tocar la zona horaria—. No compone la fecha del gasto a partir de las cadenas del aviso:
eso es `componerFechaGasto` en T7, y el test de T12 **no la importa**; construye sus instantes de
entrada literalmente, para que una regresión en T7 no pueda enmascarar ni provocar una falla acá. No
valida la fecha ni decide cuántas cuotas hay, y no persiste nada.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.4 — `mesDe(new Date('2026-08-24T14:14:00.000Z'))` devuelve `'2026-08'`. Es exactamente el instante
  que T7 produce para `('24/08/2026', '11:14')`: el camino feliz de una punta a la otra queda cubierto
  por las dos tareas sin que ninguna importe a la otra.
- 8.4, casos borde de cobertura obligatoria — `mesDe` de `2026-02-01T02:50:00.000Z` devuelve `'2026-01'`
  y de `2026-02-01T03:10:00.000Z` devuelve `'2026-02'`. Son **los dos instantes exactos que fija T7**
  para el consumo del 31/01 a las 23:50 y el del 01/02 a las 00:10. Los dos caen en febrero en UTC y
  están separados por veinte minutos: solo una lectura en la zona de referencia los puede separar en dos
  meses distintos. Es el par que cierra el error desde ambos lados; ninguno de los dos solo alcanza.
- 8.4, caso borde de cobertura obligatoria — `mesDe(new Date('2027-01-01T02:00:00.000Z'))` devuelve
  `'2026-12'`. Retroceder de mes cruzando el año es una rama de falla propia: una implementación que
  reste uno al número de mes produce `'2027-00'`, que las aserciones de enero y febrero no atrapan.
- 8.4 — El valor devuelto es una cadena de exactamente siete caracteres con el mes rellenado a dos
  dígitos: `mesDe(new Date('2026-01-15T15:00:00.000Z'))` devuelve `'2026-01'`, nunca `'2026-1'`. El
  formato no es cosmético: la columna `imputaciones.mes` es `char(7)` y el orden alfabético de la cadena
  tiene que coincidir con el orden cronológico para que el dashboard agrupe y ordene por ella.
- 8.4 — Todos los casos anteriores dan idéntico resultado con la variable `TZ` del runner puesta en un
  valor distinto de la zona de referencia, según la condición que fijó T7. Sin esto el test no verifica
  nada: una lectura ingenua en hora local del proceso pasa en la máquina de desarrollo y falla en CI. La
  forma concreta de fijar esa variable ya quedó resuelta en el Decision log de T7 y se reutiliza acá.
- El tipo de retorno es `Mes` —un alias de `string`—, nunca un `Date` ni un objeto de la biblioteca de
  zona horaria. Es la mitad verificable del contrato de `design.md` de que la aritmética de meses opera
  sobre cadenas: al no devolver un `Date`, `sumarMeses` en T13 no tiene sobre qué hacer aritmética de
  fechas. Esa mitad la sostiene el `typecheck`, no una aserción.
- Este ciclo **no incorpora ninguna dependencia nueva**: importa el mecanismo de zona horaria que
  eligió y registró T7. Un segundo paquete de zona horaria en el `package.json` después de este ciclo es
  una falla del criterio, no un detalle de implementación.
- Verificación: `npm run typecheck && npm test` en verde, respetando la convención de ubicación de tests
  que fijó T1.

**Decision log:**

- Ubicación: `dominio/imputacion/mesDe.ts` + `.test.ts` colocado; ahí también se declara el tipo `Mes`.
- Mecanismo: `Intl.DateTimeFormat('en-CA', { timeZone: ZONA_REFERENCIA, year: 'numeric', month: '2-digit'
  })`, importando `ZONA_REFERENCIA` desde `dominio/normalizacion/componerFechaGasto.ts` (T7) en vez de
  redeclararla — es el mismo mecanismo de conversión de zona horaria, no uno nuevo. `formatToParts` en
  vez de `.format()` + slicing de string, para no depender del orden en que la configuración regional
  concatena año y mes.
- No se instala ninguna dependencia nueva, como exige la tarea.

**Outcome:**

`mesDe` y el tipo `Mes` implementados en `dominio/imputacion/mesDe.ts`. Ciclo TDD completo: RED (5 tests
sobre módulo inexistente), GREEN (`npm run typecheck && npm test` verdes, 32/32 acumulados), mutación (se
cambió el `timeZone` del formateador de `ZONA_REFERENCIA` a `'UTC'` — es exactamente el bug que la tarea
describe, leer el mes en UTC en vez de en la zona de referencia; fallaron exactamente los 2 tests que
cruzan la frontera horaria de tres horas —el par de 31/01 23:50 ART / 01/02 00:10 ART, y el cruce de año
hacia atrás—, mientras los 3 tests que no cruzan esa frontera (el camino feliz de agosto, el rellenado a
dos dígitos) siguieron en verde sin detectar el error, que es justo el comportamiento que describe la
tarea: "once meses y medio del año acierta"), restaurada con Edit y reverificado verde. Sin desviaciones
del diseño.

## T13 — `sumarMeses` y `calcularMesesDeImputacion`

**Requisitos:** 8.2, 8.4, 8.5
**Depende de:** T12

**Descripción:**

`sumarMeses(mes: Mes, cantidad: number): Mes` hace aritmética sobre la cadena `AAAA-MM`, nunca sobre
objetos `Date`. `calcularMesesDeImputacion(fechaGasto: Date, cuotas: number): Mes[]` devuelve el arreglo
de meses de las N imputaciones **en orden de cuota**: la posición N menos uno corresponde a la
imputación número N —la misma convención de orden que fijó T11 para `dividirEnCuotas`— y su mes es el
que resulta de sumar N menos uno meses al mes de la fecha del gasto.

Las dos viven en `dominio/imputacion/`, cada una en su propio archivo, siguiendo la convención de un
archivo por función que estrenó T6 y que T10, T11 y T12 ya aplicaron en esta misma carpeta.
`calcularMesesDeImputacion` es el nombre del componente que `design.md` declara, y T13 lo completa: T12
puso `mesDe` y el tipo `Mes`, T13 pone las dos exports que faltan.

**Por qué las dos funciones entran en un solo ciclo TDD y no se parten.** Son una sola conducta —el
calendario de una compra en cuotas— expresada en dos exports del mismo componente de `design.md`.
`calcularMesesDeImputacion` es una repetición de `sumarMeses` sobre el resultado de `mesDe`: partirla
dejaría a la segunda mitad sin ningún test que pueda fallar por sí solo, que es exactamente la
condición que obliga a fusionar. Un test que falla, la implementación mínima que lo hace pasar, y
`npm run typecheck && npm test`.

**Importa el tipo `Mes` de T12; no lo vuelve a declarar.** `Mes` es el alias de `string` con formato
`AAAA-MM` que T12 dejó declarado junto a `mesDe`. Acá se importa de ahí y se usa como tipo de entrada y
de salida de `sumarMeses` y como elemento del arreglo de `calcularMesesDeImputacion`. Dos alias `Mes`
en el árbol no rompen el `typecheck` —son estructuralmente idénticos— pero abren la puerta a que uno de
los dos cambie de formato sin que nada lo señale, así que la unicidad del alias es un criterio de esta
tarea y no un detalle de estilo.

**Este ciclo no importa el mecanismo de zona horaria, y esa es la mitad del contrato que falta
escribir.** `design.md` fija que "la única conversión de zona horaria ocurre en `mesDe`, una sola vez".
T12 escribió la primera mitad —es ahí donde ocurre—; T13 escribe la segunda —no ocurre en ningún otro
lado—. `sumarMeses` no tiene puerta abierta: recibe y devuelve cadenas. `calcularMesesDeImputacion`
**sí la tiene**, porque recibe un `Date`, y es el único punto de todo el plan donde podría abrirse un
segundo punto de conversión. Su única lectura de ese `Date` debe ser la llamada a `mesDe`; todo lo
demás —las N menos una sumas— ocurre sobre la cadena. Un import del paquete de zona horaria que eligió
T7, un `Intl.DateTimeFormat`, un `getMonth()` o cualquier aritmética sobre `Date` en cualquiera de los
dos archivos es la falla que esta tarea existe para impedir.

**Los bugs que estos tests existen para atrapar.** Son tres y ninguno se solapa con los otros. El
primero: una implementación que incremente el número de mes sin reacomodar el año produce `'2026-13'`
hacia adelante, el simétrico exacto del `'2027-00'` que T12 atrapa hacia atrás; las aserciones que no
cruzan diciembre lo dejan pasar entero. El segundo: un desborde que se arregle restando doce una sola
vez funciona para una compra en 6 cuotas y se rompe en una de 12 o 18, que son las que el banco ofrece
de verdad. El tercero: una segunda conversión de zona horaria —o ninguna, leyendo el mes en UTC— corre
**el arreglo completo** un mes, y el error se manifiesta como un total mensual corrido que ninguna
pantalla señala.

**El test compara contra cadenas literales, no contra `mesDe`.** Escribir la expectativa como
`mesDe(instante)` haría que un bug en `mesDe` apareciera en los dos lados de la aserción y se cancelara
solo. Los meses esperados van escritos a mano en el test, igual que hizo T12 con sus instantes.

**Tampoco depende de los fixtures.** Sus entradas son un `Date`, una cadena y un entero: no lee HTML, no
invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del
repositorio. Depende solo de T12, de donde vienen `Mes` y `mesDe`; T1 —andamiaje, ubicación de tests,
contrato de verificación— y T7 —el mecanismo de zona horaria— entran por transitividad a través de T12 y
**no se reinstalan acá**. Puede ejecutarse con el bloqueo de fixtures todavía abierto.

**Lo que T13 no hace.** No convierte zonas horarias: eso es `mesDe` en T12, una sola vez. No valida la
cantidad de cuotas —T9 fijó que el criterio 3.7 se evalúa como primera sentencia de `normalizarAviso`,
antes de cualquier aritmética, así que una guarda defensiva acá crearía un segundo camino de rechazo sin
criterio que lo respalde— y por lo tanto asume `cuotas ≥ 1`. No reparte montos: eso es `dividirEnCuotas`
en T11, y esta función no recibe ningún monto. No define comportamiento para una `cantidad` negativa en
`sumarMeses`, porque `calcularMesesDeImputacion` solo le pasa valores de `0` a `cuotas − 1`. Y no
escribe ninguna imputación: que se persistan N filas es de T36.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.2 — `calcularMesesDeImputacion(new Date('2026-08-24T14:14:00.000Z'), 6)` devuelve exactamente
  `['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01']`. La aserción es sobre el arreglo
  completo y en orden, no sobre su primer y último elemento: es lo que fija que la posición N menos uno
  es la imputación número N. El instante es el mismo que T7 produce para `('24/08/2026', '11:14')` y del
  que T12 asserta `'2026-08'`, y el caso es el cruce de año que `design.md` nombra en su estrategia de
  testing (`2026-08` + 5 = `2027-01`).
- 8.2 — El primer elemento no tiene corrimiento: `sumarMeses('2026-08', 0)` devuelve `'2026-08'`. Sumar
  N menos uno con N igual a 1 es sumar cero, y una implementación que sume N en vez de N menos uno
  produce un arreglo entero corrido un mes hacia adelante que las aserciones sobre la longitud y sobre
  el cruce de año no distinguen.
- 8.5 — `calcularMesesDeImputacion(fechaGasto, 1)` devuelve un arreglo de un único mes, y la firma
  `(fechaGasto: Date, cuotas: number)` no recibe el tipo de tarjeta ni nada derivado de él. Un débito
  —que T3 registra como una cuota por no traer la fila `Cuotas`, criterio 2.5— y un crédito con
  `Cuotas: 1` llegan acá con argumentos idénticos, así que no pueden divergir ni con un condicional
  futuro: no hay dato sobre el cual ramificar. La otra mitad de 8.5 —que de ahí salga una sola fila en
  `imputaciones`— se verifica en T36.
- 8.4, cruce de año hacia adelante — `sumarMeses('2026-12', 1)` devuelve `'2027-01'`. Es una rama de
  falla propia y simétrica al `'2027-00'` que atrapa T12 hacia atrás: una implementación que incremente
  el número de mes sin reacomodar el año devuelve `'2026-13'`, que ninguna aserción dentro del mismo año
  detecta.
- 8.4, salto de más de doce meses — `sumarMeses('2026-08', 12)` devuelve `'2027-08'` y
  `sumarMeses('2026-08', 17)` devuelve `'2028-01'`. Un cruce de año simple lo resuelve un ajuste que
  reste doce una sola vez, que se rompe en cuanto la compra es de 12 o 18 cuotas —las que el banco
  ofrece— o cruza dos años. Es el caso que obliga a que la aritmética sea sobre el índice absoluto de
  mes y no sobre un parche.
- 8.4, formato — el valor devuelto conserva los siete caracteres y el mes a dos dígitos que fijó T12:
  `sumarMeses('2026-09', 1)` devuelve `'2026-10'` y `sumarMeses('2026-12', 1)` devuelve `'2027-01'`,
  nunca `'2027-1'`. No es cosmético: la columna `imputaciones.mes` es `char(7)` y el orden alfabético de
  la cadena tiene que seguir coincidiendo con el cronológico para que el dashboard agrupe y ordene por
  ella.
- 8.4, la conversión ocurre una sola vez —criterio conductual—:
  `calcularMesesDeImputacion(new Date('2026-02-01T02:50:00.000Z'), 2)` devuelve `['2026-01', '2026-02']`.
  Ese instante cae en **febrero** en UTC y en **enero** en la zona de referencia: es el mismo que T12 usa
  para el consumo del 31/01 a las 23:50. Si `calcularMesesDeImputacion` leyera el mes por su cuenta —en
  UTC o en la hora local del proceso— o aplicara una segunda conversión sobre el resultado, el arreglo
  entero saldría corrido a `['2026-02', '2026-03']`. Es la prueba de que la única lectura del `Date` es
  la que delega en `mesDe` (verificado en T13).
- 8.4 — Todos los casos que parten de un `Date` dan idéntico resultado con la variable `TZ` del runner
  puesta en un valor distinto de la zona de referencia, según la condición que fijó T7 y reutilizó T12.
  Sin esto el criterio anterior no verifica nada: una lectura ingenua en hora local del proceso pasa en
  la máquina de desarrollo y falla en CI.
- El tipo `Mes` se **importa** del archivo donde lo declaró T12; este ciclo no lo redeclara. `sumarMeses`
  no recibe ni devuelve un `Date`, y el único `Date` del componente es el parámetro de entrada de
  `calcularMesesDeImputacion`. Esa parte la sostiene el `typecheck`, no una aserción.
- Este ciclo **no incorpora ninguna dependencia nueva y no importa el mecanismo de zona horaria** que
  eligió y registró T7. Un import de ese paquete, un `Intl.DateTimeFormat`, un `getMonth()` o cualquier
  aritmética sobre `Date` en los archivos de `sumarMeses` o `calcularMesesDeImputacion` es una falla del
  criterio, no un detalle de implementación: es el segundo punto de conversión que `design.md` prohíbe.
- Verificación: `npm run typecheck && npm test` en verde, respetando la convención de ubicación de tests
  que fijó T1.

**Decision log:**

- Ubicación: `dominio/imputacion/sumarMeses.ts` y `dominio/imputacion/calcularMesesDeImputacion.ts`,
  cada una con su `.test.ts` colocado, importando `Mes` desde `mesDe.ts` (T12) sin redeclararlo.
- Aritmética de `sumarMeses`: sobre el **índice absoluto de mes** (`anio * 12 + (mes - 1) + cantidad`),
  no sobre un ajuste que reste 12 una sola vez — es justo lo que exige el caso de 17 cuotas cruzando dos
  años.
- `calcularMesesDeImputacion` no importa ningún mecanismo de zona horaria: su único contacto con el
  `Date` de entrada es la llamada a `mesDe(fechaGasto)`; el resto del arreglo se construye con
  `sumarMeses` sobre esa cadena.

**Outcome:**

`sumarMeses` y `calcularMesesDeImputacion` implementadas en sus archivos propios dentro de
`dominio/imputacion/`. Ciclo TDD único (las dos funciones, un solo ciclo según indica la tarea): RED (8
tests entre ambos archivos sobre módulos inexistentes), GREEN (`npm run typecheck && npm test` verdes,
40/40 acumulados), mutación (se reemplazó la aritmética de índice absoluto de `sumarMeses` por un ajuste
que resta 12 una sola vez cuando el mes resultante supera 11 — el bug descrito en la tarea, que funciona
para un cruce de año simple y se rompe con más de 12 meses de salto; falló exactamente el test de
`sumarMeses("2026-08", 17)` con el resultado corrupto `'2027-13'`, mientras los otros 7 tests —incluidos
los 3 de `calcularMesesDeImputacion`, que no llegan a pasar cantidades mayores a 5— siguieron en verde),
restaurada con Edit y reverificado verde. Sin desviaciones del diseño.

## T14 — `categorizarPorReglas`: coincidencia por contención y ausencia de coincidencia

**Requisitos:** 5.1, 5.2, 5.4, 5.7
**Depende de:** T1

**Descripción:**

`dominio/categorizacion`: el tipo `Categoria` con exactamente `Salidas`, `Comida`, `Extras` y
`Sin categorizar`; la constante `CATEGORIAS_INFERIBLES` con las tres categorías ofrecibles; el tipo
`Regla`; y `categorizarPorReglas(comercio, reglas)` en su forma base. Devuelve la `Regla` que coincide
—no la categoría, para que el llamador registre la trazabilidad— o nulo cuando ninguna coincide. Sin
IA en la firma ni en el cuerpo.

La función vive en su propio archivo dentro de `dominio/categorizacion/`, siguiendo la convención de un
archivo por función que estrenó T6. Los tipos `Categoria` y `Regla` y la constante
`CATEGORIAS_INFERIBLES` se declaran junto a ella, igual que T12 declaró el tipo `Mes` junto a `mesDe`;
T15, T17, T33 y T34 los importan de ahí y no los redeclaran.

**Qué significa "coincide" es el contrato de esta tarea, no un detalle de implementación (Req. 5.7).**
`design.md` fija que la coincidencia es por **contención sobre texto normalizado**: una regla coincide
cuando su patrón normalizado está contenido en el comercio normalizado, y normalizar es pasar a
mayúsculas, quitar acentos y colapsar espacios consecutivos. No es igualdad —el aviso trae
`COTO SUCURSAL 0142` y el patrón sembrado es `COTO SUCURSAL`— y la contención tiene una dirección: el
patrón dentro del comercio, nunca al revés. Sin esta mitad del contrato, los criterios 5.2 y 5.4 no
verifican nada: una implementación por igualdad estricta los satisface a los dos y falla contra todos
los avisos reales.

**Por qué 5.7 entra acá y no en T15.** 5.7 define el predicado de coincidencia; T15 define el **orden**
en que se evalúan las reglas que ya se sabe coincidir —prioridad, inactivas, desempate—. Son dos
conductas separables y cada una puede fallar sin la otra, así que siguen siendo dos ciclos. Pero el
predicado no es separable de "coincide / no coincide", que es exactamente lo que T14 verifica: partirlo
dejaría a T14 sin ninguna aserción capaz de distinguir la implementación correcta de la trivial.

**El patrón se compara como texto literal, nunca como expresión regular.** Los patrones los escribe el
usuario desde la bandeja (Req. 7.6): una regex mal formada rompería la categorización de **todos** los
gastos siguientes, no solo la del comercio que la originó. Los metacaracteres —`*`, `(`, `[`, `.`— son
caracteres del comercio como cualquier otro; `PAY*AR*UBER` es una cadena, no un patrón de tres partes.

**`SUBE` es el patrón más corto y el de mayor riesgo de falso positivo por contención**, según
`design.md`. Esta tarea no lo mitiga con una regla especial —eso reintroduciría el caso particular que
el diseño evita—, pero sí fija la dirección de la contención, que es el bug que convertiría ese riesgo
en una falla masiva: un `includes` bidireccional haría que el comercio `SUBE` coincidiera con cualquier
patrón que lo contenga.

**No depende de los fixtures.** Sus entradas son una cadena y un arreglo de `Regla` construido en el
test: no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Puede ejecutarse con ese bloqueo todavía abierto.

**Lo que T14 no hace.** No ordena ni filtra: prioridad, reglas inactivas y desempate determinista son
T15, y el arreglo de reglas de estos tests se construye para que a lo sumo una coincida. No siembra
reglas: el conjunto de comercios conocidos del diseño es el criterio 5.8 y se carga en la migración,
no acá; los patrones que usan estos tests son literales del test. No asigna la categoría al gasto ni
registra el origen `regla` ni marca el gasto confirmado: eso es 5.3, en el step de T33. No llama al
modelo ni lo conoce: derivar a inferencia cuando esta función devuelve nulo es decisión del
orquestador (Req. 6.2, T33).

**Criterios de aceptación (trazados desde requirements.md):**

- 5.1 — `CATEGORIAS_INFERIBLES` es exactamente `['Salidas', 'Comida', 'Extras']`, con la aserción sobre
  el arreglo completo y en orden —la convención que fijó T11—, no sobre su longitud ni sobre la
  pertenencia de cada elemento por separado. `Sin categorizar` pertenece al tipo `Categoria` pero **no**
  a `CATEGORIAS_INFERIBLES`: es el destino de falla de la inferencia, no una opción ofrecible. Que el
  tipo tenga esos cuatro valores y ninguno más lo sostiene el `typecheck`, no una aserción.
- 5.2 — Con un conjunto de reglas activas, el comercio `WWWAYSACOMAR` devuelve **la regla** cuyo patrón
  coincide, y la aserción es sobre la regla —su `id`— y no sobre su `categoria`: el llamador de T33
  necesita saber cuál coincidió para registrar la trazabilidad, y una implementación que devuelva la
  categoría pasa una aserción escrita sobre `Comida` y deja a T33 sin dato. Es el paso 4 del escenario A
  de `design.md`.
- 5.7, contención — el comercio `COTO SUCURSAL 0142` coincide con la regla de patrón `COTO SUCURSAL`.
  Una implementación por igualdad estricta pasa el criterio anterior y falla acá; es el caso que separa
  el contrato real del trivial, y el que hace que los patrones sembrados sobrevivan al número de
  sucursal que agrega el banco.
- 5.7, dirección de la contención — el comercio `SUBE` contra una regla de patrón `SUBE CARGA VIRTUAL`
  devuelve nulo. El patrón va contenido en el comercio y no al revés; un `includes` invertido o
  bidireccional pasa los dos criterios anteriores y rompe acá, y sobre el patrón más corto del conjunto
  sembrado convertiría el riesgo de falso positivo que `design.md` acepta en una falla generalizada.
- 5.7, mayúsculas — el comercio `Coto Sucursal 0142` coincide con la regla de patrón `coto sucursal`.
  Se normalizan **los dos lados**: el patrón lo tipea el usuario desde la bandeja (Req. 7.6) con el
  capitalizado que se le ocurra, y una implementación que solo normalice el comercio pasa este caso
  escrito en un solo sentido y falla en el otro, así que la aserción cubre las dos direcciones.
- 5.7, acentos — el comercio `PANADERÍA Y CONFITERÍA LA NUEVA` coincide con la regla de patrón
  `PANADERIA Y CONFITERIA`, y el comercio `PANADERIA Y CONFITERIA LA NUEVA` coincide con el patrón
  `Panadería y Confitería`. La eliminación de acentos es un eje propio: un `toUpperCase()` solo pasa el
  criterio anterior y falla este entero.
- 5.7, espacios colapsados — el comercio `RES   SOLDADO` (con espacios consecutivos, como los deja el
  banco) coincide con la regla de patrón `RES SOLDADO`. Tercer eje independiente, con su propia
  aserción por la misma razón: cada eje de normalización tiene que poder fallar solo.
- 5.7, el patrón es texto literal y no una expresión regular — el comercio `PAY*AR*UBER 1234` coincide
  con la regla de patrón `PAY*AR*UBER`, mientras que el comercio `PAYXARYUBER` **no** coincide con ella:
  los asteriscos son caracteres, no comodines. Y una regla cuyo patrón sea sintácticamente inválido como
  regex —`FARMACITY (`— no lanza: devuelve nulo si no está contenida literalmente y la evaluación del
  resto del arreglo sigue su curso, de modo que una regla mal escrita no puede tumbar la categorización
  de los gastos siguientes.
- 5.4 — Un comercio que ninguna regla activa cubre —`SUPERMERCADO DIA 4412` contra un arreglo cuyas
  reglas son `COTO SUCURSAL` y `SUBE`— devuelve **nulo**, que es la señal de derivar a inferencia. Nulo,
  no `Sin categorizar`: esa categoría es el destino de falla del paso de IA (T34, T35), y devolverla acá
  haría que el orquestador de T33 diera el gasto por categorizado y nunca llamara al modelo.
- Este ciclo **no incorpora ninguna dependencia nueva**: opera sobre cadenas y sobre un arreglo de
  `Regla` construido en el propio test. La normalización se resuelve con la biblioteca estándar del
  lenguaje; si se usara una función auxiliar, vive en el mismo archivo y no se exporta ni se testea
  aparte, porque toda su conducta es observable a través de `categorizarPorReglas`.
- Verificación: `npm run typecheck && npm test` en verde, respetando la convención de ubicación de tests
  que fijó T1.

**Decision log:**

- Ubicación: `dominio/categorizacion/categorizarPorReglas.ts` + `.test.ts` colocado; ahí se declaran
  también `Categoria`, `CATEGORIAS_INFERIBLES` y `Regla`, siguiendo la convención de T12.
- Normalización: `toUpperCase()` → `normalize('NFD')` (descompone letra acentuada en letra base + marca
  diacrítica combinante) → `replace` del rango Unicode `̀-ͯ` (marcas diacríticas) → colapso de
  espacios con `replace(/\s+/g, ' ')` → `trim()`. Cuatro pasos independientes, cada uno con su propio
  test que lo puede hacer fallar solo (mayúsculas, acentos, espacios).
- Coincidencia: `String.prototype.includes` sobre los dos textos ya normalizados — nunca `RegExp`, así
  que un patrón con metacaracteres nunca lanza y nunca se interpreta como comodín.
- T14 implementa la versión mínima que T15 va a extender: recorre el arreglo en orden y devuelve la
  primera regla cuyo patrón está contenido, sin filtrar `activa` ni ordenar por `prioridad` — los tests
  de T14 solo construyen arreglos donde a lo sumo una regla coincide, tal como fija la tarea.

**Outcome:**

`categorizarPorReglas`, `Categoria`, `CATEGORIAS_INFERIBLES` y `Regla` implementados en
`dominio/categorizacion/categorizarPorReglas.ts`. Ciclo TDD completo: RED (10 tests sobre módulo
inexistente), GREEN (`npm run typecheck && npm test` verdes, 50/50 acumulados), mutación (se quitó el
paso `normalize('NFD')` + remoción de marcas diacríticas de la función de normalización — dejando pasar
solo mayúsculas y colapso de espacios; falló exactamente el test "normaliza acentos en los dos lados",
los otros 9 —incluidos mayúsculas y espacios colapsados, los otros dos ejes de normalización—
siguieron en verde, confirmando que cada eje tiene su propio test capaz de fallar solo), restaurada con
Edit y reverificado verde. Sin desviaciones del diseño.

## T15 — `categorizarPorReglas`: prioridad, reglas inactivas y determinismo

**Requisitos:** 5.2, 5.5, 5.6
**Depende de:** T14

**Descripción:**

Completar `categorizarPorReglas` con su **política de selección**: de todas las reglas que coinciden con
el comercio, cuál gana. T14 fijó el predicado de coincidencia (Req. 5.7) sobre arreglos construidos para
que a lo sumo una regla coincidiera; T15 levanta esa restricción y define qué ocurre cuando coinciden
varias, cuando la que coincide está inactiva, y cuando dos empatan en prioridad.

Son tres reglas aplicadas en este orden: **descartar las inactivas antes de comparar**, quedarse con la
de **mayor `prioridad`** entre las que coinciden, y ante empate **desempatar por `id`**. Es lo que fija
`design.md`: "Filtra las inactivas y ordena por prioridad descendente (Req. 5.6); ante empate de
prioridad, desempata por `id` para que 5.5 se cumpla sin ambigüedad".

**Por qué 5.2 se agrega acá y no queda solo en T14.** El criterio 5.2 dice evaluar las reglas
**activas** contra el texto del comercio **en orden de prioridad descendente**: sus dos calificativos
son exactamente el alcance de esta tarea, y T14 los excluyó de forma explícita del suyo. Trazado solo a
T14, medio criterio quedaba sin ningún test que lo verificara. T14 conserva la traza por la otra mitad
—evaluar las reglas contra el texto del comercio—; 5.2 queda cubierto por las dos tareas juntas.

**Por qué las tres conductas son un solo ciclo y no tres tareas.** No son tres comportamientos
independientes: son una sola decisión —cuál regla gana— que se implementa como una sola expresión de
selección sobre el arreglo. Cada una por separado es de una línea y no puede fallar de forma
significativa sola: un ciclo cuya única aserción fuera "la regla inactiva no se aplica" se satisface con
un `filter` que ninguna otra tarea vuelve a mirar. Y además se interfieren: el caso que de verdad
discrimina la implementación correcta es una regla **inactiva de mayor prioridad** compitiendo con una
activa de menor, y ese caso no existe dentro de ninguna de las tres por separado.

**Prioridad descendente significa que el número mayor gana.** El schema pone `prioridad int NOT NULL
DEFAULT 0` y la semilla de comercios conocidos (Req. 5.8, T17) se carga entera con `prioridad = 0`, de
modo que la regla más específica que el usuario agregue después la vence con un número mayor —es la
mitigación que `design.md` prescribe para el falso positivo de `SUBE`. Un comparador invertido es un bug
silencioso: no lanza, no rompe el `typecheck`, y elige la regla equivocada únicamente cuando dos
coinciden a la vez, que es el caso raro que nadie mira a ojo.

**El desempate por `id` necesita una dirección, y esta tarea la fija.** `design.md` manda desempatar por
`id` pero no dice hacia dónde, porque para 5.5 cualquier dirección estable sirve. Esta tarea fija que
gana el **`id` menor**, comparado como cadena, y lo registra en el Decision log. Lo que importa no es
cuál se elija sino que sea una, explícita y testeada: un desempate implícito —"la primera que aparezca
en el arreglo"— cumple 5.5 solo mientras el repositorio devuelva las filas siempre en el mismo orden, y
un `SELECT` sin `ORDER BY` no lo garantiza.

**Determinismo acá es independencia del orden de entrada, no repetibilidad.** Invocar dos veces con el
mismo arreglo devuelve lo mismo incluso en una implementación que desempata por posición, así que esa
aserción no distingue nada. La que verifica 5.5 pasa el **mismo conjunto** de reglas en distinto orden y
exige el mismo resultado.

**La función no debe mutar el arreglo que recibe.** `Array.prototype.sort` reordena in situ el arreglo
del llamador. En T33 ese arreglo son las reglas leídas del repositorio, que el step puede reutilizar; un
efecto de ese tipo no aparece en ninguna aserción escrita sobre el valor devuelto, y contradice que esta
sea una función pura del dominio. Se ordena sobre una copia, y hay una aserción que lo fija.

**No cambia la firma ni agrega archivos.** Sigue siendo `(comercio: string, reglas: readonly Regla[]) =>
Regla | null` y sigue viviendo en el mismo archivo de `dominio/categorizacion/` que estrenó T14, con su
mismo archivo de test. El `readonly` del parámetro que fija `design.md` es coherente con la ausencia de
mutación, pero no la garantiza en tiempo de ejecución: el `typecheck` no ve un `sort` sobre una copia mal
hecha.

**No depende de los fixtures.** Sus entradas son una cadena y un arreglo de `Regla` construido en el
test: no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Puede ejecutarse con ese bloqueo todavía abierto.

**Lo que T15 no hace.** No toca el predicado de coincidencia: normalización, contención y dirección son
5.7 y quedaron cerrados en T14. No siembra reglas: el conjunto de comercios conocidos es 5.8 y se carga
en la migración de T17. No ordena en SQL: la función recibe el arreglo tal como venga y la garantía es
suya, no de la consulta —un `ORDER BY` en el repositorio sería una segunda fuente de la misma regla, y
la que se rompe en silencio es siempre la que ningún test mira. No asigna la categoría al gasto, no
registra el origen `regla` ni lo marca confirmado: eso es 5.3, en el step de T33. No decide qué hacer
cuando devuelve nulo: derivar a inferencia es del orquestador (Req. 6.2, T33).

**Criterios de aceptación (trazados desde requirements.md):**

- 5.6 — Dos reglas activas que coinciden con el mismo comercio, con `prioridad` 10 y 0, devuelven la de
  `prioridad` 10. La aserción es sobre el `id` de la regla devuelta, siguiendo la convención de T14, y
  se repite con el arreglo en el orden inverso: fija que gana el número **mayor** y no la posición.
- 5.6, la prioridad solo ordena entre las que coinciden — una regla activa de `prioridad` 99 cuyo patrón
  **no** está contenido en el comercio no se devuelve; gana la de `prioridad` 0 que sí coincide. Separa
  "ordenar y devolver la primera" de "ordenar y devolver la primera que coincide", que es la diferencia
  entre categorizar bien y categorizar todo con la regla de mayor prioridad del sistema.
- 5.2, reglas inactivas — una regla cuyo patrón coincide pero con `activa` en falso, sola en el arreglo,
  devuelve **nulo**: el gasto se deriva a inferencia como si esa regla no existiera. Es lo que hace que
  desactivar una regla desde la bandeja tenga efecto sin borrar la fila.
- 5.2, filtrar precede a ordenar — una regla inactiva de `prioridad` 10 y una activa de `prioridad` 0,
  ambas coincidentes, devuelven la **activa**. Una implementación que ordena primero, toma la primera
  coincidente y recién ahí mira `activa` devuelve nulo acá y pasa los dos criterios anteriores: es el
  único caso del ciclo que la detecta, y el motivo por el que las tres conductas viven en una sola tarea.
- 5.5, desempate por `id` — dos reglas activas que coinciden, con la misma `prioridad` e `id` distinto,
  devuelven siempre la de `id` menor, con la aserción repetida sobre las dos permutaciones del arreglo.
  Es el caso que separa el desempate explícito del implícito por posición, y el que vuelve indiferente el
  orden en que el repositorio entregue las filas.
- 5.5, independencia del orden de entrada — un conjunto de tres reglas coincidentes con `prioridad` e
  `id` mezclados devuelve la misma regla para **todas** las permutaciones del arreglo, recorridas en el
  test. La aserción es sobre las seis, no sobre dos elegidas: con tres elementos, una comparación
  incompleta puede dar el resultado correcto en la mitad de los órdenes.
- 5.5, sin mutación de la entrada — después de invocar `categorizarPorReglas`, el arreglo pasado conserva
  su orden original, verificado por la secuencia de `id`. Sin esta aserción, un `sort` in situ pasa todo
  el resto del ciclo y le reordena las reglas al llamador de T33.
- Los casos de T14 siguen pasando sin modificación: sobre un arreglo donde a lo sumo una regla coincide,
  la política de selección no puede cambiar el resultado. Es la red que impide que este ciclo se
  implemente reescribiendo el predicado de coincidencia.
- Este ciclo **no incorpora ninguna dependencia nueva** ni un archivo nuevo: extiende la función y el
  archivo de test que creó T14, con reglas construidas dentro del propio test.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

- Sin archivo nuevo: extiende `categorizarPorReglas.ts` y su `.test.ts`, como fija la tarea.
- Implementación: `Array.filter` (activa + coincide) sobre una copia lógica —`filter` ya devuelve un
  arreglo nuevo—, seguido de `[...coincidentes].sort(...)` con un comparador de dos claves (prioridad
  descendente, luego `id` ascendente como cadena). El `sort` opera sobre el resultado de `filter`, que ya
  es una copia, así que el arreglo `reglas` que pasó el llamador nunca se toca.
- Dirección del desempate por `id`: **gana el `id` menor**, comparado como cadena con `<`/`>` (orden
  lexicográfico). Se registra acá porque `design.md` no fija la dirección, solo exige que sea explícita
  y estable.
- **Hallazgo durante la implementación — `npm test` era intermitente en este entorno Windows.** El pool
  multi-proceso por defecto de Vitest (`tinypool`/`ProcessWorker`) falló dos veces seguidas con
  `spawn UNKNOWN` al intentar levantar varios workers, sin relación con el código de esta tarea.
  Diagnosticado ejecutando `npx vitest run --pool=forks --poolOptions.forks.singleFork=true`, que corrió
  limpio. Se fijó esa configuración en `vitest.config.ts` (`pool: 'forks'`, `singleFork: true`) para que
  el contrato `npm test` del proyecto sea reproducible; la suite es dominio puro sin red ni base de datos,
  así que un único fork no cuesta paralelismo real todavía. Si aparecen tests de integración con Postgres
  (T16 en adelante) que se beneficien de paralelismo, revisar esta decisión ahí.

**Outcome:**

`categorizarPorReglas` completada con su política de selección (filtrar → ordenar por prioridad →
desempatar por `id`) en el mismo archivo que creó T14. Ciclo TDD completo: RED (7 tests nuevos agregados
al archivo de T14; contra la implementación mínima de T14, fallaron los 5 que dependen de prioridad,
filtrado de inactivas o desempate — confirmado antes de implementar), GREEN (`npm run typecheck && npm
test` verdes, 57/57 acumulados, incluidos los 10 tests de T14 sin modificación), mutación (se invirtió el
comparador de prioridad de `b.prioridad - a.prioridad` a `a.prioridad - b.prioridad` — gana el número
menor en vez del mayor; fallaron exactamente los 2 tests que dependen de qué prioridad gana —el de dos
reglas y el de las seis permutaciones de tres—, mientras los otros 15, incluidos el de empate por `id` y
el de no-mutación, siguieron en verde porque no dependen de la dirección de esa comparación), restaurada
con Edit y reverificado verde. Desviación registrada: se ajustó `vitest.config.ts` (pool de tests) para
resolver una falla intermitente del entorno, no una falla del diseño ni del código de esta tarea.

## T16 — Base de datos, migración de `emails_crudos` y `guardarSiEsNuevo`

**Requisitos:** 1.1, 1.2, 1.3
**Depende de:** T1

**Descripción:**

Primer contacto del proyecto con Postgres. Incluye el **andamiaje de base** —cliente de conexión,
herramienta de migraciones, base de test descartable y la forma de correr los tests que la necesitan—
fusionado con el primer test que lo ejercita, por el mismo motivo que T1: un andamiaje sin un test que
falle no es un ciclo TDD. T1 excluyó Postgres de forma explícita y lo dejó reservado para esta tarea.

**Las convenciones de base que T16 fija las heredan otras veinte tareas.** T17 a T23 y T29 a T40 escriben
migraciones o tests contra la base sin volver a decidir nada de esto, así que las elecciones se registran
en el Decision log de T16, que es el único lugar donde quedan documentadas: el cliente de Postgres, la
herramienta de migraciones y dónde viven sus archivos, cómo se declara la URL de conexión, cómo se crea y
se deja limpia la base de test entre tests, y si los tests que necesitan Postgres corren dentro de
`npm test` o en un script propio. Esa última decisión no es cosmética: define qué significa "verificación
en verde" para las veinte tareas siguientes, y una respuesta implícita —"algunos tests requieren una base
que a veces está levantada"— convierte el contrato de verificación en algo que pasa por omisión.

**La migración crea el tipo `estado_email` y la tabla `emails_crudos`, y nada más.** `emails_crudos` con
las columnas que fija el modelo de datos del diseño —`gmail_message_id text NOT NULL UNIQUE`,
`remitente`, `asunto`, `headers_crudos text NOT NULL`, `cuerpo`, `recibido_en`, `estado` con default
`pendiente` y `procesado_en`—. `headers_crudos` guarda el bloque de headers crudo y completo, que es lo
que hace verificable el "con headers y cuerpo" del criterio 1.1: `remitente`, `asunto` y `recibido_en`
siguen siendo columnas propias porque se consultan, pero son proyecciones del bloque, no un reemplazo
suyo. Cada migración crea los tipos enumerados de sus propias tablas: `origen_categoria` con `reglas_categoria`
en T17, y `estado_gasto` y `tipo_tarjeta` con `gastos` en T18. Que T16 declarara `estado_gasto` dejaba un
tipo que ningún test de esta tarea puede ejercitar —no hay tabla que lo use hasta T18— y lo duplicaba con
la migración de T18, que ya lo reclama.

**`MensajeCrudo` se define acá.** `design.md` lo usa en tres firmas —`traerMensajeCrudo` de `ClienteGmail`,
`guardarSiEsNuevo` y `traerCrudo` de `RepositorioEmails`— pero nunca declara su forma. T16 es la primera
tarea del orden que lo necesita, así que lo define, derivado de las columnas de `emails_crudos`:
`gmailMessageId`, `remitente`, `asunto`, `headersCrudos`, `cuerpo` y `recibidoEn`. `headersCrudos` es el
bloque de headers crudo tal como lo entrega Gmail, sin parsear: es el campo que hace que un `MensajeCrudo`
sea efectivamente el email completo y no un extracto suyo, y sin él ni T24 ni T29 tienen de dónde sacar lo
que 1.1 manda persistir. T21 (`traerCrudo`) y T24 (`traerMensajeCrudo`) lo consumen sin redefinirlo; si a
alguna le falta un campo, lo ensancha como T4 ensanchó `DatosAviso`, no lo declara de nuevo.

**`guardarSiEsNuevo` conserva la firma del diseño:** `(mensaje: MensajeCrudo) => Promise<{ id: string;
yaExistia: boolean }>`. El detalle que decide si el pipeline es idempotente de verdad es **qué `id`
devuelve cuando el mensaje ya estaba**: tiene que ser el de la fila existente. T29 usa ese `id` para
buscar o crear el gasto del email, así que un `id` nuevo o nulo en el camino del duplicado rompe 1.3 río
abajo sin romper ninguna aserción de esta tarea, salvo que se escriba la aserción.

**La restricción de unicidad y el método son un solo ciclo.** No son dos comportamientos independientes:
el `UNIQUE` es el mecanismo con el que el método cumple 1.3 — la tabla de manejo de errores del diseño lo
dice así, "el `UNIQUE` lo detecta; el paso termina sin crear nada". Partirlos deja una tarea cuya única
aserción es que la base rechaza un insert duplicado, satisfecha por una línea de DDL que ninguna otra
tarea vuelve a mirar, y una segunda que tendría que volver a crearla para poder correr.

**La idempotencia se apoya en la base, no en leer antes de escribir.** Un `SELECT` seguido de un `INSERT`
deja una ventana entre los dos: con Inngest reintentando el step de ingesta, dos ejecuciones del mismo
paso pueden solaparse y ninguna de las dos ve la fila de la otra. La implementación se apoya en la
restricción —`ON CONFLICT` sobre `gmail_message_id`, o capturar la violación— y cuál de las dos se eligió
va al Decision log. Es lo que hace real 1.3 y lo que T37 verifica después de punta a punta.

**No depende de los fixtures.** Los `MensajeCrudo` de las aserciones se construyen dentro del test: T16 no
lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del
repositorio. Puede ejecutarse con ese bloqueo todavía abierto. Sí requiere un Postgres alcanzable, que es
la precondición nueva que esta tarea introduce en el entorno.

**Qué mitad de 1.1 verifica T16.** El criterio 1.1 manda dos cosas: persistir el email crudo **completo,
con headers y cuerpo**, y hacerlo **antes de ejecutar cualquier otro paso**. La segunda mitad es un
ordenamiento del step de ingesta y queda en T29, que es donde hay un pipeline cuyo orden se pueda observar.
La primera es una propiedad de la tabla y del método que la escribe, y solo se puede asertar acá: T16 es
quien crea `headers_crudos` y quien releé la fila para comparar. Por eso esta tarea traza a 1.1 además de
a 1.2 y 1.3. La cobertura de 1.1 en T24 y T39 es sobre el mensaje en tránsito —que Gmail lo entregue
entero, que el cron lo emita—, no sobre lo que queda guardado; sin la aserción de T16, "completo" no lo
comprueba nadie contra la base.

**Lo que T16 no hace.** No crea `categorias`, `reglas_categoria`, `gastos`, `imputaciones` ni la vista
mensual: cada una entra con la tarea que la ejercita (T17, T18, T19, T20). No implementa `marcarDescartado`
ni `traerCrudo`, que son T21, ni ejercita las transiciones de `estado_email` más allá del valor por
defecto. No habla con Gmail: de dónde sale un `MensajeCrudo` es T24. No decide cuándo se llama al método
ni qué se hace con `yaExistia`: eso es el step de ingesta, T29.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.2 — Un `INSERT` directo que repite un `gmail_message_id` ya presente en `emails_crudos` viola la
  restricción de unicidad de la tabla. La aserción es sobre la base y no sobre el repositorio: fija que la
  garantía vive en el schema y sobrevive a cualquier reescritura del método.
- 1.3 — Una segunda llamada a `guardarSiEsNuevo` con el mismo `gmailMessageId` devuelve `yaExistia` en
  verdadero y deja la tabla con **una** fila. El segundo `MensajeCrudo` se construye con `asunto`,
  `headersCrudos` y `cuerpo` **distintos** a los del primero, y la fila releída conserva los tres valores
  originales: sin esa diferencia, un `UPSERT` que pisa la fila pasa la aserción de conteo y contradice que
  el email crudo se conserve intacto (Req. 1.6).
- 1.3 — El `id` devuelto por la segunda llamada es exactamente el mismo que devolvió la primera. Es la
  aserción que hace utilizable el camino del duplicado: T29 resuelve el gasto del email a partir de ese
  `id`.
- 1.3 — La primera llamada devuelve `yaExistia` en falso y persiste la fila con `estado` en `pendiente` y
  `procesado_en` en nulo, que son los valores por defecto del schema. Distingue "no existía" de "existía" y
  fija el estado inicial del que parten T21 y T29.
- 1.1 — `headersCrudos` y `cuerpo` releídos de la base son **byte a byte** idénticos a los del
  `MensajeCrudo` de entrada. El caso de prueba usa un bloque de headers y un cuerpo que contienen
  caracteres no ASCII (acentos y el signo `$`), comillas simples y dobles, y saltos de línea —incluidos
  los de plegado de headers, la línea en blanco que separa headers de cuerpo y un `=` de
  `quoted-printable`—, que es la forma real en que llega el aviso. La comparación es de igualdad exacta
  sobre la cadena entera, no de contención ni sobre una versión recortada: es la aserción que descarta
  normalizaciones silenciosas de la capa de base —recorte de espacios finales, colapso de `CRLF` a `LF`,
  reencodeo de la cadena— y la que hace verificable el "completo, con headers y cuerpo" de 1.1.
- Fidelidad de las columnas consultables — `remitente`, `asunto` y `recibidoEn` releídos coinciden con los
  de entrada, `recibidoEn` conservando el instante exacto. Son proyecciones del bloque de headers y se
  asertan aparte porque de ellas dependen las consultas de T21 y T40, no la reprocesabilidad.
- Andamiaje — las migraciones corren desde cero contra una base vacía y dejan `emails_crudos` y el tipo
  `estado_email` con la forma del modelo de datos del diseño; volver a correrlas no falla ni duplica
  objetos. Es la aserción que convierte el andamiaje en algo verificado y no en configuración que existe
  porque un test la usó de costado.
- Este ciclo estrena el cliente de Postgres y la herramienta de migraciones como dependencias del proyecto,
  siguiendo la regla que fijó T1: cada dependencia externa entra en la tarea que la ejercita con un test
  propio.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable. Si los tests que
  necesitan la base quedan en un script aparte, ese script pasa a integrar el contrato de verificación de
  todas las tareas que tocan la base, y el Decision log lo deja escrito.

**Decision log:**

- **Desviación de entorno registrada, no una decisión de diseño libre.** El entorno de esta corrida
  (Windows, sin repo git, sesión sin privilegios de administrador) no tiene un Postgres alcanzable:
  `docker ps` reporta el daemon de Docker Desktop detenido y `Start-Service com.docker.service` falla
  por falta de permisos; no hay `psql` ni servicio de Postgres instalado. Verificado antes de decidir,
  no asumido.
- **Cliente de conexión: `pg` (node-postgres)**, como dependencia de producción. Es el driver que usan
  los repositorios de `infra/db/` en cualquier entorno, incluido contra Supabase en producción — nada en
  el código de los repositorios sabe que existe una alternativa de test.
- **Base de test descartable: `@electric-sql/pglite` + `@electric-sql/pglite-socket`, no un Postgres de
  red.** `PGlite` es el motor de Postgres compilado a WASM —el mismo código fuente, no una reescritura ni
  una emulación— y `pglite-socket` lo expone por el protocolo de wire real de Postgres sobre un socket
  TCP local. Eso permite que los tests se conecten con el mismo `pg.Pool` que usa la aplicación, sin
  ningún adaptador ni interfaz paralela: la "base de test descartable" que pide esta tarea se crea y se
  destruye en proceso, sin Docker, sin permisos elevados y sin estado que sobreviva entre corridas.
  Verificado con una prueba de humo antes de comprometerse: tipos `ENUM`, `gen_random_uuid()`,
  `numeric(14,2)` y una restricción `UNIQUE` violada correctamente, los cuatro a través del driver `pg`
  estándar. Esto **no es un mock ni un stub de la base**: es Postgres real corriendo en el mismo proceso
  de Node en vez de en una red, elegido exclusivamente porque el entorno no tiene Docker disponible.
  **Queda explícitamente escalado al usuario** si el criterio del proyecto de "Postgres real" para tests
  de integración exige en cambio un servidor de red (Docker/Supabase local) — este Decision log es el
  único lugar donde la decisión queda registrada y es reversible sin tocar los repositorios, que solo ven
  un `pg.Pool`.
- **Herramienta de migraciones: runner propio, sin dependencia externa** (`infra/db/migrar.ts`). Archivos
  `.sql` numerados en `infra/db/migraciones/`, aplicados en orden alfabético dentro de una transacción
  cada uno, con bookkeeping en `_migraciones_aplicadas (nombre PK)`. Elegido en vez de una herramienta
  como `node-pg-migrate` o `Prisma Migrate` porque el proyecto no tiene ORM y las 52 tareas no lo piden:
  un runner de ~40 líneas sobre `pg` alcanza y no introduce una segunda forma de declarar el schema
  aparte del SQL de `design.md`.
- **Los tests que necesitan la base corren dentro de `npm test`, no en un script aparte.** Es la
  consecuencia directa de elegir PGlite: al no depender de un servicio externo que "a veces está
  levantado", un archivo `*.test.ts` colocado junto al repositorio (misma convención de T1) puede crear
  su propia base con `beforeAll`, correr las migraciones y destruirla con `afterAll`, sin coordinación
  externa. El contrato de verificación del proyecto (`npm run typecheck && npm test`) queda sin excepción
  para T17–T23 y T29–T40.
- **Idempotencia de `guardarSiEsNuevo`:** una sola sentencia con `INSERT ... ON CONFLICT (gmail_message_id)
  DO NOTHING` dentro de un CTE, seguida de un `SELECT` de la fila existente cuando el `INSERT` no insertó
  nada, unidos con `UNION ALL` en la misma consulta — no un `SELECT` seguido de un `INSERT` separado, que
  abriría la ventana de carrera entre reintentos solapados de Inngest que el criterio 1.3 prohíbe.
- **Hallazgo de infraestructura durante la implementación:** `PGLiteSocketServer` fija
  `net.Server.maxConnections` con su opción `maxConnections` (default 1). Node **destruye** —no encola—
  cualquier socket entrante que exceda ese número, lo que el cliente ve como `ECONNRESET`; un `pg.Pool`
  puede abrir una conexión de reemplazo durante su propia rotación interna antes de liberar la anterior,
  así que dejarlo en 1 no da margen y producía una falla reproducible (no intermitente) en la segunda
  query de cada archivo de test. Se subió a `maxConnections: 5` en el servidor, manteniendo `pool.max: 1`
  del lado del cliente (PGlite sigue siendo de un solo escritor). Diagnosticado corriendo el mismo archivo
  de test tres veces seguidas antes y después del cambio.
- `MensajeCrudo` declarado en `infra/db/repositorioEmails.ts`, con los seis campos que fija el modelo de
  datos: `gmailMessageId`, `remitente`, `asunto`, `headersCrudos`, `cuerpo`, `recibidoEn`.

**Outcome:**

Andamiaje de base creado: `infra/db/migrar.ts` (runner de migraciones), `infra/db/migraciones/
0001_emails_crudos.sql`, `infra/db/testUtils/basePostgresDeTest.ts` (base de test descartable sobre
PGlite). `RepositorioEmails.guardarSiEsNuevo` y `MensajeCrudo` implementados en
`infra/db/repositorioEmails.ts`. Dos ciclos TDD (andamiaje de migraciones + repositorio, cada uno con su
propio archivo de test): RED confirmado en ambos (módulos inexistentes), GREEN (`npm run typecheck && npm
test` verdes, 64/64 acumulados, 7 tests nuevos de base de datos), mutación del repositorio (se cambió
`ON CONFLICT DO NOTHING` por `ON CONFLICT DO UPDATE SET asunto = EXCLUDED.asunto` — el email crudo
duplicado pisa el original; falló exactamente el test que verifica que la segunda llamada no duplica ni
pisa la fila —`yaExistia` volvió `false` en vez de `true`—, mientras los otros 4, incluido el de
unicidad a nivel de schema y el de fidelidad byte a byte, siguieron en verde), restaurada con Edit y
reverificado verde. **Desviación de entorno registrada arriba**: base de test sobre PGlite en vez de un
Postgres de red, por ausencia de Docker/Postgres alcanzable en este entorno — escalada al usuario, no
decidida en silencio.

## T17 — Migración de `categorias` y `reglas_categoria` con la semilla de categorías y de comercios conocidos

**Requisitos:** 5.1, 5.8
**Depende de:** T14, T16

**Descripción:**

Los **datos de referencia de la categorización**, en una sola migración: el tipo enumerado
`origen_categoria`, las tablas `categorias` y `reglas_categoria` con la forma que fija el modelo de datos
del diseño, y el estado inicial de las dos —las cuatro categorías con su color estable y las diez reglas
de comercios conocidos—. Es lo que existe en la base recién instalada, antes de que entre el primer
email.

**El tipo `origen_categoria` lo crea esta migración**, con `regla`, `ia` y `usuario`. T16 fijó la regla de
que cada migración crea los tipos enumerados de sus propias tablas y nombró a T17 como dueña de este:
`reglas_categoria.creada_por` es su primer uso, y declararlo antes dejaba un tipo que ningún test podía
ejercitar.

**La semilla de reglas es la lista del diseño, literal** (Req. 5.8, sección "Reglas semilla — comercios
conocidos"). Diez filas, todas con `creada_por = 'usuario'`, `activa = true` y `prioridad = 0`:

| Patrón de comercio | Categoría |
|---|---|
| `MERPAGO*LAFRUTAALEGRE` | Comida |
| `SUPER CORAZON` | Comida |
| `COTO SUCURSAL` | Comida |
| `RES SOLDADO` | Comida |
| `PANADERIA Y CONFITERIA` | Comida |
| `SUBE` | Salidas |
| `PAY*AR*UBER` | Salidas |
| `MISTER PEDRO` | Salidas |
| `HAVANNA` | Salidas |
| `FARMACITY` | Extras |

**Los patrones se guardan ya normalizados, y eso es una precondición del contrato de T14, no un detalle
de tipeo.** T14 fijó que la coincidencia es por contención sobre texto normalizado —mayúsculas, sin
acentos, espacios colapsados— y normaliza los dos lados, así que un patrón sembrado en minúscula o con
acento igual coincidiría. Pero se guarda normalizado igual, por dos motivos que sí se rompen: es lo que
prescribe el diseño para las filas de la migración, y es lo que hace que `COTO SUCURSAL` cubra
`COTO SUCURSAL 0142` sin una fila por sucursal. La aserción que lo protege no puede importar un
normalizador —T14 decidió no exportarlo—, así que se hace donde importa: pasando las reglas releídas de
la base por `categorizarPorReglas`.

**`prioridad = 0` en toda la semilla no es un default perezoso.** Es la mitigación que `design.md`
prescribe para `SUBE`, el patrón más corto y el de mayor riesgo de falso positivo por contención: si
aparece un comercio que lo contiene, se corrige con una regla más específica de prioridad mayor, no con
un deploy. Eso solo funciona si la semilla entera arranca en el piso, que es el supuesto sobre el que
T15 construyó el orden descendente de prioridad y el desempate por `id`. Una semilla con prioridades
dispares obligaría a adivinar contra qué número compite una regla nueva.

**La semilla de reglas no incluye `Sin categorizar`.** No es una categoría que una regla pueda asignar:
es el destino de una inferencia que no llegó a una respuesta (T34, T35). La tabla `categorias` sí la
tiene como fila, porque `gastos.categoria_id` la referencia; el conjunto de las diez reglas se reparte
solo entre `Salidas`, `Comida` y `Extras`.

**Por qué las dos semillas y el schema son un solo ciclo.** No son componentes con conducta
independiente: son un único artefacto —la migración de los datos de referencia— y un único
comportamiento observable, el estado de la base recién instalada. Están acopladas por la clave foránea:
`reglas_categoria.categoria_id` referencia `categorias(id)`, así que sembrar las reglas exige resolver
los nombres de categoría a los `id` que la misma migración acaba de crear, y una tarea que sembrara
reglas sin la semilla de categorías no tendría contra qué insertar. Partirla dejaría una segunda tarea
cuya implementación son diez `INSERT` en una migración que la primera ya escribió. El volumen tampoco lo
justifica: T17 no agrega una sola línea de código de aplicación —es DDL, filas y aserciones de lectura—,
y es estrictamente más chica que T16, que fusionó el andamiaje entero de la base con un método de
repositorio.

**No depende de los fixtures.** No lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos
anonimizados que siguen ausentes del repositorio: sus entradas son la migración y cadenas literales del
test. Puede ejecutarse con ese bloqueo todavía abierto. Sí requiere un Postgres alcanzable y el
andamiaje de base que fijó T16.

**Lo que T17 no hace.** No crea ni consulta `gastos` (T18), `imputaciones` (T19) ni la vista mensual
(T20). No implementa ningún repositorio: `asignarCategoria` es T22 y la creación de reglas desde la
bandeja es T51 —esta tarea escribe reglas por migración, no por API—. No reimplementa ni reordena la
selección de reglas: el predicado de coincidencia es T14 y la política de prioridad, inactivas y
desempate es T15; acá `categorizarPorReglas` se usa como función ya verificada para comprobar que lo
sembrado sirve. No categoriza ningún gasto ni registra el origen `regla`: eso es 5.3, en T33.

**Criterios de aceptación (trazados desde requirements.md):**

- 5.1 — Tras correr las migraciones, `categorias` contiene exactamente cuatro filas: `Salidas`, `Comida`,
  `Extras` y `Sin categorizar`. La aserción es sobre el conjunto completo de nombres, no sobre el conteo
  ni sobre la presencia de cada uno por separado, siguiendo la convención que fijó T11: es lo que
  detecta una quinta categoría de más.
- 5.1 — Cada una de las cuatro tiene un `color` no vacío. El color es estable —la misma categoría
  conserva el suyo entre corridas—, que es lo que hace legible el gráfico de T42 sin que la paleta
  dependa del orden de inserción.
- 5.8 — `reglas_categoria` contiene exactamente las diez filas de la tabla de arriba, y la aserción es
  sobre el conjunto completo de pares patrón/nombre de categoría, con el `JOIN` a `categorias`
  resuelto. Comparar el conjunto entero y no fila por fila es lo que detecta a la vez un patrón faltante,
  uno de más y un `categoria_id` apuntado a la categoría equivocada — que es el error silencioso de esta
  tarea: una semilla con `HAVANNA` en `Comida` pasa cualquier aserción de conteo.
- 5.8 — Las diez filas tienen `creada_por = 'usuario'` y `activa = true`. Son los dos calificativos
  explícitos del criterio: `activa` porque una regla inactiva la salta el filtro de T15 y la semilla no
  categorizaría nada, y `creada_por` porque es lo que distingue una regla de instalación de una que
  nació de una confirmación del usuario en la bandeja (T51).
- 5.8 — Las diez filas tienen `prioridad = 0`. Se aserta explícitamente y no se deja al `DEFAULT 0` del
  schema: es el supuesto sobre el que T15 apoyó la mitigación de `SUBE` —una regla más específica gana
  con un número mayor— y una semilla que arrancara en cualquier otro número la rompe sin romper ninguna
  otra aserción.
- 5.8, la semilla sirve de verdad — las reglas releídas de la base, mapeadas a `Regla` con su categoría
  resuelta por el `JOIN`, se pasan a `categorizarPorReglas` y clasifican comercios con la forma en que
  los escribe el banco: `COTO SUCURSAL 0142` devuelve la regla de `COTO SUCURSAL` con categoría `Comida`,
  y `FARMACITY 0333` la de `FARMACITY` con `Extras`. Es la aserción que separa una semilla real de una
  decorativa: comprueba que los patrones están guardados en la forma normalizada que la contención
  espera y que el `categoria_id` resuelve al nombre correcto, dos cosas que ninguna aserción de igualdad
  sobre la tabla sola puede distinguir de un valor plausible pero inservible.
- 5.8, ningún patrón sembrado está contenido en otro — se verifica sobre el conjunto de los diez. Es el
  supuesto que `design.md` escribe para aceptar `SUBE`: "se acepta porque ningún otro comercio de la
  lista lo contiene". Si dejara de valer, dos reglas empatadas en `prioridad = 0` coincidirían con el
  mismo comercio y la ganadora la decidiría el desempate por `id` de T15 —determinista, pero arbitrario y
  silencioso—, así que la propiedad se asegura acá, en la tarea que es dueña de la lista, y no río abajo.
- Andamiaje — las migraciones corren desde cero contra una base vacía y dejan el tipo `origen_categoria`
  con exactamente `regla`, `ia` y `usuario`, y las tablas `categorias` y `reglas_categoria` con la forma
  del modelo de datos del diseño, incluyendo la clave foránea de `categoria_id`, el `UNIQUE` de
  `categorias.nombre` y los defaults de `prioridad`, `activa` y `creada_en`. Volver a correrlas no falla
  ni duplica filas: la semilla es idempotente, no se acumula. Es la condición para que la base de test
  se reconstruya en cada corrida de las veinte tareas que vienen.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres y la herramienta de
  migraciones que estrenó T16, y `categorizarPorReglas` y el tipo `Categoria` de T14, importados de
  `dominio/categorizacion/` sin redeclararlos.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que el
  Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

- Migración `infra/db/migraciones/0002_categorias_y_reglas.sql`: DDL de `origen_categoria`, `categorias`,
  `reglas_categoria`, seguido de dos `INSERT`: las cuatro categorías con color literal, y las diez reglas
  vía `INSERT ... SELECT ... FROM (VALUES ...) AS semilla JOIN categorias` — resuelve `categoria_id` por
  nombre en la misma sentencia, en vez de subconsultas por fila, para que agregar una fila a la lista sea
  agregar una tupla al `VALUES`.
  - Colores elegidos (estables, sin significado más allá de distinguir la categoría en el gráfico de T42):
    Salidas `#f59e0b`, Comida `#10b981`, Extras `#8b5cf6`, Sin categorizar `#6b7280`.
- Test: `infra/db/migracionCategoriasYReglas.test.ts`, colocado junto a la migración (no hay archivo de
  repositorio nuevo en esta tarea, así que no hay un `.ts` de implementación al lado — la migración
  misma es la implementación, como fija la tarea). Reutiliza `crearBasePostgresDeTest` y
  `aplicarMigraciones` de T16 sin modificarlos.
- La aserción de "la semilla sirve de verdad" reconstruye `Regla[]` leyendo `reglas_categoria` con el
  `JOIN` a `categorias` y pasa el resultado a `categorizarPorReglas` (T14) tal cual, sin normalizar de
  nuevo del lado del test: es lo que prueba que los patrones ya están guardados en la forma que la
  contención espera.

**Outcome:**

Migración `infra/db/migraciones/0002_categorias_y_reglas.sql` con el DDL de `categorias` y
`reglas_categoria` y la semilla completa (4 categorías, 10 reglas). Ciclo TDD completo: RED confirmado
moviendo el archivo de migración fuera de `migraciones/` temporalmente y corriendo el test —los 7 casos
fallaron con `relation "categorias"/"reglas_categoria" does not exist`—, restaurado el archivo, GREEN
(`npm run typecheck && npm test` verdes, 71/71 acumulados), mutación (se cambió la categoría de la fila
semilla de `HAVANNA` de `'Salidas'` a `'Comida'` en el `VALUES` de la migración — el error silencioso
que describe la tarea, un `categoria_id` apuntado a la categoría equivocada; falló exactamente el test
que compara el conjunto completo de pares patrón/categoría, mostrando el diff exacto —`HAVANNA` con
`Comida` en vez de `Salidas`—, mientras los otros 6, incluido el que ejercita `categorizarPorReglas`
sobre `COTO SUCURSAL` y `FARMACITY` —que no tocan `HAVANNA`—, siguieron en verde), restaurada con Edit y
reverificado verde. Sin desviaciones del diseño.

## T18 — Migración de `gastos` y `RepositorioGastos.crear`

**Requisitos:** 2.12, 3.2, 3.5, 3.7, 10.5
**Depende de:** T8, T16, T17

**Descripción:**

La **compra como hecho único**, en la base: la migración de la tabla `gastos` con la forma que fija el
modelo de datos del diseño —`monto_total` en `numeric(14,2)`, `email_id` único con clave foránea a
`emails_crudos`, `categoria_id` referenciando `categorias`, las columnas de datos nullables y las
restricciones `monto_positivo` y `cuotas_validas`—, más `RepositorioGastos.crear`, que persiste un
`GastoNormalizado` y devuelve el `Gasto` resultante.

**Esta migración crea los dos tipos enumerados de `gastos`: `estado_gasto` y `tipo_tarjeta`.** T16 fijó
la regla de que cada migración declara los tipos de sus propias tablas y nombró a T18 como dueña de los
dos: `gastos.estado` y `gastos.tipo_tarjeta` son su primer y único uso en todo el schema, y declararlos
antes dejaba tipos que ningún test podía ejercitar. `estado_gasto` lleva `pendiente`, `extraido`,
`categorizado`, `imputado` y `needs_review` (Req. 10.5); `tipo_tarjeta`, `debito` y `credito`.

**Las dos enumeraciones se asertan cerradas, y por motivos distintos.** La de `estado_gasto` es el
criterio 10.5 escrito casi literalmente y traza a él. La de `tipo_tarjeta` no tiene un criterio propio
—2.7 y 2.8 fijan las grafías `debito` y `credito` del lado del parser, y los verifica T4—, así que se
aserta como andamiaje, igual que T16 hizo con `estado_email` y T17 con `origen_categoria`. No se agrega
a la traza de 2.7 ni de 2.8: la cobertura de esos criterios ya es real en T4 y sumar T18 sería
decorativo. Pero la aserción sí hace falta acá: si la migración escribiera `débito` con acento o
`debit`, el `GastoNormalizado` que produce T8 no entraría en la tabla, y el fallo aparecería recién en
T30 como un error de inserción sin relación aparente con su causa.

**`crear` persiste el gasto en estado `extraido`, no en `pendiente`.** Es la decisión que esta tarea le
debe a T30, cuyo criterio de aceptación es exactamente que el gasto quede `extraido` después del step:
`crear` recibe un `GastoNormalizado` —un aviso ya parseado, normalizado y validado—, y un gasto con
todos sus datos resueltos no está pendiente de extracción por definición. El diseño lo dice en el
escenario A del pipeline: "Se crea el gasto en estado `extraido`". El `DEFAULT 'pendiente'` de la
columna se conserva igual, porque es el estado de una fila creada sin datos normalizados, que es lo que
necesita el camino de `needs_review`; pero `crear` no lo usa. Si el default fuera el estado que deja
`crear`, T30 no tendría con qué método llevar el gasto a `extraido`: el diseño no expone ninguna
transición de estado genérica en `RepositorioGastos`.

**Las columnas de datos son nullables a propósito, y eso es el criterio 2.12 en el schema.** `design.md`
lo escribe como invariante: "preferimos una fila incompleta y visible antes que un valor inventado".
`monto_total`, `comercio`, `fecha_gasto`, `tipo_tarjeta`, `tarjeta_ultimos4` y `cuotas_total` no llevan
`NOT NULL` ni `DEFAULT`. Un `DEFAULT 0` en `monto_total` sería la forma exacta en que 2.12 se rompe sin
que ninguna otra aserción se entere: el gasto fallido entraría en los totales del mes valiendo cero en
vez de quedar afuera.

**Por qué `monto_positivo` y `cuotas_validas` toleran el nulo.** Las dos restricciones se escriben
`IS NULL OR ...`, tal como las declara el diseño. Es lo que hace compatibles 3.5 y 3.7 con 2.12: la base
rechaza un monto de cero o de menos y un número de cuotas menor a uno, pero acepta que no haya monto ni
cuotas. Sin esa mitad, un gasto en `needs_review` no podría persistirse y el sistema estaría obligado a
inventar un valor para poder guardar la fila.

**La migración y el método son un solo ciclo**, por el mismo motivo que en T16: no son comportamientos
independientes. `crear` no tiene contra qué correr sin la tabla, y las restricciones de la tabla son el
mecanismo con el que el método cumple 3.5 y 3.7. Partirlos dejaría una segunda tarea cuya
implementación es una función de inserción sobre un schema que la primera ya fijó.

**No depende de los fixtures.** Los `GastoNormalizado` de las aserciones se construyen en el test: T18
no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Puede ejecutarse con ese bloqueo todavía abierto. Sí requiere un Postgres
alcanzable y el andamiaje de base que fijó T16.

**Lo que T18 no hace.** No crea `imputaciones` (T19) ni la vista mensual (T20). De `RepositorioGastos`
implementa **solo** `crear`: `asignarCategoria` y `marcarParaRevision` son T22, y `confirmar` y
`pendientesDeConfirmacion` son T23. No ejercita las transiciones de estado más allá del que deja
`crear` —llevar un gasto a `categorizado`, `imputado` o `needs_review` es de las tareas que son dueñas
de esos pasos—. No decide cuándo se llama a `crear` ni de dónde sale el `GastoNormalizado`: eso es el
step extraer, T30.

**Criterios de aceptación (trazados desde requirements.md):**

- 3.2 — Un `monto_total` con decimales persistido con `crear` y releído devuelve el **mismo valor
  decimal exacto**, sin pérdida de precisión. El caso de prueba usa un monto cuya representación en
  punto flotante binario no es exacta —`2571.30` o similar— y la comparación es sobre el valor decimal,
  no sobre un número convertido: es la aserción que detecta que la capa de base esté haciendo pasar el
  monto por un `float` en el camino de ida o de vuelta, que es la única forma en que este criterio se
  rompe sin romper nada más.
- 3.5 — Un `INSERT` directo con `monto_total` en cero y otro con un valor negativo violan la restricción
  `monto_positivo`. La aserción es sobre la base y no sobre el repositorio: fija que la garantía vive en
  el schema y sobrevive a cualquier reescritura del método, siguiendo la convención de T16.
- 3.7 — Un `INSERT` directo con `cuotas_total` en cero y otro con un valor negativo violan la
  restricción `cuotas_validas`.
- 3.5, 3.7 — Un `INSERT` con `monto_total` y `cuotas_total` **en nulo** es aceptado por las dos
  restricciones. Es la mitad que hace convivir 3.5 y 3.7 con 2.12: sin ella, la forma más simple de
  pasar las dos aserciones anteriores es un `CHECK` sin el `IS NULL OR`, que bloquearía el camino de
  `needs_review` entero y solo fallaría en T32.
- 2.12 — Un gasto se persiste con `monto_total`, `comercio`, `fecha_gasto`, `tipo_tarjeta`,
  `tarjeta_ultimos4` y `cuotas_total` en nulo, y releído los seis siguen en nulo. La base **no completa
  ninguno** con cero, cadena vacía ni valor por defecto. Se aserta campo por campo sobre los seis: un
  `DEFAULT 0` en `monto_total` es el modo de falla concreto de este criterio y lo detecta esta aserción
  y ninguna otra de la tarea.
- 10.5 — El tipo `estado_gasto` acepta exactamente `pendiente`, `extraido`, `categorizado`, `imputado`
  y `needs_review`, y rechaza cualquier otro valor. La aserción es sobre el **conjunto completo** de
  etiquetas del tipo leído de la base, no sobre la presencia de cada una por separado, siguiendo la
  convención que fijó T11: es lo que detecta un sexto estado de más. Se agrega un `INSERT` con un estado
  fuera del conjunto que la base rechaza.
- `crear` deja el gasto en `extraido` — el `Gasto` devuelto y la fila releída tienen `estado` en
  `extraido`, no en `pendiente`. Es la precondición del criterio de aceptación de T30, y se aserta acá
  porque es donde está el método que lo decide.
- `crear` persiste el `GastoNormalizado` completo — el `Gasto` devuelto y la fila releída conservan
  `comercio`, `fecha_gasto` en el instante exacto, `tipo_tarjeta`, `tarjeta_ultimos4` y `cuotas_total`
  del objeto de entrada, y `moneda` en `ARS`. El `email_id` es el que se pasó como segundo argumento y
  el `id` devuelto es el de la fila creada.
- `email_id` es único — un segundo `crear` con el mismo `emailId` viola la restricción de unicidad de la
  columna. Es lo que fija que un email crudo produzca a lo sumo un gasto, y lo que hace verificable
  río abajo el "ni un nuevo gasto" del criterio 1.3, que T29 y T37 asertan a nivel de pipeline.
- Andamiaje — las migraciones corren desde cero contra una base vacía y dejan el tipo `tipo_tarjeta`
  con exactamente `debito` y `credito`, y la tabla `gastos` con la forma del modelo de datos del diseño:
  las claves foráneas a `emails_crudos(id)` y a `categorias(id)`, el `UNIQUE` de `email_id`, el
  `DEFAULT 'pendiente'` de `estado`, el `DEFAULT 'ARS'` de `moneda`, el `DEFAULT now()` de `creado_en` y
  el índice parcial sobre `estado` para `needs_review`. Volver a correrlas no falla ni duplica objetos.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres y la herramienta de
  migraciones que estrenó T16, y `GastoNormalizado`, `TipoTarjeta` y el tipo `Decimal` de la cadena de
  normalización, importados sin redeclararlos.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que
  el Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

`infra/db/migraciones/0004_gastos.sql` declara `estado_gasto` y `tipo_tarjeta` (primer y único uso en
todo el schema) y la tabla `gastos` con la forma literal del modelo de datos de `design.md`, incluidos
los dos índices parciales que ese mismo bloque define sobre `gastos` (`estado = 'needs_review'` y
`confirmado_en IS NULL`) — van en esta migración porque son índices de la tabla que T18 crea, no de
`imputaciones` (T19). `Gasto` no estaba declarado en ningún lado —igual que `TipoTarjeta` antes de T4—,
así que se define en `infra/db/repositorioGastos.ts`, derivado de las columnas de la tabla; T22 y T23 lo
importan sin redeclararlo. `OrigenCategoria` también se declara acá por la misma razón (el campo
`categoriaOrigen` de `Gasto` lo necesita), aunque `crear` no lo popula todavía. `RepositorioGastos.crear`
convierte `GastoNormalizado.montoTotal` (`Decimal`) a texto con `.toString()` para el parámetro de la
consulta (`pg` no serializa `Decimal` de `decimal.js` de forma nativa) y reconstruye un `Decimal` a
partir de la columna `numeric` releída, que `pg` devuelve como texto por defecto para no perder
precisión — la ida y la vuelta pasan por texto, nunca por `number`.

**Regresión detectada y corregida antes de cerrar el ciclo:** `gastos.email_id REFERENCES
emails_crudos(id)` rompió `TRUNCATE emails_crudos` (sin `CASCADE`) en tres `beforeEach`/`afterEach` de
tests preexistentes de T21 y T29 (`repositorioEmails.test.ts` dos veces, `procesarAviso.test.ts` una) —
Postgres rechaza truncar una tabla referenciada por una FK aunque la tabla referenciante esté vacía. Se
agregó `CASCADE` a los tres `TRUNCATE` con un comentario explicando el porqué; ninguno de esos tests
necesitaba conservar filas de `gastos` entre corridas.

**Outcome:**

RED confirmado: `repositorioGastos.test.ts` fallaba con "Failed to load url @/infra/db/repositorioGastos"
(módulo inexistente; la migración tampoco existía). GREEN: creados `infra/db/migraciones/0004_gastos.sql`
e `infra/db/repositorioGastos.ts`; primera corrida ya en verde (10/10) contra la base PGlite de T16.
Detecté y corregí la regresión de `TRUNCATE` descripta arriba; `npm run typecheck && npx vitest run` →
21 test files, 156/156 en verde. Mutación dirigida: en `crear` se cambió el estado insertado de
`'extraido'` a `'pendiente'`. Corrí la suite completa: falló exactamente el test "crear deja el gasto en
estado extraido, no en pendiente", con 155 tests restantes en verde. Restaurado con Edit. Verificación
final: `npm run typecheck && npx vitest run` → typecheck limpio, 21 test files, 156/156 en verde.

## T19 — Migración de `imputaciones` y `reemplazarPara` sin duplicados

**Requisitos:** 8.6
**Depende de:** T12, T18

**Descripción:**

El **impacto mensual como N hechos**, en la base: la migración de la tabla `imputaciones` con la forma
que fija el modelo de datos del diseño —`gasto_id` con clave foránea a `gastos` y `ON DELETE CASCADE`,
`numero_cuota` con el `CHECK` de mayor o igual a uno, `monto` en `numeric(14,2)`, `mes` en `char(7)`, el
`UNIQUE (gasto_id, numero_cuota)` y el índice por `mes`—, más
`RepositorioImputaciones.reemplazarPara`, que escribe el conjunto de imputaciones de un gasto de forma
que reejecutarlo no duplique filas.

**Esta migración no crea ningún tipo enumerado, y es la primera del schema que no lo hace.** Se deja
escrito para que nadie busque el enum faltante: `imputaciones` no tiene ninguna columna de dominio
cerrado —`mes` es la cadena `AAAA-MM` en `char(7)`, `numero_cuota` un entero y `monto` un `numeric`—,
así que la regla que fijó T16 —cada migración declara los tipos de sus propias tablas— se cumple de
forma vacía acá. Con `estado_email` (T16), `origen_categoria` (T17), `estado_gasto` y `tipo_tarjeta`
(T18) el modelo de datos ya no tiene más tipos enumerados por declarar.

**`NuevaImputacion` se define acá**, por el mismo motivo que T16 definió `MensajeCrudo`: `design.md` lo
usa en la firma de `reemplazarPara` pero nunca declara su forma, y esta es la primera tarea del orden
que lo necesita. Se deriva de las columnas: `numeroCuota: number`, `monto: Decimal` y `mes: Mes`. El
`gastoId` **no** forma parte del objeto porque es el primer argumento del método: un `gastoId` por
elemento habilitaría un arreglo que escribe en dos gastos distintos, que es justamente lo que "las
imputaciones de un gasto" excluye. `Mes` se importa de T12 —de ahí la dependencia— y `Decimal` de la
cadena de normalización, que llega por T18; ninguno se redeclara. T36 lo consume sin redefinirlo.

**Qué significa "reemplazar", y por qué la aserción de idempotencia sola no alcanza.** El criterio 8.6
está escrito como una prohibición —no crear un duplicado para la misma combinación de gasto y número de
cuota— y esa prohibición la satisfacen dos implementaciones muy distintas: un `DELETE` de las
imputaciones del gasto seguido del `INSERT` del arreglo nuevo, o un `INSERT ... ON CONFLICT DO UPDATE`
fila por fila. Llamar dos veces con **el mismo** arreglo no las distingue: las dos dejan las mismas
filas. La diferencia aparece cuando el arreglo nuevo es **más corto** que el anterior: el reemplazo
deja el conjunto exacto que recibió, el `UPSERT` deja además las cuotas sobrantes de la escritura
previa. Por eso el nombre del método en el diseño es `reemplazarPara` y no `guardar`, y por eso esta
tarea aserta el caso del arreglo más corto. El modo de falla es silencioso y caro: esas filas huérfanas
tienen `mes` y `monto` válidos, entran en la vista mensual de T20 y el dashboard muestra meses que ya no
existen, sin que ninguna otra aserción del plan las mire.

**La identidad de las filas no se aserta.** 8.6 prohíbe el duplicado, no manda conservar la fila: si la
implementación es `DELETE` más `INSERT`, el `id` de cada imputación cambia en cada llamada, y eso es
aceptable porque nadie lo referencia —la vista mensual une por `gasto_id` y agrupa por `mes`, y ninguna
tabla tiene una clave foránea hacia `imputaciones`—. Asertar la estabilidad del `id` le prohibiría al
ejecutor la implementación más simple sin ningún criterio que lo respalde. Cuál de las dos se eligió va
al Decision log, como en T16.

**El reemplazo es atómico o no es un reemplazo.** Un `DELETE` seguido de un `INSERT` que falla a la
mitad deja el gasto con cero imputaciones o con parte de ellas, y con Inngest reintentando el step
(T38) el estado final pasa a depender de en qué intento falló — exactamente lo que 8.6 y 8.7 prohíben.
Las dos sentencias van en una sola transacción, y hay una aserción que lo verifica.

**No calcula montos ni meses, y se mantiene independiente de T11 y T13.** `reemplazarPara` recibe el
arreglo ya resuelto y su contrato es escribirlo tal cual: no lee `gastos.monto_total` y no tiene con qué
comparar. La invariante de 8.3 —que la suma de las cuotas dé exactamente el total— la garantiza
`dividirEnCuotas` (T11) y se verifica sobre datos persistidos en T36. Lo que sí se aserta acá es la
**fidelidad decimal** del `monto`, por el mismo motivo que T18 la asertó sobre `monto_total`: es otra
columna y otro camino de escritura, y un `float` en el medio descuadraría la suma sin romper ninguna
aserción de T11, que es una función pura y nunca toca la base.

**Por qué no traza a 8.1.** El criterio 8.1 —"exactamente tantas imputaciones como cuotas tenga la
compra"— es una decisión de cardinalidad que este método no puede tomar ni verificar: recibe un arreglo
ya construido y no conoce el `cuotas_total` del gasto. Quien decide cuántos elementos tiene ese arreglo
es el step imputar (T36), a partir de `dividirEnCuotas` y `calcularMesesDeImputacion`, y ahí está la
cobertura real de 8.1. La aserción de que un arreglo de seis elementos deja seis filas sí se escribe
acá, pero como andamiaje —igual que T18 asertó `tipo_tarjeta` sin sumarse a la traza de 2.7—: verifica
que el método no pierde ni agrega filas, no que la cantidad sea la correcta. Sumar 8.1 a la traza de
T19 sería cobertura decorativa.

**No depende de los fixtures.** Los `NuevaImputacion` y los gastos de las aserciones se construyen en el
test: T19 no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que
siguen ausentes del repositorio. Puede ejecutarse con ese bloqueo todavía abierto. Sí requiere un
Postgres alcanzable y las convenciones de base que fijó T16.

**Lo que T19 no hace.** No crea la vista mensual ni implementa `totalesPorMesYCategoria`: eso es T20. No
decide cuándo se llama a `reemplazarPara`, de dónde sale el arreglo ni lleva el gasto a estado
`imputado` — todo eso es el step imputar, T36. No borra gastos: el `ON DELETE CASCADE` se aserta como
comportamiento del schema, pero ninguna operación del pipeline elimina un gasto.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.6 — Dos llamadas consecutivas a `reemplazarPara` con el mismo `gastoId` y el mismo arreglo dejan
  exactamente las mismas filas que la primera: misma cantidad, mismos `numero_cuota`, mismos montos y
  mismos meses. Una tercera llamada tampoco cambia nada — el estado final es función del último arreglo
  recibido y no de cuántas veces se ejecutó el método.
- 8.6 — Un segundo `reemplazarPara` con un arreglo **más corto** deja solo las filas del arreglo nuevo.
  Después de escribir seis imputaciones para un gasto, una segunda llamada con tres deja **tres** filas,
  las de las cuotas 1 a 3, y las cuotas 4, 5 y 6 ya no están en la tabla. Es la aserción que distingue
  el reemplazo de un `UPSERT`: un `INSERT ... ON CONFLICT DO UPDATE` pasa la aserción anterior y falla
  esta.
- 8.6 — Un `INSERT` directo que repite la combinación de `gasto_id` y `numero_cuota` viola la
  restricción de unicidad de la tabla. La aserción es sobre la base y no sobre el repositorio: fija que
  la garantía vive en el schema y sobrevive a cualquier reescritura del método, siguiendo la convención
  de T16 y T18.
- 8.6 — El reemplazo es atómico. `reemplazarPara` invocado con un arreglo que repite un `numero_cuota`
  **rechaza la llamada y deja intactas las filas de la escritura anterior**: no las borra y no escribe
  una parte del arreglo nuevo. Es el mismo vector que la aserción anterior —la violación del `UNIQUE`—
  pero visto desde el método, y es lo único que detecta un `DELETE` y un `INSERT` emitidos fuera de una
  transacción, que dejarían el gasto con cero imputaciones.
- Aislamiento entre gastos — `reemplazarPara` sobre un gasto deja intactas las imputaciones de otro
  gasto que ya las tenía. Es lo que impide que el `DELETE` del reemplazo se escriba sin el filtro por
  `gasto_id`: las aserciones anteriores operan sobre un solo gasto y ninguna puede ver ese error.
- Fidelidad decimal — un `monto` con decimales escrito con `reemplazarPara` y releído devuelve el
  **mismo valor decimal exacto**. El caso de prueba usa un monto cuya representación en punto flotante
  binario no es exacta —`428.55` o similar— y la comparación es sobre el valor decimal, no sobre un
  número convertido: es la aserción que detecta que la capa de base haga pasar el monto por un `float`
  en el camino de ida o de vuelta.
- Fidelidad del mes — el `mes` releído es igual a la cadena `AAAA-MM` de entrada, con comparación de
  igualdad exacta sobre la cadena entera. Un valor que vuelva como `'2026-08 '` con relleno de la
  columna de ancho fijo no pasa: T20 agrupa por esta columna y T13 la produce, así que un espacio de más
  parte el mes en dos filas del dashboard.
- Cardinalidad del arreglo (andamiaje) — un arreglo de seis elementos con `numero_cuota` de 1 a 6 deja
  seis filas y un arreglo de un solo elemento deja una. Verifica que el método escribe el arreglo entero
  y nada más; la cobertura de 8.1 es de T36, por lo dicho arriba.
- Andamiaje — las migraciones corren desde cero contra una base vacía y dejan `imputaciones` con la
  forma del modelo de datos del diseño: la clave foránea a `gastos(id)` con `ON DELETE CASCADE`, el
  `UNIQUE (gasto_id, numero_cuota)`, los `CHECK` de `numero_cuota >= 1` y `monto >= 0`, `mes` en
  `char(7) NOT NULL` y el índice sobre `mes`. Volver a correrlas no falla ni duplica objetos. El índice
  se verifica por **presencia en el catálogo**, no por rendimiento: existe porque la vista mensual de
  T20 agrupa por `mes`, y ninguna otra aserción de esta tarea lo obliga, así que sin esta línea se cae
  del plan sin que nada se entere.
- Andamiaje — borrar la fila de `gastos` elimina sus imputaciones y no falla por violación de clave
  foránea. Ningún criterio lo pide y ningún paso del pipeline borra gastos; se aserta acá porque esta es
  la única tarea que crea la restricción, y sin `ON DELETE CASCADE` la limpieza de la base entre tests
  que fijó T16 falla con un error de integridad en una tarea posterior, sin relación aparente con su
  causa.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres y la herramienta de
  migraciones que estrenó T16, el tipo `Mes` de T12 y el `Decimal` de la cadena de normalización,
  importados sin redeclararlos.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que
  el Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

`reemplazarPara` es `DELETE` seguido de `INSERT`, dentro de una única transacción tomada de `pool.connect()`
(mismo patrón que `aplicarMigraciones` de T16: `BEGIN`/`COMMIT`/`ROLLBACK` en `try`/`catch`/`finally` con
`cliente.release()`), no un `INSERT ... ON CONFLICT DO UPDATE`. La identidad de las filas no se conserva
a propósito. `NuevaImputacion` se declara en `infra/db/repositorioImputaciones.ts`, con `mes: Mes`
importado de T12 y `monto: Decimal` importado como tipo desde `decimal.js` (no se re-exporta un alias
propio).

**Outcome:**

RED confirmado por `tsc`: `Cannot find module '@/infra/db/repositorioImputaciones'` antes de escribir la
implementación. GREEN: creados `infra/db/migraciones/0005_imputaciones.sql` e
`infra/db/repositorioImputaciones.ts`; primera corrida en verde (11/11). `npm run typecheck && npx
vitest run` → 22 test files, 199/199 en verde. Mutación dirigida: se reemplazó `DELETE` + `INSERT` por
`INSERT ... ON CONFLICT (gasto_id, numero_cuota) DO UPDATE`. Corrí la suite completa: fallaron
exactamente los 2 tests que distinguen un reemplazo real de un `UPSERT` —el del arreglo más corto (dejó
6 filas en vez de 3) y el de atomicidad ante `numero_cuota` repetido dentro del mismo arreglo (el
`UPSERT` no rechaza la llamada, solo pisa la fila dos veces)—, con 197 tests restantes en verde.
Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run` → typecheck limpio, 22
test files, 199/199 en verde.

## T20 — `vista_gastos_mensuales` y `totalesPorMesYCategoria`

**Requisitos:** 9.1, 9.3, 9.5
**Depende de:** T12, T14, T17, T19

**Descripción:**

La **única lectura agregada del sistema**: la migración que crea la vista `vista_gastos_mensuales` con
la forma que fija el modelo de datos del diseño —`SUM(i.monto)` agrupado por `i.mes` y `c.nombre`,
`bool_or(g.confirmado_en IS NULL)` como marca de "tiene sin confirmar", `JOIN` a `gastos`, `LEFT JOIN` a
`categorias` y el filtro `g.estado <> 'needs_review'`—, más
`RepositorioImputaciones.totalesPorMesYCategoria`, que lee de la vista, la recorta a un rango de meses y
devuelve las filas ya resueltas.

**El dashboard nunca consulta `gastos`, y esta tarea es la que lo hace cierto.** El criterio 9.1 —"el
total de cada mes sumando imputaciones y nunca sumando gastos"— no es una preferencia de
implementación: `gastos.monto_total` de una compra en seis cuotas es seis veces lo que esa compra pesa
en el mes, así que sumar gastos no da un número aproximado, da un número que no significa nada. La
vista es el mecanismo que hace que la suma equivocada ni siquiera esté disponible aguas arriba: T43
recibe filas y no tiene con qué recalcularlas.

**`FilaDashboard` se define acá**, por el mismo motivo que T16 definió `MensajeCrudo` y T19
`NuevaImputacion`: `design.md` lo usa en la firma de `totalesPorMesYCategoria` pero nunca declara su
forma, y esta es la primera tarea del orden que lo necesita. Se deriva de las columnas de la vista:
`mes: Mes`, `categoria: Categoria`, `total: Decimal` y `tieneSinConfirmar: boolean`. `Mes` se importa de
T12 y `Categoria` de T14 —los dos llegan por la cadena de dependencias y ninguno se redeclara—. T42,
T43 y T44 lo consumen sin redefinirlo.

**Por qué `categoria` es `Categoria` y no `Categoria | null`, y qué se hace con el `LEFT JOIN`.** La
vista une `categorias` por la izquierda, así que en principio un gasto con `categoria_id` en `NULL`
produciría una fila con la categoría en `NULL`. Ese estado **no es alcanzable**, y la tarea lo aserta
como imposible en vez de inventarle una presentación. El argumento es de recorrido: una imputación solo
existe si la escribió el step imputar (T36), que corre **después** del step categorizar; y el step
categorizar asigna categoría en todos sus caminos —por regla (T33), por inferencia (T34) o
`Sin categorizar` cuando el modelo se abstiene, responde fuera del enum o falla (T35)—. El único camino
que sale de categorizar sin categoría es el agotamiento de reintentos, que lleva el gasto a
`needs_review` (10.2) y lo saca de la vista por el `WHERE`. Ninguna operación posterior devuelve la
columna a `NULL`: `asignarCategoria` (T22) y `confirmar` (T23) siempre escriben un valor, y la clave
foránea a `categorias` impide que la categoría desaparezca por debajo. Un gasto con imputaciones está
categorizado o está en `needs_review`; no hay tercera opción.

**Y sin embargo el `LEFT JOIN` se conserva, porque es lo que protege 9.1.** Cambiarlo por un `JOIN`
—tentador, dado que la columna nunca es nula— haría que un gasto sin categoría dejara de aportar su
monto al total del mes en lugar de aportarlo sin etiqueta. Es la peor de las dos fallas: la unión
interna descuenta plata en silencio y el mes cierra más bajo sin que nada lo indique. La unión por
izquierda preserva el monto pase lo que pase, y el problema queda reducido a una etiqueta faltante.

**Lo que no se hace es mapear ese `NULL` a `Sin categorizar`.** Es la salida cómoda y es incorrecta:
`Sin categorizar` **es** una fila real de `categorias` que T17 siembra, y es el destino explícito de una
inferencia que no llegó a una respuesta (6.4, 6.5, 6.7). Un gasto que la IA no supo categorizar tiene su
`categoria_id` apuntando a esa fila y es un estado normal del sistema que la bandeja resuelve (7.10). Un
gasto sin `categoria_id` es un gasto que nunca pasó por categorizar: un defecto del pipeline. Colapsar
los dos en la misma etiqueta haría que un bug de orquestación se presentara en el dashboard como una
fila perfectamente rutinaria, indistinguible de las decenas que la bandeja produce por diseño. Por eso
`totalesPorMesYCategoria` **rechaza** la fila con un error propio en vez de traducirla: valida la
categoría en el borde igual que `inferirCategoria` valida el enum del modelo aunque el schema ya lo
restrinja —"la restricción del schema es una ayuda, no una garantía"—. Un estado imposible que aparece
tiene que hacer ruido; si en cambio no aparece nunca, que es lo que este análisis sostiene, el camino
no se ejecuta jamás y no le cuesta nada a nadie.

**Por qué 4.3 ya no traza acá.** El bootstrap le había puesto a esta tarea el criterio 4.3 —"un email
`descartado` queda excluido de la cola de errores y de todo cálculo de gastos"— con la justificación de
que un email descartado no produce gasto ni imputaciones. Es cierto, y es exactamente por eso que la
aserción no es verificable en T20: sería una aserción sobre la **ausencia** de un dato que ninguna
operación de esta tarea crea. La vista no menciona `emails_crudos` y no tiene forma de llegar hasta él;
un test que insertara un email descartado y comprobara que los totales no se mueven pasaría con
cualquier implementación de la vista, incluso con una rota, porque el gasto que no existe no lo dejó de
crear la vista sino el step extraer. Es cobertura decorativa. La mitad "cola de errores" de 4.3 la
verifica T21, que consulta esa cola de verdad; la mitad "cálculo de gastos" la produce y la aserta T31,
cuando comprueba que el email queda `descartado` y que **no existe ningún gasto asociado**.

**9.5 se sostiene entero acá.** Con `/revision` fuera de alcance y T45 eliminada, esta es la única tarea
del plan que traza el criterio 9.5, así que su aserción no admite ser una comprobación de paso: es la
totalidad de la evidencia de que un gasto en `needs_review` no contamina un total. El caso de prueba
construye deliberadamente el estado incómodo —un gasto en `needs_review` que **sí tiene** imputaciones
escritas, que es lo que ocurre cuando el gasto se imputa y una ejecución posterior lo manda a revisión—
porque un gasto en `needs_review` sin imputaciones queda fuera del total por no tener filas, no por el
`WHERE`, y no distingue una vista correcta de una que perdió el filtro.

**La mitad de 9.3 que es de T20 es el dato, no el dibujo.** La vista expone `tiene_sin_confirmar` y,
sobre todo, **incluye** las imputaciones sin confirmar en el total: 9.3 pide las dos cosas y la primera
es la que se puede equivocar sin que se note, porque un total que excluye lo no confirmado sigue siendo
un número plausible. El indicador visual y su etiqueta de texto son T44. Nótese que la marca es
`bool_or` sobre el grupo entero, no una propiedad de cada gasto: un mes y una categoría con nueve gastos
confirmados y uno sin confirmar tiene la marca en verdadero. Es deliberado —la barra completa queda
señalada— y es la clase de agregación que se implementa al revés sin que ningún otro test lo note.

**Fidelidad decimal, otra vez y por un camino nuevo.** T18 la asertó sobre `monto_total` y T19 sobre
`imputaciones.monto`; acá el valor pasa además por un `SUM` y por la deserialización de la vista, que es
donde el cliente de Postgres entrega los `numeric` como cadena y una conversión descuidada a `Number`
los redondea. Un total de dashboard que difiere en centavos del monto de la compra es el síntoma más
difícil de rastrear que puede producir este sistema, y ninguna aserción de T18 o T19 lo alcanza.

**No depende de los fixtures.** Los gastos e imputaciones de las aserciones se construyen en el test:
T20 no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen
ausentes del repositorio. Puede ejecutarse con ese bloqueo todavía abierto. Sí requiere un Postgres
alcanzable y las convenciones de base que fijó T16.

**Lo que T20 no hace.** No dibuja nada: la ruta `/dashboard` y su contenedor son T43, el componente del
gráfico es T42 y el indicador de "sin confirmar" es T44. No decide qué rango de meses pide el dashboard;
recibe `desde` y `hasta` como argumentos. No escribe imputaciones —eso es `reemplazarPara` (T19),
invocado por el step imputar (T36)— y no toca el estado de ningún gasto. No propaga una corrección de
categoría a las imputaciones (9.4, T50): la vista lee `gastos.categoria_id` en cada consulta, así que el
cambio se refleja solo, pero asertarlo es de T50.

**Criterios de aceptación (trazados desde requirements.md):**

- 9.1 — El total de un mes es la suma de los montos de las **imputaciones** de ese mes. Un gasto de
  `$6.000,00` en 6 cuotas aporta `$1.000,00` a cada uno de los seis meses, y **ningún mes muestra
  `$6.000,00`**: la segunda mitad de la aserción es la que falla si la implementación sumó
  `gastos.monto_total`, porque la primera la pasa igual cuando la compra es de una sola cuota.
- 9.1 — Dos gastos distintos del mismo mes y la misma categoría producen **una sola fila** con la suma
  de ambos, no dos filas. Es lo que verifica que el `GROUP BY` agrupa por lo que dice agrupar.
- 9.1 — Un mismo mes con gastos de categorías distintas produce **una fila por categoría**, y la suma
  de esas filas es el total del mes. La desagregación por categoría es lo que consume T42.
- 9.1 — La suma de los totales de todos los meses de un gasto en cuotas es **exactamente** igual a su
  `monto_total`. Cierra el circuito con el invariante de 8.3 sobre datos ya persistidos y agregados:
  `dividirEnCuotas` (T11) lo garantiza en memoria y esta aserción confirma que la ida a la base y la
  agregación no lo rompieron.
- 9.3 — Un grupo de mes y categoría con al menos un gasto de origen `ia` y `confirmado_en` en `NULL`
  **incluye sus imputaciones en el total** y devuelve `tieneSinConfirmar` en verdadero. Las dos mitades
  se asertan juntas: el total del grupo es la suma de los confirmados **más** los no confirmados.
- 9.3 — La marca es `bool_or` y no `bool_and`: un grupo con un gasto confirmado y uno sin confirmar
  devuelve `tieneSinConfirmar` en verdadero. Un grupo donde **todos** los gastos tienen `confirmado_en`
  con valor lo devuelve en falso. Sin el segundo caso, un `true` constante pasa el primero.
- 9.5 — Un gasto en estado `needs_review` que **tiene imputaciones escritas** queda excluido: sus
  montos no aparecen en el total de su mes. El caso de prueba compara el total del mes con y sin ese
  gasto y verifica que es el mismo número; no alcanza con comprobar que el total "no lo incluye".
- 9.5 — Si el único gasto de un grupo de mes y categoría está en `needs_review`, ese grupo **no
  aparece** en el resultado: la fila desaparece, no vuelve con total en cero. Un cero es un dato sobre
  un mes en el que no se gastó; esto es un mes del que no sabemos nada.
- 9.5 — La exclusión es del gasto entero y no del estado de sus imputaciones: las imputaciones de un
  gasto en `needs_review` siguen existiendo en la tabla después de la consulta. T20 lee, no borra.
- Categoría nula, imposibilidad asertada — recorridos los estados alcanzables de un gasto con
  imputaciones —categorizado por regla, categorizado por IA, categorizado como `Sin categorizar`, y en
  `needs_review`—, **ninguna fila devuelta por la vista tiene la categoría en `NULL`**. Es la aserción
  que fija el análisis de alcanzabilidad de la Descripción como una propiedad verificada y no como un
  razonamiento en prosa.
- Categoría nula, comportamiento defensivo — un gasto con `categoria_id` en `NULL` y con imputaciones,
  **construido a mano en el test porque el pipeline no lo produce**, conserva su monto en la vista —el
  `LEFT JOIN` no lo descarta, que es lo que verifica que la unión no se volvió interna— y hace que
  `totalesPorMesYCategoria` **falle con un error propio y distinguible**. No lo devuelve como
  `Sin categorizar`: la aserción comprueba explícitamente que el error no es una fila, porque un mapeo a
  esa etiqueta haría indistinguible un defecto del pipeline de un caso rutinario de la bandeja.
- Rango de meses — `totalesPorMesYCategoria(desde, hasta)` devuelve los meses del rango **con ambos
  extremos incluidos** y omite los de afuera. El caso de prueba tiene imputaciones en el mes anterior a
  `desde` y en el posterior a `hasta`, y ninguno de los dos aparece; los meses iguales a `desde` y a
  `hasta` sí. La comparación es lexicográfica sobre la cadena `AAAA-MM`, que para el formato de ancho
  fijo con cero a la izquierda coincide con el orden cronológico —`'2026-09' < '2026-10'`—, y esa
  equivalencia es la razón por la que T12 fija el formato con ceros.
- Rango de meses — un rango sin imputaciones devuelve un **arreglo vacío**, no un error y no filas con
  total en cero. Es el estado de la aplicación recién instalada, que es lo primero que T43 renderiza.
- Fidelidad decimal — un total agregado a partir de montos con decimales que no tienen representación
  exacta en punto flotante binario —`$428,55` y `$1.234,57`, o similares— devuelve el **valor decimal
  exacto**, comparado como `Decimal` y no como número convertido. Es el camino que ni T18 ni T19
  alcanzan: acá el valor pasa además por un `SUM` de la vista y por la deserialización del `numeric`.
- Fidelidad del mes — el `mes` de cada fila es la cadena `AAAA-MM` exacta, sin el relleno que puede
  dejar la columna `char(7)`. T19 lo asertó en la escritura; acá se aserta después de agrupar, porque el
  `GROUP BY` es el punto donde un espacio de más parte un mes en dos filas del dashboard.
- Andamiaje — la migración corre desde cero contra una base vacía y deja `vista_gastos_mensuales` con la
  forma del modelo de datos del diseño. Volver a correrla no falla ni duplica objetos. Esta migración
  **no crea tablas ni tipos enumerados**: el schema quedó completo en T19 y esta es una vista sobre él.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres y la herramienta de
  migraciones que estrenó T16, el tipo `Mes` de T12, `Categoria` de T14 y el `Decimal` de la cadena de
  normalización, importados sin redeclararlos.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que
  el Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

`FilaDashboard` se declara en `infra/db/repositorioImputaciones.ts`, junto a `totalesPorMesYCategoria`,
con `total: Decimal` (no `number`) tal como fija `design.md`. `GraficoMensual.tsx` (T42) ya tenía su
propia versión local con `total: number`, declarada mientras esta tarea estaba bloqueada y documentada
ahí como algo a reemplazar cuando T20 se desbloqueara — esta tarea define el tipo canónico pero **no**
toca `GraficoMensual.tsx`: la reconciliación (importar este `FilaDashboard` en vez del local, y decidir
dónde convertir `Decimal` a lo que el componente de presentación necesita) es de T43, que es quien arma
el contenedor real y consume el repositorio de punta a punta. La comparación de rango usa `BETWEEN`
sobre la cadena `mes` (`char(7)` con ceros a la izquierda), que coincide con el orden cronológico
(Decision log de T12) — no se necesitó convertir a fecha en ningún punto.

**Outcome:**

RED confirmado por `tsc`: `Property 'totalesPorMesYCategoria' does not exist on type
'RepositorioImputaciones'` antes de escribir la implementación. GREEN: creados
`infra/db/migraciones/0006_vista_gastos_mensuales.sql` y el método en
`infra/db/repositorioImputaciones.ts`; primera corrida en verde (14/14). `npm run typecheck && npx
vitest run` → 23 test files, 213/213 en verde. Mutación dirigida: se cambió el `throw` de la fila con
`categoria: null` por `categoria: fila.categoria ?? 'Sin categorizar'` —mapea el estado imposible del
pipeline a una categoría real en vez de rechazarlo—. Corrí la suite completa: falló exactamente el test
defensivo de categoría nula (`expected [Error: rejected promise] pero resolvió con una fila`), con 212
tests restantes en verde. Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run`
→ typecheck limpio, 23 test files, 213/213 en verde.

## T21 — `marcarDescartado` y `traerCrudo` en `RepositorioEmails`

**Requisitos:** 4.2, 4.3, 10.3
**Depende de:** T16

**Descripción:**

Completa `RepositorioEmails` con los dos métodos que T16 dejó explícitamente afuera: `marcarDescartado`,
que lleva el email al estado `descartado` —distinto de `error`—, y `traerCrudo`, que devuelve el
`MensajeCrudo` persistido sin consultar Gmail. Con esta tarea la interfaz del diseño queda cerrada.

**Por qué los dos métodos son un solo ciclo y no dos tareas.** Cada uno por separado es una sentencia
—un `UPDATE` de una columna y un `SELECT` por clave primaria— sobre la misma tabla, la misma interfaz y
el mismo archivo de test. Partirlos daría dos tareas que no pueden fallar de forma interesante por
separado y que repetirían el mismo armado de fixture en la base. Es la granularidad que ya usan T22
(`asignarCategoria` + `marcarParaRevision`) y T23 (`confirmar` + `pendientesDeConfirmacion`): un
repositorio, sus métodos restantes, un ciclo.

**Qué es la "cola de errores" en esta versión, y por qué 4.3 sí se puede asertar acá.** Con `/revision`
fuera de alcance no existe ninguna pantalla de errores, así que la cola no es una superficie: es el
conjunto de filas de `emails_crudos` con `estado = 'error'`, el único sentido observable que le queda al
término en esta versión. Por eso la aserción de 4.3 se escribe como una consulta sobre ese conjunto y no
como una relectura del estado de la fila, que es lo que ya cubre 4.2. Y por eso lleva **control
positivo**: sin una fila en `error` que la consulta sí devuelva, una consulta rota que no devuelve nada
pasa la aserción y 4.3 queda decorativo, que es exactamente el defecto por el que T20 se desprendió de
este criterio. La fila en `error` se construye con un `UPDATE` directo en el test, porque ningún método
de esta tarea —ni de ninguna otra del plan— escribe ese estado.

**4.3 queda partido y esta tarea sostiene una sola mitad.** La mitad "cola de errores" es esta. La mitad
"todo cálculo de gastos" la produce y la aserta T31, que comprueba que un email `descartado` no dejó
ningún gasto asociado; su línea de traza se agrega al converger T31, no acá.

**`traerCrudo` traza 10.3 junto con T40, no en lugar de T40.** `design.md` anota el método con
`// Req. 10.3` y esta es la tarea que lo escribe: sin la traza, la mitad `traerCrudo` de T21 quedaría sin
criterio que la justifique. La división es de nivel, no de solapamiento — T21 verifica la primitiva (que
devuelve lo persistido y que no toca la red) y T40 verifica el recorrido completo (que el reprocesamiento
produce el gasto y sus imputaciones). T40 puede fallar con T21 en verde, y por eso las dos aserciones
existen.

**Por qué 10.4 ya no traza acá.** El criterio 10.4 es sobre **gastos** —el paso en el que está cada gasto
y su último error—, no sobre emails. `traerCrudo` lee `emails_crudos` y no tiene columna de paso ni de
error que devolver, así que la traza original asertaba algo que el método no hace. T22 escribe `estado`
y `ultimo_error` y las verifica sobre el gasto; 10.4 queda entero ahí.

**Por qué se elimina la traza a 9.6 en lugar de renumerarla.** El criterio 9.6 **no existe**: el
Requisito 9 de `requirements.md` termina en 9.5. Lo que la traza describía —el acceso al email crudo
desde la interfaz— es una de las cosas que la sección "Fuera de alcance" sacó nominalmente el 2026-08-26
junto con la pantalla `/revision`. No hay criterio vigente al que reapuntarla: el dato se sigue
conservando y se sigue pudiendo leer, pero por `traerCrudo` y desde el panel de Inngest, que es 10.3. La
fila fantasma `9.6` se elimina también de la tabla de Cobertura.

**`MensajeCrudo` no se ensancha.** T16 lo declaró con `gmailMessageId`, `remitente`, `asunto`,
`headersCrudos`, `cuerpo` y `recibidoEn`, y dejó abierto si T21 necesitaría un campo más. No lo necesita:
`traerCrudo` recibe el `id` interno de la fila y devuelve esos seis campos. El tipo se importa de T16 sin
redeclararlo y sin agregarle nada; el `estado` del email no forma parte de `MensajeCrudo` y esta tarea no
lo incorpora.

**No depende de los fixtures.** Los `MensajeCrudo` de las aserciones se construyen dentro del test: T21 no
lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del
repositorio. Puede ejecutarse con ese bloqueo abierto. Sí requiere un Postgres alcanzable y las
convenciones de base que fijó T16.

**Lo que T21 no hace.** No decide **cuándo** se descarta un email —esa es la rama `no_es_aviso` del step
extraer, T31— ni **cuándo** se reprocesa uno, que es T40. No crea ni modifica migraciones: la tabla y el
tipo `estado_email` ya existen desde T16. No escribe los estados `procesado` ni `error`. No dibuja
ninguna superficie.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.2 — Tras `marcarDescartado` sobre un email recién guardado, una relectura de la fila devuelve el
  estado `descartado`, y ese valor es **distinto de `error`**: la aserción compara contra `error`
  explícitamente y no solo contra `pendiente`, porque colapsar descarte y falla en un mismo estado es
  precisamente lo que 4.2 prohíbe y lo que ninguna otra aserción de la tarea detectaría.
- 4.3 — Una consulta de la cola de errores —las filas de `emails_crudos` con `estado = 'error'`— **no
  devuelve** el email descartado. El caso de prueba incluye un segundo email llevado a `error` con un
  `UPDATE` directo que la consulta **sí devuelve**: sin ese control positivo, una consulta que no
  devuelve nada pasaría la aserción.
- 10.3 — `traerCrudo` devuelve un `MensajeCrudo` cuyos `cuerpo` y `headersCrudos` son **byte a byte**
  idénticos a los que se guardaron, con el mismo caso no ASCII, comillas y saltos de línea que fija T16
  para 1.1. Es la aserción que hace utilizable el reprocesamiento: un cuerpo recortado o reencodeado al
  volver de la base rompe la extracción de T40 sin romper nada acá.
- 10.3 — La llamada a `traerCrudo` se ejecuta con un `ClienteGmail` simulado que **falla si se lo
  invoca**, y la operación igual devuelve el mensaje. Es la mitad "sin volver a consultarlo en Gmail" del
  criterio, y solo es verificable con el doble que explota: un simulado que devuelve un valor dejaría
  pasar una implementación que consulta la red.
- 10.3 — Los campos consultables del `MensajeCrudo` devuelto —`gmailMessageId`, `remitente`, `asunto` y
  `recibidoEn`— coinciden con los guardados, `recibidoEn` conservando el instante exacto. Es la relectura
  completa del tipo, no solo de los dos campos que consume la extracción.
- Fidelidad del descarte — `marcarDescartado` cambia el estado y **nada más**: `cuerpo`, `headersCrudos`,
  `remitente`, `asunto` y `recibidoEn` releídos después del descarte son idénticos a los de antes. Un
  email descartado se sigue pudiendo reprocesar, y un `UPDATE` demasiado amplio o un `UPSERT` que
  reescribe la fila rompería eso sin mover ninguna aserción de estado. `procesado_en` queda deliberadamente
  fuera de esa lista: si el descarte sella o no esa columna es una decisión de la implementación y va al
  Decision log.
- Idempotencia — una segunda llamada a `marcarDescartado` sobre el mismo email no falla y deja el estado
  en `descartado`. Inngest reintenta el step que lo invoca (T31), así que la segunda ejecución es un
  camino real y no una hipótesis.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres de T16 y el tipo
  `MensajeCrudo` importado sin redeclararlo.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que el
  Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

- Extiende `infra/db/repositorioEmails.ts` (sin archivo nuevo) con `marcarDescartado` y `traerCrudo` en
  la interfaz `RepositorioEmails` y su implementación; el archivo de test se extiende con un segundo
  `describe` en `infra/db/repositorioEmails.test.ts`, reutilizando `crearMensaje` y las constantes de
  contenido realista que ya declaró T16.
- `marcarDescartado`: `UPDATE emails_crudos SET estado = 'descartado' WHERE id = $1`, sin tocar ninguna
  otra columna (ni `procesado_en`, que la tarea deja explícitamente como decisión de implementación): un
  email descartado se sigue pudiendo reprocesar. Naturalmente idempotente porque el `UPDATE` no depende
  del estado anterior.
- `traerCrudo`: `SELECT` directo por `id`, sin ningún parámetro de `ClienteGmail` en la firma — la
  garantía "sin volver a Gmail" (Req. 10.3) la sostiene el tipo, no un doble inyectado y verificado en
  tiempo de ejecución, la misma técnica que usó T8 para "el header Date es inalcanzable" (se documenta en
  el test en vez de construir un mock que nunca se pasa a ningún lado). Lanza si el `id` no existe.
- La cola de errores (4.3) se verifica con una consulta directa `SELECT ... WHERE estado = 'error'`
  sobre `emails_crudos`: no hay método de repositorio que la exponga en esta versión (no hay superficie
  de `/revision`), así que el test la escribe inline, con el control positivo que exige la tarea.

**Outcome:**

`marcarDescartado` y `traerCrudo` agregados a `RepositorioEmails` en `infra/db/repositorioEmails.ts`.
Ciclo TDD completo: RED confirmado (5 tests nuevos, `TypeError: repositorio.marcarDescartado/traerCrudo
is not a function`), GREEN (`npm run typecheck && npm test` verdes, 76/76 acumulados — un primer intento
de correr la suite completa mostró un crash aislado de V8 dentro del worker de Vitest, `Worker exited
unexpectedly`, sin relación con el código de esta tarea; una segunda corrida inmediata pasó limpia y se
repitió la suite completa dos veces más para confirmar que no era recurrente), mutación (se amplió el
`UPDATE` de `marcarDescartado` para tocar también `asunto = 'MUTADO'` — el modo de falla concreto que
describe la tarea, un `UPDATE` demasiado amplio; falló exactamente el test de "no altera cuerpo,
headersCrudos, remitente, asunto ni recibidoEn", mostrando el `asunto` mutado, mientras los otros 9,
incluidos el de estado `descartado` y el de la cola de errores con control positivo, siguieron en verde),
restaurada con Edit y reverificado verde. Sin desviaciones del diseño.

## T22 — `asignarCategoria` y `marcarParaRevision` con trazas de error

**Requisitos:** 6.6, 10.4, 10.5
**Depende de:** T9, T14, T18

**Descripción:**

Las **dos transiciones de estado del gasto** que faltan en `RepositorioGastos`: `asignarCategoria`
—categoría, origen y justificación— y `marcarParaRevision(id, motivo, ultimoError)`, que lleva el gasto
a `needs_review` registrando el motivo enumerado y la traza de error, si la hubo. Las dos son el mismo
tipo de operación: un `UPDATE` que mueve el gasto de un paso del pipeline al siguiente y deja escrito
por qué. Con esta tarea y T23 la interfaz del diseño queda cerrada.

**Por qué los dos métodos son un solo ciclo y no dos tareas.** Cada uno es un `UPDATE` sobre la misma
tabla, la misma interfaz y el mismo archivo de test, y los dos comparten el armado de fixture —un gasto
creado con `crear`— y la misma aserción de relectura. Partirlos daría dos tareas que no pueden fallar de
forma interesante por separado. Es la granularidad que ya fijaron T21 (`marcarDescartado` +
`traerCrudo`) y T18 (migración + `crear`): un repositorio, sus métodos restantes, un ciclo.

**No existe la columna `paso_actual`, y el "paso" del criterio 10.4 es `gastos.estado`.** El modelo de
datos del diseño no tiene esa columna: `gastos` lleva `estado estado_gasto`, `motivo_revision` y
`ultimo_error`, y la migración ya la creó T18 con esa forma exacta. El enum `estado_gasto` **es** la
lista de pasos del pipeline —`pendiente`, `extraido`, `categorizado`, `imputado`— más el destino de
falla `needs_review`, así que registrar el estado es registrar el paso, y una segunda columna sería el
mismo dato duplicado y desincronizable. Esta tarea **no crea ni modifica migraciones**: escribe sobre
las columnas que T18 ya dejó. `design.md` corrigió el 2026-08-27 la línea de la sección de superficie
visual que prometía escribir `paso_actual`: ahora dice `estado`, que es la columna real. No queda
ninguna otra mención a esa columna fantasma en los tres artefactos.

**`asignarCategoria` avanza el estado a `categorizado` y decide `confirmado_en`.** Es la decisión que
esta tarea le debe a T33, T34 y T23, por el mismo motivo por el que T18 decidió que `crear` deja el
gasto en `extraido`: el diseño **no expone ninguna transición de estado genérica** en
`RepositorioGastos`, así que cada método mueve el estado que le corresponde o el gasto se queda clavado
en `extraido` para siempre. Y el mismo método resuelve la confirmación, porque el diseño la ata al
origen en los dos escenarios del flujo de datos: con origen `regla` el gasto queda confirmado en el acto
—`confirmado_en = now()`, escenario A, Req. 5.3— y con origen `ia` queda sin confirmar —`confirmado_en`
en nulo, escenario B, Req. 6.3—. Si `asignarCategoria` no distinguiera los dos orígenes, todos los
gastos resueltos por regla caerían en la bandeja de confirmación de T23 y T47.

**`OrigenCategoria` se define acá, no en T14.** `design.md` usa el tipo en la firma de
`asignarCategoria` —`origen: OrigenCategoria`— y en la columna `categoria_origen origen_categoria` del
modelo de datos, pero no lo declara como tipo de TypeScript en ninguna parte, igual que pasó con
`MensajeCrudo` antes de T16, `NuevaImputacion` antes de T19 y `FilaDashboard` antes de T20. T14 declara
`Categoria`, `Regla` y `CATEGORIAS_INFERIBLES` en `dominio/categorizacion/`, pero no `OrigenCategoria`:
ninguna tarea anterior a esta lo necesita en una firma, así que atribuírselo a T14 —como hacían la
redacción anterior de esta tarea y la de T23— es una traza falsa que un `import` roto detectaría recién
en el `typecheck` de quien lo intente. Esta tarea lo declara junto a `asignarCategoria`, con los mismos
tres valores que ya fija el enum SQL `origen_categoria` de T17: `export type OrigenCategoria = 'regla' |
'ia' | 'usuario'`. T23 lo importa de acá sin redeclararlo — su propia mención a "T14" queda para
corregir cuando esa tarea itere.

**10.5 acá es la transición; en T18 es el conjunto cerrado.** No se pisan y la división es deliberada.
T18 aserta sobre el **tipo** `estado_gasto` leído de la base: que acepta exactamente las cinco etiquetas
y rechaza una sexta. Esta tarea aserta sobre el **valor que los métodos escriben**: que
`asignarCategoria` deja `categorizado` y `marcarParaRevision` deja `needs_review`, y no cualquier otra
etiqueta del conjunto. Un método que escribiera `imputado` pasaría entero por la aserción de T18 —es una
etiqueta válida del tipo— y solo lo detecta la aserción de esta tarea.

**La justificación es también el canal del error de la inferencia, y por eso 6.6 y 10.4 se tocan acá.**
`design.md` lo dice explícitamente al cerrar `inferirCategoria`: los tres caminos de falla convergen en
`Sin categorizar` con origen `ia`, y "lo que los distingue es la justificación persistida, que en la
abstención es la del modelo y en la falla es la traza del error (Req. 6.6, 10.4)". Es decir que el
parámetro `justificacion` de `asignarCategoria` transporta dos cosas distintas según el camino, y las
dos tienen que llegar a `categoria_justificacion` **sin recorte ni reescritura**. Por eso la aserción de
6.6 es sobre el texto verbatim y no sobre su presencia: una traza de error truncada a los primeros
caracteres pasa una aserción de "no es nulo" y pierde exactamente el dato por el que existe la columna.

**`marcarParaRevision` es el único escritor de `gastos.ultimo_error`, y por eso 10.4 queda entero acá.**
La iteración anterior de esta tarea encontró que ningún método de las 49 tareas del plan escribía esa
columna: el modelo de datos la declara anotada `-- Req. 10.4`, la tabla de manejo de errores promete
"`needs_review` + `ultimo_error` registrado" y la AC de T38 la daba por escrita, pero la firma no
recibía ningún texto de error. `design.md` lo resolvió el 2026-08-27 agregando el tercer parámetro:
`marcarParaRevision(id: string, motivo: MotivoRevision, ultimoError: string | null): Promise<void>`.
Un **solo escritor** para la transición a `needs_review` es lo que hace garantizable el criterio 2.12
—ningún camino de error produce un monto—: la alternativa, que el envoltorio de step de T38 escribiera
la columna por su cuenta, habría necesitado igual un método de repositorio, porque el diseño prohíbe
que los `step.run` tengan lógica propia, y habrían quedado dos escritores para una misma transición.

**El parámetro es `string | null` y no opcional, a propósito.** Obliga al llamador —T32, T33, T35, T38—
a decidir explícitamente si hay traza de error o no, en vez de omitirlo por descuido y dejar la columna
en nulo sin haberlo decidido. La consecuencia para el test es directa: el caso con `null` explícito es
una aserción propia, no la ausencia de una llamada.

**La división de 10.4 con T38 es de nivel, no de solapamiento.** T22 verifica la primitiva: que la
columna recibe y conserva el texto que se le pasó, sea cual sea. T38 verifica el recorrido: que el
agotamiento de reintentos efectivamente **invoca** el método con la traza del error del intento fallido
(su AC de 10.2). T38 puede fallar con T22 en verde —un envoltorio que agota reintentos y llama con
`null`, o que no llama— y por eso las dos aserciones existen. `ultimo_error` no es de 10.2: 10.2 pide
`needs_review` y el email crudo intacto, y esa es la aserción de nivel de workflow que se queda en T38.

**El otro hueco de `needs_review` no es de esta tarea.** `GastoNormalizado` tiene sus siete campos
obligatorios y `marcarParaRevision` necesita el `id` de una fila que ya exista, así que ningún método
del diseño puede **crear** la fila de un gasto cuyo aviso fue ilegible (Req. 2.11, 2.12). Ese hueco
muerde en T32, que es la tarea que necesita esa fila; acá no, porque `marcarParaRevision` opera sobre un
gasto que `crear` ya persistió y el test lo construye por esa vía. T22 puede converger y ejecutarse con
esa decisión todavía pendiente.

**`asignarCategoria` resuelve el nombre de categoría contra las filas de T17.** La firma recibe un
`Categoria` —`'Salidas' | 'Comida' | 'Extras' | 'Sin categorizar'`, el tipo que declaró T14— y la
columna es `categoria_id smallint` con clave foránea a `categorias`. La traducción de nombre a `id`
ocurre en el repositorio, contra las cuatro filas que sembró T17, y por eso `Sin categorizar` tiene que
funcionar igual que las otras tres: es el destino de T35 y de la abstención del modelo, y si la
resolución del nombre solo contemplara las tres categorías inferibles, el camino de falla de la IA
fallaría al persistir en vez de continuar hacia la imputación, que es lo contrario de lo que pide 6.5.

**No depende de los fixtures.** El gasto de las aserciones se construye con un `GastoNormalizado` armado
en el test: T22 no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que
siguen ausentes del repositorio. Puede ejecutarse con ese bloqueo abierto. Sí requiere un Postgres
alcanzable, las convenciones de base de T16 y las migraciones de T17 y T18.

**Lo que T22 no hace.** No decide **cuándo** se asigna una categoría ni de dónde sale —la regla es T33,
la inferencia T34 y T35—, ni cuándo un paso agota sus reintentos, que es T38. **No compone el texto de
`ultimo_error`**: el repositorio persiste verbatim lo que recibe, y de qué excepción sale y cómo se
serializa es de los llamadores (T32, T33, T35, T38). No implementa `confirmar`
ni `pendientesDeConfirmacion` (T23), aunque fija la precondición de las dos al escribir `confirmado_en`.
No crea ni modifica migraciones ni tipos enumerados: `estado_gasto` y las columnas
de traza ya existen desde T17 y T18, y el enum SQL `origen_categoria` ya existe desde T17 — lo único que
esta tarea agrega es su contraparte en TypeScript. No lleva el gasto a `imputado` —esa transición es del
step imputar— y no dibuja ninguna superficie.

**Criterios de aceptación (trazados desde requirements.md):**

- 6.6 — `asignarCategoria` con origen `ia` y una justificación del modelo la persiste, y una relectura
  la devuelve **verbatim**: mismo texto, mismos acentos y comillas, mismos saltos de línea, sin recorte.
  El caso de prueba usa una justificación con caracteres no ASCII y más larga que cualquier límite
  accidental de columna. Es la aserción que hace utilizable la bandeja de T48, que muestra ese texto tal
  cual.
- 6.6 — La misma aserción se repite con una justificación que es una **traza de error** en lugar de una
  explicación del modelo. `design.md` fija que en el camino de falla la columna transporta la traza
  (Req. 6.6, 10.4); si la implementación filtrara, recortara o normalizara el texto, la explicación del
  modelo seguiría pasando y la traza se perdería sin que ninguna otra aserción se entere.
- 6.6 — `asignarCategoria` con origen `regla` y justificación en nulo deja `categoria_justificacion` en
  **nulo**, no en cadena vacía. Un gasto resuelto por regla no tiene nada que justificar, y una cadena
  vacía haría que la bandeja renderice una justificación en blanco en vez de omitirla.
- 10.4 — Tras `asignarCategoria`, una relectura del gasto devuelve `estado` en `categorizado`; tras
  `marcarParaRevision`, en `needs_review`. Es el registro del paso en el que se encuentra el gasto, y se
  aserta sobre el valor releído de la fila, no sobre el retorno del método —los dos devuelven `void`—.
- 10.4 — `marcarParaRevision` persiste en `motivo_revision` **el motivo exacto que recibió**. El caso de
  prueba invoca el método al menos dos veces sobre gastos distintos con motivos distintos —
  `monto_invalido` y `error_de_paso`— y comprueba que cada fila conserva el suyo: con un solo motivo, una
  implementación que escribe una constante pasa la aserción.
- 10.4 — `marcarParaRevision` persiste en `ultimo_error` **el texto que recibió**, y una relectura lo
  devuelve **verbatim**: mismo contenido, mismos acentos, mismos saltos de línea, sin recorte. El caso de
  prueba usa una traza multilínea más larga que cualquier límite accidental de columna, porque es
  exactamente el final de la traza —donde está la causa— lo que se pierde si la implementación trunca.
  Es la mitad "el último error ocurrido" del criterio, y esta tarea es su **único** escritor.
- 10.4 — `ultimo_error` y `motivo_revision` son columnas **distintas y no intercambiables**: el caso de
  prueba llama con un motivo y un texto de error que no se parecen, y aserta cada columna contra su
  valor. Una implementación que escribiera `ultimo_error = motivo` —duplicar la etiqueta del enum y
  llamar a eso traza— pasa cualquier aserción de "no es nulo" y falla esta.
- 10.4 — Un `null` explícito en `ultimoError` deja la columna en **nulo**: `marcarParaRevision(id,
  'monto_invalido', null)` marca el gasto para revisión con su motivo y **no fabrica ningún texto** —ni
  cadena vacía, ni el nombre del motivo, ni un mensaje por defecto—. Es el caso del motivo que no nace de
  una excepción, y el que justifica que el parámetro sea `string | null` obligatorio en vez de opcional.
- 10.4 — "Si hubo alguno": un gasto al que solo se le llamó `asignarCategoria` tiene `motivo_revision`
  y `ultimo_error` en **nulo**. Ninguno de los dos métodos inventa un error donde no lo hubo, que es la
  mitad condicional del criterio y la que evita que un gasto sano aparezca como fallido.
- 10.5 — La transición que escribe cada método es **exactamente** la que le corresponde y no otra
  etiqueta del conjunto: `asignarCategoria` deja `categorizado` —no `imputado` ni `extraido`— y
  `marcarParaRevision` deja `needs_review`. La aserción es por igualdad contra la etiqueta esperada, no
  por pertenencia al conjunto: una comprobación de pertenencia la pasa cualquiera de los cinco valores y
  duplicaría sin agregar nada la aserción de conjunto cerrado que ya hace T18 sobre el tipo.
- 10.5 — `marcarParaRevision` sobre un gasto en `categorizado` lo lleva igual a `needs_review`. El
  destino de falla es alcanzable desde cualquier paso del pipeline, no solo desde `extraido`: T38 lo
  invoca cuando el agotamiento de reintentos ocurre en la categorización o en la imputación.
- `confirmado_en` según el origen — `asignarCategoria` con origen `regla` deja `confirmado_en` con un
  instante, y con origen `ia` lo deja en **nulo**. Son las dos mitades del contrato que consumen
  `pendientesDeConfirmacion` (T23) y el indicador de T47: sin la primera, todos los gastos resueltos por
  regla caen en la bandeja; sin la segunda, ninguno de los inferidos llega.
- Resolución del nombre de categoría — `asignarCategoria` persiste un `categoria_id` que resuelve contra
  la fila de `categorias` con ese nombre, y funciona con las **cuatro**: `Salidas`, `Comida`, `Extras` y
  `Sin categorizar`. La aserción releé el nombre por el join, no el `id` literal, que depende del orden
  de la semilla de T17.
- Fidelidad del `UPDATE` — `asignarCategoria` cambia la categoría, el origen, la justificación, el
  estado y `confirmado_en`, y **nada más**: `monto_total`, `comercio`, `fecha_gasto`, `tipo_tarjeta`,
  `tarjeta_ultimos4`, `cuotas_total` y `email_id` releídos son idénticos a los de antes. Lo mismo para
  `marcarParaRevision`, que toca `estado`, `motivo_revision` y `ultimo_error` y **nada más**, y que
  además **no completa ningún campo nulo**: un gasto con `monto_total` en nulo sigue con `monto_total`
  en nulo después de la marca. Es el criterio 2.12 sostenido en el camino de error, y un `UPDATE`
  demasiado amplio o un `UPSERT` que reescribe la fila lo rompe sin mover ninguna aserción de estado.
- Idempotencia — una segunda llamada a `marcarParaRevision` con el mismo motivo no falla y deja el gasto
  en `needs_review`; si la segunda llamada trae un `ultimoError` distinto, la columna queda con **el
  último**, que es lo que su nombre promete. Una segunda llamada a `asignarCategoria` con otra categoría
  la reemplaza y deja una sola fila. Inngest reintenta los steps que los invocan (T33, T34, T38), así que
  la segunda ejecución es un camino real y no una hipótesis (Req. 8.7).
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres de T16, el tipo
  `Categoria` de T14 y `MotivoRevision` de T9, importados sin redeclararlos, y declara `OrigenCategoria`
  —`'regla' | 'ia' | 'usuario'`— junto a `asignarCategoria`: es el tipo que la firma del diseño usa pero
  que ninguna tarea anterior declaraba.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que el
  Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

`OrigenCategoria` ya estaba declarado desde el ciclo de T18 (`infra/db/repositorioGastos.ts`), con una
nota que anticipaba esta tarea — T22 lo importa sin redeclararlo, en vez de declararlo de nuevo como
anticipaba el texto original de la tarea. `asignarCategoria` resuelve `categoria_id` con un subselect
contra `categorias` en la misma sentencia `UPDATE` (`(SELECT id FROM categorias WHERE nombre = $2)`),
sin una consulta previa. `confirmado_en` se decide en TypeScript (`origen === 'regla' ? new Date() :
null`), no en SQL, porque es la misma decisión que ya describe el diseño y no hay ninguna ventaja en
moverla al servidor. Los dos métodos comparten el mismo helper de fixture (`crearGastoDePrueba`, un
email + un `crear`) y el mismo `filaCompleta` que relee las catorce columnas relevantes con SQL directo,
en vez de ensanchar el tipo `Gasto` con los seis campos que T22 no necesita devolver desde el método (el
diseño de los dos métodos es `Promise<void>`).

**Hallazgo de infraestructura (afecta a todas las tareas con Postgres, no solo a esta).** Con
`repositorioGastos.test.ts` creciendo a 28 tests en un archivo que levanta su propia base PGlite,
sumado a los otros seis archivos que hacen lo mismo, la suite completa empezó a fallar de forma
intermitente con `Hook timed out in 10000ms` en `crearBasePostgresDeTest` — un archivo distinto cada
vez, señal de contención de recursos por los siete arranques de Postgres-WASM en paralelo y no de un
bug determinista. Se subió `hookTimeout` a 30000 en `vitest.config.ts` (Decision log ahí mismo) y se
verificó corriendo la suite completa **tres** veces seguidas sin ningún fallo, siguiendo el mismo
estándar de verificación que T16 aplicó a su propio hallazgo de `maxConnections`.

**Outcome:**

RED confirmado por `tsc`: 21 errores TS2339 (`asignarCategoria`/`marcarParaRevision` no existían en
`RepositorioGastos`) antes de escribir la implementación. GREEN: agregados los dos métodos a
`infra/db/repositorioGastos.ts`; primera corrida en verde (16 tests nuevos de T22, 28 en total en el
archivo). Encontrada y corregida la intermitencia de `hookTimeout` descripta arriba; verificado 3/3 en
verde tras el ajuste. Mutación dirigida: en `asignarCategoria` se cambió `const confirmadoEn = origen
=== 'regla' ? new Date() : null` por `const confirmadoEn = null` —el origen deja de decidir nada—.
Corrí la suite completa: falló exactamente el test "confirmado_en según el origen: regla lo deja con un
instante, ia lo deja en null" (`expected null not to be null`), con 175 tests restantes en verde.
Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run` → typecheck limpio, 21
test files, 176/176 en verde.

## T23 — `confirmar` y `pendientesDeConfirmacion`

**Requisitos:** 7.1, 7.2, 7.3, 7.4, 7.10
**Depende de:** T14, T18, T22

**Descripción:**

Los **dos métodos de la bandeja** en `RepositorioGastos`: `confirmar`, que fija la categoría resultante,
registra el momento de la confirmación y cambia el origen a `usuario`, y `pendientesDeConfirmacion`, que
devuelve los gastos que esperan esa decisión. Con T22 y esta tarea la interfaz del diseño queda cerrada.

**Por qué los dos métodos son un solo ciclo y no dos tareas.** Son las dos caras de la misma columna:
`pendientesDeConfirmacion` selecciona por `confirmado_en IS NULL` y `confirmar` es lo único que deja de
cumplir esa condición. Comparten tabla, interfaz, archivo de test y armado de fixture, y la aserción más
fuerte de las dos —que un gasto confirmado desaparece del listado— necesita a los dos métodos en la misma
prueba. Partirlos daría dos tareas que no pueden fallar de forma interesante por separado. Es la
granularidad que ya fijaron T18 (migración + `crear`), T21 y T22: un repositorio, sus métodos restantes,
un ciclo.

**T23 sostiene la primitiva; T47, T48, T49 y T50 sostienen el recorrido.** Los cinco criterios del
Requisito 7 que esta tarea toca están partidos en dos niveles, y la división es de nivel, no de
solapamiento — la misma que ya usan T21 y T40 sobre 10.3. Acá se verifica **qué devuelve y qué escribe la
base**; allá, **qué ve y qué hace el usuario**. Cada mitad puede fallar con la otra en verde, y por eso
las dos aserciones existen:

| Criterio | Mitad de T23 (primitiva) | Mitad de la superficie |
|---|---|---|
| 7.1 | el conjunto de gastos pendientes | T47 — el indicador y su cuenta |
| 7.2 | el payload: comercio, monto, fecha, categoría y justificación | T48 — el listado que los muestra |
| 7.3 | `confirmado_en` y origen `usuario` | T49 — la acción de confirmar |
| 7.4 | el reemplazo de la categoría por la elegida | T50 — la acción de corregir |
| 7.10 | el pendiente `Sin categorizar` entra al conjunto y se confirma por corrección | T48 y T50 — listarlo sin categoría propuesta y ofrecer las tres |

**Por qué 7.2 y 7.4 se agregan a la traza.** `design.md` anota `confirmar` con `// Req. 7.3, 7.4` y
`pendientesDeConfirmacion` con `// Req. 7.1, 7.2`; la traza original de esta tarea se quedaba con un
criterio de cada método. En los dos casos el criterio faltante es el que justifica la forma de la firma.
`confirmar(id, categoria)` **recibe una categoría**: si solo existiera 7.3 —confirmar la propuesta— el
parámetro sobraría, porque la categoría ya está en la fila. El parámetro es el mecanismo de 7.4 y de la
"vía de corrección" de 7.10, y sin la aserción de reemplazo nada en la capa de persistencia comprueba que
la categoría elegida efectivamente pisa a la propuesta. Y 7.2 enumera los cinco datos de cada gasto
pendiente: el listado los dibuja, pero el repositorio tiene que devolverlos, y es acá donde se decide que
`Gasto` los lleve.

**7.10 no tenía ninguna tarea y esta absorbe sus dos mitades de persistencia.** El criterio pide que un
pendiente con categoría `Sin categorizar` se liste igual, sin categoría propuesta, y que la elección del
usuario lo confirme por la vía de corrección. "Se lista igual" es una condición sobre el conjunto que
devuelve `pendientesDeConfirmacion`, y es la mitad con el modo de falla más caro: son los gastos que
**más** necesitan al usuario —los tres caminos de falla de la inferencia terminan ahí (Req. 6.4, 6.5,
6.7)— y una implementación que filtrara "los que tienen una categoría propuesta" los dejaría fuera de la
bandeja para siempre, sin que ninguna otra aserción se entere. "Confirmado por corrección" es
`confirmar(id, 'Comida')` sobre esa fila —la misma categoría que usa su criterio de aceptación—. Lo que queda en T48 y T50 es la superficie: renderizarlo sin
categoría propuesta y ofrecer las tres opciones. La fila 7.10 se agrega a la tabla de Cobertura, donde
faltaba por completo; T48 y T50 suman sus tareas a esa fila al converger, no acá.

**`Gasto` se ensancha acá, y es la decisión que esta tarea le debe a T48.** `design.md` usa el tipo en
dos firmas —`crear(): Promise<Gasto>` y `pendientesDeConfirmacion(): Promise<Gasto[]>`— pero **no lo
declara en ninguna parte**, igual que pasó con `MensajeCrudo` antes de T16 y con `NuevaImputacion` antes
de T19. T18 lo estrenó con lo que `crear` necesita: `id`, `emailId`, `estado` y los siete campos de
`GastoNormalizado` —`montoTotal`, `moneda`, `comercio`, `fechaGasto`, `tipoTarjeta`, `tarjetaUltimos4` y
`cuotasTotal`—. Esta tarea le agrega los cuatro que la bandeja consume y que hasta ahora ningún
método devolvía: `categoria: Categoria | null`, `categoriaOrigen: OrigenCategoria | null`,
`categoriaJustificacion: string | null` y `confirmadoEn: Date | null`. Los cuatro son nullables y `crear`
los deja en nulo, así que **ninguna aserción de T18 cambia**: un gasto recién creado no tiene categoría ni
confirmación. Lo que sí cambia es el **mapeo** de `crear`, que pasa a devolver los cuatro campos en nulo
para que el tipo cierre; es un ajuste de implementación dentro de esta tarea, no una reapertura de T18, y
si se omite el `npm run typecheck` de este mismo ciclo lo detecta. `categoria` es el **nombre** resuelto por el join contra `categorias`, no el `categoria_id`,
siguiendo la convención que fijó T22. `Gasto` no incluye las imputaciones del gasto: la bandeja muestra el
monto total de la compra, no su reparto en cuotas.

**Un gasto en `needs_review` no entra en la bandeja, y el caso es alcanzable.** El criterio 7.1 describe
la condición como "origen `ia` y sin confirmar" sin mencionar el estado, pero un gasto puede cumplirla y
estar en `needs_review` al mismo tiempo: el step categorizar le asigna `Sin categorizar` con origen `ia` y
sigue hacia la imputación (Req. 6.5), y si ahí se agotan los reintentos, T38 lo lleva a `needs_review`
conservando esas dos columnas. Listarlo contradiría dos cosas ya decididas: `design.md` fija que en esta
versión "un gasto en `needs_review` es invisible dentro de la aplicación" y el criterio 9.5 lo excluye de
los totales, así que la bandeja ofrecería confirmar la categoría de una compra cuyo monto puede ser nulo y
cuya confirmación no lo haría contar en ningún mes. El filtro es por las tres columnas y se aserta.

**Idempotencia: acá el camino real no es Inngest.** A diferencia de T21 y T22, `confirmar` no lo invoca
ningún step del workflow —lo invoca el usuario desde la bandeja (T49, T50)—, así que el criterio 8.7 no
es lo que la justifica. Lo que la justifica es el doble envío de la acción y el hecho de que `confirmar`
es el **mismo** método para confirmar y para corregir: una segunda llamada sobre un gasto ya confirmado es
el camino de corregir dos veces, y tiene que reemplazar la categoría sin fallar y sin duplicar filas.

**No depende de los fixtures.** Los gastos de las aserciones se construyen con `crear` más
`asignarCategoria`: T23 no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos
anonimizados que siguen ausentes del repositorio. Puede ejecutarse con ese bloqueo abierto. Sí requiere un
Postgres alcanzable, las convenciones de base de T16 y las migraciones de T17 y T18.

**Por qué depende de T22 y no solo de T18.** El fixture central de esta tarea es un gasto **categorizado
por la IA y sin confirmar**, y el único método que deja esa fila es `asignarCategoria`. Construirla con un
`UPDATE` directo —el recurso que usó T21 para el estado `error`, que ningún método escribe— acá sería
peor: fijaría en el test una forma de escribir `confirmado_en` que podría divergir de la que T22 decidió,
y las dos tareas quedarían verdes con contratos distintos sobre la misma columna. T22 es además quien fijó
que el origen `regla` confirma en el acto y el origen `ia` no, que es exactamente la precondición que este
listado filtra.

**Lo que T23 no hace.** No dibuja ninguna superficie: el indicador es T47, el listado T48, las acciones de
confirmar y corregir T49 y T50. No ofrece ni crea la regla del comercio (T51, T52). No restringe la
categoría elegida a `CATEGORIAS_INFERIBLES`: el repositorio acepta cualquier `Categoria` y limitar la
oferta a `Salidas`, `Comida` y `Extras` es de la bandeja (Req. 7.10). No crea ni modifica migraciones —
`confirmado_en`, `categoria_id`, `categoria_origen` y el índice parcial existen desde T18—. No toca
`imputaciones`: que la corrección se refleje en las N cuotas sin alterar montos ni meses (Req. 9.4) sale
del join y lo verifica T50 sobre la vista de T20. No cambia el `estado` del gasto. Y no fija el **orden**
del listado: ningún criterio del Requisito 7 lo pide, así que si `pendientesDeConfirmacion` ordena por
fecha de gasto o por fecha de creación es una decisión de la implementación y va al Decision log — pero
tiene que ser alguno, porque un `SELECT` sin `ORDER BY` le da a la bandeja de T48 un orden que puede
cambiar entre dos cargas de la misma página.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.3 — Tras `confirmar` sobre un gasto pendiente con la **misma** categoría que ya tenía propuesta, una
  relectura devuelve `confirmado_en` con un instante y `categoria_origen` en `usuario`, y la categoría
  intacta. Es el camino de confirmar sin corregir, y se aserta sobre la fila releída, no sobre el retorno
  del método, que es `void`.
- 7.4 — Tras `confirmar` sobre un gasto propuesto como `Extras` pasando `Salidas`, la relectura devuelve
  `Salidas`, `confirmado_en` con un instante y origen `usuario`. La categoría se compara por el **nombre
  resuelto por el join**, no por el `categoria_id`, que depende del orden de la semilla de T17. Sin este
  caso, una implementación que ignora el parámetro y solo sella la confirmación pasa entera la aserción
  de 7.3.
- 7.1 — `pendientesDeConfirmacion` devuelve **exactamente** los gastos con origen `ia` y `confirmado_en`
  en nulo. El caso de prueba monta las cuatro poblaciones a la vez y comprueba el conjunto completo de
  `id` devueltos, no solo que el pendiente esté: un gasto de origen `ia` sin confirmar —**sí**—, uno de
  origen `regla` confirmado por `asignarCategoria` —no—, uno de origen `ia` ya pasado por `confirmar`
  —no— y uno en `extraido` que todavía no llegó a la categorización, con `categoria_origen` y
  `confirmado_en` los dos en nulo —**no**—. El último es el que importa: el diseño trae un índice parcial
  `ON gastos (confirmado_en) WHERE confirmado_en IS NULL`, así que filtrar solo por esa columna es la
  implementación más tentadora, y deja entrar a la bandeja gastos que ni siquiera tienen una categoría
  que confirmar.
- 7.1 — Sin ningún gasto pendiente, `pendientesDeConfirmacion` devuelve una lista **vacía**, no un error
  ni un nulo. Es el estado en el que el indicador de T47 no se muestra, y el estado al que el sistema
  tiende con el uso.
- 7.2 — Cada `Gasto` devuelto trae los cinco datos que la bandeja muestra: `comercio`, `montoTotal`,
  `fechaGasto`, `categoria` y `categoriaJustificacion`, todos con el valor que se persistió. El
  `montoTotal` se aserta como **decimal exacto** contra un monto cuya representación en punto flotante
  binario no lo es —`2571.30` o similar—: esta consulta es un camino de lectura distinto del que verificó
  T18 en `crear`, y un `numeric` convertido a `number` en el listado rompe el monto que ve el usuario sin
  romper nada más.
- 7.2 — La justificación llega **verbatim**, con los mismos acentos, comillas y saltos de línea que
  persistió T22, sin recorte. Es el texto que la bandeja renderiza tal cual, y el mismo canal por el que
  viaja la traza de error del camino de falla de la inferencia (Req. 6.6).
- 7.10 — Un gasto pendiente con categoría `Sin categorizar` y origen `ia` **está** en el resultado de
  `pendientesDeConfirmacion`, con `categoria` en `Sin categorizar` —no en nulo, no ausente—. Es la mitad
  "se lista en la bandeja" del criterio, y sin ella los gastos que la IA no supo categorizar son los
  únicos que nunca llegan al usuario.
- 7.10 — `confirmar` sobre ese gasto pasando `Comida` deja la categoría en `Comida`, `confirmado_en` con
  un instante y origen `usuario`, y lo saca del resultado de `pendientesDeConfirmacion`. Es la vía de
  corrección que el criterio nombra: no hay un método aparte para elegir la categoría de un
  `Sin categorizar`.
- `needs_review` fuera de la bandeja — un gasto con origen `ia` y `confirmado_en` en nulo llevado a
  `needs_review` con `marcarParaRevision(id, 'error_de_paso', <traza>)` **no** aparece en
  `pendientesDeConfirmacion`. El fixture invoca el método con sus **tres** argumentos, que es la firma que
  `design.md` fijó el 2026-08-27 y que T22 implementa: el motivo enumerado y la traza de error son
  obligatorios, y una llamada de dos argumentos no compila. El caso es alcanzable —inferencia fallida que
  asigna `Sin categorizar` y agotamiento posterior de reintentos (Req. 6.5, 10.2)— y es el único que
  distingue un filtro por las tres columnas de uno por dos.
- Cierre del ciclo — un gasto que aparecía en `pendientesDeConfirmacion` ya no aparece después de
  `confirmar`, y el tamaño del resultado baja exactamente en uno. Es la aserción que necesita a los dos
  métodos juntos y la precondición del criterio 7.9, que T49 verifica sobre la superficie.
- `confirmar` no mueve el `estado` — un gasto en `imputado` sigue en `imputado` después de confirmarse.
  La confirmación es ortogonal al paso del pipeline: el flujo real confirma gastos que ya están imputados
  —el dashboard los suma antes de que el usuario los mire (Req. 9.3)— y una implementación que escribiera
  un estado nuevo o retrocediera a `categorizado` los sacaría de los totales.
- Fidelidad del `UPDATE` — `confirmar` cambia la categoría, el origen y `confirmado_en`, y **nada más**:
  `monto_total`, `comercio`, `fecha_gasto`, `tipo_tarjeta`, `tarjeta_ultimos4`, `cuotas_total`,
  `email_id` y `categoria_justificacion` releídos son idénticos a los de antes. La justificación se
  conserva a propósito: es el registro de qué había propuesto el modelo cuando el usuario lo corrigió.
  Un `UPDATE` demasiado amplio o un `UPSERT` que reescribe la fila rompe esto sin mover ninguna aserción
  de estado.
- Idempotencia — una segunda llamada a `confirmar` sobre el mismo gasto no falla, no duplica filas y deja
  la última categoría pasada; el gasto sigue fuera de `pendientesDeConfirmacion`. Es el doble envío de la
  acción de la bandeja y el camino de corregir dos veces, no un reintento de Inngest: `confirmar` no lo
  invoca ningún step del workflow.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres de T16 y los tipos
  `Categoria` y `OrigenCategoria` de T14, importados sin redeclararlos. `Gasto` se ensancha con cuatro
  campos nullables sobre la declaración de T18, sin redeclararlo en un segundo lugar.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que el
  Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

`Categoria` se importa de `dominio/categorizacion/categorizarPorReglas` (T14) y `OrigenCategoria` de
`infra/db/repositorioGastos` (T18/T22) — la traza original de esta tarea atribuía las dos a T14, error
que ya señaló el Decision log de T22 para `OrigenCategoria`. `Gasto` se ensancha con `categoria:
Categoria | null`, `categoriaOrigen`, `categoriaJustificacion` y `confirmadoEn`, los cuatro nullable;
`crear` no cambia su contrato observable (sigue devolviendo esos cuatro en `null`), pero internamente
pasó de un `INSERT ... RETURNING` simple a un `WITH g AS (INSERT ... RETURNING *) SELECT ... FROM g LEFT
JOIN categorias` para reutilizar la misma forma de fila (`COLUMNAS_GASTO`/`filaAGasto`) que
`pendientesDeConfirmacion`, en vez de mantener dos mapeos de fila a `Gasto` divergentes. `confirmar` no
toca `estado` ni `categoria_justificacion` a propósito: la primera es ortogonal al paso del pipeline, la
segunda es el registro de lo que el modelo había propuesto antes de la corrección. El filtro de
`pendientesDeConfirmacion` es sobre las **tres** columnas (`categoria_origen = 'ia'`, `confirmado_en IS
NULL`, `estado <> 'needs_review'`), no solo sobre el índice parcial de `confirmado_en`, tal como exige el
criterio 7.1 con el caso del gasto `extraido` sin categorizar. Orden por `creado_en ASC`, la decisión que
el texto de la tarea dejaba abierta.

**Hallazgo de infraestructura — crash de proceso, no solo intermitencia (afecta a toda la suite).** Con
`repositorioGastos.test.ts` en 40 tests y ocho archivos que instancian su propia base PGlite, `vitest run`
sin límite de threads empezó a **crashear el proceso entero** de forma determinista con "Fatal process out
of memory: Zone" —el mismo error de V8 que el Decision log de T29 documentó para el conflicto
`@inngest/test` + PGlite bajo `pool: 'forks'`, reaparecido acá por presión de memoria bajo `pool:
'threads'`: cada worker thread trae su propio isolate de V8 más su propia instancia de PGlite, y con
siete a ocho arrancando a la vez el conjunto agota el espacio de Zone. Confirmado reproduciéndolo dos
veces seguidas en el mismo punto de la suite. `--no-file-parallelism` lo evita pero serializa todo `npm
test` sin necesidad. Se agregó `poolOptions.threads.{minThreads: 1, maxThreads: 4}` a `vitest.config.ts`
—acotar los workers en paralelo, no eliminarlos— y se verificó corriendo la suite completa **tres** veces
seguidas sin ningún crash, con la mutación de esta misma tarea activa en la primera corrida para
confirmar que el límite de threads no esconde una regresión real.

**Outcome:**

RED confirmado por `tsc`: `confirmar` y `pendientesDeConfirmacion` no existían en `RepositorioGastos`
(2 errores TS2339 repetidos en cada call site) y `Gasto` no tenía los cuatro campos nuevos (4 errores
TS2339 adicionales) antes de escribir la implementación. GREEN: implementados los dos métodos y el
ensanche de `Gasto`/`crear`; primera corrida en verde (40 tests en el archivo, 12 nuevos de T23).
Encontrado y corregido el crash de infraestructura descripto arriba antes de poder cerrar el ciclo de
mutación con confianza. Mutación dirigida: en `pendientesDeConfirmacion` se redujo el `WHERE` a
`g.confirmado_en IS NULL`, quitando los filtros de `categoria_origen` y `estado`. Corrí la suite completa
tres veces con la mutación activa (para descartar que el límite de threads nuevo enmascarara algo):
fallaron consistentemente los mismos 2 tests —el que arma las cuatro poblaciones y el de exclusión por
`needs_review`—, con 186 tests restantes en verde las tres veces. Restaurado con Edit. Verificación
final: `npm run typecheck && npx vitest run`, corrida tres veces seguidas → typecheck limpio, 21 test
files, 188/188 en verde las tres, sin ningún crash.

## T53 — Migración de `estado_acceso_gmail` y `RepositorioAccesoGmail`

**Requisitos:** 1.5
**Depende de:** T16

**Descripción:**

El medio persistente que T26 dejó como pregunta abierta. `estado_acceso_gmail` es la tabla donde queda
escrito el hecho "el acceso a Gmail está revocado, desde tal instante, con tal detalle", y
`RepositorioAccesoGmail` es la implementación real del colaborador que T26 inyecta y dobla en memoria:
una operación que marca la revocación con su detalle y otra que informa si el acceso está revocado. Con
esta tarea la mitad (b) del criterio 1.5 —registrar el error de forma persistente y consultable— deja
de estar verificada solo hasta el borde del puerto, y la mitad (c) —el latch que impide volver a llamar
a Gmail— pasa a sobrevivir al reinicio del proceso de verdad y no solo contra un doble en memoria.

**Se resuelve la pregunta abierta de T26 por la primera de sus tres opciones: una tabla mínima de
estado de acceso.** Las otras dos se descartan con motivo. Una tabla genérica de errores del sistema
obligaría a implementar el latch como "el error más reciente de tipo revocación todavía no resuelto",
una consulta frágil sobre un log para leer el único bit que se mira antes de cada llamada a Gmail; y no
tiene consumidor en esta versión, porque la sección "Errores del sistema" quedó fuera de alcance el
2026-08-26 junto con `/revision`. Un registro fuera de la base agrega un segundo medio de persistencia
al proyecto —con su configuración, su doble y su forma propia de consultarse— para guardar ese mismo
bit, cuando ya hay un Postgres que T16 dejó listo y una futura superficie de errores podrá leer esta
tabla sin migrar nada.

**El nombre del puerto queda fijado acá: `RepositorioAccesoGmail`.** T26 lo nombró `RegistroAccesoGmail`
de forma explícitamente provisional, porque cuando se escribió no se sabía si el medio iba a ser una
tabla. Lo es, así que el nombre sigue la convención de `infra/db/` que ya usan `RepositorioEmails`,
`RepositorioGastos` y `RepositorioImputaciones`. La interfaz se declara acá y T26 la importa sin
redeclararla, igual que T21 y T24 importan `MensajeCrudo` de T16.

**La tabla es de una sola fila, y el `CHECK` es lo que lo garantiza.** `estado_acceso_gmail` lleva
`id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)`, `revocado_en timestamptz`, `detalle text` y
`restablecido_en timestamptz`; la migración siembra la fila con los tres valores en nulo. No es un log
de eventos: es el estado actual de un único acceso, y "está revocado" se lee como
`revocado_en IS NOT NULL AND restablecido_en IS NULL`. Sembrar la fila en la migración le saca al
método un camino —el de "todavía no hay registro"— que si no existiría solo en producción y ninguna
aserción visitaría. Esta migración **no crea ningún tipo enumerado**, como la de T19: ninguna columna es
de dominio cerrado.

**El "una sola vez" de T26 solo puede ser real acá.** T26 aserta que la revocación se registra una vez
contra un doble, dentro de una sola invocación. En ejecución no hay una sola invocación: Inngest
reintenta el step y cada corrida construye un proceso nuevo, así que `marcarRevocado` se va a llamar
muchas veces sobre la misma revocación. Por eso el método es idempotente **por estado, no por
contador**: si el acceso ya figura revocado, no pisa `revocado_en` ni `detalle` —conserva el instante y
el mensaje de la primera detección, que es lo que el operador necesita para saber cuándo empezó— y no
agrega ninguna fila. Si el acceso figura restablecido, una revocación nueva sí escribe el instante y el
detalle nuevos y vuelve a poner `restablecido_en` en nulo.

**El restablecimiento es una acción de operador, y por eso no hay método para él.** T26 dejó escrito que
ninguna tarea de este plan construye el flujo de re-autorización, y esta tampoco lo construye: el
operador escribe `restablecido_en` con un `UPDATE` directo, del mismo modo que la única recuperación de
un gasto en `needs_review` es reprocesar desde el panel de Inngest (Req. 10.3) y no desde la aplicación.
Lo que T53 sí verifica es que `estaRevocado` **lee el estado actual**: tras ese `UPDATE`, devuelve falso
y las llamadas a Gmail se reabren. Es la contracara persistente de la aserción de restablecimiento que
T26 escribe contra su doble, y sin ella una implementación que solo mira `revocado_en IS NOT NULL` deja
la casilla muerta para siempre aunque el usuario vuelva a autorizar.

**"Consultable" se aserta con SQL sobre la tabla, no con un método.** Con `/revision` fuera de alcance no
hay pantalla que muestre esto, así que el sentido observable del término es el mismo que T21 le dio a la
"cola de errores": un conjunto de filas que el operador puede consultar. La aserción es sobre la base y
no sobre el repositorio, siguiendo la convención de T16, T18 y T19: fija que el detalle y el instante
quedan legibles con una consulta y sobreviven a cualquier reescritura de los métodos.

**No depende de los fixtures.** Los detalles de error de las aserciones se escriben a mano dentro del
test: T53 no lee HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que
siguen ausentes del repositorio. Puede ejecutarse con ese bloqueo abierto. Sí requiere un Postgres
alcanzable y las convenciones de base que fijó T16.

**Lo que T53 no hace.** No habla con Gmail ni depende del cliente: no importa `ClienteGmail`, no declara
ni lanza `AccesoRevocadoError` y no decide **cuándo** se marca una revocación —eso es T26, que detecta
la señal de permiso retirado y llama a este repositorio—. No construye el flujo de re-autorización, no
dibuja ninguna superficie, no crea una tabla genérica de errores del sistema ni toca `gastos.ultimo_error`
(T22), que es por gasto y no sirve para un fallo que ocurre antes de que exista gasto alguno. No
persiste tokens: dónde viven las credenciales OAuth lo fijó el Decision log de T24.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.5 — `estaRevocado` sobre una base recién migrada devuelve **falso**, y tras `marcarRevocado`
  devuelve **verdadero**. Es el latch en su forma mínima: el estado que T26 consulta antes de cada
  llamada a Gmail sale de la base y no de la memoria del adaptador.
- 1.5 — Latch entre procesos: una **instancia nueva** de `RepositorioAccesoGmail`, construida sobre la
  misma base después de `marcarRevocado`, devuelve `estaRevocado` en verdadero. Simula el reinicio del
  proceso entre dos corridas de Inngest y es la aserción que hace persistente el latch que T26 verifica
  contra un doble en memoria; sin ella, la mitad (c) del criterio queda apoyada en un colaborador que
  en producción no existe.
- 1.5 — El detalle y el instante quedan **consultables**: una consulta SQL directa sobre
  `estado_acceso_gmail` devuelve el `detalle` recibido, byte a byte igual al que se pasó, y un
  `revocado_en` que conserva el instante exacto. La aserción es sobre la base y no sobre el
  repositorio, siguiendo la convención de T16, T18 y T19.
- 1.5 — Registro único: un segundo `marcarRevocado` con un detalle **distinto**, con el acceso ya
  revocado, deja la tabla con **una** fila y conserva el `revocado_en` y el `detalle` de la primera
  llamada. Es el "una sola vez" de T26 llevado al único nivel donde puede ser real: Inngest reintenta el
  step y cada corrida vuelve a llamar al método. El detalle distinto es lo que distingue un método
  idempotente de uno que pisa la fila y borra cuándo empezó realmente la revocación.
- 1.5 — Restablecimiento: tras un `UPDATE` directo que escribe `restablecido_en` —la acción de operador
  que reabre el acceso—, `estaRevocado` devuelve **falso**. Es lo que hace que el latch sea una lectura
  del estado actual y no un apagado permanente, y la contracara persistente de la aserción de
  restablecimiento de T26.
- 1.5 — Re-revocación: con el acceso restablecido, un `marcarRevocado` nuevo escribe el instante y el
  detalle nuevos, deja `restablecido_en` en nulo y `estaRevocado` vuelve a devolver verdadero. Sin esta
  aserción, la implementación más simple del criterio anterior —ignorar `revocado_en` cuando hay
  `restablecido_en`— deja el latch permanentemente apagado tras el primer restablecimiento.
- Andamiaje — las migraciones corren desde cero contra una base vacía y dejan `estado_acceso_gmail` con
  la forma descrita: la clave primaria `id` con `DEFAULT 1` y el `CHECK (id = 1)`, las tres columnas
  nullables y la fila sembrada. Un `INSERT` directo con `id = 2` es rechazado por el `CHECK`: es lo que
  fija que la fila única es una garantía del schema y no una convención de los métodos. Volver a correr
  las migraciones no falla ni duplica objetos.
- Este ciclo **no incorpora ninguna dependencia nueva**: usa el cliente de Postgres y la herramienta de
  migraciones que estrenó T16. No importa nada de `infra/gmail/`, y no necesita red ni credenciales.
- Verificación: `npm run typecheck && npm test` en verde con un Postgres alcanzable, respetando lo que
  el Decision log de T16 haya fijado sobre cómo corren los tests que necesitan la base.

**Decision log:**

- Migración `infra/db/migraciones/0003_estado_acceso_gmail.sql`: tabla de una fila con
  `id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)`, sembrada con los tres campos en nulo, tal como
  describe la tarea.
- `RepositorioAccesoGmail` en `infra/db/repositorioAccesoGmail.ts`: `marcarRevocado` es un único
  `UPDATE` con tres expresiones `CASE` sobre la misma condición (`revocado_en IS NOT NULL AND
  restablecido_en IS NULL`) — evalúa el estado actual y la escritura en la misma sentencia, sin
  `SELECT` previo, para no abrir una ventana de carrera entre reintentos de Inngest, la misma razón que
  T16 usó `INSERT ... ON CONFLICT` en vez de `SELECT` + `INSERT`. `estaRevocado` es un único `SELECT`
  que evalúa la misma condición booleana.
- No se inyecta un reloj (`ahora`) como en las funciones de dominio: `revocado_en` sale de `now()` del
  lado de la base. Es infraestructura, no una función pura que decide plata o fechas de negocio; el test
  verifica la marca de tiempo acotándola entre un `antes` y un `despues` capturados en el propio test, en
  vez de comparar contra un instante inyectado.

**Outcome:**

`RepositorioAccesoGmail` (`marcarRevocado`, `estaRevocado`) implementado en
`infra/db/repositorioAccesoGmail.ts`, con la migración `0003_estado_acceso_gmail.sql`. Ciclo TDD
completo: RED confirmado (módulo inexistente), GREEN (`npm run typecheck && npm test` verdes, 83/83
acumulados), mutación (se sacó el `CASE` de la columna `detalle` y se lo reemplazó por una escritura
incondicional `detalle = $1` — pisa el detalle de la primera revocación en cada reintento; falló
exactamente el test de "registro único" con el detalle de la segunda llamada en vez de la primera,
mientras los otros 6 —incluidos el latch entre instancias nuevas del repositorio, el restablecimiento y
la re-revocación, que ejercitan la misma condición pero no ese campo en ese escenario— siguieron en
verde), restaurada con Edit y reverificado verde. Sin desviaciones del diseño.

## T24 — `ClienteGmail`: listar y traer mensajes del remitente configurado

**Requisitos:** 1.1, 1.7
**Depende de:** T16

**Descripción:**

`infra/gmail/ClienteGmail` con las dos operaciones de lectura que fija `design.md`:
`listarMensajesDe(remitente, desde)`, que devuelve los identificadores de los mensajes del remitente
configurado recibidos a partir de un instante, y `traerMensajeCrudo(id)`, que devuelve el
`MensajeCrudo` completo de uno de ellos. Es el primer contacto del proyecto con Gmail, así que estrena
la dependencia del cliente de Gmail siguiendo la regla que fijó T1 —cada dependencia externa entra en
la tarea que la ejercita con un test propio— y fija en su Decision log las convenciones que heredan
T25, T26 y T39: qué cliente concreto se usa, cómo se inyecta el transporte, de dónde salen las
credenciales OAuth en ejecución y qué forma tiene el doble que las reemplaza en los tests.

**Por qué los dos métodos son un solo ciclo y no dos tareas.** Listar y traer son las dos mitades de
una misma lectura y ninguna sirve sola: `listarMensajesDe` devuelve identificadores que sin
`traerMensajeCrudo` no se pueden convertir en nada, y `traerMensajeCrudo` sin el listado no tiene de
dónde sacar un id. Comparten interfaz, archivo, transporte y doble. Es la misma granularidad de T21
—un adaptador, sus métodos, un ciclo—; partirlos duplicaría el armado del doble para obtener dos
tareas que no pueden fallar de forma interesante por separado.

**El transporte se inyecta y el test no toca la red.** El adaptador recibe el transporte de Gmail como
dependencia —no lo construye adentro—, de modo que el test lo sustituye por un doble sin credenciales,
sin variables de entorno y sin salida a internet. El doble no es un objeto que devuelve la respuesta
esperada: es una casilla simulada mínima que **honra la consulta** que el adaptador le manda, porque de
eso depende que la aserción de 1.7 signifique algo (ver más abajo). El invariante del diseño se sostiene
en el mismo movimiento: `infra/` traduce entre la API y el tipo del dominio, y no decide nada — no
filtra por asunto, no interpreta el aviso, no persiste.

**El remitente es un parámetro, no configuración que T24 lea.** La firma del diseño lo recibe, así que
"el remitente configurado" de 1.7 es, para esta tarea, el que le pasaron. Dónde vive esa configuración
y cómo se lee es de T39, que es quien la invoca desde el cron. T24 no crea un módulo de configuración
que T39 después tendría que duplicar o reemplazar.

**`MensajeCrudo` no se ensancha.** T16 lo declaró con `gmailMessageId`, `remitente`, `asunto`,
`headersCrudos`, `cuerpo` y `recibidoEn`, y dejó abierto si T21 o T24 necesitarían un campo más. T21 ya
resolvió que no; T24 tampoco: los seis campos salen de la respuesta de Gmail sin excepción —el id del
mensaje, los headers `From`, `Subject` y la marca temporal de recepción, el bloque de headers completo y
el cuerpo—. El tipo se importa de T16 sin redeclararlo y sin agregarle nada. De qué fuente concreta sale
`recibidoEn` —el header `Date` del email o la marca de recepción que agrega Gmail— es una decisión de la
implementación y va al Decision log; lo que no es opcional es que **`recibidoEn` no es la fecha del
gasto**: 3.4 prohíbe que `fecha_gasto` salga del header `Date`, y T30 usa un fixture donde los dos
valores difieren a propósito. Son dos hechos distintos y esta tarea solo produce el primero.

**Dos codificaciones, dos dueños — y esta es la frontera que no puede quedar en tierra de nadie.** La
respuesta de Gmail viene codificada en el transporte (base64url sobre el mensaje MIME), y **eso sí lo
decodifica T24**: es formato de cable, no contenido, y sin resolverlo `headersCrudos` y `cuerpo` serían
un bloque ilegible que ninguna aserción de fidelidad podría comparar. El `quoted-printable` del cuerpo,
en cambio, es contenido del email y **T24 no lo toca**: lo decodifica el step extraer con
`decodificarQuotedPrintable` (T1), que es exactamente lo que dice 2.1 —"WHEN un email crudo entra al
paso de extracción"—. La razón no es de reparto sino de corrección: 1.1 manda persistir el email
**crudo**, y si T24 entregara el cuerpo ya decodificado, la fila de `emails_crudos` dejaría de ser el
email original y el reprocesamiento de T40 volvería a decodificar un texto ya decodificado, corrompiendo
cualquier `=` literal que hubiera en el contenido. El cuerpo sale de T24 tal como viajó.

**Qué mitad de 1.1 verifica T24.** El reparto lo fijó T16 y esta tarea lo respeta: T16 asserta contra la
base que lo persistido está completo, T29 que se persiste antes que cualquier otro paso, T39 que el cron
emite un evento por mensaje, y T24 —esta— que **Gmail entregue el mensaje entero**. Es la mitad de
origen: si `traerMensajeCrudo` devuelve un `MensajeCrudo` sin el bloque de headers, la columna
`headers_crudos text NOT NULL` que T16 creó no tiene con qué llenarse, y el "completo, con headers y
cuerpo" de 1.1 se rompe aguas arriba de todas las aserciones que lo verifican aguas abajo. Por eso la
aserción de esta tarea nombra el campo `headersCrudos` de forma literal en vez de describirlo en prosa:
la traza tiene que apoyarse en el nombre que la implementación usa.

**1.7 se verifica con un caso negativo, y el doble es lo que lo hace real.** Gmail filtra del lado del
servidor: `users.messages.list` devuelve identificadores, no remitentes, así que el adaptador no puede
re-chequear el remitente de cada id sin traer los mensajes uno por uno. La garantía vive entonces en la
consulta, y ahí está la trampa — un doble que devuelve la lista que el test espera pasa la aserción
aunque el adaptador no haya restringido nada, porque quien filtró fue el test. Por eso el doble es una
casilla simulada que **contiene mensajes de otros remitentes** y que aplica la consulta recibida: si el
adaptador no restringe por remitente, el doble devuelve todo y la aserción falla. La consulta literal se
asserta además por separado, para que una restricción que "casi" filtra —texto libre en vez de una
restricción por remitente— quede visible en el test y no se descubra en producción.

**El doble que explota no aplica acá, y conviene decir por qué.** T21 lo necesitó porque su criterio
tenía una mitad negativa sobre un colaborador: "sin volver a consultarlo en Gmail" solo es verificable
si el `ClienteGmail` simulado falla al ser invocado. Los negativos de T24 —no decodificar
`quoted-printable`, no recortar los headers, no filtrar por asunto— son propiedades del valor devuelto y
se asertan mirándolo, no colaboradores de los que haya que abstenerse: el único colaborador de esta
tarea es el transporte, y llamarlo es precisamente lo que tiene que hacer.

**No depende de los fixtures.** El mensaje del doble se construye dentro del test como un email crudo
escrito a mano: T24 no lee HTML de aviso, no invoca `parsearAvisoSantander` y no toca los tres avisos
anonimizados que siguen ausentes del repositorio. Puede ejecutarse con ese bloqueo abierto. Tampoco
necesita Postgres: depende de T16 solo por el tipo `MensajeCrudo`, no por la base.

**Lo que T24 no hace.** No renueva el token vencido (T25) ni declara ni lanza `AccesoRevocadoError`
(T26): declarar acá una clase de error que ninguna aserción de esta tarea puede provocar repetiría lo
que T2 se prohibió con los campos de `DatosAviso` que todavía no extraía. No persiste nada —de eso se
ocupa `guardarSiEsNuevo` (T16) llamado desde el step ingestar (T29)—, no emite eventos (T39), no decide
cada cuánto se consulta la casilla, y no marca los mensajes como leídos ni les cambia etiquetas en
Gmail: la lectura no tiene efectos sobre la casilla. Tampoco usa `RepositorioAccesoGmail` ni la tabla
`estado_acceso_gmail` de T53: esa dependencia es de T26, que es quien detecta y registra la revocación;
listarla acá describía un prerequisito que ninguna aserción de este ciclo ejercita.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.7 — Con una casilla simulada que contiene mensajes del remitente configurado **y mensajes de otros
  remitentes**, y que aplica la consulta que recibe, `listarMensajesDe` devuelve exactamente los
  identificadores de los primeros y ninguno de los segundos. El doble aplica el filtro en lugar de
  devolver la respuesta esperada: es lo que hace que la aserción falle cuando el adaptador no restringe
  por remitente, en vez de pasar porque quien filtró fue el test.
- 1.7 — La consulta que el adaptador le manda al transporte restringe por el remitente **recibido como
  parámetro** y lo hace como restricción de remitente, no como texto libre. Se asserta sobre la consulta
  registrada por el doble: es la mitad que detecta una restricción que sobre-empareja y que el caso
  anterior, con una casilla acotada, podría no ejercitar.
- 1.1 — `traerMensajeCrudo` devuelve un `MensajeCrudo` cuyo campo **`headersCrudos`** contiene el bloque
  de headers completo del mensaje entregado por la API —incluidos headers que el tipo no proyecta en
  ningún otro campo, y los saltos de línea de plegado—, comparado por igualdad exacta contra el bloque
  del mensaje simulado. Nombrar el campo es deliberado: es la única fuente de la columna
  `headers_crudos NOT NULL` que creó T16, y una aserción que hablara de "headers completos" sin nombrarlo
  se satisface con un objeto que los trae proyectados en `remitente` y `asunto` y pierde el bloque.
- 1.1 — El `cuerpo` devuelto es **byte a byte** idéntico al del mensaje entregado por la API, con el
  mismo caso no ASCII, comillas y saltos de línea que T16 fija para 1.1. La comparación es de igualdad
  exacta sobre la cadena entera, no de contención: descarta recortes, colapsos de `CRLF` a `LF` y
  reencodeos silenciosos en el borde de entrada, que es donde 1.1 empieza.
- 1.1 — El cuerpo del mensaje simulado incluye construcciones `quoted-printable` —un salto suave y una
  secuencia `=XX`— y el `cuerpo` devuelto **las conserva sin decodificar**. Es la aserción que fija la
  frontera con 2.1: la decodificación es del step extraer (T30, vía la función de T1), y un adaptador
  que se adelanta rompe el "crudo" de 1.1 y hace que el reprocesamiento de T40 decodifique dos veces.
- 1.1 — Los campos consultables del `MensajeCrudo` devuelto —`gmailMessageId`, `remitente`, `asunto` y
  `recibidoEn`— corresponden al mensaje pedido, `recibidoEn` conservando el instante exacto. Son las
  proyecciones que T16 guarda en columnas propias y de las que dependen las consultas de T21 y T40; se
  asertan acá porque salen del mismo bloque de headers y un error de mapeo entre ellas no lo detecta
  ninguna aserción de fidelidad del bloque.
- Fidelidad de la consulta — `listarMensajesDe` traslada el parámetro `desde` a la consulta como cota
  temporal inferior: con la casilla simulada conteniendo mensajes anteriores y posteriores a ese
  instante, el resultado excluye los anteriores. No traza a ningún criterio numerado, pero es el
  mecanismo con el que T39 consulta desde la última corrida en vez de re-listar la casilla entera en
  cada ejecución.
- Decodificación del transporte — el mensaje simulado se entrega con la codificación de transporte real
  de la API (base64url sobre el mensaje MIME) y el adaptador la resuelve: `headersCrudos` y `cuerpo`
  salen como texto. Es la contracara de la aserción anterior sobre `quoted-printable` y las dos juntas
  son las que dejan la frontera de decodificación escrita en el test y no en la prosa.
- Este ciclo **incorpora la dependencia del cliente de Gmail**, que ninguna tarea anterior usó, y no
  incorpora ninguna otra: no necesita Postgres, y el tipo `MensajeCrudo` se importa de T16 sin
  redeclararlo.
- Verificación: `npm run typecheck && npm test` en verde, sin red, sin credenciales y sin Postgres.

**Decision log:**

- Ubicación: `infra/gmail/clienteGmail.ts` + `.test.ts` colocado, primer archivo de `infra/gmail/`.
- **Forma del transporte inyectado**, no fijada por `design.md`: se modeló sobre la forma real de la
  API de Gmail (la misma que expone el SDK oficial `googleapis`), no sobre una interfaz de conveniencia
  inventada para el test. `listarMensajes({ q }): Promise<{ mensajes: { id }[] }>` refleja
  `users.messages.list`; `obtenerMensaje(id): Promise<{ raw, internalDate }>` refleja
  `users.messages.get({ format: 'raw' })` — `raw` es el MIME completo en base64url y `internalDate` es
  la marca de recepción que agrega Gmail (epoch millis), presente en la respuesta sin importar el
  `format` pedido. Elegir el `q` de búsqueda de Gmail en vez de parámetros estructurados fue deliberado:
  es lo único que la API real acepta para filtrar, así que el doble de test **tiene** que parsear una
  cadena de búsqueda para aplicar el filtro de verdad, en vez de que un parámetro estructurado dejara
  pasar una implementación que no construye la consulta correctamente.
- **`recibidoEn` sale de `internalDate` de Gmail, no del header `Date` del email.** Es más confiable
  (no depende de que el cliente de correo del remitente haya puesto una fecha razonable) y evita
  reimplementar un parser de fechas RFC 5322 solo para esta proyección. Registrado porque la tarea lo
  deja explícitamente como decisión de implementación a documentar.
- La separación headers/cuerpo busca primero `\r\n\r\n` y cae a `\n\n` si no aparece, para tolerar los
  dos estilos de salto de línea sin asumir cuál usa el mensaje.
- `extraerHeader` despliega líneas de continuación (RFC 5322: una continuación empieza con espacio o
  tab) **solo** para las dos proyecciones (`remitente`, `asunto`); `headersCrudos` conserva el bloque
  tal cual, plegado incluido.
- **Hallazgo propio corregido antes de cerrar el ciclo:** la primera versión declaraba
  `AccesoRevocadoError` en este archivo, anticipando T26. Es exactamente lo que la descripción de la
  tarea prohíbe ("no declara ni lanza `AccesoRevocadoError`: repetiría lo que T2 se prohibió con campos
  que todavía no extraía"). Se detectó releyendo "Lo que T24 no hace" antes de correr los tests y se
  quitó; ningún test llegó a depender de ella.

**Outcome:**

`ClienteGmail` (`listarMensajesDe`, `traerMensajeCrudo`) y el tipo `TransporteGmail` implementados en
`infra/gmail/clienteGmail.ts`. Ciclo TDD completo: RED confirmado (módulo inexistente), GREEN (`npm run
typecheck && npm test` verdes, 89/89 acumulados, sin red ni credenciales), mutación (se quitó el prefijo
`from:` de la consulta, dejando el remitente como texto libre — exactamente el modo de falla que
describe el criterio 1.7; fallaron los 3 tests de `listarMensajesDe` —incluida ids devueltos, la
aserción directa sobre la consulta enviada, y la cota temporal, que dejó de filtrar porque el doble ya
no reconocía ningún `from:` y devolvía una lista vacía—, mientras los 3 de `traerMensajeCrudo`
siguieron en verde por no tocar esa rama), restaurada con Edit y reverificado verde. Sin desviaciones
del diseño más allá del hallazgo propio ya documentado.
## T25 — `ClienteGmail`: renovación del token vencido y reintento

**Requisitos:** 1.4
**Depende de:** T24

**Descripción:**

Cuando el transporte de Gmail rechaza una llamada porque el token de acceso está vencido, el
`ClienteGmail` lo renueva con el token de refresco y **reintenta la operación original una sola vez**,
de forma transparente para el llamador. El renovador entra como dependencia inyectada, igual que el
transporte que estrenó T24: el test corre sin red, sin credenciales y sin Postgres, y `infra/` sigue sin
decidir nada de negocio —renovar y reintentar es traducción de protocolo, no una regla del dominio—.
Dónde viven en ejecución el token de refresco y el resto de las credenciales OAuth es la decisión de T24;
esta tarea no crea un módulo de credenciales paralelo.

**El criterio pide dos cosas y la segunda es la que se olvida.** 1.4 manda renovar **y** reintentar la
operación. Una implementación que renueva el token y devuelve igual el error satisface la mitad visible
del criterio y falla el criterio entero. Por eso la aserción del camino feliz no se conforma con "no
hubo excepción" ni con "se llamó al renovador": exige que la operación original **devuelva su
resultado** —los identificadores de `listarMensajesDe`, el `MensajeCrudo` de `traerMensajeCrudo`— tal
como lo habría devuelto si el token nunca hubiera vencido.

**El doble se maneja por token, no por número de llamada, y esa es la decisión central del test.** Un
transporte simulado que rechaza la primera llamada y acepta la segunda pasa aunque el reintento vuelva a
mandar el token vencido: quien decidió el éxito fue el contador del doble, no el token nuevo. Acá el
transporte simulado **valida el token que recibe**: rechaza con la señal de token vencido cualquier
llamada que traiga el token viejo y responde con éxito solo a la que traiga el token que el renovador
devolvió. Así, un reintento que reusa el token vencido vuelve a ser rechazado y el test falla, que es
exactamente lo que tiene que pasar. Es la misma lógica con la que T24 hizo que su casilla simulada
aplicara la consulta en vez de devolver la respuesta esperada.

**La guarda del token válido es de esta tarea, y va con el doble que explota.** T24 dejó el hallazgo
explícito: no puso la guarda "un token válido no dispara la renovación" porque el renovador lo introduce
T25 y exigirla antes invertiría el orden de dependencias. Acá sí aplica el recurso que estrenó T21 —un
colaborador simulado que **falla el test si se lo invoca**—: el caso del token válido corre con un
renovador que explota al ser llamado. Sin esa guarda, una implementación que renueva en cada request
pasa el camino feliz sin que nada la delate y quema la cuota de la API en producción.

**El reintento es acotado por construcción.** Si el token que el renovador devuelve también viene
vencido, no se renueva otra vez: la operación falla y propaga el error. El presupuesto es de una
renovación y un reintento por llamada, no un bucle que renueve hasta que alguna vez ande. Lo que sigue
después es el reintento con espera creciente del step de Inngest (10.1) y, agotado, `needs_review` con
`ultimo_error` (10.2) —otro nivel, otras tareas (T28, T35)—. El reintento de T25 vive dentro de una sola
invocación del adaptador y es seguro porque las dos operaciones son de lectura pura: repetirlas no tiene
efectos sobre la casilla.

**Frontera con T26 — qué distingue un token vencido de un acceso revocado.** Desde afuera los dos son
"Gmail no me deja entrar", y el diseño los separa a propósito: el vencido se renueva y se reintenta
(1.4), el revocado corta seco, no se reintenta y el error queda registrado de forma persistente y
consultable por el operador (1.5, sin superficie in-app —`/revision` está fuera de alcance—). El
discriminador no es el código de estado sino la **señal específica que devuelve la API**: credencial
expirada, que se arregla sola con el token de refresco, contra permiso retirado por el usuario, donde
renovar es imposible porque el token de refresco también dejó de valer. Por eso T25 dispara la
renovación **solo ante la señal de token vencido**, no ante cualquier fallo de autorización: una
implementación que generaliza a "todo error de auth se renueva y se reintenta" se come el camino de T26.
Esa mitad negativa —revocado no renueva y no reintenta— la assertea T26 y **no se duplica acá**; lo que
esta tarea deja escrito es el discriminador, para que T26 tenga contra qué fallar. T25 tampoco declara
ni lanza `AccesoRevocadoError`: la clase es de T26, que es donde una aserción puede provocarla.

**Lo que T25 no hace.** No persiste el token renovado ni gestiona su ciclo de vida más allá de la
llamada en curso —1.4 no lo pide y ninguna otra tarea lo consume—, no cambia la interfaz `ClienteGmail`
que fija `design.md`, no reimplementa las operaciones de T24 y no toca los fixtures de aviso: el mensaje
del transporte simulado se escribe a mano dentro del test, como en T24.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.4 — Con un transporte simulado que **valida el token recibido** —rechaza con la señal de token
  vencido el token viejo y acepta el nuevo— y un renovador simulado que, invocado con el token de
  refresco, devuelve un token nuevo distinto y literal, `traerMensajeCrudo` **devuelve el `MensajeCrudo`
  esperado** y el llamador no observa ningún error. Es la mitad "reintentar la operación" del criterio:
  se assertea el valor devuelto, no la ausencia de excepción.
- 1.4 — En ese mismo caso, la segunda llamada al transporte —la del reintento— viaja con el **token
  nuevo**, comparado por igualdad exacta contra el que devolvió el renovador, y no con el vencido. Se
  assertea sobre el token que el doble registró en cada invocación. Es lo que distingue una renovación
  real de un reintento a ciegas que vuelve a mandar la credencial muerta.
- 1.4 — El renovador es invocado **exactamente una vez** y **con el token de refresco**. Sin la segunda
  mitad, una implementación que renueva mandando cualquier cosa —o el propio token vencido— pasa el
  camino feliz porque el doble le responde igual.
- 1.4 — La renovación cubre **las dos operaciones de la interfaz**: el mismo recorrido
  vencido → renovar → reintentar, con los mismos dobles, deja a `listarMensajesDe` devolviendo los
  identificadores esperados. Detecta la implementación que cablea la renovación en un solo método y deja
  al otro fallando ante un token vencido, que es la forma más barata de pasar las aserciones anteriores.
- 1.4 — Guarda del token válido: con un transporte que acepta el token inicial y un **renovador que
  falla el test si se lo invoca**, la operación devuelve su resultado y el renovador nunca es llamado.
  Es el doble que explota de T21 y es la única aserción que descarta la implementación que renueva en
  cada request —que pasa todo lo anterior y quema la cuota de la API—.
- 1.4 — Reintento acotado: si el token que devuelve el renovador **también** es rechazado por vencido,
  la operación falla propagando el error, el renovador fue invocado **exactamente una vez** y el
  transporte **exactamente dos veces**. Es la cota que impide el bucle infinito de renovación; sin
  contar las invocaciones, una implementación que reintenta para siempre termina colgando el test en vez
  de fallarlo.
- Frontera con T26 — la renovación se dispara ante la señal de **token vencido**, no ante cualquier
  fallo de autorización. La mitad negativa (acceso revocado: ni renovación ni reintento) la assertea
  T26; no se duplica acá. Se anota como criterio para que quede escrito que T25 no puede generalizar el
  disparador sin romper T26.
- Este ciclo **no incorpora ninguna dependencia nueva**: el cliente de Gmail lo estrenó T24 y el
  renovador se inyecta como doble. Sin red, sin credenciales, sin Postgres y sin fixtures.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

- Extiende `infra/gmail/clienteGmail.ts` (sin archivo nuevo): `TransporteGmail` pasa a recibir el
  `token` vigente en cada operación; nueva clase `TokenVencidoError`; `crearClienteGmail` pasa a recibir
  `credenciales: CredencialesGmail` (`tokenAcceso`, `tokenRefresco`) y `renovarToken`. Un solo helper
  interno `conRenovacion` envuelve las dos operaciones de `ClienteGmail`, así que la renovación cubre
  las dos por construcción y no hay dos copias de la lógica de reintento.
- **Dónde viven las credenciales en ejecución** (pregunta que la tarea deja abierta y pide resolver):
  variables de entorno leídas por la raíz de composición (T29, donde se construye el `ClienteGmail` real
  contra la API), no por este módulo — `crearClienteGmail` solo recibe `CredencialesGmail` ya resuelto.
  No se crea ningún módulo de configuración nuevo.
- El estado del token renovado (`tokenActual`) se cachea en una variable local a la instancia del
  adaptador, no se persiste: sirve para no repetir la renovación en llamadas subsiguientes de la misma
  instancia, pero no sobrevive al proceso — 1.4 no lo exige y ninguna tarea posterior lo consume.
- **Actualización necesaria de T24, ya cerrada:** extender `crearClienteGmail` con dos parámetros
  nuevos obligatorios rompe la compilación de los 6 tests de T24 (que la llamaban con un solo
  argumento). Se actualizaron sus 6 call sites para pasar `CREDENCIALES_NEUTRAS` y un
  `renovadorQueFalla` (el mismo doble que explota que T25 formaliza como criterio propio), y se
  reverificó que las 6 aserciones originales de T24 siguen pasando sin cambios — la interfaz
  `ClienteGmail` que fija `design.md` no cambió, solo el constructor, que `design.md` no congela.

**Outcome:**

`crearClienteGmail` extendido con renovación de token y `TokenVencidoError` en
`infra/gmail/clienteGmail.ts`. Ciclo TDD completo: RED confirmado (4 de 11 tests fallaban: 2 por
`TokenVencidoError is not a constructor`, 2 por comportamiento incorrecto contra la firma vieja; los
otros 7, incluidos los 6 de T24 ya actualizados a la nueva firma, pasaban desde antes de tocar la
implementación), GREEN (`npm run typecheck && npm test` verdes, 94/94 acumulados, 11/11 en este
archivo), mutación (se reemplazó la guarda `if (!(error instanceof TokenVencidoError))` por
`if (false)` — dispara renovación ante cualquier error, generalizando el disparador que la tarea prohíbe
generalizar; falló exactamente el test "frontera con T26", cuyo error dejó de ser el original
`'permiso retirado por el usuario'` y pasó a ser el del renovador que explota, mientras los otros 10
—incluidos los 4 de renovación real y los 6 de T24— siguieron en verde), restaurada con Edit y
reverificado verde. Sin desviaciones del diseño.

## T26 — `ClienteGmail`: acceso revocado, sin reintentos y sin volver a llamar

**Requisitos:** 1.5
**Depende de:** T25, T53

**Descripción:**

Cuando la API devuelve la señal de **permiso retirado**, el `ClienteGmail` lanza `AccesoRevocadoError`
sin renovar el token y sin reintentar, deja registrada la revocación de forma **persistente y
consultable por el operador** —no en una superficie in-app: `/revision` está fuera de alcance— y, a
partir de ese momento, **no vuelve a llamar a Gmail** hasta que el acceso se restablezca. Es la mitad
negativa que T25 dejó escrita como frontera y deliberadamente no asertó.

**El criterio tiene tres mitades y el borrador solo trazaba una.** 1.5 manda (a) detener los
reintentos, (b) registrar el error de forma persistente y consultable, y (c) no volver a llamar a Gmail
hasta que el acceso se restablezca. Las dos aserciones de bootstrap cubrían (a) y nombraban (b) mal
—hablaban de un error "visible en la aplicación", que contradice la decisión de alcance del 2026-08-26
y la tabla de manejo de errores de `design.md`—. Nadie verificaba (c), que es la mitad cara: sin ella,
cada mensaje pendiente y cada corrida del cron de T39 vuelven a golpear una API que ya dijo que no,
queman la cuota y llenan el registro con el mismo error repetido.

**Un solo pedazo de estado sirve para (b) y para (c), y por eso esto es un ciclo y no dos tareas.** El
registro que hace consultable la revocación y el latch que impide la próxima llamada necesitan
exactamente el mismo hecho: "el acceso a Gmail está revocado, desde tal instante, con tal detalle", y
ese hecho tiene que **sobrevivir al reinicio del proceso** —cada corrida de un step de Inngest es un
proceso distinto, así que un booleano en memoria del adaptador se pierde entre invocaciones y el latch
no late—. El adaptador recibe ese registro **inyectado** bajo el puerto `RepositorioAccesoGmail` que
fija T53 (T26 lo importa sin redeclararlo, igual que T21 y T24 importan `MensajeCrudo` de T16), igual
que el transporte que estrenó T24 y el renovador que estrenó T25: escribe la revocación al detectarla
con `marcarRevocado` y consulta el estado antes de cada llamada con `estaRevocado`. El test lo
sustituye por un doble en memoria que implementa el mismo puerto, así que corre sin red, sin
credenciales y sin Postgres — la implementación que sí toca la base es T53, y esta tarea no la
reimplementa ni la duplica. `infra/` sigue sin decidir nada de negocio: cortar y registrar es política
de protocolo, no una regla del dominio.

**La pregunta abierta que dejó el borrador de esta tarea ya está resuelta por T53.**
`estado_acceso_gmail` es la tabla y `RepositorioAccesoGmail` el repositorio real: la mitad (b) del
criterio —"registrado de forma persistente y consultable"— deja de estar verificada solo hasta el borde
del puerto. Esta tarea sigue doblando el puerto en memoria porque su ciclo TDD es sobre el adaptador de
Gmail y no sobre Postgres; la verificación de que el registro sobrevive de verdad contra una base real
es responsabilidad de T53 y no se duplica acá.

**El discriminador es el de T25, usado al revés.** T25 fijó que la señal que dispara la renovación es
**credencial expirada**, no cualquier fallo de autorización, precisamente para dejarle a T26 contra qué
fallar. Acá el transporte simulado responde la otra señal —**permiso retirado por el usuario**, donde
renovar es imposible porque el token de refresco también dejó de valer— y la aserción exige que el
renovador no sea invocado ni una vez. No se duplica el camino feliz de T25: sus tests ya están en la
suite y una implementación que generalizara el latch a "todo error de auth" los rompería sola.

**El doble que explota es lo que vuelve real la mitad (c).** "Sin volver a llamar a Gmail" no se puede
asertar mirando un valor devuelto: es una abstención sobre un colaborador, el mismo caso que estrenó
T21 y que T25 reusó para la guarda del token válido. Después de la revocación, el transporte se
reemplaza por uno que **falla el test si se lo invoca**; la llamada siguiente tiene que terminar en
`AccesoRevocadoError` sin haberlo tocado. Un transporte que se limita a devolver otra vez el error de
permiso retirado no sirve: la aserción pasaría igual con un adaptador que sale a la red en cada
intento, que es exactamente la implementación que 1.5 prohíbe.

**El latch se lee, no se recuerda — y ahí está la aserción que separa las dos implementaciones.** Un
campo de instancia del adaptador pasa la aserción anterior y no cumple el criterio: la próxima corrida
de Inngest construye un cliente nuevo y vuelve a salir a Gmail. Por eso hay un caso donde una
**instancia nueva** de `ClienteGmail`, construida sobre el mismo registro y con el transporte que
explota, también rechaza sin llamar. Y la contracara: con un registro que informa el acceso **no
revocado**, la operación sale a Gmail y devuelve su resultado, porque 1.5 dice "hasta que el acceso se
restablezca" y no "para siempre".

**Lo que T26 no hace.** No construye el flujo de re-autorización que restablece el acceso —1.5 lo
presupone pero no lo pide, y T53 tampoco lo construye—: el test se limita a demostrar que el latch lee
el estado actual, de modo que restablecerlo reabre las llamadas. No dibuja ninguna superficie —la
decisión de alcance del 2026-08-26 dejó "Errores del sistema" fuera de esta versión—, no crea la tabla
ni el repositorio del registro persistente (eso es T53), no cambia la interfaz `ClienteGmail` que fija
`design.md` más allá de sumar el colaborador inyectado, no reimplementa las operaciones de T24 ni la
renovación de T25, no persiste tokens y no toca los fixtures de aviso: el mensaje del transporte
simulado se escribe a mano dentro del test, como en T24 y T25.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.5 — Con un transporte simulado que responde la señal de **permiso retirado**, `traerMensajeCrudo`
  lanza `AccesoRevocadoError`, el transporte fue invocado **exactamente una vez** y el renovador
  simulado —el mismo doble que explota de T25— **nunca fue llamado**. Es la mitad (a) y a la vez la
  mitad negativa del discriminador que T25 dejó escrito: sin la aserción sobre el renovador, una
  implementación que trata todo fallo de auth como token vencido pasa igual.
- 1.5 — El mismo recorrido deja a `listarMensajesDe` lanzando `AccesoRevocadoError` con las mismas
  cotas de invocación. Detecta la implementación que cablea el corte en un solo método y deja al otro
  renovando y reintentando contra un permiso retirado, que es la forma más barata de pasar la aserción
  anterior.
- 1.5 — La revocación queda registrada **una sola vez** en el doble de `RepositorioAccesoGmail`, con el
  detalle del error recibido de la API y el instante en que ocurrió. Es la mitad (b) hasta el borde del
  puerto; que ese registro sea efectivamente persistente y consultable por el operador lo verifica T53
  contra la tabla real, y no se repite acá.
- 1.5 — Latch: tras la revocación, con el transporte **reemplazado por uno que falla el test si se lo
  invoca**, la llamada siguiente termina en `AccesoRevocadoError` sin tocar el transporte. Es la mitad
  (c), la que ninguna aserción cubría, y el doble que explota es lo único que la hace verificable: con
  un transporte que devuelve el error otra vez, la aserción pasaría con un adaptador que sale a la red
  en cada intento.
- 1.5 — Latch persistente: una **instancia nueva** de `ClienteGmail` construida sobre el mismo doble de
  `RepositorioAccesoGmail` —simula el reinicio del proceso entre dos corridas de Inngest— y con el
  transporte que explota también rechaza sin llamar. Descarta la implementación que guarda la
  revocación en un campo de instancia, que pasa la aserción anterior y no late entre invocaciones, que
  es donde el criterio importa.
- 1.5 — Restablecimiento: con un doble de `RepositorioAccesoGmail` que informa el acceso **no
  revocado**, la operación sale al transporte y devuelve su resultado. El latch es una lectura del
  estado actual, no un apagado permanente; sin esta aserción, una implementación que rechaza para
  siempre una vez marcada la revocación pasa todo lo anterior y deja la casilla muerta aunque el
  usuario vuelva a autorizar.
- Este ciclo **no incorpora ninguna dependencia nueva**: el cliente de Gmail lo estrenó T24, el
  renovador lo estrenó T25 y el registro de acceso entra como doble en memoria del puerto
  `RepositorioAccesoGmail` que fija T53. Sin red, sin credenciales, sin Postgres y sin fixtures. La
  implementación concreta que persiste a Postgres es T53, que esta tarea no reimplementa ni duplica.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

- Extiende `infra/gmail/clienteGmail.ts`: dos clases nuevas —`PermisoRevocadoError` (señal del
  transporte, distinta de `TokenVencidoError`) y `AccesoRevocadoError` (lo que ve el llamador, ya
  declarada en `design.md`)—; `crearClienteGmail` pasa a recibir un cuarto parámetro,
  `repositorioAccesoGmail: RepositorioAccesoGmail`, **importado de T53 sin redeclararlo**. Un segundo
  helper, `conLatchDeRevocacion`, envuelve a `conRenovacion` (T25): primero consulta el latch —sin
  tocar el transporte si ya está revocado—, y si la operación falla con `PermisoRevocadoError`, marca
  la revocación y traduce a `AccesoRevocadoError` antes de propagar.
- **Actualización necesaria de T24 y T25, ya cerradas:** el cuarto parámetro obligatorio rompe los 11
  call sites anteriores. Se agregó un doble neutro `repositorioNoRevocado()` (`estaRevocado` siempre
  `false`) a los 11, y se reverificó que las 11 aserciones originales siguen pasando sin cambios.
- Doble de test para T26: `crearRepositorioAccesoGmailEnMemoria`, que implementa el mismo puerto que
  T53 define contra Postgres — el mismo patrón que usa T53 para su propia base de test, pero en memoria,
  porque el ciclo de esta tarea es sobre el adaptador de Gmail y no sobre la base.
- El orden de las dos comprobaciones dentro de `conLatchDeRevocacion` es deliberado: el latch se
  consulta **antes** de invocar `conRenovacion`, para que una revocación ya conocida corte sin tocar el
  transporte ni el renovador en absoluto — es lo que hace reales los dos criterios de "no volver a
  llamar a Gmail".

**Outcome:**

`PermisoRevocadoError`, `AccesoRevocadoError` y el latch de revocación implementados en
`infra/gmail/clienteGmail.ts`, con `RepositorioAccesoGmail` (T53) inyectado. Ciclo TDD completo: RED
confirmado (3 de 17 tests fallando por comportamiento incorrecto; los otros 14 ya pasaban, incluidos
2 casos donde `toThrow(AccesoRevocadoError)` resultó trivialmente satisfecho porque las clases todavía
no existían en el módulo, detalle registrado y no oculto), GREEN (`npm run typecheck && npm test`
verdes, 100/100 acumulados, 17/17 en este archivo), mutación (se reemplazó la consulta real al latch
`await repositorioAccesoGmail.estaRevocado()` por `false` — el bug que la mitad (c) del criterio existe
para impedir, un adaptador que vuelve a salir a Gmail después de una revocación conocida; fallaron
exactamente los 2 tests de latch —dentro de la misma instancia y entre instancias nuevas, ambos con el
transporte que explota si se lo invoca—, mostrando el error genérico del transporte en vez de
`AccesoRevocadoError`, mientras los otros 15 siguieron en verde), restaurada con Edit y reverificado
verde. Sin desviaciones del diseño.
## T27 — `inferirCategoria`: conjunto cerrado con abstención

**Requisitos:** 6.1, 6.7
**Depende de:** T14

**Descripción:**

`infra/ia/inferirCategoria(comercio, cliente)` le pide al modelo, con salida estructurada, una
respuesta restringida al conjunto cerrado de cuatro valores que fija 6.1 —`Salidas`, `Comida`,
`Extras` y `no_estoy_seguro`— junto con una justificación breve, y traduce esa respuesta al tipo del
dominio: una categoría con su justificación cuando el modelo se pronunció, o nulo cuando se abstuvo.
Es el único punto de todo el sistema donde se invoca un modelo, y estrena tanto el puerto `ClienteIA`
como la dependencia del SDK de Anthropic. Se testea con un cliente simulado: esta tarea no llama al
modelo real, no necesita credenciales y no sale a la red.

**El conjunto que se le pide al modelo tiene cuatro valores, no tres.** Es la corrección central de
esta tarea y la fija 6.1 de forma literal: el conjunto cerrado está "formado por `Salidas`, `Comida`,
`Extras` y `no_estoy_seguro`". `CATEGORIAS_INFERIBLES` —que T14 declaró con exactamente tres— es el
conjunto de categorías **ofrecibles**, no el de respuestas admisibles. `design.md` los distingue con
dos nombres y deriva el segundo del primero: `RESPUESTAS_IA = [...CATEGORIAS_INFERIBLES,
'no_estoy_seguro']`. T27 importa `CATEGORIAS_INFERIBLES` de `dominio/categorizacion/` y no lo
redeclara; `RESPUESTAS_IA` se declara acá, en `infra/ia/`, porque la abstención es un valor del
protocolo con el modelo y no una categoría del dominio: ninguna regla puede asignarla, ninguna
imputación puede llevarla y la bandeja nunca la muestra.

**Por qué la abstención (6.7) entra acá y no en T28 ni en T35.** 6.7 tiene dos mitades con dueños
distintos. La mitad que le toca a esta tarea es la de la función pura de traducción: si el modelo
responde `no_estoy_seguro`, `inferirCategoria` **no** devuelve esa cadena como categoría, devuelve
nulo. No es una repetición de T28: T28 valida en el borde una respuesta que cae **fuera** del conjunto
cerrado (6.4), y `no_estoy_seguro` cae **adentro** —es una respuesta perfectamente válida del
protocolo—, así que una implementación que solo chequee pertenencia a `RESPUESTAS_IA` pasa todo T28 y
devuelve `{ categoria: 'no_estoy_seguro' }` al llamador, violando el tipo `InferenciaCategoria` que
`design.md` restringe a `CATEGORIAS_INFERIBLES`. Y tampoco es la mitad de T35: lo que pasa con el gasto
—`Sin categorizar`, origen `ia`, sin confirmar, sin categoría propuesta— ocurre en el step categorizar
sobre el nulo que esta función devuelve, y hoy no tiene tarea asignada (ver "Lo que T27 no hace").
Sin esta mitad acá, T27 declararía `no_estoy_seguro` como respuesta admisible sin que ninguna aserción
verifique qué hace el sistema cuando el modelo efectivamente la usa: la declaración quedaría
decorativa.

**`ClienteIA` es el puerto que estrena esta tarea.** `design.md` lo nombra en la firma de
`inferirCategoria` pero nunca declara su interfaz, así que T27 la declara —es la primera y única tarea
que la necesita— y fija en su Decision log las convenciones que heredan T28, T33, T34 y T35: qué
cliente concreto envuelve al SDK de Anthropic, cómo se declara el schema de salida estructurada, de
dónde sale la credencial en ejecución y qué forma tiene el doble que la reemplaza en los tests.
Siguiendo el precedente de T24 con el transporte de Gmail, el puerto se mantiene mínimo: una sola
operación, la que esta tarea ejercita. No se declara acá nada que ninguna aserción de T27 pueda
provocar.

**El cliente se inyecta y el test no toca la red.** Es la convención que ya fijaron T24 y T25 para
Gmail y esta tarea la repite sin variantes: `inferirCategoria` recibe el `ClienteIA` como parámetro
—no lo construye adentro—, de modo que el test lo sustituye por un doble sin credenciales, sin
variables de entorno y sin salida a internet. El doble registra la solicitud que recibe, porque de eso
depende que la aserción de 6.1 signifique algo: un doble que solo devuelve la respuesta esperada pasa
igual aunque la solicitud no haya restringido nada, y la restricción del enum es precisamente lo que
6.1 manda verificar.

**El doble que explota no aplica acá, y conviene decir por qué.** T21 y T33 lo necesitan porque sus
criterios tienen una mitad negativa sobre un colaborador —"sin volver a consultarlo en Gmail", "el
modelo no se invoca"—. El único colaborador de T27 es el `ClienteIA`, y llamarlo es exactamente lo que
esta tarea tiene que hacer. La aserción de que el modelo **no** se invoca cuando una regla coincide es
de T33 (6.2) y no se toca acá.

**El alcance de la IA no se ensancha.** Invariante duro del diseño: la extracción es un parser
determinista y el modelo se usa **solo** para inferir la categoría de un comercio desconocido. La
entrada de esta función es una cadena de comercio y nada más —no recibe el HTML del aviso, ni el monto,
ni la fecha, ni el email crudo— y su salida es una categoría con una justificación. Esta tarea no
introduce ningún otro uso de un modelo en el sistema.

**Qué fija `design.md` sobre la restricción de la respuesta, y qué no.** Fija el modelo
(`claude-sonnet-5`), la salida estructurada restringida a `RESPUESTAS_IA`, y que **la validación del
enum se hace igual en el borde porque la restricción del schema es una ayuda, no una garantía** —el
mismo precedente que dejó T20 al validar aunque el schema ya restrinja—. Esa validación de borde es
6.4 y es de T28: T27 se ocupa de que la solicitud **declare** la restricción y de que el prompt
instruya explícitamente a responder `no_estoy_seguro` cuando el comercio no permita inferir con
confianza y a **no** adivinar, que es la razón por la que la abstención existe. `design.md` no fija
temperatura, semilla ni reintentos para esta llamada, así que T27 no inventa ninguno: los reintentos
son de 6.5 y viven en T28.

**No depende de los fixtures.** Su entrada es una cadena de comercio construida en el test: no lee
HTML, no invoca `parsearAvisoSantander` y no toca los tres avisos anonimizados que siguen ausentes del
repositorio. Tampoco necesita Postgres. Puede ejecutarse con ese bloqueo todavía abierto.

**Lo que T27 no hace.** No valida en el borde una respuesta fuera del conjunto cerrado ni maneja la
falla del modelo tras agotar reintentos: las dos son T28 (6.4, 6.5), y esta tarea no las anticipa. No
decide **cuándo** llamar al modelo —derivar a inferencia solo cuando ninguna regla coincidió es 6.2, en
T33—. No toca el gasto: no le asigna categoría, no registra el origen `ia`, no lo deja sin confirmar y
no persiste la justificación; eso es `asignarCategoria` (T22) llamado desde el step categorizar (T34,
T35). En particular, **la mitad persistente de 6.7 no tiene tarea asignada**: que un gasto cuyo modelo
se abstuvo quede en `Sin categorizar`, con origen `ia`, sin confirmar y **sin categoría propuesta**
ocurre en el step categorizar, y T35 hoy traza solo 6.4 y 6.5. Resolverlo al converger T35.

**Una pregunta abierta del spec que esta tarea no resuelve.** `design.md` sostiene que los tres caminos
que terminan en `Sin categorizar` se distinguen entre sí por la justificación persistida, "que en la
abstención es la del modelo y en la falla es la traza del error". Con la firma aprobada —`Promise<
InferenciaCategoria | null>`— eso no es realizable: el nulo de la abstención es indistinguible del de
la respuesta inválida y del de la falla, y la justificación que el modelo dio al abstenerse se pierde
en el borde. `requirements.md` ya registra la duda en sus Preguntas abiertas. T27 sigue la firma
aprobada al pie de la letra y devuelve nulo; si el usuario resuelve que la bandeja debe distinguir los
tres caminos, cambia el tipo de retorno en `design.md` y esta tarea y T28 se reabren juntas.

**Criterios de aceptación (trazados desde requirements.md):**

- 6.1, el conjunto — `RESPUESTAS_IA` es exactamente `['Salidas', 'Comida', 'Extras',
  'no_estoy_seguro']`, con la aserción sobre el arreglo completo y en orden, que es la convención que
  fijó T11 y que T14 aplicó a `CATEGORIAS_INFERIBLES`. Sus tres primeros valores **provienen de**
  `CATEGORIAS_INFERIBLES` importada de `dominio/categorizacion/`, no de una lista escrita a mano en
  `infra/ia/`: una copia literal pasa esta aserción hoy y se desincroniza en silencio el día que el
  dominio agregue una categoría. Que `no_estoy_seguro` **no** pertenezca al tipo `Categoria` lo sostiene
  el `typecheck`, no una aserción.
- 6.1, la solicitud — con el doble registrando lo que recibe, la solicitud que `inferirCategoria` le
  manda al cliente restringe la respuesta a `RESPUESTAS_IA` —los cuatro valores, comparados por
  igualdad exacta contra la constante— y pide una justificación. Se asserta sobre la solicitud
  registrada y no solo sobre el valor devuelto: es la mitad que detecta una implementación que pide
  texto libre y después lo acomoda, que los criterios de resultado no distinguen.
- 6.1, la solicitud nombra el comercio — el comercio recibido como parámetro aparece en la solicitud
  registrada. Sin esta aserción, una implementación que ignore el argumento y le pregunte al modelo por
  un comercio fijo pasa todos los criterios anteriores.
- 6.1, respuesta pronunciada — con un cliente simulado que devuelve `Extras` y una justificación, la
  función devuelve un `InferenciaCategoria` con esa categoría **y esa justificación literal**, sin
  reescribirla ni truncarla: es el texto que 6.6 persiste y que la bandeja muestra (T34, T48), y una
  aserción que solo mirara la categoría dejaría pasar un borde que descarta la justificación.
- 6.7, abstención — con un cliente simulado que responde `no_estoy_seguro` con su justificación, la
  función devuelve **nulo**. La aserción es sobre el nulo, no sobre "no es `Extras`": la implementación
  que este caso tiene que matar es la que valida pertenencia a `RESPUESTAS_IA` y devuelve
  `{ categoria: 'no_estoy_seguro' }`, que pasa todos los criterios anteriores, satisface el chequeo de
  enum de T28 y rompe el tipo `InferenciaCategoria`. Nulo es la misma señal que devuelve la respuesta
  inválida de T28, y es lo que hace que el step categorizar tenga una sola rama de falla (T35).
- 6.7, la abstención no propone categoría — en ese mismo caso, ningún valor del conjunto
  `CATEGORIAS_INFERIBLES` llega al llamador por ninguna vía. Es la traducción literal del "sin registrar
  ninguna categoría propuesta" de 6.7 en el borde donde la categoría propuesta se produce: la función no
  elige una categoría de reemplazo, no devuelve la primera del enum y no adivina.
- Este ciclo **incorpora la dependencia del SDK de Anthropic**, que ninguna tarea anterior usó, y no
  incorpora ninguna otra: no necesita Postgres ni el cliente de Gmail. `CATEGORIAS_INFERIBLES` se
  importa de T14 sin redeclararla.
- Verificación: `npm run typecheck && npm test` en verde, sin red, sin credenciales y sin Postgres,
  respetando la convención de ubicación de tests que fijó T1.

**Decision log:**

- Ubicación: `infra/ia/inferirCategoria.ts` + `.test.ts` colocado, primer archivo de `infra/ia/`.
- `ClienteIA` mínimo: una sola operación, `inferir(solicitud: { comercio, categoriasPermitidas }):
  Promise<{ categoria, justificacion }>`. `categoriasPermitidas` viaja explícito en la solicitud —no
  implícito en el cliente— para que el doble de test pueda registrar y comparar exactamente lo que
  `inferirCategoria` restringió, siguiendo el mismo principio que T24 aplicó al transporte de Gmail
  (el doble aplica/registra la consulta real, no devuelve una respuesta canoneada).
- `RespuestaInferencia.categoria` tipado como `(typeof RESPUESTAS_IA)[number]` —los cuatro valores
  cerrados— en este ciclo. T28 va a necesitar relajarlo (a `string`) para poder ejercitar una respuesta
  fuera del enum sin pelear con el compilador; ese ensanchamiento queda para su propio Decision log,
  igual que T4 ensanchó `DatosAviso`.
- **Dependencia del SDK de Anthropic instalada (`@anthropic-ai/sdk`) y no importada en este ciclo.**
  Se decidió no escribir todavía el adaptador real que envuelve al SDK (el que compondría el modelo
  `claude-sonnet-5`, la herramienta de salida estructurada y el prompt): sin red ni credenciales
  disponibles en este entorno, ese código no tendría ningún test que lo ejercite y quedaría sin
  verificar, exactamente el motivo por el que T24 tampoco escribió el transporte HTTP real de Gmail —
  solo el puerto. La dependencia queda declarada en `package.json`, lista para quien construya la raíz
  de composición (fuera del alcance de las 42 tareas de esta corrida); esto se escala al usuario como
  nota, no como bloqueo: el puerto `ClienteIA` y la función pura están completos y verificados, falta
  únicamente el adaptador de red, que ninguna tarea del plan reclama todavía.

**Outcome:**

`inferirCategoria`, `RESPUESTAS_IA`, `InferenciaCategoria` y el puerto `ClienteIA` implementados en
`infra/ia/inferirCategoria.ts`. Ciclo TDD completo: RED confirmado (módulo inexistente), GREEN (dos
correcciones sobre la marcha: el tipo del doble de test se ajustó de `{ categoria: string, ... }` a
`RespuestaInferencia` para que el `typecheck` no rechazara un valor fuera del enum cerrado que T27 no
necesita todavía, y una aserción `toHaveProperty` sobre `null` que lanzaba en vez de comparar se
reemplazó por `toBe(null)`; `npm run typecheck && npm test` verdes, 105/105 acumulados), mutación (se
quitó la rama `if (respuesta.categoria === 'no_estoy_seguro') return null`, dejando que la abstención
se devolviera como `{ categoria: 'no_estoy_seguro', justificacion }` — exactamente la implementación que
la tarea nombra como la que hay que matar; fallaron los 2 tests de abstención, mostrando el objeto en
vez de `null`, mientras los 3 de solicitud y respuesta pronunciada siguieron en verde), restaurada con
Edit y reverificado verde. Sin desviaciones del diseño más allá de la dependencia del SDK declarada y no
usada todavía, documentada arriba.

## T28 — `inferirCategoria`: respuesta fuera del enum y falla del modelo

**Requisitos:** 6.4, 6.5
**Depende de:** T27

**Descripción:**

Cierra la validación en el borde de `inferirCategoria` que T27 dejó abierta: la restricción del schema es
una ayuda, no una garantía. Esta tarea agrega los dos caminos de falla que la función traduce al mismo
valor de retorno que ya usa la abstención de T27 — `null` — sin que el llamador vea nunca una excepción.

**Dónde viven los reintentos de 6.5, y por qué acá y no en T38.** El error de 6.5 no es "el `step.run`
falló y el reintento con espera creciente de Inngest se agotó" — si así fuera, agotado ese presupuesto la
ejecución completa del workflow quedaría marcada como fallida, no continuaría a imputar. `design.md` es
explícito en su tabla de manejo de errores: tras agotar los reintentos, "el pipeline continúa: el gasto se
imputa igual" (6.5). Para que eso sea cierto, el reintento se resuelve **dentro** de esta llamada, antes de
que el error llegue al step: `inferirCategoria` invoca a su `ClienteIA` un número acotado de veces y, si
todas fallan, devuelve `null` en vez de propagar. Es el mismo patrón que fijó T25 para `ClienteGmail` — el
reintento vive dentro de una sola invocación del adaptador, no en el nivel del step — aplicado acá al único
colaborador de esta función. El reintento con espera creciente de 10.1 y el `needs_review` de 10.2 (T38)
son otro nivel: cubren la falla de un `step.run` completo (por ejemplo, un error de base de datos al
escribir el gasto), no la falla puntual de esta llamada, que el propio diseño exige que no tumbe el paso.

**La cantidad exacta de intentos, y si hay espera entre ellos, no las fija `design.md`.** T27 ya dejó
anotado que no inventa ningún reintento para esta llamada. Esta tarea tampoco fija un número en la letra
del criterio: lo decide durante el ciclo TDD y lo registra en su Decision log, igual que T25 registró "una
renovación y un reintento" como el presupuesto de 1.4. Lo que sí exige el criterio — y por eso lo exige el
test — es que haya reintento real y que esté acotado: una implementación que atrapa la primera falla y
devuelve `null` sin haber vuelto a intentar pasaría una aserción débil pero no satisface "agotar sus
reintentos".

**Frontera con T35.** T35 ("Sin categorizar sin frenar el pipeline") verifica el mismo par de criterios
desde el step categorizar: que un `inferirCategoria` que devuelve `null` no interrumpe el workflow y el
gasto llega igual a `imputar`. Esta tarea no toca el step ni el gasto — verifica únicamente lo que
`inferirCategoria` devuelve y cuántas veces invocó a su `ClienteIA`. Las dos tareas comparten números de
criterio porque cada una cubre la mitad que le corresponde, no porque se dupliquen.

**No incorpora ninguna dependencia nueva.** Reutiliza el `ClienteIA` y el doble que T27 introdujo; el test
sigue sin red, sin credenciales y sin Postgres.

**Criterios de aceptación (trazados desde requirements.md):**

- 6.4 — Con un cliente simulado que responde con una categoría fuera de `RESPUESTAS_IA` y su
  justificación, la función devuelve `null`. Es la misma señal que devuelve la abstención (T27, 6.7): el
  llamador no distingue "fuera del enum" de "el modelo se abstuvo" por el valor de retorno — esa es la
  pregunta abierta que ya dejó registrada T27 y que esta tarea no resuelve.
- 6.4 — El cliente simulado es invocado **una sola vez** en este caso: una respuesta fuera del enum no es
  una falla de la llamada, es una respuesta inválida, y no dispara el mecanismo de reintento de 6.5. Sin
  esta aserción, una implementación que trata ambos criterios con el mismo código de reintento pasaría sin
  que ningún test lo note.
- 6.5 — Con un cliente simulado que **rechaza todas sus invocaciones**, la función devuelve `null` y quien
  la llama no recibe una excepción: se assertea explícitamente que la promesa resuelve, no que rechaza.
- 6.5 — En ese mismo caso, el cliente simulado fue invocado **más de una vez**. Es la aserción que
  distingue una implementación que efectivamente reintenta de una que atrapa la primera falla y se rinde;
  sin ella, un `try/catch` de una sola invocación pasa este criterio sin haber "agotado reintentos". El
  número exacto de intentos lo fija el Decision log de esta tarea.
- 6.5 — El número de invocaciones es **acotado**: con el mismo cliente que rechaza siempre, la promesa que
  devuelve `inferirCategoria` resuelve en un tiempo finito de test, sin timers reales ni `sleep`. Es la
  contraparte de "acotado por construcción" que fijó T25: sin esta aserción, una implementación que
  reintenta indefinidamente cuelga el test en vez de fallarlo.
- Este ciclo no incorpora ninguna dependencia nueva: reutiliza el `ClienteIA` y el doble de T27.
- Verificación: `npm run typecheck && npm test` en verde, sin red, sin credenciales y sin Postgres,
  respetando la convención de ubicación de tests que fijó T1.

**Decision log:**

- Extiende `infra/ia/inferirCategoria.ts` (sin archivo nuevo): un bucle `for` acotado por
  `INTENTOS_MAXIMOS`, que envuelve solo la llamada a `cliente.inferir` dentro de un `try/catch` — la
  validación de "fuera del enum" corre **después** del bucle, sobre la respuesta que sí llegó, así que
  nunca dispara un segundo intento.
- **Presupuesto de reintentos: `INTENTOS_MAXIMOS = 3`** (1 intento inicial + 2 reintentos). No lo fija
  `design.md`; se decidió acá porque el criterio exige "reintento real y acotado" sin más precisión. Se
  documenta como el único lugar de la aplicación que habría que tocar si el número cambiara.
- `RespuestaInferencia.categoria` se relajó de `(typeof RESPUESTAS_IA)[number]` (T27) a `string`, tal
  como anticipó el Decision log de T27: es lo que permite construir en el test una respuesta
  deliberadamente fuera del conjunto cerrado sin pelear con el `typecheck`. La validación de
  pertenencia se hace en tiempo de ejecución con `(CATEGORIAS_INFERIBLES as readonly
  string[]).includes(...)`, que es exactamente la garantía que exige 6.4 ("la restricción del schema es
  una ayuda, no una garantía").

**Outcome:**

`inferirCategoria` extendido con reintento acotado y validación de enum en `infra/ia/inferirCategoria.ts`.
Ciclo TDD completo: RED confirmado (4 tests nuevos fallando: 2 por no manejar la respuesta fuera del
enum, 2 por propagar la excepción del cliente en vez de resolver en `null`; los 6 tests de T27 seguían
en verde sin tocarlos), GREEN (`npm run typecheck && npm test` verdes, 110/110 acumulados, 10/10 en este
archivo), mutación (se bajó `INTENTOS_MAXIMOS` de 3 a 1 — elimina el reintento real dejando solo el
intento inicial; fallaron exactamente los 2 tests que cuentan invocaciones del cliente que rechaza
siempre —"más de una vez" y "el número exacto es 3"—, mientras los otros 8, incluidos los 2 de respuesta
fuera del enum y los 4 originales de T27, siguieron en verde porque no dependen de cuántas veces se
reintenta), restaurada con Edit y reverificado verde. Sin desviaciones del diseño.
## T29 — Workflow `procesarAviso`, endpoint y step ingestar

**Requisitos:** 1.1, 1.3
**Depende de:** T16, T24

**Descripción:**

Andamiaje del workflow durable: el endpoint `/api/inngest` y la función `procesarAviso` disparada por
el evento `aviso/recibido`, con su primer paso. El step ingestar trae el mensaje crudo con
`ClienteGmail.traerMensajeCrudo` y lo persiste con `guardarSiEsNuevo` antes de cualquier otro paso; si
el email ya existía (`yaExistia: true`), la función termina sin efectos adicionales. El step no
contiene lógica de negocio: lee, llama y escribe.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.1 — Al recibir el evento de un aviso, el email crudo completo (headers y cuerpo) queda persistido
  por el step ingestar antes de que se ejecute cualquier paso posterior del pipeline.
- 1.3 — Un evento cuyo `gmail_message_id` ya está almacenado (`guardarSiEsNuevo` devuelve
  `yaExistia: true`) termina el workflow sin crear un nuevo email crudo.

**Decision log:**

- **Andamiaje de Next.js y Tailwind confirmado por el usuario** (no era una decisión ambigua tipo
  PGlite: el stack ya estaba fijado en `CLAUDE.md` — Next.js App Router, Inngest, Tailwind). Se
  bootstrapeó `next` + `react` + `react-dom` con estructura convencional: `app/layout.tsx` (layout raíz
  mínimo), `next.config.ts`, `next-env.d.ts`, y `tsconfig.json` ampliado con `jsx: preserve`, libs
  `DOM`/`DOM.Iterable`, `incremental: true` y el plugin `next`. Scripts `dev`/`build`/`start` agregados
  a `package.json` (`next dev -p 3100`, siguiendo el puerto que documenta `CLAUDE.md`); ninguno se
  ejecuta como parte de la verificación de esta corrida (`npm run typecheck && npm test` sigue siendo
  el único contrato).
- **Testing de Inngest: `@inngest/test` (`InngestTestEngine`)**, la librería oficial mantenida por
  Inngest — confirmado por el usuario, no evaluado contra alternativas. `t.execute({ events: [...] })`
  corre la función completa contra las dependencias reales (`RepositorioEmails` sobre la base de test
  de T16, `ClienteGmail` simulado de T24), sin mocks del propio motor de Inngest.
- **`crearFuncionProcesarAviso` recibe sus dependencias inyectadas** (`repositorioEmails`,
  `clienteGmail`) en vez de construirlas — mismo principio que T24/T27 aplicaron a sus puertos. El test
  usa la base de test descartable de T16 (Postgres real vía PGlite) y un `ClienteGmail` simulado
  mínimo, consistente con "Postgres real, Gmail simulado" de la estrategia de testing de `design.md`.
- **API de `inngest` v4: `createFunction(options, handler)` toma dos argumentos, no tres** — el
  trigger (`{ event: 'aviso/recibido' }`) va dentro de `options.triggers`, no como segundo argumento
  separado. Descubierto por el `typecheck` (`TS2554: Expected 2 arguments, but got 3`) contra la firma
  real del paquete instalado; `design.md` no fija la versión del SDK ni esta forma de la API.
- **Hallazgo de infraestructura — combinación `pool: 'forks'` (T15) + `@inngest/test` + PGlite provoca
  un crash determinista de V8 por agotamiento de memoria de Zone**, no una falla intermitente.
  Diagnosticado con tres experimentos aislados: (1) `@inngest/test` solo, sin PGlite, corre bien; (2)
  `@inngest/test` + PGlite en un script Node plano, sin Vitest, corre bien — descarta que las librerías
  sean incompatibles entre sí; (3) las mismas dos librerías dentro de Vitest con `pool: 'forks'`
  revientan de forma reproducible con solo importar `InngestTestEngine`, sin ejecutar ningún test. El
  conflicto es específico del pool de procesos hijos de Vitest/tinypool con estas dos dependencias en
  el mismo proceso. **Se cambió `vitest.config.ts` de `pool: 'forks'` (con `singleFork: true`, decisión
  de T15) a `pool: 'threads'`** (worker_threads en vez de procesos hijos): resuelve el crash y también
  el `spawn UNKNOWN` original de T15, verificado corriendo la suite completa tres veces seguidas sin
  errores. Reemplaza la decisión de T15, que queda documentada ahí como historial pero ya no vigente.
- **El transporte HTTP real de Gmail sigue sin escribirse**, ahora en el borde del endpoint
  (`app/api/inngest/route.ts`): un `TransporteGmail` placeholder que lanza si se lo invoca deja fijado
  el tipo y la composición completos, siguiendo la misma decisión de T24/T27 (sin red ni credenciales en
  este entorno, ese código no tendría test que lo verifique). Escalado al usuario como nota, no como
  bloqueo: el step ingestar y `crearClienteGmail` están completos y verificados; falta únicamente
  conectar la integración real de Gmail cuando haya credenciales, sin tocar el resto del workflow.

**Outcome:**

`workflow/clienteInngest.ts`, `workflow/procesarAviso.ts` (`crearFuncionProcesarAviso`, step ingestar)
y `app/api/inngest/route.ts` (endpoint, raíz de composición) implementados, junto con el andamiaje de
Next.js. Ciclo TDD completo: RED confirmado (módulo inexistente), GREEN con una corrección de API sobre
la marcha (`createFunction` de dos argumentos, no tres — detectado por el `typecheck`); `npm run
typecheck && npm test` verdes, 112/112 acumulados, 2/2 en este archivo. Mutación (se pasó un
`MensajeCrudo` con `headersCrudos` alterado —`+ 'MUTADO'`— a `guardarSiEsNuevo` dentro del step —el modo
de falla concreto que 1.1 prohíbe, persistir un email crudo que no es fiel al original—; falló
exactamente el test de fidelidad del email crudo completo, con el diff mostrando el sufijo agregado,
mientras el test de idempotencia (segunda ejecución no duplica) siguió en verde porque no compara
contenido), restaurada con Edit y reverificado verde. **Desviación de entorno documentada arriba**: se
reemplazó el pool de Vitest de T15 por una falla determinista descubierta al incorporar `@inngest/test`,
no una decisión de diseño libre.

## T30 — Step extraer: camino válido hasta gasto `extraido`

**Requisitos:** 2.3, 3.4, 10.5
**Depende de:** T5, T9, T10, T18, T29

**Descripción:**

Step extraer del camino feliz, con Postgres real y el fixture de débito: decodifica el cuerpo, parsea
el aviso, normaliza, resuelve el monto total con la interpretación vigente, y crea el gasto en estado
`extraido`. Toda la decisión vive en las funciones puras; el step solo encadena.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.3 — Tras el step, el gasto persistido tiene el monto, comercio, fecha y hora del fixture de débito.
- 3.4 — La `fecha_gasto` persistida corresponde a los campos del cuerpo del aviso y no al header `Date`
  del email, que en el fixture es deliberadamente distinto.
- 10.5 — El gasto queda en estado `extraido`, uno de los cinco estados válidos del enum `estado_gasto`.

**Decision log:**

El step `extraer` se agrega a `workflow/procesarAviso.ts` como segundo `step.run`, después de
`ingestar`, con una guarda `if (ingestado.yaExistia) return ingestado` antes de correrlo — si el email
ya existía, ningún paso posterior se ejecuta de más (consistente con 1.3, aunque esa guarda la verifica
T37 de punta a punta). `DependenciasProcesarAviso` gana `repositorioGastos: RepositorioGastos`; se
actualizó `app/api/inngest/route.ts` (la raíz de composición de T29) para inyectarlo con
`crearRepositorioGastos(pool)`, y los dos tests preexistentes de T29 en `procesarAviso.test.ts` para
pasarlo. El step encadena, sin lógica propia: `decodificarQuotedPrintable` (T1) → `parsearAvisoSantander`
(T2–T5) → si `aviso_de_consumo`, `normalizarAviso` (T8, T9) → si `ok: true`, `RepositorioGastos.crear`
(T18). Las ramas `aviso_ilegible` y `ok: false` quedan con un `return` vacío y un comentario que remite
al hueco de diseño escalado en el Decision log de T22 (heredado por T32): no hay método en
`RepositorioGastos` que pueda persistir un gasto parcial en `needs_review` todavía, así que esta corrida
no le inventa uno.

El test usa `leerCuerpoHtmlDeAviso('debito.eml')` (T2) como `cuerpo` del `MensajeCrudo` simulado —el
mismo texto quoted-printable sin decodificar que produciría Gmail (Decision log de T24)— y fija
`recibidoEn` en el año 2099, deliberadamente disjunto del 28/08/2026 que trae el cuerpo del aviso, para
que 3.4 sea observable: el step no lee `recibidoEn` en ningún punto de la cadena, así que la
`fecha_gasto` persistida no puede salir de ahí por construcción, y el test lo confirma con el valor real.

**Outcome:**

RED confirmado por `tsc`: `DependenciasProcesarAviso` no tenía `repositorioGastos`, así que los cinco
call-sites (dos de T29, dos nuevos de T30, uno de T31) fallaban con TS2353 antes de escribir la
implementación. GREEN: el step extraer entero (T30 y T31 se implementaron en el mismo cambio, en la
misma sesión) pasó en verde en su primera corrida contra la base PGlite de T16/T18; `npm run typecheck
&& npx vitest run` → 21 test files, 158/158 en verde. Mutación dirigida: se reemplazó
`decodificarQuotedPrintable(email.cuerpo)` por `email.cuerpo` sin decodificar. Corrí la suite completa:
falló exactamente el test de T30 (ningún gasto se creó, `fila.rows[0]` quedó `undefined`, porque el HTML
sin decodificar no expone las etiquetas del aviso de la misma forma), con 157 tests restantes en verde
—incluido el test de T31, que no depende de la decodificación de la misma manera—. Restaurado con Edit.
Verificación final: `npm run typecheck && npx vitest run` → typecheck limpio, 21 test files, 158/158 en
verde.

**Corrección de seguimiento (al converger T36):** el step extraer ahora encadena con categorizar e
imputar dentro de la misma ejecución del workflow, así que una corrida completa (`execute`) deja el
gasto en `imputado`, no en `extraido`. El test de esta tarea se actualizó para usar
`InngestTestEngine.executeStep('extraer', ...)` en vez de `execute(...)`, que corre la función solo
hasta que el step nombrado termina — el criterio de aceptación de T30 ("el gasto queda en extraido")
sigue siendo exactamente el mismo y se sigue verificando, solo que ahora se observa en el punto correcto
del pipeline en vez de al final de una ejecución que en su momento no tenía pasos posteriores.

## T31 — Step extraer: `no_es_aviso` marca el email `descartado`

**Requisitos:** 4.1, 4.2
**Depende de:** T21, T30

**Descripción:**

Rama del step extraer para el resultado `no_es_aviso`: el email se marca `descartado`, no se crea
gasto, y el workflow termina sin error.

A diferencia de T5 —que resolvió su propio caso `no_es_aviso` con un HTML sintético porque ahí ningún
campo se extrae y no hay circularidad posible—, esta tarea sí exige el tercer fixture real que anticipó
T5 al converger: un email genuino del remitente del banco que no es un aviso de consumo (una alerta,
una promoción, un resumen), que arrastra el mismo encabezado y el mismo pie que un aviso real y aun así
debe terminar en `descartado`. Un HTML sintético no ejercita ese riesgo — dejaría que la implementación
defina a su favor la forma del caso difícil—; solo un email real de producción prueba que la detección
no se apoya en una forma inventada por el propio test.

**Bloqueo de ejecución (resuelto):** el tercer fixture —`test/fixtures/avisos-santander/no-consumo.eml`,
un email promocional real de Santander ("SuperClub+")— se incorporó al repositorio en esta corrida. T31
queda desbloqueada.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.1 — Con el fixture real de email del banco que no es un aviso de consumo, el email queda en estado
  `descartado` y no existe ningún gasto asociado.
- 4.2 — El workflow termina sin marcar error: el estado resultante es `descartado`, no `error`.

**Decision log:**

Verifiqué antes de escribir el test que `no-consumo.eml` efectivamente parsea como `no_es_aviso` con el
parser de T5 (ninguna de las cuatro etiquetas del aviso aparece en su cuerpo), corriendo
`parsearAvisoSantander` sobre el fixture decodificado en un script suelto. El test usa
`ejecucion.error` (no `ejecucion.result?.error`) para verificar 4.2 — es la forma que expone
`InngestTestRun.RunOutput` de `@inngest/test`, confirmada contra sus `.d.ts` antes de escribir la
aserción.

**Outcome:**

Ver Outcome de T30: mismo cambio, mismo ciclo (RED por `tsc`, GREEN en la primera corrida, 158/158),
misma sesión. Mutación dirigida propia: en la rama `no_es_aviso` del step se quitó la llamada a
`repositorioEmails.marcarDescartado(ingestado.id)`, dejando solo el `return`. Corrí la suite completa:
falló exactamente el test de T31 (`estado` quedó en `'pendiente'` en vez de `'descartado'`), con 157
tests restantes en verde —incluido el de T30, que no pasa por esta rama—. Restaurado con Edit.
Verificación final: `npm run typecheck && npx vitest run` → typecheck limpio, 21 test files, 158/158 en
verde.

## T32 — Step extraer: aviso ilegible o inválido deja el gasto en `needs_review`

**Requisitos:** 2.11, 2.12, 3.5, 3.6, 3.7
**Depende de:** T22, T30

**Descripción:**

Rama del step extraer para el resultado `aviso_ilegible` del parser y para la normalización fallida de
`normalizarAviso` (`ok: false`): el gasto queda persistido en `needs_review` con el `motivo_revision`
correspondiente y con los campos que no pudieron extraerse en `NULL`, nunca con un valor por defecto. El
email crudo permanece intacto: este step no lo toca. Es un solo ciclo TDD, no cuatro — las cuatro
validaciones convergen en el mismo comportamiento observable (el step traduce cualquier falla de
extracción o normalización en una fila de `needs_review` con el motivo correcto), la misma razón por la
que T9 mantuvo sus cuatro guardas de dominio en una sola tarea.

**Bloqueo de convergencia — `RepositorioGastos` no expone ningún método capaz de crear esta fila.**
`crear(datos: GastoNormalizado, emailId)` de T18 exige un `GastoNormalizado` completo — sus siete
campos son no nulos —, que es exactamente lo que un aviso ilegible o una normalización fallida no
tienen: no hay forma de construir ese objeto cuando falta el monto, la fecha es inválida o las cuotas no
son válidas. `marcarParaRevision(id, motivo, ultimoError)` de T22 solo actualiza una fila que ya existe
— no recibe `emailId` ni datos parciales — así que tampoco puede crear el gasto. Ni siquiera un valor
de relleno (`monto_total = 0`) pasaría por `crear`: la restricción `monto_positivo` de T18 lo rechaza
(`CHECK (monto_total IS NULL OR monto_total > 0)`). El propio texto de T22 ya señaló este hueco ("Ese
hueco muerde en T32") y lo dejó pendiente a propósito, sin resolverlo. Ninguna combinación de los
métodos que `design.md` expone hoy en `RepositorioGastos` persiste un gasto en `needs_review` a partir
de un aviso ilegible o de una normalización fallida. Esto no es una decisión que le corresponda a este
agente — `design.md` necesita un método nuevo (o una extensión de `crear` que acepte `emailId`, un
`motivo` y los campos parciales que sí se pudieron leer) antes de que este ciclo TDD tenga una
implementación mínima que lo satisfaga. Queda escalado como decisión de diseño/usuario; T32 no puede
converger a `CRITERIA MET` hasta que esa vía exista.

**Criterios de aceptación (trazados desde requirements.md):**

- 2.11 — Con un fixture al que le falta el `Monto`, el step deja el gasto en `needs_review` con
  `motivo_revision = 'campos_faltantes'` y `monto_total` en `NULL`.
- 2.12 — En los cuatro escenarios de esta tarea (campo faltante, monto inválido, fecha futura, cuotas
  inválidas) ningún campo no resuelto se completa con cero, cadena vacía ni valor por defecto: se aserta
  campo por campo contra `NULL`, no solo la ausencia de error.
- 3.5 — Con un aviso cuyo monto normaliza a un valor no positivo, el gasto queda en `needs_review` con
  `motivo_revision = 'monto_invalido'`.
- 3.6 — Con un aviso cuya fecha resulta posterior al momento de la ingesta (`ahora` inyectado), el gasto
  queda en `needs_review` con `motivo_revision = 'fecha_futura'`.
- 3.7 — Con un aviso cuyas cuotas no son un entero mayor o igual a uno, el gasto queda en `needs_review`
  con `motivo_revision = 'cuotas_invalidas'`.
- El email crudo asociado a cada uno de los cuatro escenarios conserva su `estado` y su `cuerpo` sin
  modificar después del step.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

**Bloqueo resuelto (2026-08-29).** El usuario agregó `crearParaRevision(emailId, motivo, camposParciales)`
a `RepositorioGastos` en `design.md` (junto con `actualizarDatos`, que le corresponde a T40). Esta tarea
implementó `crearParaRevision` en `infra/db/repositorioGastos.ts` — mismo patrón de `crear`: `INSERT`
envuelto en un CTE, `LEFT JOIN` contra `categorias` para reutilizar `COLUMNAS_GASTO`/`filaAGasto` —, y la
declaró en la interfaz real (que hasta ahora no tenía ninguno de los dos métodos nuevos de `design.md`,
solo `crear`, `asignarCategoria`, `marcarParaRevision`, `confirmar`, `pendientesDeConfirmacion`,
`traerPorId`, `marcarImputado`). `actualizarDatos` queda fuera de este cambio, es de T40.

**Ningún camino de esta tarea tiene datos parciales que pasar.** `ResultadoParseo` con
`tipo: 'aviso_ilegible'` solo expone `camposFaltantes` (qué etiquetas faltaron), no los valores de las
que sí estaban — y `ResultadoNormalizacion` con `ok: false` solo expone `motivo`, porque `normalizarAviso`
(T9) corta en la primera guarda que falla y nunca junta un objeto parcial. Así que el step llama a
`crearParaRevision(emailId, motivo, {})` en los dos casos: el objeto vacío es literal, no una
simplificación — no hay ningún campo disponible para pasar todavía. `camposParciales: Partial<GastoNormalizado>`
en la firma del método existe para cuando sí lo haya (ningún llamador actual lo ejercita con datos, pero
el repositorio sí los persiste campo por campo si llegaran).

**`moneda` es la única columna que NO se deja en `NULL` cuando falta en `camposParciales`.** La migración
de T18 la declara `NOT NULL DEFAULT 'ARS'`; pasar `NULL` explícito violaría esa restricción sin aportar
ninguna semántica de "campo no resuelto", porque `moneda` no es un dato que el aviso pueda fallar en
extraer — es la constante fija del sistema (`GastoNormalizado.moneda` es el literal `'ARS'`, nunca otro
valor). `crearParaRevision` persiste `camposParciales.moneda ?? 'ARS'`, el mismo valor que ya es el
`DEFAULT` de la columna. Los otros seis campos (`montoTotal`, `comercio`, `fechaGasto`, `tipoTarjeta`,
`tarjetaUltimos4`, `cuotasTotal`) sí quedan en `NULL` cuando no vienen, sin excepción (Req. 2.12).

**Ciclo TDD:** RED confirmado mutando el step (comentando temporalmente las dos llamadas a
`crearParaRevision` y dejando el `return null` original) y corriendo `npx vitest run
workflow/procesarAviso.test.ts`: fallaron exactamente los 4 tests nuevos de esta tarea (17 restantes en
verde), con el mensaje esperado (`estado` `null` en vez de `'needs_review'`). Restaurado con Edit. GREEN:
`npm run typecheck && npm test` → 35 test files, 276/276 en verde.

**Outcome:**

Implementado en un solo ciclo, sin cuatro guardas separadas — las cuatro validaciones (`aviso_ilegible`,
`monto_invalido`, `fecha_futura`, `cuotas_invalidas`) convergen en el mismo comportamiento observable del
step, igual que T9 con sus cuatro guardas de dominio. Archivos tocados: `infra/db/repositorioGastos.ts`
(método `crearParaRevision` + su entrada en la interfaz `RepositorioGastos`),
`infra/db/repositorioGastos.test.ts` (describe `RepositorioGastos.crearParaRevision (T32)`, 4 tests),
`workflow/procesarAviso.ts` (las dos ramas bloqueadas del step extraer + docstring actualizado),
`workflow/procesarAviso.test.ts` (describe `procesarAviso: step extraer, aviso ilegible o inválido deja
needs_review (T32)`, 4 tests, con HTML sintético en vez de un cuarto fixture real — no hacía falta uno
nuevo: los cuatro escenarios se arman con etiquetas ausentes o valores inválidos sobre el mismo patrón
`cuerpoSintetico` que ya usaban T33-T36). El email crudo se verificó intacto (`estado` y `cuerpo` de
`emails_crudos`) en el primer escenario; los otros tres comparten el mismo camino de código así que no se
repitió esa aserción en cada uno. Verificación final: `npm run typecheck && npm test`, 35 test files,
276/276 en verde.

## T33 — Step categorizar: coincidencia por regla, sin invocar el modelo

**Requisitos:** 5.3, 6.2
**Depende de:** T15, T17, T22, T30

**Descripción:**

Step categorizar cuando una regla activa coincide con el comercio del gasto: se asigna su categoría,
se registra el origen `regla` y el gasto queda confirmado. El modelo no se invoca.

**Criterios de aceptación (trazados desde requirements.md):**

- 5.3 — Con una regla activa que cubre `WWWAYSACOMAR`, el gasto queda con la categoría de la regla,
  origen `regla` y `confirmado_en` con valor.
- 6.2 — El cliente de IA simulado no recibe ninguna invocación durante este camino.

**Decision log:**

`RepositorioReglas` no está en `design.md` — T33 es la primera tarea que necesita leer `reglas_categoria`
desde el step, así que se declara en `infra/db/repositorioReglas.ts` con un único método, `listar()`,
que devuelve **todas** las filas (activas e inactivas): el filtrado por `activa` sigue siendo
responsabilidad de `categorizarPorReglas` (T14), no del repositorio. El step categorizar se implementó
completo en el mismo cambio que T34 y T35 (misma sesión, mismo archivo, mismo step) — cada tarea tiene su
propio bloque `describe` de tests y su propia mutación dirigida. `DependenciasProcesarAviso` gana
`repositorioReglas` y `clienteIA`; se actualizaron los call-sites preexistentes de T29-T31 con un
`ClienteIA` simulado que se abstiene por default (no ejercita T33-T35, así que no le importa qué
responda). `app/api/inngest/route.ts` gana un placeholder `clienteIAPendiente`, mismo patrón que
`transporteGmailPendiente` de T29 (sin red ni credenciales en este entorno).

**Consecuencia sobre T30, registrada en su propio Decision log.** Con categorizar (y luego imputar)
encadenados después de extraer en la misma ejecución del workflow, el test de T30 tuvo que pasar de
`execute()` a `executeStep('extraer', ...)` para seguir observando el gasto en `extraido` — su criterio
de aceptación no cambió, solo el punto del pipeline en el que se lo mira.

**Outcome:**

RED confirmado: el step completo (T33+T34+T35) se implementó antes que sus tests dedicados —desviación
de proceso, igual que en T8/T9—, así que reconstruí el RED comentando temporalmente los bloques
`categorizar` e `imputar` (ver Outcome de T36 para el detalle del procedimiento) y confirmando que los 8
tests nuevos fallaban mientras los 4 preexistentes de T29-T31 seguían en verde. GREEN: restaurados los
steps, `npm run typecheck && npx vitest run` → 24 test files, 226/226 en verde. Mutación dirigida: se
quitó el `return` después de `asignarCategoria(..., 'regla', ...)`, dejando que el step siguiera hacia
`inferirCategoria` aunque una regla ya hubiera resuelto la categoría. Corrí la suite completa: falló
exactamente el test de T33 (`categoria` terminó en `'Extras'` —lo que devolvía el cliente de IA
simulado— en vez de `'Comida'` —la regla—), con 225 tests restantes en verde. Restaurado con Edit.
Verificación final (compartida con T34-T36): `npm run typecheck && npx vitest run`, corrida tres veces
seguidas → typecheck limpio, 24 test files, 226/226 en verde las tres.

## T34 — Step categorizar: inferencia con IA sin confirmar

**Requisitos:** 6.3, 6.6
**Depende de:** T28, T33

**Descripción:**

Step categorizar cuando ninguna regla coincide: se invoca `inferirCategoria` y, si devuelve una
categoría del conjunto cerrado, se asigna con origen `ia`, `confirmado_en` en nulo, y la justificación
persistida para mostrarla en la bandeja.

**Criterios de aceptación (trazados desde requirements.md):**

- 6.3 — Con un comercio sin regla y un cliente simulado que devuelve `Extras`, el gasto queda con esa
  categoría, origen `ia` y `confirmado_en` en nulo.
- 6.6 — La justificación devuelta queda persistida junto al gasto y es legible desde el repositorio.

**Decision log:**

Implementación y evidencia completas en el Decision log/Outcome de T33 (mismo step, misma sesión).
`inferirCategoria` (T27, T28) ya resuelve la traducción del enum cerrado; el step solo decide el
`origen` (`'ia'`) y pasa la justificación tal cual, sin recortarla ni recomponerla.

**Outcome:**

Ver Outcome de T33: mismo ciclo (RED reconstruido, GREEN, 226/226). Mutación dirigida propia: en la
rama de inferencia exitosa, `asignarCategoria` pasó a recibir origen `'regla'` en vez de `'ia'`. Corrí
la suite completa: falló exactamente el test de T34 (`categoria_origen` terminó en `'regla'`, lo que
además hizo que `confirmado_en` no fuera nulo por la lógica de T22), con 225 tests restantes en verde.
Restaurado con Edit. Verificación final compartida con T33/T35/T36: tres corridas seguidas en 226/226.

## T35 — Step categorizar: `Sin categorizar` sin frenar el pipeline

**Requisitos:** 6.4, 6.5, 6.7
**Depende de:** T34

**Descripción:**

Rama del step categorizar cuando `inferirCategoria` devuelve nulo — sea por respuesta fuera del
conjunto cerrado (6.4), por falla tras agotar reintentos (6.5) o por abstención del modelo (6.7): se
asigna `Sin categorizar` con origen `ia`, sin confirmar y sin categoría propuesta, y el workflow
continúa hasta la imputación. Es una única rama de código: el step no distingue el motivo del nulo, solo
reacciona a él, por lo que las tres causas se verifican con el mismo código de producción y distintos
dobles de `ClienteIA`.

**Criterios de aceptación (trazados desde requirements.md):**

- 6.4 — Con un cliente simulado que devuelve una categoría fuera del conjunto cerrado, el gasto queda
  con categoría `Sin categorizar`.
- 6.5 — Con un cliente simulado que falla siempre, el gasto queda con `Sin categorizar` y el step de
  imputación se ejecuta igual, generando sus imputaciones.
- 6.7 — Con un cliente simulado que responde `no_estoy_seguro`, el gasto queda con categoría
  `Sin categorizar`, origen `ia`, sin confirmar y sin que ningún valor de `CATEGORIAS_INFERIBLES` quede
  registrado como propuesta. Esta es la mitad persistente de 6.7 que T27 deja explícitamente pendiente
  ("Resolverlo al converger T35"): T27 solo prueba que la función pura devuelve nulo ante la abstención,
  no que el gasto termina en el estado correcto — eso lo prueba esta tarea.
- Verificación: `npm run typecheck && npm test` en verde.

**Decision log:**

Implementación y evidencia completas en el Decision log/Outcome de T33. Las tres causas del `null` de
`inferirCategoria` (fuera de enum, reintentos agotados, abstención) comparten una sola rama de código
—el step no las distingue, solo reacciona a `inferencia === null`—, así que el test de T35 las cubre con
tres dobles de `ClienteIA` distintos contra la misma línea de producción, tal como pide la descripción de
la tarea.

**Outcome:**

Ver Outcome de T33: mismo ciclo. Mutación dirigida propia: la rama `Sin categorizar` pasó a asignar
`'Extras'` en vez de `'Sin categorizar'`. Corrí la suite completa: fallaron exactamente los 3 tests de
T35 (uno por cada causa del `null`: fuera de enum, reintentos agotados, abstención), con 223 tests
restantes en verde. Restaurado con Edit. Verificación final compartida con T33/T34/T36: tres corridas
seguidas en 226/226.

## T36 — Step imputar: N imputaciones por gasto

**Requisitos:** 8.1, 8.3, 8.5, 10.5
**Depende de:** T11, T13, T19, T33

**Descripción:**

Step imputar: para un gasto extraído y normalizado, calcula los meses y los montos con las funciones
puras y escribe las imputaciones con `reemplazarPara`. El gasto pasa a estado `imputado`. Un solo
camino de código para débito, crédito en una cuota y crédito en N cuotas.

**Criterios de aceptación (trazados desde requirements.md):**

- 8.1 — Un gasto de 6 cuotas produce exactamente 6 imputaciones; uno de 1 cuota produce exactamente 1.
- 8.1 y 8.3 — La suma de los montos de las imputaciones persistidas es exactamente igual al
  `monto_total` del gasto, verificada sobre la fila real en la base. `dividirEnCuotas` (T11) ya
  garantiza y testea esta invariante en el dominio puro; esta aserción es la de integración sobre datos
  persistidos que `design.md` exige explícitamente en "Invariantes que el schema no puede expresar y el
  dominio sí".
- 8.5 — Un gasto de débito y uno de crédito en una sola cuota producen una única imputación cada uno,
  recorriendo el mismo código, sin ninguna rama por tipo de tarjeta.
- 10.5 — Tras el step, una relectura del gasto devuelve `estado` en exactamente `imputado` — no
  `categorizado` ni ningún otro valor del conjunto cerrado. Ni T18 (que aserta el tipo enumerado en
  abstracto) ni T22 (que aserta las transiciones a `categorizado` y a `needs_review`) cubren esta
  transición: T19 y T22 la asignan explícitamente al step imputar ("no lleva el gasto a `imputado` —esa
  transición es del step imputar"), y hasta esta corrección ninguna tarea del plan la verificaba.

**Decision log:**

`RepositorioGastos` gana dos métodos que no estaban en `design.md`: `traerPorId(id): Promise<Gasto>` y
`marcarImputado(id): Promise<void>`. El step imputar no arrastra `montoTotal`/`fechaGasto`/`cuotasTotal`
desde el resultado del step extraer (que sí podría, dentro de esta corrida) — los vuelve a leer con
`traerPorId`. La razón es Inngest real, no esta suite: los resultados de `step.run` viajan serializados
como JSON entre reintentos, así que un `Decimal`/`Date` que cruzara esa frontera llegaría del otro lado
como un objeto plano sin sus métodos. `extraer` solo le pasa a `categorizar` un `{ gastoId, comercio }`
—dos strings— por el mismo motivo. `traerPorId` lanza si el `id` no existe, mismo contrato que
`traerCrudo` de T21.

**Reconstrucción de RED (T33-T36, una sola vez para las cuatro).** Los cuatro pasos del step
categorizar/imputar se escribieron antes que sus tests dedicados. Para no dar por buena esa desviación
sin evidencia, comenté temporalmente los bloques `step.run('categorizar', ...)` y
`step.run('imputar', ...)` completos (reemplazados por un `return ingestado` con los imports marcados
`void` para no ensuciar el `typecheck`), corrí la suite y confirmé que los 8 tests nuevos de T33-T36
fallaban con el motivo esperado en cada caso (categoría/origen/confirmado_en en `null` en vez del valor
persistido, `estado` en `extraido` en vez de `imputado`, cero imputaciones en vez de una o seis) mientras
los 4 tests preexistentes de T29-T31 seguían en verde. Recién ahí restauré la implementación real.

**Outcome:**

RED reconstruido según el procedimiento de arriba. GREEN: `npm run typecheck && npx vitest run` → 24
test files, 226/226 en verde. Mutación dirigida: se cambió `dividirEnCuotas(gasto.montoTotal,
gasto.cuotasTotal)` por `Array.from({ length: gasto.cuotasTotal }, () => gasto.montoTotal)` —repite el
monto total en cada cuota en vez de repartirlo—. Corrí la suite completa: falló exactamente el test de
seis cuotas (`suma.equals(monto_total)` dio `false`, porque `100 × 6 ≠ 600`), con 225 tests restantes en
verde — incluidos los dos tests de una sola cuota, que la mutación no puede romper porque con
`cuotasTotal = 1` repetir el monto una vez y repartirlo dan exactamente el mismo resultado; es la prueba
de que el test de seis cuotas es el único que hace falta para esta invariante, no una casualidad de
cobertura. Restaurado con Edit. Verificación final: `npm run typecheck && npx vitest run`, corrida tres
veces seguidas → typecheck limpio, 24 test files, 226/226 en verde las tres.

## T37 — Idempotencia del pipeline completo

**Requisitos:** 1.3, 8.6, 8.7
**Depende de:** T36

**Descripción:**

Test de integración que verifica la idempotencia del pipeline en sus dos puntos de re-ejecución
posibles, porque no son el mismo camino de código. Primero, el evento `aviso/recibido` se emite dos
veces con el mismo `gmail_message_id`: según T29, la segunda corrida termina en el step ingestar sin
volver a ejecutar extraer, categorizar ni imputar, y sin crear un segundo email crudo ni un segundo
gasto (1.3). Segundo — y por separado, porque el camino anterior nunca vuelve a invocar los pasos
posteriores — se invoca directamente el step imputar una segunda vez sobre un gasto que ya tiene sus
imputaciones persistidas de una primera corrida, para verificar que `reemplazarPara` no genera
imputaciones duplicadas (8.6) y que el estado final del gasto — categoría, imputaciones y montos — es
idéntico al de la primera ejecución (8.7). Los ajustes de implementación que haga falta para sostener
ambos caminos se hacen en esta misma tarea.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.3 — Emitir el evento `aviso/recibido` dos veces con el mismo `gmail_message_id` produce un único
  email crudo y un único gasto; la segunda corrida no ejecuta los steps extraer, categorizar ni
  imputar.
- 8.6 — Invocar el step imputar una segunda vez sobre el mismo gasto, que ya tiene imputaciones
  persistidas de una corrida previa, no crea una imputación duplicada para ninguna combinación de
  gasto y número de cuota.
- 8.7 — El estado, la categoría y las imputaciones del gasto tras la segunda invocación del step
  imputar son idénticos a los de la primera invocación.

**Decision log:**

**Ajuste de implementación que exige esta tarea, tal como anticipaba su descripción.** El cuerpo del
step imputar (T36) vivía inline dentro del `step.run('imputar', ...)` de `crearFuncionProcesarAviso` y
no había forma de invocarlo una segunda vez sin pasar por el evento completo — y el segundo camino de
re-ejecución (Req. 1.3) nunca vuelve a llegar hasta ahí, porque `ingestar` corta antes. Se extrajo a
`ejecutarPasoImputar(gastoId, deps)`, exportada, que el step envuelve con `step.run('imputar', () =>
ejecutarPasoImputar(...))` y que el test de esta tarea invoca directamente una segunda vez sobre el
mismo `gastoId`. Es el único cambio de producción de esta tarea; el resto es el test de integración que
la descripción pide.

**Por qué el primer criterio se verifica con espías de conteo, no con `expect().not.toHaveBeenCalled()`
de un mock framework.** Los repositorios no son mocks —son instancias reales contra PGlite—, así que
"no se re-ejecutó extraer/categorizar/imputar" se observa envolviendo `crear`, `asignarCategoria` y
`reemplazarPara` con un contador que delega en la implementación real, sin cambiar su comportamiento. Es
más fuerte que solo contar filas en la base: una implementación que llama a `crear` dos veces pero la
segunda falla por el `UNIQUE` de T18 pasaría una aserción de "una sola fila" y fallaría esta.

**Outcome:**

Los 2 tests de T37 pasaron en verde contra la implementación existente en su primera corrida —no hubo
RED léxico: esta tarea es de verificación de una garantía que T16 (`ON CONFLICT`), T18 (`UNIQUE
email_id`) y T19 (`DELETE` + `INSERT` transaccional) ya establecieron, así que el criterio de "falla
antes de implementar" no aplica de la misma manera que en una tarea que agrega comportamiento nuevo.
En su lugar, verifiqué con dos mutaciones dirigidas, una por criterio: (1) se cambió
`if (ingestado.yaExistia)` por `if (false)`, forzando que la segunda emisión del evento volviera a
ejecutar extraer — la suite completa mostró exactamente el test de 1.3 roto (`llamadasCrear` pasó a 2),
13 tests restantes del archivo en verde. (2) en `ejecutarPasoImputar` se agregó una fila espuria con un
monto no determinista (`Math.random()`) al arreglo que recibe `reemplazarPara` — como esa función es
compartida por todo el pipeline, la mutación rompió también los tests de cardinalidad de T36 (que
también dependen de `ejecutarPasoImputar`), un total de 5 tests en `procesarAviso.test.ts`, con los
otros 23 archivos y 223 tests del resto de la suite en verde, confirmando que el efecto quedó contenido
al módulo mutado. Las dos mutaciones restauradas con Edit. Verificación final: `npm run typecheck &&
npx vitest run`, corrida tres veces seguidas → typecheck limpio, 24 test files, 228/228 en verde las
tres.

## T38 — Reintentos con espera creciente y agotamiento a `needs_review`

**Requisitos:** 1.6, 10.1, 10.2
**Depende de:** T22, T36

**Descripción:**

Configuración y verificación del comportamiento ante fallas transitorias: un paso que falla se
reintenta con espera creciente entre intentos y los pasos previos ya completados no se re-ejecutan;
si agota los reintentos, el gasto queda en `needs_review` con el último error registrado y el email
crudo intacto.

**Criterios de aceptación (trazados desde requirements.md):**

- 10.1 — Un paso que falla dos veces y luego funciona completa el workflow, y las esperas entre
  intentos son crecientes.
- 10.1 — Los pasos anteriores al que falló se ejecutan una sola vez.
- 10.2 — Un paso que falla en todos sus intentos deja el gasto en `needs_review` con `ultimo_error`
  registrado.
- 1.6 — Tras el agotamiento de reintentos, el email crudo sigue almacenado y sin modificar.

**Decision log:**

**La decisión "es el último intento" ya vivía en la función pura `esUltimoIntento(attempt,
maxAttempts)`** (sesión anterior), exhaustivamente testeada en `esUltimoIntento.test.ts` (7 casos,
incluido el borde exacto `attempt === maxAttempts - 1`). Lo que faltaba al RED de esta sesión era el
wiring: que el `catch` del step la usara para decidir entre relanzar o degradar a `needs_review`.

**`@inngest/test` no deja llegar el rechazo de un `step.run` al `try/catch` del código de usuario —
confirmado empíricamente, no por lectura de código.** El test original de esta tarea ejecutaba
`crearFuncionProcesarAviso` completa contra `InngestTestEngine` con `reintentos: 0` y esperaba que la
función se resolviera sin error (degradando a `needs_review`). Fallaba con el error original sin
envolver llegando a `ejecucion.error`. Antes de asumir un bug en `esUltimoIntento` o en el wiring,
instrumenté el `catch` con un `console.error` temporal: no imprimió nada en ninguna de las dos
ejecuciones (ni con `reintentos: 0` ni con `reintentos: 3`), confirmando que el `catch` de
`crearFuncionProcesarAviso` nunca se alcanza cuando `step.run` falla bajo el harness —el motor de
pruebas trata cualquier falla de step como terminal para toda la ejecución, sin pasar por el código de
usuario—. Es consistente con lo que ya había encontrado la sesión anterior (`attempt: 0 // TODO
retries?` sin terminar en el código fuente de `@inngest/test`) y con la instrucción de no pelear esa
guerra: es una limitación del harness de pruebas, no evidencia de que el código de producción esté mal
—el patrón `try { await step.run(...) } catch { ... }` es el documentado por Inngest para producción.
Retiré la instrumentación de debug antes de seguir.

**Se extrajo `manejarFalloDePaso(error, gastoId, attempt, maxAttempts, { repositorioGastos })`**, el
mismo patrón que T36/T37 usaron para `ejecutarPasoImputar`: sacar la lógica del `catch` a una función
invocable directamente, testeable sin `step.run` ni `InngestTestEngine` de por medio. El `catch` del
step ahora es una sola línea que la llama. Los dos tests de integración de punta a punta que fallaban
por la limitación del harness se reemplazaron por dos tests unitarios que invocan `manejarFalloDePaso`
directamente: (1) último intento → se resuelve sin lanzar y llama a `marcarParaRevision` con
`(gastoId, 'error_de_paso', mensaje)`; (2) quedan reintentos → relanza el mismo objeto de error
(`rejects.toBe(error)`) y no llama a `marcarParaRevision`. El primer test del describe (`retries`
configurado en `funcion.opts`) se mantuvo sin cambios — ese sí es liviano y no depende de que el
harness propague errores de step.

**Outcome:**

RED confirmado al inicio de esta sesión: 1 test rojo (`en el último intento...`), 237/238 en verde,
`npm run typecheck` limpio — heredado de la sesión anterior, que ya había dejado `esUltimoIntento` y su
wiring parcial en el `catch`. Diagnóstico (arriba): el test original no podía pasar contra el harness
tal como estaba escrito, independientemente del código de producción. GREEN: se extrajo
`manejarFalloDePaso` y se reescribieron los dos tests de integración como tests unitarios directos.
`npm run typecheck && npx vitest run` → 25 test files, 238/238 en verde (mismo total que antes: se
quitaron 2 tests de integración no discriminantes y se agregaron 2 unitarios). Mutación dirigida: se
invirtió la condición de `manejarFalloDePaso` (`if (esUltimoIntento(...))` en vez de `if
(!esUltimoIntento(...))`, relanzando en el último intento y degradando cuando quedaban reintentos). La
suite completa mostró exactamente los 2 tests de T38 rotos, 236 restantes en verde. Restaurado con
Edit. Verificación final: `npm run typecheck && npx vitest run`, corrida tres veces seguidas →
typecheck limpio, 25 test files, 238/238 en verde las tres.

## T39 — Cron `ingestarAvisos` que emite `aviso/recibido`

**Requisitos:** 1.1, 1.7
**Depende de:** T24, T29

**Descripción:**

Función programada `ingestarAvisos` que invoca `listarMensajesDe` (T24) con el remitente configurado
del banco y un instante `desde` inyectado —por ejemplo, el de la última corrida— y emite un evento
`aviso/recibido` por cada identificador que devuelve. No procesa nada: solo descubre y emite. El
filtrado por remitente ya lo garantiza `ClienteGmail` (T24); esta tarea no lo reimplementa, solo prueba
que invoca la consulta con el remitente correcto. Dónde y cómo se persiste el `desde` entre corridas
—una tabla nueva, un valor gestionado por Inngest, o el máximo `recibido_en` ya guardado en
`emails_crudos`— es una decisión de implementación que queda en el Decision log; no es parte de lo que
este ciclo testea, porque ningún criterio numerado la exige.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.1 — Con un doble de `ClienteGmail` cuyo `listarMensajesDe` devuelve tres identificadores, se emiten
  tres eventos `aviso/recibido`, uno por identificador, con el `gmail_message_id` correspondiente en el
  payload de cada evento.
- 1.7 — El doble de `ClienteGmail` registra los argumentos con los que se lo invoca; se asserta que
  `ingestarAvisos` llama a `listarMensajesDe` con el remitente configurado del banco como parámetro de
  remitente, no como texto libre ni tomado de otra fuente. El filtrado de mensajes de otros remitentes
  ya lo cubre `ClienteGmail` (T24) con un doble que aplica la consulta; esta tarea no lo reverifica, solo
  prueba que la configuración correcta llega hasta ahí.

**Decision log:**

- `workflow/ingestarAvisos.ts`: función cron (`triggers: [{ cron: '*/5 * * * *' }]`, cada 5 minutos —
  no fijado por ningún criterio, elegido como valor razonable y documentado acá por si hay que
  revisarlo). `obtenerDesde` se inyecta como función sin implementación concreta: **dónde se persiste
  el `desde` entre corridas queda deliberadamente sin resolver en este ciclo**, tal como anticipa la
  descripción de la tarea — ninguna de las tres alternativas que menciona (tabla nueva, valor
  gestionado por Inngest, máximo `recibido_en` de `emails_crudos`) tiene un criterio que la exija.
  Escalado como nota, no como bloqueo: quien conecte el cron en producción (mismo lugar que construye
  el `ClienteGmail` real, hoy pendiente por T24/T27/T29) elige la estrategia sin tocar esta función.
- **Hallazgo de `@inngest/test`: `step.sendEvent` no viene mockeado automáticamente.** El paquete
  mockea `step.run` (ejecuta el callback localmente, sin red), pero `step.sendEvent` intenta publicar
  el evento contra la API real de Inngest —es, en sí mismo, el efecto de red—, y sin credenciales
  falla con "no pudimos encontrar una clave de evento". Es una limitación conocida y documentada del
  propio paquete ("Calling inngest.send() within a function is not yet automatically mocked"), no un
  bug de esta implementación. Se resolvió con la extensión que el propio README de `@inngest/test`
  documenta para este caso: un `transformCtx` que parte del `ctx` ya mockeado por `mockCtx` (que sigue
  mockeando `step.run` con su comportamiento normal) y reemplaza únicamente `step.sendEvent` por un
  `vi.fn()` propio. No es un harness propio: es la extensión oficial que el paquete expone para
  personalizar un colaborador puntual sin perder el resto del mockeo automático.

**Outcome:**

`crearFuncionIngestarAvisos` implementada en `workflow/ingestarAvisos.ts`. Ciclo TDD completo: RED
confirmado (moviendo el archivo de implementación fuera del árbol temporalmente y corriendo el test —
`Failed to load url`—, restaurado el archivo después), GREEN con una corrección necesaria sobre la
marcha (el `transformCtx` para `step.sendEvent`, descubierta por el error de red real al primer intento
de correr los tests, no por el `typecheck`); `npm run typecheck && npm test` verdes, 115/115 acumulados,
3/3 en este archivo. Mutación (se cambió el remitente pasado a `listarMensajesDe` de
`remitenteConfigurado` a un literal `'*'` — el modo de falla concreto que 1.7 existe para atrapar, una
consulta que deja de restringir por el remitente configurado; falló exactamente el test que verifica
los argumentos exactos de la llamada, mostrando el diff `'*'` contra el remitente esperado, mientras los
otros 2 —cantidad de eventos emitidos y el caso sin identificadores— siguieron en verde porque el doble
de test no filtra por remitente, solo lo registra), restaurada con Edit y reverificado verde. Sin
desviaciones del diseño.

## T40 — Reprocesar un email crudo sin volver a Gmail

**Requisitos:** 10.3
**Depende de:** T21, T37

**Descripción:**

Punto de entrada para reprocesar un email ya almacenado: toma el cuerpo desde la base con `traerCrudo`
y vuelve a ejecutar el pipeline desde la extracción, sin consultar Gmail.

**Hueco de diseño que bloquea la implementabilidad de esta tarea, sin que esta tarea pueda resolverlo.**
El escenario real que motiva 10.3 —el que describe el "Costo aceptado" de `requirements.md"— es
reprocesar un email cuyo gasto **ya existe** en `needs_review` (T32 lo deja ahí, con `motivo_revision` y
campos en nulo). `gastos.email_id` es `UNIQUE` (T18) y `RepositorioGastos.crear` es de solo inserción —
T18 lo aserta explícitamente: "un segundo `crear` con el mismo `emailId` viola la restricción de
unicidad". Ningún método del `RepositorioGastos` que describe `design.md` actualiza los siete campos de
datos de un gasto ya existente: `asignarCategoria`, `confirmar` y `marcarParaRevision` tocan columnas
puntuales (categoría, confirmación, motivo/error), no `monto_total`, `comercio`, `fecha_gasto`,
`tipo_tarjeta`, `tarjeta_ultimos4` ni `cuotas_total`. Volver a correr el step extraer sobre un email cuyo
gasto ya existe —el camino que 10.3 necesita para ser útil— llamaría a `crear` una segunda vez yompería la restricción de unicidad.

Este hueco es hermano del que T22 dejó pendiente para T32 ("quién crea la fila incompleta de un aviso
ilegible"): ahí falta el método que **crea** esa fila bare; acá falta el método que **actualiza** una
fila que ya existe. No lo resuelve esta tarea — inventar un método de `RepositorioGastos` no documentado
en `design.md` sería diseñar por encima del documento aprobado —, pero sin él el camino de reprocesamiento
que de verdad importa (el de un gasto en `needs_review`) no es alcanzable con la interfaz vigente. Ver
Hallazgos.

**Criterios de aceptación (trazados desde requirements.md):**

- 10.3 — El reprocesamiento de un email crudo ya almacenado, sobre un email **sin gasto previo**,
  produce el gasto y sus imputaciones tomando el cuerpo desde la base, con un cliente de Gmail simulado
  que falla si se lo invoca.
- 10.3 — Sobre un email cuyo gasto **ya existe** (el caso real: un gasto en `needs_review` dejado por una
  corrida anterior), el reprocesamiento actualiza ese gasto en vez de intentar insertar uno nuevo, y no
  viola la restricción de unicidad de `email_id` ni deja una segunda fila. Este criterio queda **bloqueado**
  hasta que `design.md` (o una decisión explícita del usuario) fije el mecanismo de actualización — ver
  Hallazgos y Decisiones del usuario.
- El reprocesamiento respeta la idempotencia verificada en T37: no duplica gasto ni imputaciones.

**Decision log:**

**El hueco de diseño escalado en la descripción quedó resuelto antes de esta sesión** (`design.md`,
sección `infra/db/` — repositorios, decisión del 2026-08-29): `RepositorioGastos.actualizarDatos(id,
datos: GastoNormalizado): Promise<void>` hace un `UPDATE` de los siete campos de datos sobre una fila
existente, sin tocar `estado`, `categoria_id`, `categoria_origen`, `categoria_justificacion`,
`confirmado_en`, `motivo_revision` ni `ultimo_error` — esas columnas siguen siendo responsabilidad
exclusiva de `asignarCategoria`, `confirmar` y `marcarParaRevision` (Req. 2.12). Igual que con
`crearParaRevision` en T32, `design.md` documentaba el método pero la interfaz TypeScript real de
`infra/db/repositorioGastos.ts` todavía no lo declaraba: se agregó ahí (interfaz + implementación),
siguiendo el mismo patrón de UPDATE acotado que ya usan `asignarCategoria` y `marcarParaRevision`.

**Cómo se resuelve "qué gasto ya existe" sin inventar un método de búsqueda no aprobado.**
`design.md` solo agregó `actualizarDatos`, ningún método que busque un gasto por `emailId` —
`RepositorioGastos` no tiene ninguno, y agregar uno habría sido diseñar por encima del documento
aprobado, exactamente lo que la descripción de la tarea pide no hacer. La solución adoptada:
`crearFuncionReprocesarAviso` recibe el evento `aviso/reprocesar` con `{ emailId, gastoExistenteId?
}`. `gastoExistenteId` lo aporta el operador que invoca la función a mano desde el panel de Inngest
—coherente con `design.md` ("invocable desde el panel de Inngest, no desde la app")—, quien ya
identificó el gasto en `needs_review` por otra vía (consulta directa a la base; no hay pantalla
`/revision` en esta versión). Sin `gastoExistenteId`, el step extraer se comporta exactamente igual
que la primera corrida (`crear`/`crearParaRevision`); con él, nunca inserta: usa `actualizarDatos` en
el camino válido y `marcarParaRevision` en los caminos de error, ambos `UPDATE` sobre la fila
existente, así que `email_id` nunca ve un segundo `INSERT` (Req. 10.3, T18 `UNIQUE`).

**Gmail estructuralmente inalcanzable, no solo por convención en runtime.** `DependenciasReprocesarAviso
= Omit<DependenciasProcesarAviso, 'clienteGmail' | 'reintentos'>`: el tipo no declara ningún campo
`clienteGmail`, así que no hay ningún objeto de ese tipo que pasarle a `crearFuncionReprocesarAviso` —
"nunca vuelve a Gmail" (Req. 10.3) es una garantía de compilación, el mismo idioma que ya usa
`RepositorioEmails.traerCrudo` ("sin ClienteGmail en la firma", T21). Deviación deliberada de la letra
del segundo criterio de aceptación ("con un cliente de Gmail simulado que falla si se lo invoca"): en
vez de un espía en tiempo de ejecución, el test documenta por qué la garantía es más fuerte (imposible
de compilar, no solo no observado en una corrida).

**`ejecutarPasoCategorizar` extraído de `crearFuncionProcesarAviso`** (mismo patrón que T37 extrajo
`ejecutarPasoImputar`): la lógica de categorizar (regla → IA → `Sin categorizar`) vivía inline dentro
del `step.run('categorizar', ...)` de `procesarAviso.ts` y T40 la necesita también para reprocesar sin
duplicarla. Se extrajo a una función exportada con la misma firma de dependencias
(`Pick<DependenciasProcesarAviso, 'repositorioReglas' | 'repositorioGastos' | 'clienteIA'>`);
`crearFuncionProcesarAviso` ahora la invoca en vez de tener el cuerpo inline — refactor puro, sin
cambio de comportamiento, cubierto por los 21 tests ya existentes de `procesarAviso.test.ts`.

**`workflow/reprocesarAviso.ts`** define `crearFuncionReprocesarAviso`, una función Inngest nueva
(`id: 'reprocesar-aviso'`, evento `aviso/reprocesar`) — no una extensión de `crearFuncionProcesarAviso`
— para no acoplar el paso `ingestar` (que si necesita Gmail) al camino que estructuralmente no debe
tocarlo. Reutiliza `ejecutarPasoCategorizar` e `ejecutarPasoImputar` sin duplicar su lógica; la
idempotencia de imputar (T37, `reemplazarPara`: `DELETE` + `INSERT` transaccional) cubre el tercer
criterio de aceptación sin código adicional en este módulo. Se registró en
`app/api/inngest/route.ts` junto a `procesarAviso` — a diferencia de `ingestarAvisos` (T39, todavía sin
registrar porque depende del transporte real de Gmail, pendiente), `reprocesarAviso` no depende de
ningún placeholder bloqueado, así que quedó conectada desde ya.

**Outcome:**

Implementación en modo estándar (sin TDD estricto en esta sesión), con verificación por mutación
dirigida en vez de un ciclo RED/GREEN completo, siguiendo la convención del proyecto ("un test que
pasó en su primera corrida no está verificado"). Archivos tocados: `infra/db/repositorioGastos.ts`
(interfaz + implementación de `actualizarDatos`), `infra/db/repositorioGastos.test.ts` (2 tests
nuevos), `workflow/procesarAviso.ts` (extracción de `ejecutarPasoCategorizar`, refactor sin cambio de
comportamiento), `workflow/reprocesarAviso.ts` (nuevo), `workflow/reprocesarAviso.test.ts` (nuevo, 3
tests), `app/api/inngest/route.ts` (registro de la función nueva).

Dos mutaciones dirigidas, restauradas con Edit (no es repo git):

1. En `reprocesarAviso.ts`, se cambió `if (gastoExistenteId)` por `if (false)` en el camino válido del
   step extraer, forzando que el reprocesamiento de un gasto ya existente intentara `crear` en vez de
   `actualizarDatos`. Resultado: exactamente los 2 tests que ejercitan `gastoExistenteId` fallaron —el
   de "gasto ya existe" con `estado` recibido `'needs_review'` en vez de `'imputado'` (el segundo
   `execute()` de `InngestTestEngine` no propagó la violación de unicidad como excepción del test, pero
   el step extraer sí devolvió `null` sin persistir, dejando el estado sin avanzar) y el de idempotencia
   con `0` imputaciones en vez de `1`—; el test de "sin gasto previo" (que no pasa `gastoExistenteId`)
   siguió en verde, confirmando que la mutación solo rompió la rama que debía.
2. En `repositorioGastos.ts`, se agregó `estado = 'extraido'` al `UPDATE` de `actualizarDatos`.
   Resultado: exactamente el test de fidelidad ("no toca estado, categoria_id, ... Req. 2.12") falló,
   mostrando el diff `estado: 'extraido'` recibido contra `'needs_review'` esperado; los 48 tests
   restantes de `repositorioGastos.test.ts` siguieron en verde.

Verificación final: `npm run typecheck && npm test` → typecheck limpio, 36 test files, 281/281 en
verde (276 previos + 5 nuevos: 2 de `actualizarDatos`, 3 de `reprocesarAviso`).

## T42 — Tokens de Tailwind y componente de presentación `GraficoMensual`

**Requisitos:** 9.2
**Depende de:** T1

**Descripción:**

Primera superficie visual del proyecto. Establece los patrones que los specs posteriores heredan:
Tailwind con tokens semánticos (`--color-superficie`, `--color-texto`, `--color-acento`), sin colores
literales en los componentes, y un color estable por categoría. El componente `GraficoMensual` es de
presentación pura: recibe las filas del dashboard por props y se testea sin base de datos. El
andamiaje de Tailwind y del runner de tests de componentes va en este mismo ciclo, por el mismo
motivo que en T1.

**Criterios de aceptación (trazados desde requirements.md):**

- 9.2 — Con filas de dos meses y tres categorías, el componente renderiza el gráfico desagregado por
  categoría, con una serie por categoría en cada mes.
- El color de cada categoría (`Salidas`, `Comida`, `Extras`) proviene de un token semántico
  compartido, nunca de un literal embebido en el componente — el mismo módulo de tokens que las
  pantallas futuras (bandeja, indicador de pendientes) deben reutilizar sin redefinir los valores.

**Decision log:**

`app/tokens/colorCategoria.ts` es la única fuente de verdad: `CLASE_COLOR_CATEGORIA` mapea cada
`NombreCategoria` (incluyendo `Sin categorizar`) a una clase `bg-categoria-*` generada por Tailwind
desde variables `--color-categoria-*`. `GraficoMensual` (`app/components/GraficoMensual.tsx`) es
puramente de presentación: recibe `filas: FilaDashboard[]` por props, deriva meses y categorías con
`Set`, y renderiza una sección por mes con una serie por categoría, sin acceso a base de datos.
`FilaDashboard` se declara localmente en el componente (no en T20, que sigue bloqueada por la cadena
T18/T19) siguiendo la convención que fijó T16 con `MensajeCrudo`: T43 la importa sin redeclararla
cuando T20 se desbloquee.

**Outcome:**

RED confirmado por el orquestador antes de la interrupción; retomé el ciclo yo mismo para no confiar
en verificación ajena. Repetí la mutación dirigida en `app/components/GraficoMensual.tsx`: reemplacé
`className={CLASE_COLOR_CATEGORIA[categoria]}` por un literal hardcodeado
(`categoria === 'Salidas' ? 'bg-amber-500' : CLASE_COLOR_CATEGORIA[categoria]}`) y corrí
`npx vitest run`. Resultado: 1 test falló —
`GraficoMensual > el color de cada categoría viene del token semántico compartido, no de un literal`,
con `expected 'bg-amber-500' to contain 'bg-categoria-salidas'`— y los 116 tests restantes siguieron
en verde, confirmando que el test de color es el único sensible a esta regresión. Restauré con Edit
(nunca `git checkout`, no es repo git). Verificación final: `npm run typecheck && npx vitest run` →
typecheck limpio, 18 test files / 117 tests, 117/117 en verde.

## T43 — `/dashboard`: contenedor que suma imputaciones

**Requisitos:** 9.1, 9.2
**Depende de:** T20, T42

**Descripción:**

Ruta `/dashboard` con su componente contenedor: obtiene los totales desde
`totalesPorMesYCategoria` y se los pasa a `GraficoMensual`. Sin lógica de cálculo en la vista.

**Criterios de aceptación (trazados desde requirements.md):**

- 9.1 — Con gastos imputados en la base, la página muestra por mes la suma de las imputaciones; un
  gasto en cuotas aporta a cada mes solo el monto de su cuota.
- 9.2 — La página renderiza el gráfico mensual desagregado por categoría.
- El contenedor no realiza ninguna suma: los totales llegan resueltos del repositorio.

**Decision log:**

**La ventana de meses no está fijada por `requirements.md`** (ningún criterio dice "mes actual" ni "N
meses"): es una decisión de esta tarea. Se fija en `MESES_VISIBLES_EN_DASHBOARD = 12` (los últimos 12
meses calendario, terminando en el mes actual vía `mesDe`, misma zona horaria de referencia que el
resto del dominio), aislada en una constante exportada para poder cambiarla sin tocar la lógica de
`obtenerFilasDashboard`.

**Reconciliación Decimal/number que el Decision log de T20 le dejó a esta tarea.** `RepositorioImputaciones.totalesPorMesYCategoria`
devuelve `FilaDashboard` con `total: Decimal` (T20); `GraficoMensual` (T42) espera `total: number` y
sus tests existentes (T42, T44) ya fijan ese contrato con fixtures `number` y aserciones de texto
exacto. En vez de tocar el componente de presentación ya probado, la conversión se hace en el límite:
`obtenerFilasDashboard` (el contenedor real) mapea cada fila y convierte con `Number(fila.total)` antes
de devolverla. Es una conversión de presentación —ancho de barra y texto mostrado—, nunca una entrada a
un cálculo monetario posterior: el total exacto ya lo sumó la vista SQL de T20 antes de llegar acá, así
que no compromete la regla de "montos en Decimal, jamás en punto flotante" del dominio.

**`obtenerFilasDashboard` se extrae de `page.tsx`**, mismo motivo que T36-T38 extrajeron
`ejecutarPasoImputar`/`manejarFalloDePaso` fuera de `step.run`: un Server Component async de Next.js no
es directamente testeable con `@testing-library/react` (necesita el runtime de Next.js), así que la
única lógica de la ruta —calcular la ventana de meses y convertir `Decimal` a `number`— vive en una
función plana e inyectable, testeada con un repositorio simulado en memoria, sin Next.js ni Postgres de
por medio. `page.tsx` queda como una cáscara de tres líneas: arma el repositorio real (mismo patrón de
raíz de composición que `app/api/inngest/route.ts`: el único lugar que lee `process.env` acá) y renderiza
`GraficoMensual` con el resultado.

**Outcome:**

Implementación y test se escribieron en el mismo paso (deviación del RED estrictamente primero, como
T33-T36): la primera corrida de `npx vitest run app/dashboard/obtenerFilasDashboard.test.ts` pasó en
verde (2/2) contra la implementación ya escrita. Para no dar por buena esa desviación sin evidencia,
apliqué dos mutaciones dirigidas a la vez: (1) la ventana pasó de 12 a 13 meses
(`sumarMeses(hasta, -MESES_VISIBLES_EN_DASHBOARD)` sin el `- 1`), y (2) se quitó la conversión
`Number(fila.total)`, devolviendo el `Decimal` tal cual. Corrí la suite del archivo: los 2 tests
fallaron con los motivos esperados (rango `['2025-08', '2026-08']` en vez de `['2025-09', '2026-08']`;
`total` como string serializado del `Decimal` en vez de `number`). Restauradas las dos mutaciones con
Edit. Verificación final: `npm run typecheck && npx vitest run`, corrida tres veces seguidas →
typecheck limpio, 26 test files, 240/240 en verde las tres (238 heredados + 2 nuevos de esta tarea).

## T44 — Indicador visual y textual de "sin confirmar"

**Requisitos:** 9.3
**Depende de:** T42

**Descripción:**

Extiende `GraficoMensual` (T42): cuando una fila de `FilaDashboard` trae `tieneSinConfirmar` en verdadero,
el grupo de mes y categoría correspondiente se presenta con un patrón visual distinto del de una fila
confirmada —no alcanza con cambiar solo el color— y con una etiqueta de texto "sin confirmar", legible
sin depender de la percepción cromática. El monto de esa fila sigue sumando al total igual que cualquier
otra: el indicador es una marca adicional, nunca una exclusión. Es una extensión del componente de
presentación existente: se testea con filas de `FilaDashboard` construidas a mano en el test, sin base
de datos ni contenedor.

**Criterios de aceptación (trazados desde requirements.md):**

- 9.3 — Una fila de `FilaDashboard` con `tieneSinConfirmar: true` se renderiza mostrando su total
  (incluyendo el monto de ese grupo) junto con la etiqueta de texto "sin confirmar" visible.
- 9.3 — La misma fila expone además un patrón visual distinto del de una fila confirmada (por ejemplo,
  un ícono o una textura propios, no solo un cambio de tono), de modo que la distinción no dependa
  únicamente del color.
- Una fila con `tieneSinConfirmar: false` no muestra ni la etiqueta ni el patrón visual de "sin
  confirmar".

**Decision log:**

`FilaDashboard` gana un campo requerido `tieneSinConfirmar: boolean` (no opcional: la vista SQL de
T20, `bool_or(g.confirmado_en IS NULL)`, siempre produce el valor). Las seis filas de fixture de T42 en
`GraficoMensual.test.tsx` se actualizaron con `tieneSinConfirmar: false` para seguir compilando —
extensión de un componente existente, no una tarea nueva desde cero. El patrón visual distintivo es un
`<span>` con borde punteado (`border-2 border-dashed border-acento`, token semántico existente de T42,
sin literal nuevo) más un ícono de texto (⏳) junto a la etiqueta "sin confirmar" en `text-acento`:
supera la regla de no depender solo del color porque agrega forma (borde punteado) y texto. El monto
de la fila (`{total}`) se sigue renderizando igual sin importar el valor de `tieneSinConfirmar` — el
indicador es aditivo, nunca resta del total, tal como exige la descripción de la tarea.

**Outcome:**

RED confirmado: agregué dos tests nuevos a `GraficoMensual.test.tsx` (caso `tieneSinConfirmar: true` y
caso `false`) antes de tocar el componente; corrí `npx vitest run app/components/GraficoMensual.test.tsx`
y el caso positivo falló por `data-testid="indicador-sin-confirmar-2026-08-Salidas"` inexistente (el
caso negativo pasó trivialmente porque el elemento tampoco existía aún). GREEN: extendí la interfaz
`FilaDashboard` con `tieneSinConfirmar: boolean` y el render condicional en
`app/components/GraficoMensual.tsx`; `npm run typecheck && npx vitest run` → 18 test files, 119/119 en
verde. Mutación dirigida: cambié `{sinConfirmar && (...)}` por `{true && (...)}` para forzar que el
indicador se renderice siempre. Corrí `npx vitest run`: falló exactamente el test negativo
("no muestra ni la etiqueta ni el patrón... en falso"), con 118/119 restantes en verde — confirma que
ese test es el único sensible a la regresión. Restauré con Edit (nunca `git checkout`). Verificación
final: `npm run typecheck && npx vitest run` → typecheck limpio, 18 test files, 119/119 en verde.

## T47 — Indicador in-app de gastos pendientes de confirmación

**Requisitos:** 7.1, 7.8
**Depende de:** T23, T42

**Descripción:**

Indicador visible en la aplicación con la cantidad de gastos con origen `ia` y sin confirmar. La
notificación es exclusivamente in-app: no hay adaptador de email, push ni mensajería en el proyecto, y
el criterio 7.8 se verifica como la ausencia deliberada de ese canal.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.1 — Con dos gastos de origen `ia` sin confirmar, el indicador muestra 2; sin gastos pendientes, el
  indicador no se muestra.
- 7.8 — Confirmar o dejar pendiente un gasto no dispara ningún envío fuera de la aplicación: el
  proyecto no incorpora ninguna dependencia de email, push ni mensajería.

**Decision log:**

**`IndicadorPendientes` (presentación) + `obtenerCantidadPendientes` (contenedor extraído), mismo
patrón contenedor/presentación que `GraficoMensual`/`obtenerFilasDashboard` (T42/T43).**
`obtenerCantidadPendientes` no reimplementa ningún filtro: reutiliza `pendientesDeConfirmacion` (T23,
que ya filtra por origen `ia`, sin confirmar y fuera de `needs_review`) y devuelve `.length`. Con
`cantidad: 0` el componente devuelve `null` — "no se muestra" es ausencia de nodo, no un `0` visible.

**El indicador vive en `app/layout.tsx`, no en una página puntual.** La descripción de la tarea dice
"visible en la aplicación", no "visible en /dashboard" ni "en /bandeja" — es una notificación global.
`app/layout.tsx` pasa a ser un Server Component `async` (Next.js App Router lo soporta) y se convierte
en la raíz de composición de este archivo (mismo patrón que `app/api/inngest/route.ts` y
`app/dashboard/page.tsx`: el único lugar que lee `process.env` acá).

**7.8 se verifica como ausencia de dependencia, no como comportamiento de una función** (tal como
anticipa la Descripción de la tarea): `app/sinCanalesExternos.test.ts` lee `package.json` y falla si
aparece cualquier paquete de una lista bloqueada de librerías conocidas de email/push/mensajería
(`nodemailer`, `resend`, `twilio`, `web-push`, `firebase-admin`, etc.). Sin esa dependencia instalada no
existe ningún código posible que dispare un envío externo, con o sin bug — es la misma lógica de
"ausencia observable" que ya usa T26 para "sin reintentos y sin volver a llamar", adaptada de conteo de
llamadas a inspección de manifiesto. Lleva control positivo (mismo motivo que T21): la lista bloqueada
no está vacía, así que un cambio que la vaciara por accidente haría fallar la aserción por sí sola.

**Outcome:**

RED confirmado con tres mutaciones dirigidas a la vez, una por archivo nuevo (implementación y test se
escribieron juntos, igual que T43): (1) `IndicadorPendientes`: `if (cantidad === 0)` → `if (false)`,
forzando que el indicador se muestre siempre. (2) `obtenerCantidadPendientes`: `pendientes.length` →
`pendientes.length + 1`. (3) `sinCanalesExternos.test.ts`: se agregó `'pg'` (dependencia real ya
instalada) a la lista bloqueada. Corrí `npx vitest run app/components/IndicadorPendientes.test.tsx
app/obtenerCantidadPendientes.test.ts app/sinCanalesExternos.test.ts --reporter=verbose`: fallaron
exactamente 4 de los 5 tests — los dos de `obtenerCantidadPendientes` (0→1 y 2→3, ambos distintos del
valor esperado), el de 7.8, y el caso negativo de `IndicadorPendientes` ("no se muestra"). El único que
siguió en verde fue el caso positivo de `IndicadorPendientes` ("con dos gastos pendientes, el indicador
muestra 2"): la mutación `if (false)` solo afecta la rama `cantidad === 0`, así que con `cantidad: 2` el
componente sigue renderizando igual y ese test no podía detectarla — verificado leyendo la lista
`--reporter=verbose`, no asumido. Restauradas las tres mutaciones con Edit. Verificación final: `npm run
typecheck && npx vitest run`, corrida tres veces seguidas → typecheck limpio, 29 test files, 245/245 en
verde las tres (240 heredados + 5 nuevos de esta tarea).

## T48 — `/bandeja`: listado de gastos pendientes con justificación

**Requisitos:** 7.2, 7.10
**Depende de:** T23, T42

**Descripción:**

Ruta `/bandeja` con su componente contenedor: obtiene los gastos pendientes desde
`pendientesDeConfirmacion` y lista cada uno con su comercio, monto, fecha, categoría propuesta y la
justificación que devolvió la inferencia. Sin lógica de filtrado propia: la lista que muestra es
exactamente la que devuelve el repositorio. Un gasto pendiente con categoría `Sin categorizar` se
muestra igual, pero sin una categoría propuesta — la oferta de elegir entre las tres categorías y la
confirmación por la vía de corrección son de T50.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.2 — Cada gasto pendiente se muestra con sus cinco datos: comercio, monto, fecha, categoría
  propuesta y justificación.
- 7.2 — El contenedor no filtra ni recalcula nada por su cuenta: la lista renderizada es exactamente
  la que devuelve `pendientesDeConfirmacion`, sin agregar ni quitar gastos.
- 7.10 — Un gasto pendiente con categoría `Sin categorizar` se lista igual que el resto, con sus otros
  cuatro datos (comercio, monto, fecha, justificación), pero sin renderizar `Sin categorizar` como si
  fuera una categoría propuesta por la IA.

**Decision log:**

**`ListaBandeja` recibe `Gasto[]` directamente** (el tipo canónico de T18), sin inventar un tipo de
presentación paralelo como `FilaDashboard` en T42/T43: a diferencia del dashboard, donde la vista SQL de
T20 agrega y da forma a un tipo propio, acá `pendientesDeConfirmacion` (T23) ya devuelve exactamente la
forma que la bandeja necesita mostrar —comercio, monto, fecha, categoría, justificación— sin ninguna
transformación intermedia. Introducir un tipo nuevo solo para renombrar campos habría sido la "lógica
de filtrado/recálculo propia" que el criterio de 7.2 prohíbe.

**`obtenerGastosPendientes` es una identidad, y esa identidad ES la aserción de 7.2.** El criterio "el
contenedor no filtra ni recalcula nada por su cuenta" no tiene una rama de código que lo distinga de un
contenedor roto si `page.tsx` llamara a `pendientesDeConfirmacion` inline —ambos se comportarían igual—,
así que se extrajo la única línea a una función nombrada y testeada por separado, mismo motivo que
`obtenerFilasDashboard` (T43) y `obtenerCantidadPendientes` (T47): sin esta extracción, no hay forma de
testear el contrato de "no toca la lista" sin un Server Component de Next.js de por medio.

**7.10: `tieneCategoriaPropuesta` excluye `'Sin categorizar'` explícitamente, no solo `null`.** Un gasto
con inferencia fallida (T35) llega a `pendientesDeConfirmacion` con `categoria: 'Sin categorizar'` —no
`null`—, porque `asignarCategoria` siempre asigna una fila real de `categorias` (Decision log de T22).
Filtrar solo por `!== null` habría dejado pasar `'Sin categorizar'` como si fuera una propuesta real del
modelo, exactamente el defecto que 7.10 prohíbe.

**Outcome:**

RED confirmado con dos mutaciones dirigidas a la vez (implementación y test se escribieron juntos, igual
que T43/T47): (1) `ListaBandeja`: `gasto.categoria !== null && gasto.categoria !== 'Sin categorizar'` →
`gasto.categoria !== null`, dejando pasar `'Sin categorizar'` como categoría propuesta. (2)
`obtenerGastosPendientes`: `return repositorioGastos.pendientesDeConfirmacion()` → `.slice(1)`, quitando
el primer gasto de la lista. Corrí `npx vitest run app/components/ListaBandeja.test.tsx
app/bandeja/obtenerGastosPendientes.test.ts --reporter=verbose`: fallaron exactamente los 2 tests
esperados (el caso `Sin categorizar` de `ListaBandeja`, y el de "sin agregar ni quitar" de
`obtenerGastosPendientes`), con los 3 restantes en verde. Restauradas las dos mutaciones con Edit.
Verificación final: `npm run typecheck && npx vitest run`, corrida tres veces seguidas → typecheck
limpio, 31 test files, 250/250 en verde las tres (245 heredados + 5 nuevos de esta tarea).

## T49 — Confirmar la categoría propuesta

**Requisitos:** 7.3, 7.9
**Depende de:** T23, T47, T48

**Descripción:**

Acción de confirmar desde la bandeja: registra el momento de la confirmación, cambia el origen de
categoría a `usuario`, retira el gasto de la bandeja y descuenta el indicador. El ofrecimiento de
crear la regla llega en T51.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.3 — Confirmar un gasto registra `confirmado_en` y deja `categoria_origen` en `usuario`, sin
  cambiar la categoría propuesta.
- 7.9 — Tras confirmar, el gasto ya no aparece en la bandeja y el indicador de pendientes baja en uno.

**Decision log:**

**7.9 ya estaba probado del lado de los datos antes de esta tarea, y esta tarea no lo vuelve a probar.**
`RepositorioGastos.confirmar` y `pendientesDeConfirmacion` (T23) ya tienen el test "cierre del ciclo: un
gasto que aparecía en `pendientesDeConfirmacion` ya no aparece después de confirmar, y el tamaño baja
exactamente en uno". Como `obtenerGastosPendientes` (T48) y `obtenerCantidadPendientes` (T47) son
identidades sobre `pendientesDeConfirmacion` (sin filtrar ni recalcular, por diseño de esas dos tareas),
ese test de T23 ya prueba transitivamente que la bandeja y el indicador reflejan el cambio. Lo único que
faltaba, y lo único que agrega esta tarea, es la wiring desde la UI hacia `confirmar` — así que el test
de esta tarea se enfoca en esa wiring, no en redemostrar el dato.

**`<form action={onConfirmar}>` sin `'use client'`.** `ListaBandeja` sigue siendo un Server Component:
React 19 soporta pasar una función como prop `action` de un `<form>` y ejecutarla como Server Action al
enviarse, sin que el componente que lo renderiza necesite ser de cliente. La alternativa —convertir
`ListaBandeja` en `'use client'` para usar un `onClick` — habría obligado a que `gasto.montoTotal`
(`Decimal`) cruzara la frontera server/client como prop, donde pierde su prototipo (`.toFixed` deja de
existir del otro lado): un bug real de serialización, no solo una preferencia de estilo. `onConfirmar`
es opcional para no romper los tests de solo lectura de T48 (que no lo pasan).

**`ejecutarConfirmarGasto` es una identidad sobre `RepositorioGastos.confirmar`, y esa identidad ES la
aserción de 7.3 del lado de la UI**: el riesgo real que introduce esta tarea no es que `confirmar`
haga lo correcto (T23 ya lo prueba exhaustivamente) sino que el wiring de la UI pase la categoría
correcta —la que la fila ya mostraba, nunca una elegida por el usuario (eso es T50)—. Se extrajo del
Server Action real (`confirmarGasto`, que lee `FormData` y llama a `revalidatePath`) para poder
testearse sin `FormData` ni el runtime de Next.js de por medio, mismo motivo que `ejecutarPasoImputar`
(T36) y `obtenerGastosPendientes` (T48). `confirmarGasto` en sí (el Server Action con `revalidatePath`)
no tiene test propio: revalidar rutas es responsabilidad del framework, no lógica de este proyecto.

**Outcome:**

RED confirmado con dos mutaciones dirigidas a la vez (implementación y test se escribieron juntos, igual
que T43/T47/T48): (1) `ListaBandeja`: se quitó la condición `tieneCategoriaPropuesta` del formulario
(ahora renderiza para cualquier fila) y se hardcodeó `value={'Sin categorizar'}` en el input oculto de
categoría en vez de `gasto.categoria`. (2) `ejecutarConfirmarGasto`: `repositorioGastos.confirmar(id,
categoria)` → `repositorioGastos.confirmar(id, 'Sin categorizar')`. Corrí `npx vitest run
app/components/ListaBandeja.test.tsx app/bandeja/confirmarGasto.test.ts --reporter=verbose`: fallaron
exactamente los 3 tests esperados (el test unitario de `ejecutarConfirmarGasto`, el de "envía la misma
categoría" y el de "Sin categorizar no ofrece confirmar" — este último porque la mutación quitó la
condición que lo distinguía), con 4 tests restantes en verde. Restauradas las dos mutaciones con Edit.
Verificación final: `npm run typecheck && npx vitest run`, corrida tres veces seguidas → typecheck
limpio, 32 test files, 254/254 en verde las tres (250 heredados + 4 nuevos de esta tarea).

## T50 — Corregir la categoría propuesta

**Requisitos:** 7.4, 9.4
**Depende de:** T49

**Descripción:**

Acción de corregir desde la bandeja: reemplaza la categoría por la elegida, registra el momento de la
confirmación y cambia el origen a `usuario`. Las imputaciones existentes reflejan la nueva categoría
por la relación con el gasto, sin recalcular montos ni meses.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.4 — Corregir un gasto de `Extras` a `Salidas` deja esa categoría, `confirmado_en` con valor y
  `categoria_origen` en `usuario`.
- 9.4 — Tras la corrección, las 6 imputaciones de un gasto en cuotas cuentan en la nueva categoría, y
  sus montos y sus meses quedan idénticos a los de antes de la corrección.

**Decision log:**

**7.4 ya estaba probado del lado de los datos (T23, "confirmar sobre un propuesto como Extras pasando
Salidas..."); 9.4 no lo estaba y es lo que agrega esta tarea de verdad.** `confirmar` y `corregir` son
el mismo `UPDATE` de `RepositorioGastos.confirmar` (T23) — la única diferencia es de dónde sale la
categoría (la que ya tenía la fila, en T49; la que elige el usuario, acá). El riesgo nuevo de 9.4 no es
que el `UPDATE` funcione (T23 ya lo prueba), sino que nadie toque `imputaciones` al corregir: esa tabla
no tiene columna de categoría, la resuelve siempre el join contra `gastos.categoria_id` (design.md), así
que corregir un gasto en 6 cuotas debería mover sus 6 imputaciones a la nueva categoría sin que una sola
fila de `imputaciones` cambie. `infra/db/correccionDeCategoria.test.ts` es la primera prueba explícita
de esa consecuencia de punta a punta, comparando fila por fila `imputaciones` antes/después y
comparando montos y meses agrupados por categoría en `totalesPorMesYCategoria`.

**El selector de corrección reutiliza `CATEGORIAS_INFERIBLES`** (`dominio/categorizacion/categorizarPorReglas.ts`,
ya usado por T27/T28 para restringir qué puede proponer la IA), en vez de declarar las tres categorías
de nuevo en el componente — mismo motivo que `CLASE_COLOR_CATEGORIA` es la única fuente de verdad para
colores (T42). `'Sin categorizar'` nunca es una opción del selector: no tiene sentido "corregir hacia"
el estado que ya representa la ausencia de propuesta.

**El formulario de corregir se ofrece a TODOS los gastos pendientes, con o sin categoría propuesta** —a
diferencia de confirmar, que solo aparece si `tieneCategoriaPropuesta` (T49). Es la superficie que T48
le había dejado explícitamente a esta tarea: "la oferta de elegir entre las tres categorías... [para] un
gasto pendiente con categoría `Sin categorizar`... son de T50". Para ese caso, corregir es el único
camino de salida de la bandeja — confirmar no se ofrece porque no hay nada que confirmar.

**`corregirGasto.ts` reutiliza `ejecutarConfirmarGasto` de `confirmarGasto.ts` (T49) sin duplicar el
`UPDATE`**: el único código nuevo en el Server Action es leer `categoria` del `<select>` en vez de un
campo oculto fijo. Revalida las mismas dos rutas que `confirmarGasto` (Req. 7.9 aplica igual: corregir
también saca al gasto de la bandeja).

**Outcome:**

RED confirmado con tres mutaciones dirigidas a la vez (implementación y tests se escribieron juntos,
igual que T43/T47/T48/T49): (1) `ListaBandeja`: se agregó la condición `tieneCategoriaPropuesta` al
formulario de corregir (dejaba de ofrecerse para `Sin categorizar`) y se agregó `'Sin categorizar'` como
cuarta opción del `<select>`. (2) `RepositorioGastos.confirmar`: `categoria_id = (SELECT id FROM
categorias WHERE nombre = $2)` → `categoria_id = categoria_id` (no-op). Corrí primero
`app/components/ListaBandeja.test.tsx`, `infra/db/correccionDeCategoria.test.ts` e
`infra/db/repositorioGastos.test.ts` con `--reporter=verbose`: la mutación (1) rompió exactamente los 2
tests esperados de `ListaBandeja` (las otras 8, incluidas las de T48/T49, siguieron en verde); la
mutación (2) —al dejar el parámetro `$2` sin usar en la sentencia— hizo que Postgres rechazara el bind
con `bind message supplies 2 parameters, but prepared statement "" requires 1` en los 9 tests de T23 que
llaman a `confirmar` y en el test nuevo de 9.4, con las pruebas de solo lectura del resto del archivo en
verde: el radio de la mutación fue más ancho de lo estrictamente necesario (rompió toda la familia de
tests de `confirmar`, no solo el de 9.4), pero confirmó sin ambigüedad que el test nuevo está atado al
comportamiento real de `confirmar`. Restauradas las tres mutaciones con Edit. Verificación final: `npm
run typecheck && npx vitest run`, corrida tres veces seguidas → typecheck limpio, 33 test files, 259/259
en verde en dos de las tres corridas; la corrida intermedia terminó en un *fatal process out of memory*
de V8 a mitad de la suite (entorno Windows, corridas consecutivas de Vitest con múltiples instancias de
PGlite) sin relación con el código cambiado — no se vio ningún test fallando antes del crash nativo. Se
repitió esa corrida de forma aislada inmediatamente después y terminó limpia, 259/259. Riesgo anotado
abajo, no oculto.

## T51 — Ofrecer y crear la regla del comercio

**Requisitos:** 7.5, 7.6
**Depende de:** T17, T50

**Descripción:**

Al confirmar o corregir, la bandeja ofrece crear una regla que asocie el comercio del gasto con la
categoría resultante. Al aceptar, la regla se persiste activa y los gastos posteriores de ese comercio
se resuelven por regla, sin llegar a la bandeja.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.5 — Tanto confirmar como corregir presentan el ofrecimiento de crear la regla para el comercio del
  gasto con la categoría resultante.
- 7.6 — Aceptar persiste la regla activa; un gasto posterior del mismo comercio queda categorizado con
  origen `regla`, confirmado, y no aparece en la bandeja.

**Decision log:**

**`RepositorioReglas` gana `crear(patronComercio, categoria)`**, el método que `design.md` nunca declaró
porque su interfaz original solo cubría el step categorizar (T33), que únicamente lee reglas. `activa`
queda en `true` y `creada_por` en `'usuario'` (mismo valor que las diez reglas semilla de T17, que
también son `'usuario'` por ser literales del diseño) — `prioridad` en el `DEFAULT 0` de la migración de
T17, sin ninguna preferencia sobre las reglas semilla ni entre reglas creadas por distintos usuarios.

**El checkbox vive en el MISMO `<form>` que confirmar/corregir, no en un segundo paso.** Requirement 7.5
pide que el ofrecimiento se presente "al confirmar o corregir" — no un flujo de dos pantallas. Un
`<input type="checkbox" name="crearRegla" value="true">` dentro de cada formulario (confirmar y
corregir) hace que el mismo envío que resuelve el gasto también decida sobre la regla, sin una segunda
ida y vuelta al servidor. El comercio viaja en un campo oculto (`name="comercio"`) porque el Server
Action no tiene acceso al `Gasto` completo, solo a lo que el formulario le manda.

**`ofrecerCrearRegla` es la función que decide "sí o no" a partir de un booleano ya resuelto, sin saber
de `FormData` ni de checkboxes** — mismo motivo de extracción que `ejecutarConfirmarGasto` (T49): los
Server Actions (`confirmarGasto`, `corregirGasto`) leen `formData.get('crearRegla') === 'true'` (un
checkbox sin marcar no manda la clave en absoluto —comportamiento estándar de HTML, no necesita un
`else` explícito— así que el `get` da `null`, que coacciona a `false`) y delegan la decisión ya
resuelta. La función en sí es trivial (`if (!aceptado) return`), pero es la misma primitiva que reutiliza
T52 para probar el rechazo sin duplicar wiring.

**Hallazgo de infraestructura (no relacionado con la lógica de esta tarea): `maxThreads: 4` (T23) volvió
insuficiente.** Al correr la verificación final, la suite completa crasheó de forma repetible con
"Fatal process out of memory: Zone" (el mismo error que T23 ya había diagnosticado y resuelto una vez)
— confirmado con dos corridas consecutivas de `npx vitest run`, sin cambios de código entre ellas, con
el mismo crash nativo las dos veces. La suite creció de 188 tests (cuando T23 fijó `maxThreads: 4`) a
267 con 34 archivos, varios de ellos con su propia base PGlite nueva (`correccionDeCategoria.test.ts` de
T50, una segunda base en `repositorioReglas.test.ts` de esta tarea). Bajé `poolOptions.threads.maxThreads`
a `2` en `vitest.config.ts` y verifiqué tres corridas completas seguidas sin ningún crash. Es un cambio
de infraestructura de test, no de producto — documentado en el propio archivo de config, mismo lugar
que las dos veces anteriores que esto pasó.

**Outcome:**

RED confirmado con tres mutaciones dirigidas a la vez (implementación y tests se escribieron juntos,
igual que T43/T47-T50): (1) `RepositorioReglas.crear`: `activa = true` → `activa = false` en el
`INSERT`. (2) `ofrecerCrearRegla`: `if (!aceptado) return` → `if (aceptado) return` (invertido). (3)
`ListaBandeja`: el checkbox de confirmar pasó de `value="true"` a `value="false"`. Corrí
`app/components/ListaBandeja.test.tsx`, `infra/db/repositorioReglas.test.ts` y
`app/bandeja/ofrecerCrearRegla.test.ts` con `--reporter=verbose`: fallaron exactamente los 5 tests
esperados (los 2 de `RepositorioReglas.crear`, los 2 de `ofrecerCrearRegla`, y el de "checkbox marcado
en confirmar lleva crearRegla en true"), con los 15 tests restantes de esos tres archivos en verde.
Restauradas las tres mutaciones con Edit. Verificación final: `npm run typecheck && npx vitest run` con
`maxThreads: 2` (ver hallazgo de infraestructura arriba), corrida tres veces seguidas → typecheck
limpio, 34 test files, 267/267 en verde las tres.

## T52 — Rechazar la creación de la regla

**Requisitos:** 7.7
**Depende de:** T51

**Descripción:**

Rechazar el ofrecimiento confirma igualmente el gasto y no persiste ninguna regla.

**Criterios de aceptación (trazados desde requirements.md):**

- 7.7 — Rechazar el ofrecimiento deja el gasto confirmado (`confirmado_en` con valor, `categoria_origen`
  en `usuario`) sin alterar la categoría que ya tenía.
- 7.7 — Rechazar el ofrecimiento no agrega ninguna fila a `reglas_categoria`: la acción de crear regla
  no se invoca.

**Decision log:**

**No hay código de producción nuevo — el mecanismo ya lo construyó T51.** El checkbox sin marcar es
justamente el camino que `ofrecerCrearRegla` (T51) ya maneja con su rama `if (!aceptado) return`, y los
dos tests de esa función más los dos tests de `ListaBandeja` que verifican "sin marcar, `crearRegla` no
viaja en el FormData" ya se escribieron en T51 porque son la otra mitad natural de la misma pieza de
código. Lo que le faltaba al criterio 7.7, y lo único que agrega esta tarea, es una prueba que cierre el
ciclo sobre datos reales: que el gasto SÍ quede confirmado (no que el rechazo de la regla aborte o
altere la confirmación) y que el conteo de `reglas_categoria` no se mueva, en la misma composición
exacta (`ejecutarConfirmarGasto` + `ofrecerCrearRegla`) que ejecutan los Server Actions.

**`app/bandeja/rechazoDeRegla.test.ts` es esa prueba de cierre**, mismo espíritu que el "cierre del
ciclo" de T23 y la idempotencia de T37: contra Postgres real (no simulado), confirma un gasto sin
aceptar la regla y verifica tres cosas en la misma corrida — la categoría queda intacta, `confirmado_en`
y `categoria_origen` se escriben como corresponde, y `reglas_categoria` tiene exactamente las mismas
filas que antes.

**Segundo hallazgo de infraestructura en la misma sesión: `maxThreads: 2` (fijado horas antes, en T51)
tampoco alcanzó.** Al sumar este archivo —una base PGlite más— la suite completa volvió a crashear con
"Fatal process out of memory: Zone". El margen que dejaba `maxThreads: 2` para 34 archivos era
insuficiente para 35. Se bajó a `maxThreads: 1` (serializa los archivos de test entre sí, sin volver a
`pool: 'forks'` ni a `--no-file-parallelism`) y se verificaron tres corridas completas seguidas sin
ningún crash. El detalle completo y la recomendación para el próximo hallazgo (reducir cuántos archivos
instancian su propia base, no seguir bajando este número) quedan en el comentario de `vitest.config.ts`.

**Outcome:**

RED confirmado con la mutación ya usada en T51 (`ofrecerCrearRegla`: `if (!aceptado) return` → `if
(aceptado) return`), aplicada de nuevo para verificar que el test nuevo de esta tarea también la
detecta, no solo los de T51. Corrí `app/bandeja/rechazoDeRegla.test.ts` junto con
`app/bandeja/ofrecerCrearRegla.test.ts` con `--reporter=verbose`: fallaron los 3 tests esperados (los 2
de T51 más el nuevo de cierre de ciclo — `reglasDespues` con 11 filas en vez de 10). Restaurada la
mutación con Edit. Verificación final: `npm run typecheck && npx vitest run` con `maxThreads: 1` (ver
hallazgo de infraestructura arriba), corrida tres veces seguidas → typecheck limpio, 35 test files,
268/268 en verde las tres.
