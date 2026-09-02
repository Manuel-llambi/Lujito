# Diseño — Hábitos

**Estado:** Borrador
**Fecha:** 2026-09-02
**Requisitos:** ./requirements.md

## Resumen

`/habitos` es una pantalla de solo lectura, sin tabla nueva. Cuatro funciones puras en `dominio/habitos/`
leen datos ya persistidos (`vista_gastos_mensuales` para dos hallazgos, `gastos` directo para los otros dos)
y calculan hasta cuatro *tipos* de hallazgo — dos de los cuales pueden producir más de una tarjeta (una
variación por categoría, un comercio recurrente). Cada hallazgo nace con su recomendación y su texto de
respaldo ya resueltos; un cliente de Claude, con el mismo patrón puerto/adaptador que ya usa la
categorización (Req. 6, `infra/ia/inferirCategoria.ts`), redacta el texto final en paralelo y por ítem, sin
poder tocar ningún valor numérico. El contenedor de la ruta arma todo server-side y pasa el resultado ya
resuelto a un componente de presentación sin estado — a diferencia de `/dashboard`, no hace falta
`'use client'` porque no hay selector de mes ni ningún toggle.

## Arquitectura

```
app/habitos/page.tsx  (server component, raíz de composición)
        │
        ├─ obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, ahora)
        │     │
        │     ├─ resuelve mesEnFoco y meses anteriores disponibles (vista_gastos_mensuales)
        │     ├─ calcularCategoriaDominante        ─┐
        │     ├─ calcularVariacionCategoria         ├─ dominio/habitos/*.ts (puras, sin I/O)
        │     ├─ calcularRitmoGasto                 │
        │     └─ calcularComerciosRecurrentes       ─┘
        │     → Hallazgo[]
        │
        ├─ redactarHallazgos(hallazgos, clienteRedaccion)
        │     └─ por cada Hallazgo, en paralelo: intenta redactar con Claude,
        │        con timeout — si falla, usa el texto de respaldo ya calculado
        │     → HallazgoRedactado[]
        │
        ├─ obtenerCantidadPendientes(repositorioGastos)   (reuso sin cambios, Req. 7.1)
        │
        └─ <PantallaHabitos hallazgos={..} cantidadPendientes={..} />
                  ├─ <TopAppBar />
                  ├─ <SeccionHallazgos />       (o estado vacío, Req. 6.1)
                  ├─ <SeccionRecomendaciones />
                  └─ <BottomNavBar activa="habitos" />
```

## Componentes e interfaces

### `dominio/habitos/tiposHabitos.ts`

- **Responsabilidad:** los tipos de hallazgo, compartidos por las cuatro reglas y por la redacción.
- **Interfaz:**

```ts
import type Decimal from 'decimal.js'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'

interface CampoRedactable {
  textoRespaldo: string
  recomendacionRespaldo: string
}

export interface HallazgoCategoriaDominante extends CampoRedactable {
  tipo: 'categoriaDominante'
  categoria: Categoria
  totalCategoria: Decimal
  totalMes: Decimal
  porcentaje: number // 0–100, redondeado
}

export interface HallazgoVariacionCategoria extends CampoRedactable {
  tipo: 'variacionCategoria'
  categoria: Categoria
  totalMesFoco: Decimal
  totalMesAnterior: Decimal
  variacionPct: number | null // null cuando totalMesAnterior es 0 (categoría nueva este mes)
}

export interface HallazgoRitmoGasto extends CampoRedactable {
  tipo: 'ritmoGasto'
  totalHastaHoyMesFoco: Decimal
  promedioHastaMismoDiaMesesAnteriores: Decimal
  variacionPct: number | null
  mesesConsiderados: number
}

export interface HallazgoComercioRecurrente extends CampoRedactable {
  tipo: 'comercioRecurrente'
  comercio: string
  cantidadGastos: number
  totalComercio: Decimal
}

export type Hallazgo =
  | HallazgoCategoriaDominante
  | HallazgoVariacionCategoria
  | HallazgoRitmoGasto
  | HallazgoComercioRecurrente
```

- **Depende de:** `decimal.js`, `dominio/categorizacion/categorizarPorReglas`.

### `dominio/habitos/calcularCategoriaDominante.ts`

- **Responsabilidad:** Req. 2.3, 2.4.
- **Interfaz:**

