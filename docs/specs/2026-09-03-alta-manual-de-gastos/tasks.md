# Tareas — Alta manual de gastos

**Estado:** Convergido — 6/6 tareas en CRITERIA MET
**Fecha:** 2026-09-03
**Requisitos:** ./requirements.md
**Diseño:** ./design.md

## Resumen de tareas

| ID | Tarea | Requisitos | Estado |
|---|---|---|---|
| T1 | Migración: `gastos.email_id` nullable | 4.1 | [x] Hecho |
| T2 | `NuevoGastoManual` y `RepositorioGastos.crearManual` | 4.1 | [x] Hecho |
| T3 | `ejecutarCrearGastoManual` — crear, imputar y marcar imputado en una transacción | 3.4, 4.2, 4.3, 4.4, 5.2 | [x] Hecho |
| T4 | Server Action `crearGastoManual` — validación y orquestación | 2.1, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1 | [x] Hecho |
| T5 | `ModalNuevoGasto` — formulario de alta manual | 1.3, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.1 | [x] Hecho |
| T6 | `BotonAgregarGastoFlotante` y wiring en `PantallaDashboard` | 1.1, 1.2 | [x] Hecho |

## Cobertura de requisitos

| Criterio | Tareas |
|---|---|
| 1.1 | T6 |
| 1.2 | T6 |
| 1.3 | T5 |
| 2.1 | T4 |
| 2.2 | T4 |
| 2.3 | T5 |
| 2.4 | T4, T5 |
| 2.5 | T5 |
| 3.1 | T4, T5 |
| 3.2 | T4, T5 |
| 3.3 | T4, T5 |
| 3.4 | T3, T4 |
| 4.1 | T1, T2 |
| 4.2 | T3 |
| 4.3 | T3 |
| 4.4 | T3 |
| 5.1 | T4, T5 |
| 5.2 | T3 |

## T1 — Migración: `gastos.email_id` nullable [x] Hecho

**Requisitos:** 4.1

**Depende de:** ninguno

**Descripción:** Agregar la migración `infra/db/migraciones/0009_gastos_email_id_nullable.sql` que hace `ALTER TABLE gastos ALTER COLUMN email_id DROP NOT NULL`, habilitando que un gasto se cree sin email de origen (alta manual). El `UNIQUE` y la FK a `emails_crudos` se preservan sin cambios — Postgres permite múltiples `NULL` en una columna `UNIQUE`. Ciclo TDD: un test que corre las migraciones sobre una base de test limpia (mismo patrón que `infra/db/migracionCategoriasYReglas.test.ts`, vía `crearBasePostgresDeTest` + `aplicarMigraciones`) e intenta un `INSERT INTO gastos (email_id, monto_total, moneda, categoria_origen, estado) VALUES (NULL, 100, 'ARS', 'usuario', 'categorizado')`, que hoy falla por la constraint `NOT NULL` y debe pasar a insertar sin error una vez aplicada la migración.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.1: un `INSERT` en `gastos` con `email_id NULL` se ejecuta sin violar ninguna constraint de la tabla, dejando la fila creada con `email_id` nulo — precondición de persistencia para que `RepositorioGastos.crearManual` (T2) pueda crear un gasto sin email de origen.
- La constraint `UNIQUE` sobre `email_id` sigue vigente: dos filas con el mismo `email_id` no nulo siguen siendo rechazadas (regresión negativa a cubrir en el mismo test).

**Decision log:** Test nuevo en `infra/db/migracionGastosEmailIdNullable.test.ts` (nombre de archivo
propio en vez de sumar casos a `migracionCategoriasYReglas.test.ts`, porque ejercita una migración
distinta — mismo patrón de un archivo de test por migración/tabla que ya usan `migracionCategoriasYReglas.test.ts`
y los tests de `repositorioGastos`). Sin desvíos de diseño: la migración es exactamente el
`ALTER TABLE ... DROP NOT NULL` de `design.md`, sin tocar el `UNIQUE` ni la FK.

**Outcome:** RED confirmado — `npx vitest run infra/db/migracionGastosEmailIdNullable.test.ts` antes
de la migración falló con `error: null value in column "email_id" of relation "gastos" violates
not-null constraint`. GREEN tras crear `infra/db/migraciones/0009_gastos_email_id_nullable.sql`:

