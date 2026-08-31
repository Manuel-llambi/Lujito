import Decimal from 'decimal.js'
import type { Pool } from 'pg'
import type { Mes } from '@/dominio/imputacion/mesDe'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'

/**
 * `design.md` usa este tipo en la firma de `reemplazarPara` pero nunca lo declara — T19 es la primera
 * tarea del orden que lo necesita, así que lo define acá derivado de las columnas de `imputaciones`.
 * `gastoId` no forma parte del objeto: es el primer argumento del método (Decision log de T19), para
 * que un arreglo no pueda mezclar imputaciones de dos gastos distintos. T36 lo consume sin
 * redeclararlo.
 */
export interface NuevaImputacion {
  numeroCuota: number
  monto: Decimal
  mes: Mes
}

/**
 * Una fila del dashboard: el total de una categoría en un mes (Req. 9.1), leída de
 * `vista_gastos_mensuales`. `design.md` usa el tipo en la firma de `totalesPorMesYCategoria` pero
 * nunca lo declara — T20 es la primera tarea del orden que lo necesita. `categoria` es `Categoria`, no
 * `Categoria | null`: un gasto con imputaciones está categorizado o está en `needs_review` (excluido
 * por la vista), nunca sin categoría (Decision log de T20, análisis de alcanzabilidad). T42 declaró su
 * propia versión local mientras esta tarea estaba bloqueada; T43 es quien la reemplaza por esta.
 */
export interface FilaDashboard {
  mes: Mes
  categoria: Categoria
  total: Decimal
  tieneSinConfirmar: boolean
}

/**
 * Una fila-por-imputación con la fecha del gasto (trabajo ad hoc de `/dashboard`, fuera de tasks.md):
 * a diferencia de `FilaDashboard`, no agrega por mes+categoría — es el detalle que necesita el
 * bucketing por semana/día de la card "Resumen" (`resolverSemanasDelMes`/`resolverDiasDeSemana`, en
 * `app/components/`), que no puede calcularse a partir de un total ya sumado. `comercio` se suma acá
 * (trabajo ad hoc de la lista de gastos del acordeón "Categorías") con el mismo criterio que
 * `fechaGasto`: viene de `gastos.comercio` tal cual, `null` si el parser nunca lo completó — nunca un
 * string inventado para no dejar el campo vacío.
 */
export interface FilaImputacionDetallada {
  mes: Mes
  categoria: Categoria
  monto: Decimal
  fechaGasto: Date
  comercio: string | null
  tieneSinConfirmar: boolean
}

export interface RepositorioImputaciones {
  reemplazarPara(gastoId: string, imputaciones: NuevaImputacion[]): Promise<void> // Req. 8.6
  totalesPorMesYCategoria(desde: Mes, hasta: Mes): Promise<FilaDashboard[]> // Req. 9.1
  imputacionesDetalladasEntre(desde: Mes, hasta: Mes): Promise<FilaImputacionDetallada[]> // trabajo ad hoc
}