```ts
export function calcularCategoriaDominante(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
): HallazgoCategoriaDominante | null
```

Devuelve `null` si `totalesMesFoco` está vacío o si dos o más categorías empatan en el total más alto.

### `dominio/habitos/calcularVariacionCategoria.ts`

- **Responsabilidad:** Req. 2.5, 2.6.
- **Interfaz:**

```ts
export function calcularVariacionCategoria(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
  totalesMesAnterior: { categoria: Categoria; total: Decimal }[] | null,
): HallazgoVariacionCategoria[]
```

Devuelve `[]` si `totalesMesAnterior` es `null` (no hay mes anterior con datos). Si no es `null`, devuelve
un hallazgo por cada categoría presente en cualquiera de los dos meses (una categoría ausente en uno de los
dos cuenta como total `0` para ese lado).

### `dominio/habitos/calcularRitmoGasto.ts`

- **Responsabilidad:** Req. 2.7, 2.8.
- **Interfaz:**

```ts
export function calcularRitmoGasto(
  gastosMesFoco: { fechaGasto: Date; montoTotal: Decimal }[],
  gastosMesesAnteriores: { fechaGasto: Date; montoTotal: Decimal }[][], // uno por mes anterior disponible
  hoy: Date,
): HallazgoRitmoGasto | null
```

Devuelve `null` si `gastosMesesAnteriores.length < 2`. Para cada mes anterior, filtra sus gastos hasta el
mismo número de día calendario que `hoy` (en la zona de referencia) antes de sumarlos, para que la
comparación sea contra el mismo punto del mes y no contra el mes cerrado completo.

### `dominio/habitos/calcularComerciosRecurrentes.ts`

- **Responsabilidad:** Req. 2.9, 2.10, 2.11.
- **Interfaz:**

```ts
export function calcularComerciosRecurrentes(
  gastosMesFoco: { comercio: string | null; montoTotal: Decimal }[],
): HallazgoComercioRecurrente[]
```

Excluye gastos con `comercio: null` antes de agrupar (2.11). Devuelve un hallazgo por cada comercio con dos
o más gastos, ordenado por `totalComercio` descendente.

### `dominio/habitos/rangoDeMes.ts`

- **Responsabilidad:** traducir un `Mes` (`AAAA-MM`) al rango `[desde, hasta)` de instantes UTC que le
  corresponde en la zona de referencia, para poder filtrar `gastos.fecha_gasto` (`timestamptz`) sin
  reimplementar la conversión de zona horaria que ya centraliza `mesDe`/`componerFechaGasto`.
- **Interfaz:**

```ts
export function rangoDeMes(mes: Mes): { desde: Date; hasta: Date } // hasta es exclusivo
```

- **Depende de:** `@date-fns/tz` (`TZDate`), `ZONA_REFERENCIA` de `dominio/normalizacion/componerFechaGasto`, `sumarMeses`.

### `infra/ia/redactarHallazgo.ts`

- **Responsabilidad:** Req. 4.1–4.6. Mismo patrón puerto/adaptador que `infra/ia/inferirCategoria.ts`
  (Req. 6): el puerto se inyecta, sin credenciales ni red en el test.
- **Interfaz:**

```ts
export interface ClienteRedaccion {
  redactar(solicitud: SolicitudRedaccion): Promise<RespuestaRedaccion>
}

export interface SolicitudRedaccion {
  tipo: Hallazgo['tipo']
  datos: Record<string, string | number> // campos numéricos/textuales del hallazgo, serializados
}

export interface RespuestaRedaccion {
  texto: string
  recomendacionTexto: string
}

export interface HallazgoRedactado {
  hallazgo: Hallazgo
  texto: string
  recomendacionTexto: string
  fuente: 'modelo' | 'respaldo' // Decision log / trazabilidad, no está en requirements
}

export const TIMEOUT_REDACCION_MS = 4000

/** Un intento, con timeout. Nunca lanza — ante falla o timeout devuelve el texto de respaldo (Req. 4.3). */
export async function redactarHallazgo(hallazgo: Hallazgo, cliente: ClienteRedaccion): Promise<HallazgoRedactado>
```

- **Depende de:** `dominio/habitos/tiposHabitos`.

### `infra/ia/clienteRedaccionHttp.ts`