```
✓ infra/db/migracionGastosEmailIdNullable.test.ts (2 tests) 2696ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

Mutación de verificación (SQL de la migración reemplazado por un `SELECT 1;` no-op): el test rojo
volvió a fallar con el mismo error de constraint, y solo ese test — el de la regresión `UNIQUE` con
`email_id` no nulo siguió en verde. Restaurado con Edit. `npm run typecheck` en verde:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

Corrida conjunta final (T1 + `migracionCategoriasYReglas.test.ts`, para descartar interferencia entre
migraciones): `2 passed (2)`, `9 passed (9)`.

**Hallazgo de infraestructura (ad hoc, no bloquea la tarea):** en esta máquina, con memoria del
sistema bajo presión externa (Chrome y otros procesos), la primera corrida de un archivo de test
respaldado por PGlite dentro de una sesión de shell nueva falla de forma intermitente con
`Fatal process out of memory: Zone` — un OOM de la Zone de V8, reproducido también en un test ya
`[x] Hecho` (`migracionCategoriasYReglas.test.ts`) sin ningún cambio de código de por medio, y que
desaparece al reintentar la misma corrida sin cambiar nada. No es un defecto de esta tarea ni de su
test: es contención de memoria del sistema operativo del entorno de ejecución. Todos los `Outcome`
de este `tasks.md` documentan la corrida que efectivamente pasó, reintentando cuando fue necesario.

## T2 — `NuevoGastoManual` y `RepositorioGastos.crearManual` [x] Hecho

**Requisitos:** 4.1

**Depende de:** T1

**Descripción:**

Definir el tipo de dominio `NuevoGastoManual` (monto, comercio, fecha, categoría — la forma real de un
alta manual, sin `tipoTarjeta` ni `cuotasTotal`) en `dominio/gastos/nuevoGastoManual.ts`, y agregar
`crearManual` a la interfaz `RepositorioGastos` y a su implementación en `infra/db/repositorioGastos.ts`.
`crearManual` inserta un gasto con `email_id NULL`, `categoria_id` resuelto contra el nombre de
`categorias`, `categoria_origen 'usuario'` y `estado 'categorizado'` — nunca pasa por `'pendiente'` ni
`'extraido'`, porque un alta manual ya nace categorizada por el usuario. Reusa `COLUMNAS_GASTO` y
`filaAGasto` con el mismo patrón CTE que `crear` y `crearParaRevision`, para no introducir una segunda
forma de fila. Esta tarea cubre únicamente la persistencia del gasto en sí — la imputación y el paso a
`imputado` los orquesta `ejecutarCrearGastoManual` en T3.

En el mismo archivo, esta tarea también cambia el tipo `Gasto.emailId` de `string` a `string | null` —
es el único cambio de tipo existente que `design.md` liga a este trabajo ("Modelos de datos"). Hoy
`emailId` está declarado no nulable en `infra/db/repositorioGastos.ts:26`, pero `crearManual` devuelve un
`Gasto` con `emailId: null`: sin ampliar el tipo, la implementación mínima de este ciclo TDD no compila
(`npm run typecheck` en rojo). El cambio es un ensanchamiento de tipo, no toca la forma de `filaAGasto` ni
de ningún otro método existente — los siete métodos restantes de `RepositorioGastos` siguen devolviendo
`emailId` no nulo en la práctica (vienen de emails reales), así que ningún llamador existente se rompe.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.1: Un test contra `crearBasePostgresDeTest()` que invoca `crearManual({ montoTotal, comercio,
  fechaGasto, categoria })` y verifica que el `Gasto` devuelto (y la fila persistida) tiene `emailId`
  `null`, `categoriaOrigen 'usuario'`, `categoria` igual a la elegida, y `estado 'categorizado'`.
- Verificación: `npm run typecheck && npm test` en verde — el typecheck en particular ejercita el
  ensanchamiento de `Gasto.emailId` a `string | null` descripto arriba, ya que el test anterior asigna el
  resultado de `crearManual` a una variable de tipo `Gasto`.

**Decision log:** Test agregado como un `describe` nuevo en `infra/db/repositorioGastos.test.ts`
(mismo archivo que ya prueba `crear`/`crearParaRevision`/etc., en vez de un archivo separado) —
sigue el mismo patrón que T22/T23/T32/T40 en ese archivo: un `describe` por método nuevo, con su
propia base PGlite en `beforeAll`. `crearManual` persiste `confirmado_en: now()` (no `null`), tal
como fija el pseudocódigo SQL de `design.md` — un alta manual queda confirmada en el acto, igual que
`asignarCategoria` con origen `'regla'`; no está en los criterios de aceptación de esta tarea, así
que no se agregó una aserción dedicada, pero tampoco se desvió del diseño. Sin otros desvíos.

**Outcome:** RED confirmado — `npm run typecheck` antes de la implementación falló con
`error TS2339: Property 'crearManual' does not exist on type 'RepositorioGastos'` (en
`infra/db/repositorioGastos.test.ts(219,50)`). GREEN tras crear `dominio/gastos/nuevoGastoManual.ts`,
ensanchar `Gasto.emailId`/`FilaGasto.email_id` a `string | null`, y agregar `crearManual`:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

```
✓ infra/db/repositorioGastos.test.ts (57 tests) 15600ms
 Test Files  1 passed (1)
      Tests  57 passed (57)
