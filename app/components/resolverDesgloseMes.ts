import { CLASE_COLOR_CATEGORIA, type NombreCategoria } from '@/app/tokens/colorCategoria'
import type { FilaDashboard } from '@/app/components/GraficoMensual'

/**
 * Orden fijo de categorías para el gráfico, la leyenda y el acordeón de `/dashboard` (trabajo ad hoc
 * de reconstrucción visual, mockup Stitch): las tres categorías fijas del dominio más "Sin
 * categorizar", siempre en el mismo orden — nunca ordenadas por monto, para que una barra o una
 * leyenda no reordenen sus colores de una corrida a otra.
 */
export const ORDEN_CATEGORIAS = Object.keys(CLASE_COLOR_CATEGORIA) as NombreCategoria[]

export interface DesgloseCategoria {
  categoria: NombreCategoria
  total: number
  /** Porcentaje del total del mes, redondeado para mostrar — nunca una entrada a un cálculo posterior. */
  pct: number
  tieneSinConfirmar: boolean
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
 * solo reagrupa y calcula el porcentaje para mostrar.
 */
export function resolverDesgloseMes(filas: FilaDashboard[], mes: string): DesgloseMes {
  const filasDelMes = filas.filter((fila) => fila.mes === mes)
  const totalMes = filasDelMes.reduce((acumulado, fila) => acumulado + fila.total, 0)

  const categorias = ORDEN_CATEGORIAS.map((categoria) => {
    const fila = filasDelMes.find((f) => f.categoria === categoria)
    const total = fila?.total ?? 0
    const pct = totalMes > 0 ? Math.round((total / totalMes) * 100) : 0

    return { categoria, total, pct, tieneSinConfirmar: fila?.tieneSinConfirmar ?? false }
  })

  return { mes, totalMes, categorias }
}
