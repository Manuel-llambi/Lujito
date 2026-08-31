import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'

const formateadorDeFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_REFERENCIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}) // 'en-CA' formatea como 'AAAA-MM-DD' de forma nativa — mismo truco que usa `mesDe` con el mes solo.

/**
 * Utilidades puras de calendario `AAAA-MM-DD` para la card "Resumen" de `/dashboard` (trabajo ad hoc).
 * Todas —salvo `hoyEnZonaReferencia`— operan sobre la cadena/objeto `Date` como fecha civil, nunca
 * como instante: no hay ninguna conversión de zona horaria posible en sumar días o encontrar el lunes
 * de una semana, mismo criterio que `sumarMeses` opera sobre `AAAA-MM` sin pasar por `Date` con huso.
 */

function parsearFechaUTC(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio!, mes! - 1, dia!))
}

function formatearFechaUTC(fecha: Date): string {
  const anio = fecha.getUTCFullYear()
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getUTCDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

/** Único punto de conversión de zona horaria de este módulo: la fecha `AAAA-MM-DD` de "hoy" leída en
 * la zona de referencia, para elegir la semana en foco inicial (Decision log de esta reconstrucción). */
export function hoyEnZonaReferencia(ahora: Date): string {
  return formateadorDeFecha.format(ahora)
}

export function sumarDias(fecha: string, cantidad: number): string {
  const fechaUTC = parsearFechaUTC(fecha)
  fechaUTC.setUTCDate(fechaUTC.getUTCDate() + cantidad)
  return formatearFechaUTC(fechaUTC)
}

/**
 * Lunes (ISO) de la semana calendario que contiene `fecha` — semana lunes-a-domingo, no
 * domingo-a-sábado (Decision log: mismo criterio que el mockup, que arranca la semana en LUN).
 * `getUTCDay()` devuelve 0 para domingo; se lo trata como el séptimo día para que el domingo quede al
 * final de SU PROPIA semana en vez de al principio de la siguiente.
 */
export function lunesDeSemana(fecha: string): string {
  const diaIsoDomingoComoSiete = parsearFechaUTC(fecha).getUTCDay() || 7
  return sumarDias(fecha, -(diaIsoDomingoComoSiete - 1))
}

export function domingoDeSemana(fecha: string): string {
  return sumarDias(lunesDeSemana(fecha), 6)
}

/** Diferencia en días calendario entre dos fechas `AAAA-MM-DD` (`hasta - desde`), para ubicar una
 * fecha efectiva dentro de los 7 buckets LUN..DOM de su semana. */
export function diferenciaEnDias(desde: string, hasta: string): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000
  return Math.round((parsearFechaUTC(hasta).getTime() - parsearFechaUTC(desde).getTime()) / MS_POR_DIA)
}
