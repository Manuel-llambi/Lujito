import Decimal from 'decimal.js'
import type { Pool } from 'pg'
import type { GastoNormalizado, MotivoRevision } from '@/dominio/normalizacion/normalizarAviso'
import type { TipoTarjeta } from '@/dominio/parseo/parsearAvisoSantander'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { NuevoGastoManual } from '@/dominio/gastos/nuevoGastoManual'

/**
 * `design.md` usa `origen_categoria` como tipo de la base pero nunca lo declara del lado de
 * TypeScript. T18 es la primera tarea que necesita el equivalente en el dominio (`Gasto.categoriaOrigen`
 * no se popula todavía —eso es T22/T23—, pero el tipo del campo tiene que existir desde ahora).
 */
export type OrigenCategoria = 'regla' | 'ia' | 'usuario'

/** Los cinco estados válidos de un gasto (Req. 10.5), reflejo de `estado_gasto` en la base. */
export type EstadoGasto = 'pendiente' | 'extraido' | 'categorizado' | 'imputado' | 'needs_review'

/**
 * La fila de `gastos` tal como la ve el dominio. `design.md` usa `Gasto` en la firma de
 * `RepositorioGastos` pero nunca lo declara — T18 es la primera tarea que lo necesita, así que lo
 * define acá, derivado de las columnas de la tabla que esta misma migración crea. Las tareas
 * siguientes (T22, T23) lo importan sin redeclararlo, igual que T21 y T24 hicieron con
 * `MensajeCrudo` (T16).
 */
export interface Gasto {
  id: string
  // `string | null` desde T2 (Req. 4.1): un alta manual (`crearManual`) crea el gasto sin ningún
  // email de origen. Los siete métodos preexistentes siguen devolviendo `emailId` no nulo en la
  // práctica (vienen de emails reales) — este es un ensanchamiento de tipo, no un cambio de
  // comportamiento para ningún llamador existente.
  emailId: string | null
  montoTotal: Decimal | null
  moneda: string
  comercio: string | null
  fechaGasto: Date | null
  tipoTarjeta: TipoTarjeta | null
  tarjetaUltimos4: string | null
  cuotasTotal: number | null
  estado: EstadoGasto
  /** Nombre resuelto por el join contra `categorias`, no el `categoria_id` (T22, T23). */
  categoria: Categoria | null
  categoriaOrigen: OrigenCategoria | null
  categoriaJustificacion: string | null
  confirmadoEn: Date | null
}