```

Mutación de verificación (`crearManual` devolviendo `categoriaOrigen: 'ia'` en vez de `'usuario'`,
con Edit): el único test que falló fue el nuevo de `crearManual`
(`expected 'ia' to be 'usuario'`), los 56 restantes del archivo siguieron en verde. Restaurado con
Edit; corrida final: `57 passed (57)`, `tsc --noEmit` en verde.

**Hallazgo de infraestructura (mismo de T1, no bloquea la tarea):** las corridas de este archivo
(11 bases PGlite en `beforeAll` a lo largo de sus `describe`) mostraron el mismo
`Fatal process out of memory: Zone` intermitente por presión de memoria del sistema operativo en
esta máquina, en 2 de 4 intentos incluso después de la restauración (sin ningún cambio de código de
por medio). Documentado y reintentado hasta obtener la corrida real en verde pegada arriba.

## T3 — `ejecutarCrearGastoManual` — crear, imputar y marcar imputado en una transacción [x] Hecho

**Requisitos:** 3.4, 4.2, 4.3, 4.4, 5.2
**Depende de:** T2

**Descripción:**

Crear `app/dashboard/crearGastoManual.ts` con la función testeable `ejecutarCrearGastoManual(pool: Pool, datos: NuevoGastoManual): Promise<Gasto>`, siguiendo el mismo patrón que `ejecutarConfirmarGastoConRegla` en `app/bandeja/confirmarGasto.ts:50-63`: envuelve todo en `ejecutarEnTransaccion(pool, async (cliente) => { ... })`, construye `crearRepositorioGastos(cliente)` DENTRO del callback (ligado al `PoolClient` transaccional, nunca al `pool` compartido), y adentro:

1. `const gasto = await repositorioGastos.crearManual(datos)` (T2) — Req. 4.1, ya cubierto por T2, no se re-verifica acá.
2. `const [monto] = dividirEnCuotas(datos.montoTotal, 1)` — siempre una sola cuota, nunca imputación en múltiples meses (fuera de alcance del spec).
3. `await cliente.query('INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, $2, $3, $4)', [gasto.id, 1, monto.toString(), mesDe(datos.fechaGasto)])` — Req. 4.2. **Nota de implementación, verificada leyendo código real, no `design.md`:** el pseudocódigo de `design.md` (sección "Componentes e interfaces" → `ejecutarCrearGastoManual`) llama en su lugar a `crearRepositorioImputaciones(cliente).reemplazarPara(...)`, pero eso no compila ni corre: `reemplazarPara` (`infra/db/repositorioImputaciones.ts:58-84`) abre su PROPIA conexión y transacción (`pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`/`release()` internos) y `crearRepositorioImputaciones` está tipado contra un `pg.Pool` completo, no contra `Pick<Pool, 'query'>` como sí lo está `crearRepositorioGastos` (ver el comentario en `infra/db/repositorioGastos.ts:146-149`, que explica exactamente por qué se necesita ese tipo más angosto para ser composable dentro de una transacción). Pasarle el `cliente` (`PoolClient`) de este método a `crearRepositorioImputaciones` ni siquiera tipa (`Pool` exige `totalCount`/`idleCount`/`waitingCount`/`connect()` que `PoolClient` no tiene) y, si se fuerza con un cast, falla en runtime: `Client.prototype.connect()` sobre un cliente ya conectado lanza `'Client has already been connected. You cannot reuse a client.'` (comportamiento real de `node_modules/pg/lib/client.js:158-159`, no una suposición). Como el gasto recién creado en el paso 1 nunca tiene imputaciones previas, el `DELETE` que hace `reemplazarPara` antes de insertar sería un no-op de todos modos — un `INSERT` directo contra el mismo `cliente` transaccional cumple Req. 4.2 exactamente igual, sin ese conflicto de tipos/runtime y sin tocar `infra/db/repositorioImputaciones.ts` (código ya `[x] Hecho` del spec `2026-08-25-pipeline-gastos-email`, fuera de la autoridad de este spec para modificar).
4. `await repositorioGastos.marcarImputado(gasto.id)` — Req. 4.3.
5. `return gasto`.

Si cualquiera de los tres pasos falla, `ejecutarEnTransaccion` hace `ROLLBACK` y no queda ni el `gasto` ni la imputación escritos (Req. 4.4 y la mitad transaccional de Req. 3.4 — la mitad de validación, que nunca llega a tocar la base, la cubre `validarDatosGastoManual` en T4) — mismo mecanismo que ya prueba `corregirGasto.test.ts` para el caso confirmar+regla. No se agrega lógica de validación acá (ya la hace T4 antes de invocar esta función) ni lógica de dominio nueva: `dividirEnCuotas` y `mesDe` ya existen en `dominio/imputacion/`.

Esta tarea no toca el Server Action (`crearGastoManual`, T4) ni la UI — su verificación se limita a la función orquestadora contra una base Postgres real de test, igual que `corregirGasto.test.ts`. El test de 5.2 no se limita a inferir el resultado de que la consulta no filtra por origen: llama a `repositorioImputaciones.totalesPorMesYCategoria` (o `imputacionesDetalladasEntre`) para el mes de `fechaGasto` después de `ejecutarCrearGastoManual` y verifica que el monto del gasto recién creado aparece en el total de esa categoría y mes.

**Criterios de aceptación (trazados desde requirements.md):**

- 4.2. WHEN el gasto se crea THE SYSTEM SHALL crear exactamente una imputación por el monto total, en el mes que resulte de aplicar `mesDe` a la fecha ingresada. Verificado con el `INSERT` directo descripto arriba (no vía `reemplazarPara`, ver nota de implementación).
- 4.3. WHEN el gasto y su imputación quedan creados correctamente THE SYSTEM SHALL marcar el gasto en estado `imputado`.
- 4.4. THE SYSTEM SHALL ejecutar la creación del gasto y de su imputación dentro de una única transacción — si cualquier paso falla, ningún dato queda escrito. Verificado simulando un fallo en el `INSERT` de la imputación (o en `marcarImputado`) y comprobando que el `INSERT` de `gastos` no quedó commiteado.
- 3.4 (mitad transaccional — la mitad de validación la cubre T4): el mismo test de rollback de 4.4 verifica que ante una falla a mitad de la transacción ni el gasto ni la imputación quedan a medio cargar en la base.
- 5.2. WHEN se consulta `totalesPorMesYCategoria` (o `imputacionesDetalladasEntre`) para el mes y la categoría del gasto recién creado THE SYSTEM SHALL incluir su monto en el total, en pie de igualdad con una imputación proveniente de un email — verificado con una llamada real a ese método del repositorio después de `ejecutarCrearGastoManual`, no solo por inspección del SQL.

**Decision log:** `app/dashboard/crearGastoManual.ts` y su test `app/dashboard/crearGastoManual.test.ts`
ya existían en el árbol de trabajo al arrancar este ciclo de apply, sin marca `[x]` en este `tasks.md`
(Decision log/Outcome vacíos) — restos de una sesión previa interrumpida. La implementación encontrada
sigue el patrón exacto pedido (envuelve `crearRepositorioGastos(cliente)` dentro del callback de
`ejecutarEnTransaccion`, `INSERT` directo contra `imputaciones` en vez de `reemplazarPara`, con la
misma nota de implementación ya escrita en este archivo) y corrige un hallazgo real propio de su
propio ciclo TDD anterior: el pseudocódigo de `design.md` retorna el `gasto` capturado ANTES de
`marcarImputado`, así que su `estado` en memoria seguiría en `'categorizado'` aunque la fila en la
base ya esté en `'imputado'` — se corrige devolviendo `{ ...gasto, estado: 'imputado' }` sin una
segunda consulta. Se reescribió igualmente el archivo de test desde cero (mismos casos exigidos por
esta tarea: 4.1 vía T2/4.3, 4.2, dos variantes de rollback para 3.4/4.4 — INSERT de imputaciones y
`marcarImputado` — y 5.2) para poder ejercer un ciclo RED→GREEN real sobre el código encontrado, en
vez de heredar un GREEN sin verificación propia.

Para simular el fallo a mitad de transacción de 3.4/4.4: ni `gastos.monto_total` ni
`imputaciones.monto` distinguen el caso (la misma constraint `> 0`/`>= 0` con una sola cuota da el
mismo valor en las dos tablas), así que una violación de constraint natural fallaría también en el
paso 1 y no probaría nada nuevo sobre el paso 3/4. Se usa en cambio un `Pool` envolvente
(`crearPoolQueFallaEnLaPrimerQueryQueEmpiezaCon`) que intercepta la primera query cuyo texto arranca
con un prefijo dado (`'INSERT INTO imputaciones'` o `"UPDATE gastos SET estado = 'imputado'"`) y la
rechaza con un error propio, delegando todas las demás queries (`BEGIN`, el `INSERT` de `crearManual`,
`ROLLBACK`) al cliente real de PGlite — mismo espíritu que el "camino de fallo" de
`ejecutarEnTransaccion.test.ts`, aplicado a la composición completa de T3 en vez de a una tabla de
prueba aislada.

**Outcome:** RED confirmado moviendo temporalmente `app/dashboard/crearGastoManual.ts` fuera del árbol
(sin implementación previa que heredar) y corriendo el test nuevo:

```
❯ app/dashboard/crearGastoManual.test.ts (0 test)
Error: Failed to load url @/app/dashboard/crearGastoManual ... Does the file exist?
Test Files  1 failed (1)
```

Restaurado el archivo (mismo contenido, sin cambios) y corrida en verde:

```
✓ app/dashboard/crearGastoManual.test.ts (5 tests) 2745ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