- **Responsabilidad:** adaptador real sobre `@anthropic-ai/sdk`, mismo modelo fijo (`claude-sonnet-5`) y
  mismo `tool_choice` forzado que `infra/ia/clienteClaudeHttp.ts`, con una tool `redactar_hallazgo` cuyo
  `input_schema` exige `texto` y `recomendacionTexto`. Las instrucciones de sistema fijan el tono informal
  con modismos rioplatenses (Req. 4.6) y prohíben inventar cifras — el prompt nunca le pasa al modelo menos
  ni más datos que los que ya trae `SolicitudRedaccion.datos`.
- **Interfaz:** `export function crearClienteRedaccionHttp(apiKey: string): ClienteRedaccion`

### `app/habitos/obtenerHallazgosHabitos.ts`

- **Responsabilidad:** el contenedor real (mismo rol que `obtenerFilasDashboard.ts`): resuelve la ventana
  de meses, decide el mes en foco, arma los datos de entrada de cada regla y las invoca.
- **Interfaz:**

```ts
export const MESES_VENTANA_HABITOS = 6 // ventana fija, análoga a MESES_VISIBLES_EN_DASHBOARD

export async function obtenerHallazgosHabitos(
  repositorioImputaciones: Pick<RepositorioImputaciones, 'totalesPorMesYCategoria'>,
  repositorioGastos: Pick<RepositorioGastos, 'gastosEntreFechas'>,
  ahora: Date,
): Promise<Hallazgo[]>
```

Devuelve `[]` si no hay ningún mes con imputaciones en la ventana (Req. 2.2).

- **Depende de:** las cuatro funciones de `dominio/habitos/`, `rangoDeMes`, `mesDe`, `sumarMeses`.

### `infra/db/repositorioGastos.ts` (extensión)

- **Responsabilidad:** nuevo método de lectura, mismo archivo que ya declara `RepositorioGastos` —
  necesario porque el ritmo de gasto y los comercios recurrentes se calculan sobre `gastos.fecha_gasto` y
  `gastos.monto_total`, no sobre imputaciones (ver "Decisiones de diseño").
- **Interfaz:**

```ts
export interface RepositorioGastos {
  // … métodos existentes sin cambios …
  gastosEntreFechas(desde: Date, hasta: Date): Promise<{ comercio: string | null; montoTotal: Decimal; fechaGasto: Date }[]>
}
```

```sql
SELECT comercio, monto_total, fecha_gasto
FROM gastos
WHERE estado <> 'needs_review' AND fecha_gasto >= $1 AND fecha_gasto < $2
ORDER BY fecha_gasto ASC
```

### `app/components/habitos/PantallaHabitos.tsx`

- **Responsabilidad:** presentación pura, sin `'use client'` — a diferencia de `PantallaDashboard`, no
  gestiona ningún estado de interacción.
- **Interfaz:**

```ts
export function PantallaHabitos({
  hallazgos,
  cantidadPendientes,
}: {
  hallazgos: HallazgoRedactado[]
  cantidadPendientes: number
}): JSX.Element
```

Si `hallazgos.length === 0`, renderiza el mensaje de datos insuficientes (Req. 6.1) en vez de las dos
secciones, y sigue mostrando `<BottomNavBar activa="habitos" cantidadPendientes={cantidadPendientes} />`
(Req. 6.2).

- **Si es visual:** reusa exactamente la card `rounded-3xl border border-texto-muted/15 bg-superficie`
  que ya define `SeccionCategorias`, y `formatearMoneda`/`CLASE_COLOR_CATEGORIA` de `app/tokens/` para
  cualquier cifra o color de categoría dentro de una tarjeta — nunca un color o formato de moneda propio.

### `app/components/habitos/SeccionHallazgos.tsx` / `SeccionRecomendaciones.tsx`

- **Responsabilidad:** una lista de tarjetas cada una, título fijo ("Hallazgos" / "Recomendaciones"),
  mismo patrón de `<section>` + `<h3>` que `SeccionCategorias`.
- **Interfaz:** `{ hallazgos: HallazgoRedactado[] }` → una `TarjetaHallazgo`/`TarjetaRecomendacion` por
  ítem, usando `texto`/`recomendacionTexto` respectivamente.

### `app/components/BottomNavBar.tsx` (modificación)

