# Diseño — Alta manual de gastos

**Estado:** Borrador
**Fecha:** 2026-09-03
**Requisitos:** ./requirements.md

## Resumen

Un botón flotante en `/dashboard` abre un modal con un formulario corto (monto, comercio, fecha, categoría).
Al enviarlo, un Server Action crea el gasto y su única imputación dentro de una transacción, reusando
`ejecutarEnTransaccion` y `RepositorioImputaciones.reemplazarPara` tal como ya hace el flujo de confirmación
de la bandeja. La única pieza nueva de persistencia es `RepositorioGastos.crearManual`: el método `crear`
existente está atado a `GastoNormalizado` (la forma que produce el parser de emails, con `tipoTarjeta` y
`cuotasTotal` obligatorios) y a un `emailId` no nulo — forzar un alta manual a esa forma sería inventar datos
de tarjeta que no existen. `crearManual` toma la forma real del alta manual: monto, comercio, fecha y
categoría, nada más.

## Arquitectura

```
FAB (PantallaDashboard)
  └─ abre → ModalNuevoGasto (client component, useActionState)
       └─ submit → crearGastoManual (Server Action, 'use server')
            └─ ejecutarCrearGastoManual (testeable, sin Next.js runtime)
                 └─ ejecutarEnTransaccion(pool, cliente => {
                       RepositorioGastos.crearManual        (Req. 4.1)
                       INSERT directo en imputaciones        (Req. 4.2, ver nota abajo)
                       RepositorioGastos.marcarImputado      (Req. 4.3)
                    })
            └─ revalidatePath('/dashboard') + revalidatePath('/', 'layout')  (Req. 5.1)
```

El único módulo nuevo bajo `dominio/` es el tipo `NuevoGastoManual` — no hay lógica nueva que decida plata
más allá de la que ya existe (`dividirEnCuotas` con 1 cuota, `mesDe`). Todo lo demás es orquestación de
infraestructura, igual que `confirmarGasto.ts`.

## Componentes e interfaces

### `RepositorioGastos.crearManual` (nuevo método)

- **Responsabilidad:** insertar un gasto sin email de origen, ya categorizado por el usuario.
- **Interfaz:**

```ts
// dominio/gastos/nuevoGastoManual.ts
export interface NuevoGastoManual {
  montoTotal: Decimal
  comercio: string
  fechaGasto: Date
  categoria: Categoria // restringido a CATEGORIAS_MANUAL en el tipo del formulario, ver más abajo
}

// infra/db/repositorioGastos.ts — agregar a la interfaz RepositorioGastos existente
crearManual(datos: NuevoGastoManual): Promise<Gasto>
```

Implementación: `INSERT INTO gastos (email_id, monto_total, moneda, comercio, fecha_gasto, categoria_id,
categoria_origen, estado, confirmado_en) VALUES (NULL, $1, 'ARS', $2, $3, (SELECT id FROM categorias WHERE
nombre = $4), 'usuario', 'categorizado', now()) RETURNING *`, mapeado igual que el resto de los métodos de
este repositorio.

- **Depende de:** `pg` (`PoolClient` inyectado por `crearRepositorioGastos`), tabla `categorias`.
- No es visual.

### `CATEGORIAS_MANUAL` (nueva constante)

- **Responsabilidad:** acotar el `<select>` del formulario a las 3 categorías fijas, sin "Sin categorizar"
  ni "Descartar" (Req. 2.5).
- **Interfaz:**

```ts
// dominio/categorizacion/categorizarPorReglas.ts — junto a CATEGORIAS_INFERIBLES/CORREGIBLES
export const CATEGORIAS_MANUAL = CATEGORIAS_INFERIBLES // ['Salidas', 'Comida', 'Extras']
```

Es un alias del array que ya existe — no un array nuevo — porque hoy `CATEGORIAS_INFERIBLES` ya es
exactamente el conjunto que Req. 2.4 pide. Nombrarlo aparte documenta la intención en el sitio de uso sin
duplicar el literal.

### `ejecutarCrearGastoManual` (nueva función testeable)

- **Responsabilidad:** orquestar crear + imputar + marcar imputado dentro de una transacción; testeable sin
  `FormData` ni runtime de Next.js, mismo patrón que `ejecutarConfirmarGastoConRegla`.
- **Interfaz:**

```ts
// app/dashboard/crearGastoManual.ts
export async function ejecutarCrearGastoManual(
  pool: Pool,
  datos: NuevoGastoManual,
): Promise<Gasto> {
  return ejecutarEnTransaccion(pool, async (cliente) => {
    const repositorioGastos = crearRepositorioGastos(cliente)

    const gasto = await repositorioGastos.crearManual(datos)
    const [monto] = dividirEnCuotas(datos.montoTotal, 1)
    await cliente.query(
      'INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, $2, $3, $4)',
      [gasto.id, 1, monto.toString(), mesDe(datos.fechaGasto)],
    )
    await repositorioGastos.marcarImputado(gasto.id)

    return gasto
  })
}
```