`npm run typecheck` en verde:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

Mutación de verificación (con Edit): `return { ...gasto, estado: 'imputado' }` reemplazado por
`return gasto` (revierte el fix del hallazgo de estado stale documentado arriba). Rompió exactamente
el test de 4.3, los otros cuatro de este archivo siguieron en verde:

```
❯ crea el gasto sin email de origen y lo deja imputado (Req. 4.1 vía T2, 4.3)
  → expected 'categorizado' to be 'imputado'
Test Files  1 failed (1)
     Tests  1 failed | 4 passed (5)
```

Restaurado con Edit. Corrida final completa, `npm run typecheck && npm test`:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

```
✓ app/dashboard/crearGastoManual.test.ts (5 tests) 2369ms
...
 Test Files  64 passed (64)
      Tests  459 passed (459)
Duration  135.46s
```

Todos los archivos de test del repo, incluidos T1/T2 (`migracionGastosEmailIdNullable.test.ts`,
`repositorioGastos.test.ts`), quedaron en verde en la misma corrida.

## T4 — Server Action `crearGastoManual` — validación y orquestación [x] Hecho

**Requisitos:** 2.1, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1

**Depende de:** T3

**Descripción:**

Antes de escribir la validación, agregar en `dominio/categorizacion/categorizarPorReglas.ts`, junto a `CATEGORIAS_INFERIBLES`/`CATEGORIAS_CORREGIBLES`, la constante `export const CATEGORIAS_MANUAL = CATEGORIAS_INFERIBLES` (Req. 2.5, tal como especifica `design.md` — "Componentes e interfaces"). Es un alias de un array ya existente en el código (`CATEGORIAS_INFERIBLES` ya vive en ese archivo), no un array nuevo ni lógica nueva: por eso no lleva un ciclo TDD propio y se agrega junto a su primer consumidor real, que es la validación de esta misma tarea — el test de `validarDatosGastoManual` para "categoría fuera de `CATEGORIAS_MANUAL`" (ver más abajo) es su verificación indirecta. Ninguna otra tarea de este `tasks.md` define esta constante hasta ahora, y T5 (que también la usa, para las opciones del `<select>`) depende de T4.

En `app/dashboard/crearGastoManual.ts`, agregar una función pura y testeable `validarDatosGastoManual(formData: FormData): { datos: NuevoGastoManual } | { error: string }` que lee `monto`, `comercio`, `fecha` y `categoria` del `FormData` y valida: `normalizarMonto(monto)` no es `null` Y el `Decimal` resultante es `> 0` (Req. 2.1, 3.1 — `normalizarMonto` no valida signo ni cero, así que la positividad se chequea acá); `comercio.trim()` no vacío (Req. 2.2, 3.2); `categoria` presente y perteneciente a `CATEGORIAS_MANUAL` (`Salidas`, `Comida`, `Extras`) (Req. 2.4, 3.3). Ante el primer fallo devuelve `{ error }` con un mensaje describiendo el campo inválido; al ser una función pura sobre `FormData` que no recibe ni toca ningún repositorio ni `Pool`, la garantía de "ningún dato queda escrito" ante un error de validación (Req. 3.4, mitad de validación — la mitad de rollback transaccional, ante una falla a mitad de la transacción ya iniciada, la cubre `ejecutarCrearGastoManual` en T3) queda probada por construcción, sin necesidad de espiar ni mockear `ejecutarCrearGastoManual` — este repositorio no tiene ningún precedente de auto-mock de un módulo sobre sí mismo (`vi.mock` de un archivo importándose a sí mismo), y la única técnica de mock ya usada (`clienteRedaccionHttp.test.ts`) mockea un SDK externo, no una función hermana en el mismo archivo. Si todo valida, `validarDatosGastoManual` devuelve `{ datos }` con el `NuevoGastoManual` armado (`montoTotal` el `Decimal` de `normalizarMonto`, `comercio` recortado, `fechaGasto` parseada del input `date`, `categoria` la elegida).

Definir también en el mismo archivo el tipo `EstadoFormularioGastoManual = { error: string } | null` y el Server Action real `crearGastoManual` (firma `(estadoPrevio: EstadoFormularioGastoManual, formData: FormData) => Promise<EstadoFormularioGastoManual>`, pensada para `useActionState`) que llama a `validarDatosGastoManual(formData)`; si devuelve `{ error }`, lo retorna sin invocar `ejecutarCrearGastoManual` (T3); si devuelve `{ datos }`, llama `await ejecutarCrearGastoManual(pool, datos)` y, si resuelve, `revalidatePath('/dashboard')` + `revalidatePath('/', 'layout')` y retorna `null`. Mismo patrón de raíz de composición que `app/bandeja/confirmarGasto.ts` (un único `Pool` de módulo, `'use server'` al tope del archivo). Siguiendo la convención ya establecida en `confirmarGasto.ts`/`corregirGasto.ts` — documentada en `docs/specs/2026-08-25-pipeline-gastos-email/tasks.md`, Decision log de T49: "`confirmarGasto` en sí (el Server Action con `revalidatePath`) no tiene test propio: revalidar rutas es responsabilidad del framework, no lógica de este proyecto" — el propio `crearGastoManual` no lleva test unitario dedicado a la invocación de `revalidatePath`; su comportamiento de negocio observable queda cubierto por los tests de `validarDatosGastoManual` (esta tarea) y de `ejecutarCrearGastoManual` (T3).

