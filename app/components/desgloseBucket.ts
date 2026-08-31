import type { Mes } from '@/dominio/imputacion/mesDe'
import type { NombreCategoria } from '@/app/tokens/colorCategoria'
import { resolverFechaEfectiva } from '@/app/components/resolverFechaEfectiva'
import { ORDEN_CATEGORIAS, type DesgloseCategoria } from '@/app/components/resolverDesgloseMes'

/**
 * Fila-por-imputación (design.md la llama "detalle", `RepositorioImputaciones.imputacionesDetalladasEntre`
 * la produce), traducida a la forma que ya usa la presentación: `monto: number`, no `Decimal` — mismo
 * criterio y mismo punto de conversión que `FilaDashboard` en `GraficoMensual.tsx` frente a la versión
 * con `Decimal` que declara `infra/db/repositorioImputaciones.ts` (T42/T43 fijaron el patrón: dos
 * interfaces con el mismo nombre en capas distintas, no una redeclaración accidental). `comercio` se
 * suma acá con el mismo criterio (trabajo ad hoc de la lista de gastos del acordeón "Categorías").
 */
export interface FilaImputacionDetallada {
  mes: Mes
  categoria: NombreCategoria
  monto: number
  fechaGasto: Date
  comercio: string | null
  tieneSinConfirmar: boolean
}

/** Un bucket del gráfico de barras de la card "Resumen" — una semana del mes enfocado, o un día de la
 * semana enfocada. Misma forma que `DesgloseMes` (`resolverDesgloseMes.ts`) menos el campo `mes`: acá
 * el período no es un mes calendario, así que se identifica solo por su etiqueta de columna. */
export interface DesgloseBucket {
  etiqueta: string
  total: number
  categorias: DesgloseCategoria[]
}

/**
 * Agrupa un subconjunto ya filtrado de `FilaImputacionDetallada` (todas las filas de un mismo bucket)
 * en la forma que necesita el gráfico de barras: total del bucket y una entrada por cada una de las
 * cuatro categorías fijas con su porcentaje — mismo cálculo que `resolverDesgloseMes`, reaplicado por
 * bucket en vez de por mes completo.
 */
export function construirBucket(etiqueta: string, filas: FilaImputacionDetallada[]): DesgloseBucket {
  const total = filas.reduce((acumulado, fila) => acumulado + fila.monto, 0)

  const categorias = ORDEN_CATEGORIAS.map((categoria) => {
    const filasCategoria = filas.filter((fila) => fila.categoria === categoria)
    const totalCategoria = filasCategoria.reduce((acumulado, fila) => acumulado + fila.monto, 0)
    const pct = total > 0 ? Math.round((totalCategoria / total) * 100) : 0
    const tieneSinConfirmar = filasCategoria.some((fila) => fila.tieneSinConfirmar)

    // Gastos individuales del bucket, ordenados por fecha efectiva (mismo bucketing que ya usa este
    // módulo para ubicar cada imputación en su semana/día) — no la `fechaGasto` cruda, para que un
    // gasto en cuotas caiga en el día de SU bucket, no en el día de la compra original.
    const gastos = filasCategoria
      .map((fila) => ({
        comercio: fila.comercio,
        fecha: resolverFechaEfectiva(fila.mes, fila.fechaGasto),
        monto: fila.monto,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    return { categoria, total: totalCategoria, pct, tieneSinConfirmar, gastos }
  })

  return { etiqueta, total, categorias }
}