**Nota de implementación** — este pseudocódigo inserta la imputación con una query directa contra el
`cliente` transaccional, en vez de llamar a `RepositorioImputaciones.reemplazarPara`. `reemplazarPara`
(`infra/db/repositorioImputaciones.ts:58-84`) abre su propia conexión y transacción internas
(`pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`/`release()`), y `crearRepositorioImputaciones` está tipado
contra un `pg.Pool` completo — no contra `Pick<Pool, 'query'>` como sí lo está `crearRepositorioGastos` para
ser componible dentro de una transacción externa. Pasarle el `cliente` (`PoolClient`) de este método no tipa
y, forzado con un cast, falla en runtime (`Client.prototype.connect()` sobre un cliente ya conectado lanza
`'Client has already been connected'`). Como el gasto recién creado nunca tiene imputaciones previas, el
`DELETE` que hace `reemplazarPara` antes de insertar sería un no-op de todos modos — ver "Decisiones de
diseño y trade-offs" más abajo.

- **Depende de:** `ejecutarEnTransaccion`, `crearRepositorioGastos`, `dividirEnCuotas`, `mesDe`.

### `crearGastoManual` (Server Action)

- **Responsabilidad:** leer y validar el `FormData`, delegar en `ejecutarCrearGastoManual`, revalidar.
- **Interfaz:**

```ts
// app/dashboard/crearGastoManual.ts
export type EstadoFormularioGastoManual = { error: string } | null

export async function crearGastoManual(
  _estadoPrevio: EstadoFormularioGastoManual,
  formData: FormData,
): Promise<EstadoFormularioGastoManual> {
  // valida con normalizarMonto + comercio no vacío + fecha + categoría (Req. 3.1–3.3);
  // si falla, retorna { error } y NO llama a ejecutarCrearGastoManual (Req. 3.4)
  // si pasa: await ejecutarCrearGastoManual(pool, datos); revalidatePath(...); return null
}
```

Firma pensada para `useActionState(crearGastoManual, null)` en el cliente (React 19 / Next 16, ver
`node_modules/next/dist/docs/01-app/02-guides/forms.md`) — permite devolver el error de validación sin
`throw` y sin recargar la página, consistente con Req. 3.1–3.3 (error inline).

### `BotonAgregarGastoFlotante` + `ModalNuevoGasto` (client components)

- **Responsabilidad:** disparar la apertura del modal (Req. 1.1, 1.2) y renderizar el formulario con
  `useActionState`, mostrando `estado.error` inline si existe.
- **Interfaz:**

```ts
// app/components/BotonAgregarGastoFlotante.tsx
export function BotonAgregarGastoFlotante(): JSX.Element

// app/components/ModalNuevoGasto.tsx
export function ModalNuevoGasto(props: { abierto: boolean; onCerrar: () => void }): JSX.Element
```

- **Depende de:** `crearGastoManual`, `CATEGORIAS_MANUAL`.
- **Visual:** reusa las clases ya establecidas en `ListaBandeja.tsx:121-158` — inputs/`<select>` con
  `min-h-11 rounded-lg border border-texto-muted/25 bg-superficie px-3 text-sm text-texto`, botón primario
  `rounded-full bg-acento ... text-superficie` para "Guardar", overlay del modal con el mismo `superficie`/
  `texto-muted` que el resto de la app (no se define ninguna paleta nueva). Se monta desde
  `PantallaDashboard` (composición del layout del dashboard), no desde `app/dashboard/page.tsx`, que hoy es
  un server component puro sin wrapper de layout propio.

## Modelos de datos

```sql
-- infra/db/migraciones/0009_gastos_email_id_nullable.sql
ALTER TABLE gastos ALTER COLUMN email_id DROP NOT NULL;
-- El UNIQUE y la FK a emails_crudos se preservan: Postgres permite múltiples NULL en una columna UNIQUE.
```

```ts
export interface NuevoGastoManual {
  montoTotal: Decimal   // > 0, validado por normalizarMonto antes de llegar acá (Req. 2.1, 3.1)
  comercio: string      // no vacío, validado en el Server Action (Req. 2.2, 3.2)
  fechaGasto: Date       // default hoy en el form; se usa tal cual, mesDe aplica la zona horaria (Req. 2.3)
  categoria: Categoria   // uno de CATEGORIAS_MANUAL (Req. 2.4, 2.5)
}
```

`Gasto.emailId` pasa de `string` a `string | null` en `infra/db/repositorioGastos.ts` — el único cambio de
tipo existente que toca este diseño.

## Flujo de datos

1. Usuario toca el FAB en `/dashboard` → `ModalNuevoGasto` se abre con `fechaGasto` en la fecha de hoy
   (Req. 1.1, 1.2, 2.3).
2. Usuario completa monto (texto ARS), comercio, fecha, categoría → submit dispara `crearGastoManual` vía
   `useActionState`.
3. El Server Action normaliza el monto (`normalizarMonto`), valida comercio no vacío y categoría presente.
   Si algo falla, retorna `{ error }` sin tocar la base (Req. 3.1–3.4) y el modal muestra el error inline.