**Criterios de aceptación (trazados desde requirements.md):**

- 2.1, 3.1: `validarDatosGastoManual` con un monto vacío, no numérico, `'$0,00'` o negativo devuelve `{ error }` describiendo el problema del monto, y NO arma `{ datos }`.
- 2.2, 3.2: `validarDatosGastoManual` con `comercio` vacío o solo espacios devuelve `{ error }` y NO arma `{ datos }`.
- 2.4, 3.3: `validarDatosGastoManual` con `categoria` ausente o fuera de `CATEGORIAS_MANUAL` devuelve `{ error }` y NO arma `{ datos }` — este caso es también la verificación indirecta de que `CATEGORIAS_MANUAL` quedó correctamente exportada como alias de `CATEGORIAS_INFERIBLES`.
- 3.4 (mitad de validación): en los tres casos anteriores, `validarDatosGastoManual` es una función pura que no recibe ni toca ningún repositorio ni `Pool` — no hay ningún camino por el que un error de validación alcance a escribir en la base.
- Con datos válidos (monto `'$1.234,56'`, comercio `'Kiosco'`, fecha de hoy, categoría `'Comida'`), `validarDatosGastoManual` devuelve `{ datos }` con `montoTotal` igual al `Decimal` de `normalizarMonto('$1.234,56')`, `comercio: 'Kiosco'` y `categoria: 'Comida'`.
- 5.1: por lectura de código (sin test unitario dedicado, siguiendo la convención de `confirmarGasto.ts`/`corregirGasto.ts`), `crearGastoManual` invoca `ejecutarCrearGastoManual` solo cuando `validarDatosGastoManual` devuelve `{ datos }`, y `revalidatePath('/dashboard')` + `revalidatePath('/', 'layout')` solo después de que esa llamada resuelve; el cierre visible del modal (mitad de UI de 5.1) lo verifica T5.
- Verificación: `npm run typecheck && npm test` en verde, incluyendo `app/dashboard/crearGastoManual.test.ts` con los casos de `validarDatosGastoManual` listados arriba, que falla en rojo antes de la implementación mínima y pasa en verde después.

**Decision log:** `CATEGORIAS_MANUAL` agregada a `dominio/categorizacion/categorizarPorReglas.ts` como alias
de `CATEGORIAS_INFERIBLES`, tal como fija `design.md`. `validarDatosGastoManual`, `EstadoFormularioGastoManual`
y `crearGastoManual` agregados al mismo `app/dashboard/crearGastoManual.ts` que ya traía `ejecutarCrearGastoManual`
(T3) — no un archivo nuevo, siguiendo la descripción de la tarea.

Desvío deliberado de `design.md` respecto de dónde vive la directiva `'use server'`: el diagrama de
"Arquitectura" la etiqueta sobre `crearGastoManual` puntualmente, pero el patrón ya establecido en
`confirmarGasto.ts`/`corregirGasto.ts` la pone al tope del archivo. Ponerla al tope de este archivo
habría violado una regla real del framework —no una preferencia de estilo—: un archivo con `'use server'`
a nivel de archivo obliga a que TODA función exportada sea `async` (cada export se vuelve su propia
Server Function; ver `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md`,
sección "Using `use server` at the top of a file"), y `validarDatosGastoManual` es deliberadamente
SÍNCRONA (la prueba de Req. 3.4 mitad-validación depende de que sea una función pura sin `Pool`/repositorio,
no de que sea `async`). Se usó en cambio `'use server'` inline al tope del cuerpo de `crearGastoManual`
—el otro patrón que la misma guía documenta ("Using `use server` inline")— dejando `validarDatosGastoManual`
y `ejecutarCrearGastoManual` como exports ordinarios del módulo, testeables sin el runtime de Next.js.

`validarDatosGastoManual` valida en el orden monto → comercio → categoría que fija la descripción de la
tarea, devolviendo `{ error }` en el primer campo inválido. La fecha (`fecha` del `FormData`) no forma parte
de los criterios de aceptación de error de esta tarea (2.3 es responsabilidad de T5, el `defaultValue` del
`<input type="date">`), pero igual necesita parsearse a un `Date` real para `NuevoGastoManual.fechaGasto`.
Hallazgo real verificado leyendo código, no una suposición: `new Date('AAAA-MM-DD')` interpreta el string
como medianoche UTC, que en `ZONA_REFERENCIA` (`America/Argentina/Buenos_Aires`, UTC-3) son las 21:00 del
día ANTERIOR — para el día 1 de un mes, eso le haría calcular a `mesDe` (T3) el mes anterior al elegido por
el usuario. Se agregó `parsearFechaInput`, que construye la fecha con `TZDate` a mediodía en
`ZONA_REFERENCIA` (mismo patrón ya usado por `componerFechaGasto.ts` del spec de pipeline por email), evitando
el corrimiento de día/mes. Si el texto de fecha no tiene forma `AAAA-MM-DD` (`FormData` vacío o corrupto,
caso que no debería ocurrir con el `<input type="date">` real de T5), cae a `new Date()` (hoy) en vez de
devolver `{ error }`: no hay un criterio de aceptación que pida rechazar una fecha ausente, y bloquear el
alta completa por eso sería inventar un requisito nuevo.

**Outcome:** RED confirmado agregando el `describe('validarDatosGastoManual ...')` nuevo a
`app/dashboard/crearGastoManual.test.ts` (que aún no existía en el código) y corriendo el archivo:

```
TypeError: validarDatosGastoManual is not a function
 Test Files  1 failed (1)
      Tests  8 failed | 5 passed (13)
```

(los 5 tests que siguieron en verde son los 5 de T3, `ejecutarCrearGastoManual`, ya `[x] Hecho` — no se
tocaron). GREEN tras agregar `CATEGORIAS_MANUAL`, `validarDatosGastoManual`, `EstadoFormularioGastoManual`
y `crearGastoManual`:

