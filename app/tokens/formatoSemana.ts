import { nombreMesCorto } from '@/app/tokens/formatoMes'
import type { Mes } from '@/dominio/imputacion/mesDe'

/**
 * Rango de fechas de la semana en foco ("19 - 25 Ago 2026") para el header propio de la pestaña
 * "Semana" de la card "Resumen" (trabajo ad hoc, mockup Stitch). Recibe `lunes` y `domingo` ya
 * resueltos por `semanaCalendario.ts` como cadenas `AAAA-MM-DD` — opera sobre ellas como fechas
 * civiles, mismo criterio que `nombreMes`/`sumarMeses`: sin conversión de zona horaria posible. Cuando
 * la semana cruza el borde de dos meses calendario (o de año) muestra ambos meses ("28 Ago - 3 Sep
 * 2026"); el año que se muestra es siempre el del domingo, el día que cierra la semana.
 */
export function formatearRangoSemana(lunes: string, domingo: string): string {
  const [anioLunes, mesLunes, diaLunes] = lunes.split('-')
  const [anioDomingo, mesDomingo, diaDomingo] = domingo.split('-')
  const mesLunesAAAAMM = `${anioLunes}-${mesLunes}` as Mes
  const mesDomingoAAAAMM = `${anioDomingo}-${mesDomingo}` as Mes

  const diaLunesSinCero = String(Number(diaLunes))
  const diaDomingoSinCero = String(Number(diaDomingo))

  if (mesLunesAAAAMM === mesDomingoAAAAMM) {
    return `${diaLunesSinCero} - ${diaDomingoSinCero} ${nombreMesCorto(mesDomingoAAAAMM)} ${anioDomingo}`
  }

  return (
    `${diaLunesSinCero} ${nombreMesCorto(mesLunesAAAAMM)} - ` +
    `${diaDomingoSinCero} ${nombreMesCorto(mesDomingoAAAAMM)} ${anioDomingo}`
  )
}
