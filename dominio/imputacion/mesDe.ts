import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'

export type Mes = string // 'AAAA-MM'

const formateadorDeMes = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_REFERENCIA,
  year: 'numeric',
  month: '2-digit',
})

/**
 * Devuelve el mes calendario `AAAA-MM` al que pertenece un instante, leído en la zona horaria de
 * referencia (Req. 8.4). Único punto del sistema donde ocurre esta conversión de zona horaria.
 */
export function mesDe(fecha: Date): Mes {
  const partes = formateadorDeMes.formatToParts(fecha)
  const anio = partes.find((p) => p.type === 'year')?.value
  const mes = partes.find((p) => p.type === 'month')?.value

  return `${anio}-${mes}`
}
