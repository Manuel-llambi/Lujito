import type { Mes } from '@/dominio/imputacion/mesDe'
import { resolverFechaEfectiva } from '@/app/components/resolverFechaEfectiva'
import { construirBucket, type DesgloseBucket, type FilaImputacionDetallada } from '@/app/components/desgloseBucket'

const ETIQUETAS_SEMANA_DEL_MES = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']

/**
 * Las cuatro barras de la pestaña "Mes" de la card "Resumen" (trabajo ad hoc): partición fija del mes
 * enfocado en 4 buckets por rango de día-del-mes de la fecha efectiva de cada imputación — 1-7, 8-14,
 * 15-21, 22-hasta el último día del mes (Decision log: rango fijo, no "7 días exactos" cuatro veces,
 * para que un mes de 28, 30 o 31 días dé siempre exactamente 4 barras sin un quinto bucket residual).
 */
export function resolverSemanasDelMes(filas: FilaImputacionDetallada[], mes: Mes): DesgloseBucket[] {
  const filasPorBucket: FilaImputacionDetallada[][] = [[], [], [], []]

  for (const fila of filas) {
    if (fila.mes !== mes) continue

    const fechaEfectiva = resolverFechaEfectiva(fila.mes, fila.fechaGasto)
    const dia = Number(fechaEfectiva.slice(-2))
    const indice = dia <= 7 ? 0 : dia <= 14 ? 1 : dia <= 21 ? 2 : 3
    filasPorBucket[indice]!.push(fila)
  }

  return filasPorBucket.map((filasDelBucket, indice) =>
    construirBucket(ETIQUETAS_SEMANA_DEL_MES[indice]!, filasDelBucket),
  )
}