export interface RepositorioGastos {
  crear(datos: GastoNormalizado, emailId: string): Promise<Gasto>
  /**
   * Crea un gasto directamente en `needs_review` a partir de un `emailId`, un `motivo` y los campos
   * que sí pudieron extraerse o normalizarse (T32, `design.md` — decisión de diseño del 2026-08-29).
   * A diferencia de `crear`, no exige un `GastoNormalizado` completo: cualquier campo ausente en
   * `camposParciales` queda en `NULL`, nunca con un valor por defecto (Req. 2.11, 2.12, 3.5, 3.6, 3.7).
   */
  crearParaRevision(
    emailId: string,
    motivo: MotivoRevision,
    camposParciales: Partial<GastoNormalizado>,
  ): Promise<Gasto>
  asignarCategoria(
    id: string,
    categoria: Categoria,
    origen: OrigenCategoria,
    justificacion: string | null,
  ): Promise<void>
  marcarParaRevision(id: string, motivo: MotivoRevision, ultimoError: string | null): Promise<void>
  /**
   * `UPDATE` de los siete campos de datos de un gasto ya existente (T40, `design.md` — decisión de
   * diseño del 2026-08-29, mismo hueco hermano de `crearParaRevision`): reprocesar un email cuyo
   * gasto ya está en `needs_review` necesita sobreescribir `monto_total`, `moneda`, `comercio`,
   * `fecha_gasto`, `tipo_tarjeta`, `tarjeta_ultimos4` y `cuotas_total` sin violar la unicidad de
   * `email_id` (que un segundo `crear` violaría). No toca `estado`, `categoria_id`,
   * `categoria_origen`, `categoria_justificacion`, `confirmado_en`, `motivo_revision` ni
   * `ultimo_error` — esas columnas siguen siendo responsabilidad exclusiva de `asignarCategoria`,
   * `confirmar` y `marcarParaRevision` (Req. 2.12). El paso a `categorizado`/`imputado` lo dan esos
   * mismos métodos cuando el llamador re-ejecuta categorizar/imputar después, no este.
   */
  actualizarDatos(id: string, datos: GastoNormalizado): Promise<void> // Req. 10.3
  /**
   * Inserta un gasto de alta manual (Req. 4.1, T2): `email_id NULL`, `categoria_id` resuelto contra
   * el nombre de `categorias`, `categoria_origen 'usuario'` y `estado 'categorizado'` directo — nunca
   * pasa por `'pendiente'` ni `'extraido'`, porque un alta manual ya nace categorizada por el
   * usuario. La imputación y el paso a `imputado` los orquesta `ejecutarCrearGastoManual` (T3), no
   * este método.
   */
  crearManual(datos: NuevoGastoManual): Promise<Gasto>
  confirmar(id: string, categoria: Categoria): Promise<void> // Req. 7.3, 7.4
  pendientesDeConfirmacion(): Promise<Gasto[]> // Req. 7.1, 7.2
  /**
   * `design.md` no declara este método — T36 es la primera tarea que necesita releer un gasto
   * completo (para calcular sus imputaciones a partir de `montoTotal` y `cuotasTotal`) sin pasarlo
   * por el resultado de un step anterior, que en Inngest real solo puede llevar datos serializables
   * simples. Lanza si el `id` no existe, igual que `traerCrudo` de `RepositorioEmails` (T21).
   */
  traerPorId(id: string): Promise<Gasto>
  /** Transición a `imputado` (Req. 10.5), la única que le falta a `estado_gasto` (T36). */
  marcarImputado(id: string): Promise<void>
  /**
   * Única fuente de datos de `calcularRitmoGasto` (T3) y `calcularComerciosRecurrentes` (T4): a
   * diferencia de la categoría dominante y la variación por categoría, que leen `vista_gastos_mensuales`
   * vía `RepositorioImputaciones.totalesPorMesYCategoria`, esos dos hallazgos necesitan
   * `gastos.fecha_gasto` y `gastos.monto_total` directo, porque una imputación de una cuota N>1 no
   * tiene un "día del mes" propio dentro del mes que impacta (`design.md`, "Decisiones de diseño").
   * Rango `[desde, hasta)` — inferior inclusivo, superior exclusivo — para encadenar sin solapamiento
   * ni hueco con `rangoDeMes` (T5). No filtra por `comercio IS NOT NULL` (Req. 2.11): esa exclusión es
   * responsabilidad de `calcularComerciosRecurrentes`, no de esta consulta.
   */
  gastosEntreFechas(
    desde: Date,
    hasta: Date,
  ): Promise<{ comercio: string | null; montoTotal: Decimal; fechaGasto: Date }[]>
}

interface FilaGasto {
  id: string
  email_id: string | null
  monto_total: string | null
  moneda: string
  comercio: string | null
  fecha_gasto: Date | null
  tipo_tarjeta: TipoTarjeta | null
  tarjeta_ultimos4: string | null
  cuotas_total: number | null
  estado: EstadoGasto
  categoria_nombre: Categoria | null
  categoria_origen: OrigenCategoria | null
  categoria_justificacion: string | null
  confirmado_en: Date | null
}

// Columnas comunes a `crear` y `pendientesDeConfirmacion`, con el nombre de categoría resuelto por
// join. `crear` no tiene ningún `categoria_id` que unir todavía —lo deja en NULL literal, casteado
// para que la forma de la fila sea la misma en los dos `SELECT`.
const COLUMNAS_GASTO = `
  g.id, g.email_id, g.monto_total, g.moneda, g.comercio, g.fecha_gasto, g.tipo_tarjeta,
  g.tarjeta_ultimos4, g.cuotas_total, g.estado,
  c.nombre AS categoria_nombre, g.categoria_origen, g.categoria_justificacion, g.confirmado_en
`

