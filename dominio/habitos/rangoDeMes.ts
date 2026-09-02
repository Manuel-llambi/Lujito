import { TZDate } from '@date-fns/tz'
import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'
import type { Mes } from '@/dominio/imputacion/mesDe'
import { sumarMeses } from '@/dominio/imputacion/sumarMeses'

/**
 * Traduce un mes calendario `AAAA-MM` al rango `[desde, hasta)` de instantes UTC que le corresponde
 * en la zona de referencia, con `hasta` exclusivo (Req. 2.7, 2.9). `desde` es la medianoche del
 * primer día del mes en la zona de referencia; `hasta` es la medianoche del primer día del mes
 * siguiente, calculado con `sumarMeses` — nunca sumando o restando días sobre un `Date` a mano.
 */
export function rangoDeMes(mes: Mes): { desde: Date; hasta: Date } {
  const [anioTexto, mesTexto] = mes.split('-')
  const anio = Number(anioTexto)
  const mesIndice = Number(mesTexto) - 1 // 0-based

  const mesSiguiente = sumarMeses(mes, 1)
  const [anioSiguienteTexto, mesSiguienteTexto] = mesSiguiente.split('-')
  const anioSiguiente = Number(anioSiguienteTexto)
  const mesSiguienteIndice = Number(mesSiguienteTexto) - 1 // 0-based

  const desde = new TZDate(anio, mesIndice, 1, 0, 0, 0, ZONA_REFERENCIA)
  const hasta = new TZDate(anioSiguiente, mesSiguienteIndice, 1, 0, 0, 0, ZONA_REFERENCIA)

  return { desde: new Date(desde.getTime()), hasta: new Date(hasta.getTime()) }
}