```
✓ app/dashboard/crearGastoManual.test.ts (13 tests) 2104ms
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

Mutación de verificación (con Edit, en `validarDatosGastoManual`): `!monto.greaterThan(0)` reemplazado por
`false` (el chequeo de positividad se elimina, dejando pasar `monto === null` solo). Rompió exactamente el
test del caso "monto cero" (`$0,00`), los 12 restantes siguieron en verde:

```
❯ con un monto cero, devuelve { error } y no arma { datos } (Req. 2.1, 3.1)
  → expected false to be true
 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
```

Restaurado con Edit. Corrida final completa, `npm run typecheck && npm test`:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

```
 Test Files  64 passed (64)
      Tests  467 passed (467)
Duration  127.41s
```

Todos los archivos de test del repo, incluidos T1/T2/T3, quedaron en verde en la misma corrida.

## T5 — `ModalNuevoGasto` — formulario de alta manual [x] Hecho

**Requisitos:** 1.3, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.1

**Depende de:** T4

**Descripción:** Crear el componente cliente `app/components/ModalNuevoGasto.tsx`, con la firma `ModalNuevoGasto(props: { abierto: boolean; onCerrar: () => void }): JSX.Element` definida en `design.md`. Renderiza un formulario con cuatro campos: monto (texto libre en formato ARS, ej. `$1.234,56`), comercio (texto), fecha (`<input type="date">` con la fecha de hoy como `defaultValue`) y categoría (`<select>` restringido a `CATEGORIAS_MANUAL` — Salidas, Comida, Extras — sin "Sin categorizar" ni "Descartar"). El formulario se conecta a la Server Action `crearGastoManual` (T4) vía `useActionState(crearGastoManual, null)`; cuando `estado?.error` está presente, se muestra inline junto al formulario sin cerrar el modal ni limpiar lo tipeado. Cerrar el modal (botón "Cancelar") invoca `onCerrar` sin invocar la Server Action, descartando cualquier dato ingresado (Req. 1.3) — no se persiste estado local entre una apertura y la siguiente. Cuando el `useActionState` transiciona a `estado === null` **como consecuencia de un envío** (éxito, sin error), el componente invoca `onCerrar` (Req. 5.1); la revalidación real del dashboard (`revalidatePath`) es responsabilidad de la Server Action en T4 y no se re-verifica en este test, que solo cubre la reacción del componente al estado devuelto. `useActionState(crearGastoManual, null)` también devuelve `estado === null` en el render inicial, antes de cualquier submit: la implementación NO debe confundir ese estado inicial con un éxito — el cierre solo dispara tras una transición real desde un envío (por ejemplo, distinguiendo con el flag `pending`/`isPending` de `useActionState` o un ref que marque si hubo un submit previo), nunca por el mero hecho de que `estado` sea `null` al montar. Reusa las clases visuales ya establecidas en `ListaBandeja.tsx:121-158` (inputs/`<select>` con `min-h-11 rounded-lg border border-texto-muted/25 bg-superficie px-3 text-sm text-texto`, botón primario `rounded-full bg-acento ... text-superficie` para "Guardar") y un overlay con la paleta `superficie`/`texto-muted` ya existente, sin introducir ninguna paleta nueva. Cuando `abierto` es `false`, el componente no renderiza el formulario (retorna `null` o equivalente) — este contrato de render es lo que T6 explota para verificar que el FAB efectivamente dispara la apertura, así que queda probado acá, en el componente dueño del contrato, y no re-inferido en T6.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.3: Test — con el modal abierto y datos tipeados en los campos, al hacer click en "Cancelar" se invoca `onCerrar` y no se invoca `crearGastoManual`; al reabrir el modal (`abierto` pasa de `false` a `true` de nuevo) los campos aparecen vacíos/en sus valores por defecto, no con lo tipeado antes de cancelar.
- 2.3: Test — el input de fecha se renderiza con `defaultValue` igual a la fecha de hoy en formato `AAAA-MM-DD`.
- 2.4: Test — el `<select>` de categoría no tiene ninguna opción de categoría preseleccionada que permita un envío válido sin que el usuario elija una (placeholder deshabilitado o vacío por defecto).
- 2.5: Test — las opciones del `<select>` de categoría son exactamente las de `CATEGORIAS_MANUAL` (Salidas, Comida, Extras); ni "Sin categorizar" ni "Descartar" aparecen entre las opciones renderizadas.
- 3.1: Test — cuando el estado de `useActionState` es `{ error: '...' }` por un monto inválido, el mensaje de error se renderiza inline y el modal permanece abierto (`onCerrar` no se invoca).
- 3.2: Test — mismo comportamiento que 3.1 para el caso en que el error corresponde a comercio vacío.
- 3.3: Test — mismo comportamiento que 3.1 para el caso en que el error corresponde a categoría ausente.
- 5.1: Test — cuando el estado de `useActionState` pasa a `null` tras haber enviado el formulario (sin error), el componente invoca `onCerrar`. Test adicional (regresión de la ambigüedad inicial/post-envío): al montar el componente con `abierto: true` y sin que se haya disparado ningún submit, `onCerrar` NO es invocado, aunque `estado` inicial de `useActionState` sea `null`.
- Contrato de render (soporte de 1.1/1.2, explotado por T6): Test — con `abierto: false`, `ModalNuevoGasto` no renderiza ningún campo del formulario (monto, comercio, fecha, categoría) en el DOM.

**Decision log:** `app/components/ModalNuevoGasto.tsx` creado con la firma exacta de `design.md`
(`{ abierto: boolean; onCerrar: () => void }`). `useActionState(crearGastoManual, null)` conectado
directo al `<form action={formAction}>` (T4 ya expone `crearGastoManual` como Server Action
apta para esto). Los cuatro campos usan las clases visuales de `ListaBandeja.tsx:121-158`
(`min-h-11 rounded-lg border border-texto-muted/25 bg-superficie px-3 text-sm text-texto` para
inputs/`<select>`, `rounded-full bg-acento ... text-superficie` para "Guardar") y un overlay
`fixed inset-0` con `bg-texto-muted/40` — sin paleta nueva. `<select>` de categoría itera
`CATEGORIAS_MANUAL` (T4) con un `<option value="" disabled>` inicial, mismo patrón que el selector
de corrección de `ListaBandeja` pero sin `defaultValue` distinto de `''` (Req. 2.4: nada
preseleccionado que permita un envío válido sin elegir).

La distinción "estado inicial vs. éxito post-envío" de `useActionState` (ambigüedad advertida
explícitamente en la descripción de esta tarea) se resuelve con `pendienteAnteriorRef`, un `useRef`
que guarda el flag `pendiente` del render anterior: `onCerrar` solo se invoca cuando `pendiente` pasa
de `true` a `false` (una transición de envío que termina) Y `estado` resultante es `null` — nunca por
el mero hecho de que `estado` sea `null`, que también es cierto en el primer render antes de cualquier
submit. El cierre "vacía" los campos del formulario (Req. 1.3) sin lógica de reseteo dedicada: como
`abierto === false` hace que el componente retorne `null`, el `<form>` (no controlado, solo
`defaultValue`) se desmonta del DOM al cerrar y se remonta desde cero al reabrir — el mismo mecanismo
de React que ya limpia cualquier valor tipeado, sin un `key` ni un `reset()` explícito. El hook
`useActionState` en sí no se desmonta (vive en el mismo componente, antes del `if (!abierto) return
null`, por las Reglas de los Hooks), pero no hay ningún criterio de aceptación que dependa de que su
`estado` se resetee entre aperturas.

`fechaDeHoyComoInputDate` (fecha de hoy en `AAAA-MM-DD`, Req. 2.3) es una función nueva, chica,
propia del componente — no existía un helper equivalente en el repo (`mesDe`/`componerFechaGasto`
resuelven `AAAA-MM` o parsean fechas, no formatean "hoy" a texto). Usa el mismo patrón de
`Intl.DateTimeFormat` con `timeZone: ZONA_REFERENCIA` que esos dos módulos, pero sin las `parts`
separadas de `mesDe`: `en-CA` ya formatea como `AAAA-MM-DD` con un solo `.format()`, verificado antes
de escribir el componente (`node -e "new Intl.DateTimeFormat('en-CA', { timeZone:
'America/Argentina/Buenos_Aires' }).format(new Date())"` → `'2026-09-04'`).