4. Si todo es válido, `ejecutarCrearGastoManual` corre dentro de una transacción: crea el gasto
   (`categoria_origen: 'usuario'`, `estado: 'categorizado'`), calcula la imputación única con
   `dividirEnCuotas(monto, 1)` y `mesDe(fecha)`, la persiste con `reemplazarPara`, y marca el gasto
   `imputado` (Req. 4.1–4.4).
5. `revalidatePath('/dashboard')` (y `'/', 'layout'` si el indicador global depende de conteos) → el modal se
   cierra → el dashboard muestra el gasto nuevo en su próxima carga (Req. 5.1, 5.2).

## Manejo de errores

| Condición | Manejo | Requisito relacionado |
|-----------|--------|------------------------|
| Monto vacío o no parseable en formato ARS (`normalizarMonto` devuelve `null`) | Server Action retorna `{ error }`, no llama a `ejecutarCrearGastoManual` | 3.1 |
| Comercio vacío o solo espacios | Server Action retorna `{ error }`, no llama a `ejecutarCrearGastoManual` | 3.2 |
| Categoría ausente o fuera de `CATEGORIAS_MANUAL` | Server Action retorna `{ error }`, no llama a `ejecutarCrearGastoManual` | 3.3 |
| Falla la escritura de la imputación o el `UPDATE` de `marcarImputado` a mitad de transacción | `ejecutarEnTransaccion` hace `ROLLBACK` — ni el gasto ni la imputación quedan escritos | 3.4, 4.4 |
| Usuario cierra el modal sin enviar | `onCerrar` limpia el estado local del form, ningún Server Action se invoca | 1.3 |

## Estrategia de testing

- **Unitario:** `ejecutarCrearGastoManual` contra `crearBasePostgresDeTest()` (mismo patrón que
  `corregirGasto.test.ts`) — casos: gasto se crea con `email_id NULL` y aparece imputado en el mes correcto;
  el monto de la imputación coincide con `montoTotal`; `categoria_origen` es `'usuario'`.
- **Casos borde:** monto `'$0,00'` o negativo (rechazado antes de crear); comercio vacío; categoría fuera de
  `CATEGORIAS_MANUAL`; falla simulada de `reemplazarPara` → verificar que el `INSERT` de `gastos` quedó sin
  commitear (rollback completo).
- **Integración:** no se agrega un E2E nuevo en esta fase — `/specify` deja la decisión de cobertura E2E para
  el loop de `verify-implementation`, consistente con lo acordado en brainstorming.

## Decisiones de diseño y trade-offs

- **Decisión:** método nuevo `crearManual` en vez de reusar `crear`. — **Justificación:** `crear` está
  tipado contra `GastoNormalizado`, la forma que produce el parser de emails (incluye `tipoTarjeta`,
  `cuotasTotal` como campos del dominio de tarjetas). Forzar un alta manual a esa forma exigiría inventar
  valores de tarjeta inexistentes. — **Alternativa considerada:** hacer `tipoTarjeta`/`cuotasTotal`
  opcionales en `GastoNormalizado` para que sirva a los dos casos; rechazada porque debilita el tipo que
  usa el parser real, donde esos campos SÍ son obligatorios (Req. del spec de pipeline de emails).
- **Decisión:** sin refactor del pipeline de Inngest para compartir la orquestación categorizar+imputar. —
  **Justificación:** YAGNI — el pipeline categoriza con reglas/IA y el alta manual recibe la categoría
  directo del usuario; son secuencias distintas. — **Alternativa considerada:** extraer un servicio de
  dominio común; descartada en brainstorming por acoplar dos flujos que hoy no lo están, arriesgando código
  del pipeline que ya funciona.
- **Decisión:** `email_id` nullable en vez de un email sintético en `emails_crudos`. — **Justificación:**
  semánticamente honesto — un alta manual genuinamente no tiene email de origen; un email sintético
  ensuciaría una tabla que hoy solo representa avisos reales del banco. — **Alternativa considerada:** email
  sintético; descartada en brainstorming.
- **Decisión:** `ejecutarCrearGastoManual` inserta la imputación con SQL directo contra el `cliente`
  transaccional, en vez de llamar a `RepositorioImputaciones.reemplazarPara`. — **Justificación:**
  `reemplazarPara` abre su propia conexión/transacción interna y `crearRepositorioImputaciones` está tipado
  contra `pg.Pool` completo — no es componible dentro de una transacción externa (falla en runtime si se
  fuerza). Un gasto recién creado nunca tiene imputaciones previas, así que el `DELETE` de `reemplazarPara`
  sería un no-op de todos modos; el `INSERT` directo cumple el mismo requisito sin ese conflicto. —
  **Alternativa considerada:** refactorizar `crearRepositorioImputaciones` para aceptar un cliente inyectado
  (mismo patrón que `crearRepositorioGastos`); descartada por tocar código `[x] Hecho` del spec
  `2026-08-25-pipeline-gastos-email`, fuera del alcance de esta feature.