- **Responsabilidad:** sumar la pestaña "Hábitos", mismo patrón que "Inicio"/"Bandeja", sin badge (no hay
  noción de "pendientes" en Hábitos).
- **Interfaz:** `type Pestana = 'inicio' | 'bandeja' | 'habitos'` — el resto de la firma no cambia.
- **Depende de:** un ícono nuevo `IconoHabitos` en `app/components/iconos.tsx`, mismo estilo SVG inline
  `viewBox="0 0 20 20"` que los íconos existentes.

### `app/habitos/page.tsx`

- **Responsabilidad:** raíz de composición de la ruta, mismo patrón que `app/dashboard/page.tsx` (mismo
  `Pool`, mismos repositorios construidos a partir de `process.env.DATABASE_URL`).
- **Interfaz:** `export default async function PaginaHabitos(): Promise<JSX.Element>`

## Modelos de datos

Sin cambios de schema. Esta feature solo lee `gastos` (columnas `comercio`, `monto_total`, `fecha_gasto`,
`estado`, ya existentes) y `vista_gastos_mensuales` (ya existe, Req. 9.1). No se crea ninguna tabla,
columna, ni vista nueva.

## Flujo de datos

1. El usuario toca "Hábitos" → navega a `/habitos` (Req. 1.1).
2. `page.tsx` llama en paralelo a `obtenerHallazgosHabitos`, `obtenerCantidadPendientes`.
3. `obtenerHallazgosHabitos` pide `totalesPorMesYCategoria(desde, hasta)` sobre la ventana de
   `MESES_VENTANA_HABITOS` meses. Si no hay ninguna fila, devuelve `[]` (Req. 2.2) y el flujo termina acá.
4. Si hay datos, deriva `mesEnFoco` = el mes más reciente presente, y la lista de meses anteriores
   presentes (más recientes primero, hasta `MESES_VENTANA_HABITOS - 1`).
5. Para `calcularCategoriaDominante` y `calcularVariacionCategoria`: filtra las filas ya traídas por
   `mesEnFoco` y por el mes inmediatamente anterior (si está en la lista).
6. Para `calcularRitmoGasto` y `calcularComerciosRecurrentes`: convierte `mesEnFoco` y cada mes anterior
   disponible a rangos de fecha con `rangoDeMes`, y pide `gastosEntreFechas` para cada rango.
7. Las cuatro funciones puras corren, cada una devuelve `Hallazgo | null` o `Hallazgo[]`; se aplanan en un
   único `Hallazgo[]`.
8. `redactarHallazgos` corre `redactarHallazgo` en paralelo por cada ítem — cada uno intenta la llamada a
   Claude con `TIMEOUT_REDACCION_MS`; si falla o no llega a tiempo, usa `textoRespaldo`/`recomendacionRespaldo`
   ya calculados en el paso 7 (Req. 4.3, 4.4).
9. `PantallaHabitos` recibe `HallazgoRedactado[]` y `cantidadPendientes`, y renderiza las dos secciones o
   el estado vacío.

## Manejo de errores

| Condición | Manejo | Requisito relacionado |
|-----------|--------|------------------------|
| No hay ninguna imputación en la ventana | `obtenerHallazgosHabitos` devuelve `[]` sin llamar a ninguna regla | 2.2 |
| Empate en el total más alto del mes en foco | `calcularCategoriaDominante` devuelve `null` | 2.4 |
| No hay mes calendario anterior con datos | `calcularVariacionCategoria` devuelve `[]` | 2.6 |
| Menos de 2 meses anteriores con datos | `calcularRitmoGasto` devuelve `null` | 2.8 |
| Ningún comercio se repite en el mes en foco | `calcularComerciosRecurrentes` devuelve `[]` | 2.10 |
| Gasto sin comercio | Se excluye del agrupamiento antes de contar repeticiones | 2.11 |
| Falla o timeout de la llamada a Claude para un hallazgo | Se usa `textoRespaldo`/`recomendacionRespaldo` de ese ítem; los demás ítems no se ven afectados | 4.3, 4.4 |
| `Hallazgo[]` queda vacío tras las cuatro reglas | `PantallaHabitos` muestra el mensaje de datos insuficientes en vez de las secciones | 6.1 |

## Estrategia de testing