Sin desvíos de diseño. El test mockea el módulo hermano `@/app/dashboard/crearGastoManual` con
`vi.mock` (no un auto-mock del propio módulo bajo test: `ModalNuevoGasto` no recibe la Server Action
por props, así que no hay otra forma de controlar `{ error }` vs. éxito sin tocar una base Postgres
real) — mismo espíritu que `clienteRedaccionHttp.test.ts` mockeando el SDK de Anthropic, aplicado acá
a la Server Action en vez de a un SDK externo.

**Outcome:** RED confirmado — `npx vitest run app/components/ModalNuevoGasto.test.tsx` antes de crear
el componente falló con `Error: Failed to resolve import "@/app/components/ModalNuevoGasto"`. GREEN
tras crear `app/components/ModalNuevoGasto.tsx`:

```
✓ app/components/ModalNuevoGasto.test.tsx (11 tests) 346ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

`npm run typecheck` en verde:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

Mutación de verificación (con Edit, en el `useEffect` de cierre): `if (huboEnvioQueTermino && estado
=== null)` reemplazado por `if (estado === null)` — reintroduce exactamente la ambigüedad que esta
tarea advierte (confundir el `null` inicial de `useActionState` con un éxito post-envío). Rompió 6 de
los 11 tests, todos los que dependen de que `onCerrar` NO se dispare espuriamente (cancelar, los tres
de error inline, y los dos de "cierre tras éxito" — incluida la regresión dedicada al montaje), y
dejó en verde los 5 que no tocan `onCerrar` (contrato de render con `abierto=false`, y los tres de
valores por defecto):

```
 Test Files  1 failed (1)
      Tests  6 failed | 5 passed (11)
```

Restaurado con Edit. Corrida final completa, `npm run typecheck && npm test`:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

```
 Test Files  65 passed (65)
      Tests  478 passed (478)
