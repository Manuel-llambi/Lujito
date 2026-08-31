import { resolverFechaEfectiva } from '@/app/components/resolverFechaEfectiva'
import { construirBucket, type DesgloseBucket, type FilaImputacionDetallada } from '@/app/components/desgloseBucket'
import { diferenciaEnDias, domingoDeSemana, hoyEnZonaReferencia, lunesDeSemana } from '@/app/components/semanaCalendario'

const ETIQUETAS_DIA_SEMANA = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

/**
 * Las siete barras de la pestaña "Semana" de la card "Resumen" (trabajo ad hoc): un bucket por día
 * calendario LUN..DOM de la semana en foco, agrupando por la fecha efectiva de cada imputación
 * (`resolverFechaEfectiva`). `lunes` puede pertenecer a un mes calendario distinto del de alguna fila
 * —una semana puede cruzar el borde de dos meses— por eso esta función no filtra por `mes`: recibe ya
 * el conjunto de filas de los meses que hagan falta (responsabilidad del contenedor/pantalla) y
 * descarta acá, por fecha, lo que cae fuera de la semana pedida.
 */
export function resolverDiasDeSemana(filas: FilaImputacionDetallada[], lunes: string): DesgloseBucket[] {
  const domingo = domingoDeSemana(lunes)
  const filasPorBucket: FilaImputacionDetallada[][] = Array.from({ length: 7 }, () => [])

  for (const fila of filas) {
    const fechaEfectiva = resolverFechaEfectiva(fila.mes, fila.fechaGasto)
    // Comparación lexicográfica de `AAAA-MM-DD`: coincide con el orden cronológico, mismo criterio
    // que ya usa `RepositorioImputaciones.totalesPorMesYCategoria` para el rango de `mes`.
    if (fechaEfectiva < lunes || fechaEfectiva > domingo) continue

    const indice = diferenciaEnDias(lunes, fechaEfectiva)
    filasPorBucket[indice]!.push(fila)
  }

  return filasPorBucket.map((filasDelBucket, indice) =>
    construirBucket(ETIQUETAS_DIA_SEMANA[indice]!, filasDelBucket),
  )
}

/**
 * Semana en foco inicial (Decision log de esta reconstrucción): la semana calendario que contiene
 * "hoy" (en la zona de referencia) si hay al menos una imputación con fecha efectiva esa semana; si no,
 * la semana más reciente que sí tiene datos. `null` solo cuando no hay ninguna fila —pantalla sin datos
 * todavía, la card de "Semana" queda sin período que mostrar, igual que `mesFoco` queda `null` hoy.
 */
export function resolverSemanaFocoInicial(filas: FilaImputacionDetallada[], ahora: Date): string | null {
  if (filas.length === 0) {
    return null
  }

  const fechasEfectivas = filas.map((fila) => resolverFechaEfectiva(fila.mes, fila.fechaGasto)).sort()
  const hoy = hoyEnZonaReferencia(ahora)
  const lunesDeHoy = lunesDeSemana(hoy)
  const domingoDeHoy = domingoDeSemana(hoy)

  const hayDatosEstaSemana = fechasEfectivas.some((fecha) => fecha >= lunesDeHoy && fecha <= domingoDeHoy)
  if (hayDatosEstaSemana) {
    return lunesDeHoy
  }

  return lunesDeSemana(fechasEfectivas[fechasEfectivas.length - 1]!)
}

/** Límites de navegación de la pestaña "Semana" (Decision log): la primera y la última semana que
 * tienen al menos una fila, para no dejar navegar hacia un período sin datos — mismo espíritu que
 * `puedeIrAnterior`/`puedeIrSiguiente` ya acotan la navegación de meses a `mesesOrdenados`. */
export function resolverLimitesSemana(
  filas: FilaImputacionDetallada[],
): { minLunes: string; maxLunes: string } | null {
  if (filas.length === 0) {
    return null
  }

  const fechasEfectivas = filas.map((fila) => resolverFechaEfectiva(fila.mes, fila.fechaGasto)).sort()

  return {
    minLunes: lunesDeSemana(fechasEfectivas[0]!),
    maxLunes: lunesDeSemana(fechasEfectivas[fechasEfectivas.length - 1]!),
  }
}