function filaAGasto(fila: FilaGasto): Gasto {
  return {
    id: fila.id,
    emailId: fila.email_id,
    montoTotal: fila.monto_total === null ? null : new Decimal(fila.monto_total),
    moneda: fila.moneda,
    comercio: fila.comercio,
    fechaGasto: fila.fecha_gasto === null ? null : new Date(fila.fecha_gasto),
    tipoTarjeta: fila.tipo_tarjeta,
    tarjetaUltimos4: fila.tarjeta_ultimos4,
    cuotasTotal: fila.cuotas_total,
    estado: fila.estado,
    categoria: fila.categoria_nombre,
    categoriaOrigen: fila.categoria_origen,
    categoriaJustificacion: fila.categoria_justificacion,
    confirmadoEn: fila.confirmado_en === null ? null : new Date(fila.confirmado_en),
  }
}

// `Pick<Pool, 'query'>` en vez de `Pool` completo: permite construir este repositorio tanto con el
// `Pool` compartido de la aplicación como con un `PoolClient` de una transacción (`ejecutarEnTransaccion`,
// trabajo ad hoc del incidente de atomicidad en `confirmarGasto`/`corregirGasto`) — `PoolClient.query`
// tiene la misma forma que `Pool.query`, así que ninguna otra parte de este archivo necesita cambiar.
export function crearRepositorioGastos(pool: Pick<Pool, 'query'>): RepositorioGastos {
  return {
    // `datos` es un `GastoNormalizado` completo —sus siete campos son no nulos—, así que este método
    // no puede persistir un gasto en `needs_review` (Decision log de T22, hueco escalado que T32
    // hereda). El gasto queda en `extraido`, no en el `DEFAULT 'pendiente'` de la columna: un
    // `GastoNormalizado` ya viene parseado, normalizado y validado (T30 depende de esto).
    async crear(datos, emailId) {
      // `INSERT ... RETURNING` no puede unir contra `categorias` (la fila recién creada no tiene
      // `categoria_id` de todos modos), así que se envuelve en un CTE y se hace el `LEFT JOIN` sobre
      // ese resultado para reutilizar `COLUMNAS_GASTO` y `filaAGasto` sin una segunda forma de fila.
      const resultado = await pool.query<FilaGasto>(
        `
        WITH g AS (
          INSERT INTO gastos (
            email_id, monto_total, moneda, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4,
            cuotas_total, estado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'extraido')
          RETURNING *
        )
        SELECT ${COLUMNAS_GASTO}
        FROM g LEFT JOIN categorias c ON c.id = g.categoria_id
        `,
        [
          emailId,
          datos.montoTotal.toString(),
          datos.moneda,
          datos.comercio,
          datos.fechaGasto,
          datos.tipoTarjeta,
          datos.tarjetaUltimos4,
          datos.cuotasTotal,
        ],
      )

      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error('crear: la consulta no devolvió ninguna fila')
      }
      return filaAGasto(fila)
    },

    // Igual que `crear`, envuelve el INSERT en un CTE para reutilizar `COLUMNAS_GASTO`/`filaAGasto`.
    // Cada campo de `camposParciales` que no vino se pasa como `undefined` -> `null` explícito acá
    // (Req. 2.11, 2.12): nunca `0`, `''` ni ningún otro relleno de dato extraído. `moneda` es la única
    // excepción deliberada: no es un dato que el aviso pueda fallar en extraer —es una constante fija
    // del sistema (`GastoNormalizado.moneda` es el literal `'ARS'`, nunca otro valor)—, así que si no
    // vino se persiste con el mismo `'ARS'` que ya es el `DEFAULT` de la columna en la migración
    // (T18), en vez de forzar un `NULL` que violaría su `NOT NULL` sin aportar ninguna semántica de
    // "campo no resuelto".
    async crearParaRevision(emailId, motivo, camposParciales) {
      const resultado = await pool.query<FilaGasto>(
        `
        WITH g AS (
          INSERT INTO gastos (
            email_id, monto_total, moneda, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4,
            cuotas_total, estado, motivo_revision
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'needs_review', $9)
          RETURNING *
        )
        SELECT ${COLUMNAS_GASTO}
        FROM g LEFT JOIN categorias c ON c.id = g.categoria_id
        `,
        [
          emailId,
          camposParciales.montoTotal?.toString() ?? null,
          camposParciales.moneda ?? 'ARS',
          camposParciales.comercio ?? null,
          camposParciales.fechaGasto ?? null,
          camposParciales.tipoTarjeta ?? null,
          camposParciales.tarjetaUltimos4 ?? null,
          camposParciales.cuotasTotal ?? null,
          motivo,
        ],
      )

      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error('crearParaRevision: la consulta no devolvió ninguna fila')
      }
      return filaAGasto(fila)
    },

    // Único escritor de los siete campos de datos sobre una fila que ya existe (Decision log de T40):
    // a diferencia de `crear`, nunca inserta — así no viola la unicidad de `email_id` al reprocesar
    // un gasto que ya está en `needs_review`. No toca `estado` ni ninguna columna de categoría o
    // revisión (Req. 2.12): el UPDATE se limita exactamente a los siete campos de `GastoNormalizado`.
    async actualizarDatos(id, datos) {
      await pool.query(
        `
        UPDATE gastos
        SET monto_total = $2, moneda = $3, comercio = $4, fecha_gasto = $5, tipo_tarjeta = $6,
            tarjeta_ultimos4 = $7, cuotas_total = $8
        WHERE id = $1
        `,
        [
          id,
          datos.montoTotal.toString(),
          datos.moneda,
          datos.comercio,
          datos.fechaGasto,
          datos.tipoTarjeta,
          datos.tarjetaUltimos4,
          datos.cuotasTotal,
        ],
      )
    },

    // Igual que `crear`/`crearParaRevision`, envuelve el INSERT en un CTE para reutilizar
    // `COLUMNAS_GASTO`/`filaAGasto`, sin introducir una segunda forma de fila (Decision log de T2).
    // `email_id` siempre `NULL` — un alta manual no tiene ningún email de origen (Req. 4.1). El
    // `estado` va directo a `'categorizado'`, nunca `'pendiente'` ni `'extraido'`: el usuario ya
    // eligió la categoría al completar el formulario, así que no hay nada más que categorizar.
    async crearManual(datos) {
      const resultado = await pool.query<FilaGasto>(
        `
        WITH g AS (
          INSERT INTO gastos (
            email_id, monto_total, moneda, comercio, fecha_gasto, categoria_id, categoria_origen,
            estado, confirmado_en
          ) VALUES (
            NULL, $1, 'ARS', $2, $3, (SELECT id FROM categorias WHERE nombre = $4), 'usuario',
            'categorizado', now()
          )
          RETURNING *
        )
        SELECT ${COLUMNAS_GASTO}
        FROM g LEFT JOIN categorias c ON c.id = g.categoria_id
        `,
        [datos.montoTotal.toString(), datos.comercio, datos.fechaGasto, datos.categoria],
      )

      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error('crearManual: la consulta no devolvió ninguna fila')
      }
      return filaAGasto(fila)
    },

    // El origen decide `confirmado_en` (Req. 5.3, 6.3): `regla` confirma en el acto, `ia` queda sin
    // confirmar. `categoria_id` se resuelve contra el nombre de `categorias` (T17) en la misma
    // sentencia, sin una consulta previa. El `UPDATE` toca únicamente las cinco columnas del
    // contrato — nunca `monto_total`, `comercio`, etc. (Req. 2.12).
    async asignarCategoria(id, categoria, origen, justificacion) {
      const confirmadoEn = origen === 'regla' ? new Date() : null
      await pool.query(
        `
        UPDATE gastos
        SET categoria_id = (SELECT id FROM categorias WHERE nombre = $2),
            categoria_origen = $3,
            categoria_justificacion = $4,
            confirmado_en = $5,
            estado = 'categorizado'
        WHERE id = $1
        `,
        [id, categoria, origen, justificacion, confirmadoEn],
      )
    },

    // Único escritor de `ultimo_error` (Decision log de T22): persiste verbatim lo que recibe, sin
    // componer ni truncar el texto. `ultimoError` es `string | null` obligatorio, no opcional, para
    // que el llamador decida explícitamente si hay traza o no.
    async marcarParaRevision(id, motivo, ultimoError) {
      await pool.query(
        `
        UPDATE gastos
        SET estado = 'needs_review', motivo_revision = $2, ultimo_error = $3
        WHERE id = $1
        `,
        [id, motivo, ultimoError],
      )
    },

    // El mismo método sirve para confirmar sin cambios y para corregir (Req. 7.3, 7.4, 7.10): siempre
    // reemplaza `categoria_id` por el nombre recibido, nunca lo deja intacto "si ya coincidía". No
    // toca `estado`: la confirmación es ortogonal al paso del pipeline (un gasto ya `imputado` sigue
    // `imputado`). No toca `categoria_justificacion`: es el registro de lo que había propuesto el
    // modelo, y se conserva aunque el usuario corrija.
    async confirmar(id, categoria) {
      await pool.query(
        `
        UPDATE gastos
        SET categoria_id = (SELECT id FROM categorias WHERE nombre = $2),
            categoria_origen = 'usuario',
            confirmado_en = now()
        WHERE id = $1
        `,
        [id, categoria],
      )
    },

    // Filtra por las TRES columnas —origen `ia`, sin confirmar y fuera de `needs_review`— no solo por
    // `confirmado_en IS NULL` (Decision log de T23): un gasto en `extraido` que todavía no llegó a la
    // categorización también tiene `confirmado_en` en nulo, y no tiene ninguna categoría que confirmar
    // todavía. `needs_review` es invisible en esta versión de la app (design.md), así que tampoco
    // entra aunque cumpla las otras dos condiciones. Orden por `creado_en` para que la bandeja de T48
    // no reciba un orden que cambie entre dos cargas de la misma página.
    async pendientesDeConfirmacion() {
      const resultado = await pool.query<FilaGasto>(
        `
        SELECT ${COLUMNAS_GASTO}
        FROM gastos g
        LEFT JOIN categorias c ON c.id = g.categoria_id
        WHERE g.categoria_origen = 'ia' AND g.confirmado_en IS NULL AND g.estado <> 'needs_review'
        ORDER BY g.creado_en ASC
        `,
      )
      return resultado.rows.map(filaAGasto)
    },

    async traerPorId(id) {
      const resultado = await pool.query<FilaGasto>(
        `
        SELECT ${COLUMNAS_GASTO}
        FROM gastos g
        LEFT JOIN categorias c ON c.id = g.categoria_id
        WHERE g.id = $1
        `,
        [id],
      )
      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error(`traerPorId: no existe un gasto con id ${id}`)
      }
      return filaAGasto(fila)
    },

    async marcarImputado(id) {
      await pool.query("UPDATE gastos SET estado = 'imputado' WHERE id = $1", [id])
    },

    // Consulta exacta fijada por `design.md`: rango `[desde, hasta)`, excluye `needs_review`, sin
    // filtrar por `comercio IS NOT NULL` (Req. 2.11 — esa exclusión es responsabilidad de
    // `calcularComerciosRecurrentes`, T4). Fuera de `needs_review`, `monto_total` y `fecha_gasto`
    // siempre llegan completos juntos (por `crear` o `actualizarDatos`, ambos alimentados por un
    // `GastoNormalizado` entero), así que castear a `Decimal`/`Date` no nulos es seguro acá.
    async gastosEntreFechas(desde, hasta) {
      const resultado = await pool.query<{ comercio: string | null; monto_total: string; fecha_gasto: Date }>(
        `
        SELECT comercio, monto_total, fecha_gasto
        FROM gastos
        WHERE estado <> 'needs_review' AND fecha_gasto >= $1 AND fecha_gasto < $2
        ORDER BY fecha_gasto ASC
        `,
        [desde, hasta],
      )
      return resultado.rows.map((fila) => ({
        comercio: fila.comercio,
        montoTotal: new Decimal(fila.monto_total),
        fechaGasto: new Date(fila.fecha_gasto),
      }))
    },
  }
}