export function crearRepositorioImputaciones(pool: Pool): RepositorioImputaciones {
  return {
    // `DELETE` + `INSERT` en una sola transacción (Decision log de T19), no un `INSERT ... ON
    // CONFLICT DO UPDATE`: un `UPSERT` dejaría las cuotas sobrantes de una escritura anterior cuando
    // el arreglo nuevo es más corto, que es exactamente lo que "reemplazar" prohíbe. La identidad de
    // las filas no se conserva a propósito — nada referencia `imputaciones.id`. Las dos sentencias
    // comparten transacción para que un reintento de Inngest (T38) nunca vea un estado a mitad de
    // camino: o quedan todas las filas nuevas, o quedan las de la escritura anterior.
    async reemplazarPara(gastoId, imputaciones) {
      const cliente = await pool.connect()
      try {
        await cliente.query('BEGIN')
        await cliente.query('DELETE FROM imputaciones WHERE gasto_id = $1', [gastoId])
        for (const imputacion of imputaciones) {
          await cliente.query(
            'INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, $2, $3, $4)',
            [gastoId, imputacion.numeroCuota, imputacion.monto.toString(), imputacion.mes],
          )
        }
        await cliente.query('COMMIT')
      } catch (error) {
        await cliente.query('ROLLBACK')
        throw error
      } finally {
        cliente.release()
      }
    },

    // La comparación lexicográfica de `mes` (`char(7)` con ceros a la izquierda) coincide con el
    // orden cronológico (Decision log de T12), así que `BETWEEN` sobre la cadena alcanza. Rechaza
    // —no traduce— una fila con `categoria` en `NULL`: ese estado no es alcanzable por el pipeline
    // (Decision log de T20, análisis de alcanzabilidad) y mapearlo a `Sin categorizar` volvería
    // indistinguible un defecto de orquestación de un caso rutinario de la bandeja.
    async totalesPorMesYCategoria(desde, hasta) {
      const resultado = await pool.query<{
        mes: string
        categoria: string | null
        total: string
        tiene_sin_confirmar: boolean
      }>(
        `
        SELECT mes, categoria, total, tiene_sin_confirmar
        FROM vista_gastos_mensuales
        WHERE mes BETWEEN $1 AND $2
        ORDER BY mes ASC, categoria ASC
        `,
        [desde, hasta],
      )

      return resultado.rows.map((fila) => {
        if (fila.categoria === null) {
          throw new Error(
            `totalesPorMesYCategoria: fila con categoría nula en el mes ${fila.mes} — un gasto con ` +
              'imputaciones sin categoría es un estado imposible del pipeline, no un caso de "Sin categorizar"',
          )
        }
        return {
          mes: fila.mes,
          categoria: fila.categoria as Categoria,
          total: new Decimal(fila.total),
          tieneSinConfirmar: fila.tiene_sin_confirmar,
        }
      })
    },

    // Mismo filtro que `vista_gastos_mensuales` (`g.estado <> 'needs_review'`, LEFT JOIN a
    // `categorias`) pero sin el `GROUP BY` — una fila por imputación, no un total. Query nueva contra
    // `imputaciones JOIN gastos JOIN categorias` en vez de leer la vista: la vista ya perdió el detalle
    // por fila al agregar (Decision log de esta tarea ad hoc).
    async imputacionesDetalladasEntre(desde, hasta) {
      const resultado = await pool.query<{
        mes: string
        categoria: string | null
        monto: string
        fecha_gasto: Date | null
        comercio: string | null
        sin_confirmar: boolean
      }>(
        `
        SELECT i.mes, c.nombre AS categoria, i.monto, g.fecha_gasto, g.comercio, (g.confirmado_en IS NULL) AS sin_confirmar
        FROM imputaciones i
        JOIN gastos g ON g.id = i.gasto_id
        LEFT JOIN categorias c ON c.id = g.categoria_id
        WHERE g.estado <> 'needs_review' AND i.mes BETWEEN $1 AND $2
        ORDER BY i.mes ASC, g.fecha_gasto ASC
        `,
        [desde, hasta],
      )

      return resultado.rows.map((fila) => {
        if (fila.categoria === null) {
          throw new Error(
            `imputacionesDetalladasEntre: fila con categoría nula en el mes ${fila.mes} — mismo estado ` +
              'inalcanzable que ya rechaza totalesPorMesYCategoria (Decision log de T20)',
          )
        }
        if (fila.fecha_gasto === null) {
          throw new Error(
            `imputacionesDetalladasEntre: fila con fecha_gasto nula en el mes ${fila.mes} — un gasto con ` +
              'imputaciones ya escritas pasó por la extracción del aviso, así que tiene que tener fecha ' +
              '(mismo análisis de alcanzabilidad que la categoría nula)',
          )
        }
        return {
          mes: fila.mes,
          categoria: fila.categoria as Categoria,
          monto: new Decimal(fila.monto),
          fechaGasto: fila.fecha_gasto,
          comercio: fila.comercio,
          tieneSinConfirmar: fila.sin_confirmar,
        }
      })
    },
  }
}
