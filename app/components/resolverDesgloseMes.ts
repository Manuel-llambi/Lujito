import { CLASE_COLOR_CATEGORIA, type NombreCategoria } from '@/app/tokens/colorCategoria'
import type { FilaDashboard } from '@/app/components/GraficoMensual'
import { resolverFechaEfectiva } from '@/app/components/resolverFechaEfectiva'
// Type-only: `desgloseBucket.ts` importa `ORDEN_CATEGORIAS`/`DesgloseCategoria` DE este archivo, así
// que esto parece un ciclo — no lo es. `import type` se borra por completo en la compilación (Next usa
// SWC, que ya elimina los tipos antes de armar el grafo de módulos de JS), así que no hay dependencia
// circular en tiempo de ejecución. Se prefiere reusar el tipo a duplicarlo una tercera vez: T42/T43 ya
// fijaron el patrón de "una interfaz por capa" para la frontera infra/presentación, no para dos módulos
// de presentación que ya se importan entre sí.
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'

/**
 * Orden fijo de categorías para el gráfico, la leyenda y el acordeón de `/dashboard` (trabajo ad hoc
 * de reconstrucción visual, mockup Stitch): las tres categorías fijas del dominio más "Sin
 * categorizar", siempre en el mismo orden — nunca ordenadas por monto, para que una barra o una
 * leyenda no reordenen sus colores de una corrida a otra.
 */
export const ORDEN_CATEGORIAS = Object.keys(CLASE_COLOR_CATEGORIA) as NombreCategoria[]

/** Un gasto individual dentro de una categoría del acordeón (trabajo ad hoc): `fecha` es la fecha
 * efectiva (`resolverFechaEfectiva`), no `fechaGasto` cruda — mismo criterio que ya usa el bucketing
 * por semana/día, para que la cuota N de una compra en cuotas caiga en un día DENTRO del mes que se
 * está mostrando. */
export interface GastoDeCategoria {
  comercio: string | null
  fecha: string
  monto: number
}

export interface DesgloseCategoria {
  categoria: NombreCategoria
  total: number
  /** Porcentaje del total del mes, redondeado para mostrar — nunca una entrada a un cálculo posterior. */
  pct: number
  tieneSinConfirmar: boolean
  /** Gastos individuales de esta categoría en el mes, ordenados por fecha ascendente. */
  gastos: GastoDeCategoria[]
}

export interface DesgloseMes {
  mes: string
  totalMes: number
  categorias: DesgloseCategoria[]
}

/**
 * Agrupa las `FilaDashboard` (ya sumadas por el repositorio, Req. 9.1) de un mes puntual en la forma
 * que necesitan el gráfico y el acordeón: total del mes y una entrada por cada una de las cuatro
 * categorías fijas, con su porcentaje. No suma nada que `obtenerFilasDashboard` no haya sumado ya —
 * solo reagrupa y calcula el porcentaje para mostrar. `total`/`pct`/`tieneSinConfirmar` siguen viniendo
 * de `filas` (agregados, Req. 9.1, sin tocar); `gastos` es la única lectura de `filasDetalladas` —
 * ambas fuentes cubren la misma ventana y el mismo criterio de exclusión (`needs_review`), así que no
 * hay una segunda fuente de verdad para el total, solo el detalle por gasto que el agregado no trae.
 */
export function resolverDesgloseMes(
  filas: FilaDashboard[],
  filasDetalladas: FilaImputacionDetallada[],
  mes: string,
): DesgloseMes {
  const filasDelMes = filas.filter((fila) => fila.mes === mes)
  const totalMes = filasDelMes.reduce((acumulado, fila) => acumulado + fila.total, 0)

  const detalladasDelMes = filasDetalladas.filter((fila) => fila.mes === mes)

  const categorias = ORDEN_CATEGORIAS.map((categoria) => {
    const fila = filasDelMes.find((f) => f.categoria === categoria)
    const total = fila?.total ?? 0
    const pct = totalMes > 0 ? Math.round((total / totalMes) * 100) : 0

    const gastos = detalladasDelMes
      .filter((f) => f.categoria === categoria)
      .map((f) => ({
        comercio: f.comercio,
        fecha: resolverFechaEfectiva(f.mes, f.fechaGasto),
        monto: f.monto,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    return { categoria, total, pct, tieneSinConfirmar: fila?.tieneSinConfirmar ?? false, gastos }
  })

  return { mes, totalMes, categorias }
}