- **Unitario (dominio):** las cuatro funciones puras de `dominio/habitos/` — un caso feliz y los casos
  límite de la tabla de errores por función (mes sin anterior, empate, menos de 2 meses previos, cero
  comercios repetidos, gasto con comercio `null`). `rangoDeMes` se testea contra fechas cercanas al borde
  del mes en la zona de referencia (mismo estilo que `mesDe.test.ts`/`componerFechaGasto.test.ts`).
- **Unitario (redacción):** `redactarHallazgo` con `ClienteRedaccion` de doble — caso éxito (usa `texto`
  del modelo), caso falla, caso timeout — sin red ni credenciales, mismo patrón que
  `inferirCategoria.test.ts`.
- **Integración liviana:** `obtenerHallazgosHabitos` con los repositorios reales contra la base de test
  (`infra/db/testUtils/basePostgresDeTest.ts`), verificando que arma correctamente los rangos y que pasa
  los datos correctos a las reglas — sin mockear el SQL.
- **Componente:** `PantallaHabitos.test.tsx`, mismo estilo que `PantallaDashboard.test.tsx` — recibe
  `hallazgos` por props, valida las dos secciones con datos y el estado vacío con `hallazgos: []`.
- **E2E:** un caso feliz de `/habitos` (al menos una tarjeta en cada sección con datos de fixture) queda
  para `/plan-test-cases`, no para este documento.

## Decisiones de diseño y trade-offs

- **Decisión:** el ritmo de gasto y los comercios recurrentes se calculan sobre `gastos.fecha_gasto` y
  `gastos.monto_total`, no sobre `imputaciones`. — **Justificación:** una imputación de una cuota N>1
  hereda la `fecha_gasto` de la compra original, que puede caer en un mes calendario distinto al mes de
  esa imputación — no tiene un "día" propio dentro del mes que impacta, así que un corte "hasta el día de
  hoy" o un agrupamiento por comercio "dentro del mes" pierden sentido si se basan en imputaciones. —
  **Alternativa considerada:** usar `imputaciones` de forma uniforme en las cuatro reglas, igual que el
  dashboard — rechazada por la razón anterior; se documenta el costo: el ritmo de gasto mide el ritmo de
  las *compras* del mes, no el flujo de caja imputado, que es una noción ligeramente distinta de "cuánto
  gasté este mes" que sí usa el dashboard.
- **Decisión:** la categoría dominante y la variación por categoría siguen usando
  `vista_gastos_mensuales` (imputaciones), igual que el dashboard. — **Justificación:** son los dos
  hallazgos que hablan directamente de "cuánto gasté por categoría este mes" — el mismo número que ya ve
  el usuario en `/dashboard`; usar una fuente distinta produciría dos totales diferentes para la misma
  pregunta. — **Alternativa considerada:** ninguna — es la fuente correcta por definición del requisito 9.1.
- **Decisión:** ventana fija de `MESES_VENTANA_HABITOS = 6` meses para resolver el mes en foco y los
  meses anteriores disponibles. — **Justificación:** acota el costo de las consultas y evita comparar
  contra datos muy viejos sin que el usuario lo pida; el requisito no exige usar todo el historial. —
  **Alternativa considerada:** una ventana igual a la de `/dashboard` (12 meses) — rechazada por
  YAGNI: nada en los requisitos necesita comparar contra hace un año.
- **Decisión:** cada hallazgo se redacta con su propia llamada a Claude, corridas en paralelo, en vez de
  una única llamada combinada. — **Justificación:** satisface 4.4 al pie de la letra — la falla de una
  llamada no puede arrastrar a las demás porque son invocaciones independientes. — **Alternativa
  considerada:** un solo prompt con todos los hallazgos — más barato en tokens, pero una falla de esa
  única llamada dejaría **todos** los textos en respaldo a la vez, que es exactamente el acoplamiento que
  4.4 prohíbe.
- **Decisión:** `PantallaHabitos` no lleva `'use client'`. — **Justificación:** a diferencia de
  `PantallaDashboard`, no hay selector de mes, de semana, de tipo de gráfico ni de categoría expandida —
  cero estado de interacción que gestionar, así que se mantiene como Server Component. — **Alternativa
  considerada:** ninguna — agregar `'use client'` sin estado real sería una dependencia de runtime
  innecesaria.