Duration  130.16s
```

Todos los archivos de test del repo, incluidos T1–T4, quedaron en verde en la misma corrida.

## T6 — `BotonAgregarGastoFlotante` y wiring en `PantallaDashboard` [x] Hecho

**Requisitos:** 1.1, 1.2

**Depende de:** T5

**Descripción:** Crear `app/components/BotonAgregarGastoFlotante.tsx`, un client component que renderiza el FAB fijo sobre `/dashboard`, y montarlo desde `PantallaDashboard` (`app/components/PantallaDashboard.tsx`) junto con el estado local `abierto`/`setAbierto` que controla `ModalNuevoGasto` (T5). El FAB solo dispara la apertura del modal — no conoce `crearGastoManual` ni `NuevoGastoManual`, esa responsabilidad ya vive en `ModalNuevoGasto`. `PantallaDashboard` pasa `abierto={abierto}` y `onCerrar={() => setAbierto(false)}` a `ModalNuevoGasto`, y el `onClick` del FAB hace `setAbierto(true)`. Sin navegación: nada de `<Link>` ni `router.push`, todo el cambio de UI es estado de React dentro del mismo árbol de `/dashboard` (Req. 1.2). Reusa la paleta visual ya establecida (`bg-acento`, `text-superficie`) para el botón, posicionado `fixed` sobre el layout `max-w-md` de `PantallaDashboard`, sin tapar `BottomNavBar`.

**Criterios de aceptación (trazados desde requirements.md):**

- 1.1: al renderizar `PantallaDashboard`, existe un elemento con `data-testid="fab-nuevo-gasto"` visible en `/dashboard`.
- 1.2: al hacer click en `fab-nuevo-gasto`, `ModalNuevoGasto` pasa a recibir `abierto=true` (verificable por la aparición de su formulario en el DOM, ej. `data-testid="modal-nuevo-gasto"` expuesto por T5) sin que cambie la URL ni se dispare ningún `fetch`/Server Action — el test usa `render` de Testing Library sobre `PantallaDashboard` con un mock/stub de `ModalNuevoGasto` o el componente real de T5 ya convergido, y asegura que el resto del árbol (`TopAppBar`, `BottomNavBar`, totales) sigue montado sin remount.
- Verificación: `npm run typecheck && npm test` en verde, incluyendo el test nuevo en `app/components/PantallaDashboard.test.tsx` (o `BotonAgregarGastoFlotante.test.tsx` si el ciclo TDD lo aísla) que falla en rojo sin el FAB/wiring y pasa en verde con la implementación mínima.

**Decision log:** `BotonAgregarGastoFlotante` creado como componente puramente visual sin estado propio,
firma `{ onAbrir: () => void }` — desvío deliberado y menor respecto del pseudocódigo de
`design.md` (que declara `BotonAgregarGastoFlotante(): JSX.Element`, sin props): la descripción de esta
misma tarea exige que "el `onClick` del FAB hace `setAbierto(true)`" y que el FAB "no conozca
`crearGastoManual` ni `NuevoGastoManual`" — sin una prop de callback no hay forma de que
`PantallaDashboard` reciba el evento de click sin que el FAB importe el estado del padre o un store
global, ninguno de los dos previsto por el diseño. `PantallaDashboard` gana el estado local
`nuevoGastoAbierto`/`setNuevoGastoAbierto` (mismo patrón `useState` que ya usa para
`categoriaExpandida`, `tipoGrafico`, etc.) y monta `BotonAgregarGastoFlotante` +
`ModalNuevoGasto` (T5, reusado sin modificar) al final del árbol, pasando `onAbrir={() =>
setNuevoGastoAbierto(true)}` y `abierto`/`onCerrar` a `ModalNuevoGasto` — sin `<Link>` ni
`router.push` en ningún punto (Req. 1.2). El FAB se posiciona `fixed inset-x-0 bottom-20` envuelto en
un `div` `mx-auto max-w-md` (mismo ancho que ya usa `BottomNavBar`) con `pointer-events-none` en el
wrapper y `pointer-events-auto` en el botón, para no interceptar clicks fuera de su propia área ni
quedar pegado al borde de una pantalla ancha; `bottom-20` (80px) deja 16px de aire sobre
`BottomNavBar` (`h-16` = 64px, `z-50`), con el FAB en `z-40` (por debajo del modal, que es `z-50`, y
por encima del contenido del dashboard). Sin icono dedicado: el repo no tenía un ícono "+" en
`iconos.tsx`, así que se usó el glifo `+` como texto, consistente con el resto de la paleta
(`bg-acento`/`text-superficie`) sin introducir una dependencia de íconos nueva para una sola tarea.

**Outcome:** RED confirmado en dos ciclos separados. Primero, `BotonAgregarGastoFlotante` aislado —
`npx vitest run app/components/BotonAgregarGastoFlotante.test.tsx` antes de crear el componente:

```
Error: Failed to resolve import "@/app/components/BotonAgregarGastoFlotante" ... Does the file exist?
Test Files  1 failed (1)
```

GREEN tras crear `app/components/BotonAgregarGastoFlotante.tsx`:

```
✓ app/components/BotonAgregarGastoFlotante.test.tsx (2 tests) 37ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

Segundo, el wiring en `PantallaDashboard` — se agregó `vi.mock('@/app/dashboard/crearGastoManual', ...)`
(mismo espíritu que `ModalNuevoGasto.test.tsx`: `PantallaDashboard` monta `ModalNuevoGasto`, que
importa la Server Action real de un módulo hermano, no por props) y tres tests nuevos al describe "FAB
de alta manual" en `app/components/PantallaDashboard.test.tsx`. Antes del wiring:

```
 Test Files  1 failed (1)
      Tests  3 failed | 12 passed (15)
```

(los 3 que fallaron son exactamente los 3 nuevos: "muestra el botón flotante", "tocar el FAB abre el
modal", "cerrar el modal desde Cancelar" — los 12 preexistentes de `PantallaDashboard.test.tsx`
siguieron en verde, sin tocarlos). GREEN tras agregar el estado `nuevoGastoAbierto` y montar
`BotonAgregarGastoFlotante` + `ModalNuevoGasto` en `PantallaDashboard.tsx`:

```
✓ app/components/PantallaDashboard.test.tsx (15 tests) 379ms
✓ app/components/BotonAgregarGastoFlotante.test.tsx (2 tests) 94ms
 Test Files  2 passed (2)
      Tests  17 passed (17)
```

`npm run typecheck` en verde:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

Mutación de verificación 1 (con Edit, en `BotonAgregarGastoFlotante.tsx`): `onClick={onAbrir}`
reemplazado por `onClick={() => {}}`. Rompió exactamente los 3 tests que dependen del click
(el propio "al hacer click invoca onAbrir" de `BotonAgregarGastoFlotante.test.tsx`, y los dos de
`PantallaDashboard.test.tsx` que hacen click en el FAB), los 14 restantes siguieron en verde:

```
 Test Files  2 failed (2)
      Tests  3 failed | 14 passed (17)
```

Restaurado con Edit. Mutación de verificación 2 (con Edit, en `PantallaDashboard.tsx`): la prop
`abierto={nuevoGastoAbierto}` de `ModalNuevoGasto` reemplazada por `abierto={false}` (el wiring del
estado, no del click). Rompió exactamente los 2 tests que verifican que el modal se abre/cierra, los
15 restantes (incluidos los de `BotonAgregarGastoFlotante.test.tsx`) siguieron en verde:

```
 Test Files  1 failed | 1 passed (2)
      Tests  2 failed | 15 passed (17)
```

Restaurado con Edit. Corrida final completa, `npm run typecheck && npm test`:

```
> finanzas-cumzi@0.1.0 typecheck
> tsc --noEmit
```

```
 Test Files  66 passed (66)
      Tests  483 passed (483)
Duration  138.89s
```

Todos los archivos de test del repo, incluidos T1–T5, quedaron en verde en la misma corrida. Esta es
la última tarea del spec — las 6/6 tareas de `tasks.md` quedan en `CRITERIA MET`.
