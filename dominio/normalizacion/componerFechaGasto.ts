import { TZDate } from '@date-fns/tz'

// Zona horaria de referencia del proyecto (glosario de requirements.md). Toda fecha y todo cálculo
// de mes se resuelve contra esta zona, y la conversión ocurre en un único punto.
export const ZONA_REFERENCIA = 'America/Argentina/Buenos_Aires'

const PATRON_FECHA = /^(\d{2})\/(\d{2})\/(\d{4})$/
const PATRON_HORA = /^(\d{2}):(\d{2})$/

const formateadorDeVerificacion = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_REFERENCIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * Compone la fecha `DD/MM/AAAA` y la hora `HH:MM` del cuerpo del aviso como hora de pared en la
 * zona de referencia, y devuelve el instante UTC exacto que les corresponde (Req. 3.3).
 * Devuelve `null` cuando la fecha o la hora no tienen forma válida — nunca lanza.
 */
export function componerFechaGasto(fecha: string, hora: string): Date | null {
  const coincidenciaFecha = PATRON_FECHA.exec(fecha)
  const coincidenciaHora = PATRON_HORA.exec(hora)
  if (!coincidenciaFecha || !coincidenciaHora) {
    return null
  }

  const [, diaTexto, mesTexto, anioTexto] = coincidenciaFecha
  const [, horaTexto, minutoTexto] = coincidenciaHora

  const dia = Number(diaTexto)
  const mes = Number(mesTexto)
  const anio = Number(anioTexto)
  const horas = Number(horaTexto)
  const minutos = Number(minutoTexto)

  if (mes < 1 || mes > 12) return null
  if (dia < 1 || dia > 31) return null
  if (horas < 0 || horas > 23) return null
  if (minutos < 0 || minutos > 59) return null

  const instante = new TZDate(anio, mes - 1, dia, horas, minutos, 0, ZONA_REFERENCIA)

  // Round-trip: si la fecha no existía en el calendario (ej. 31/02), TZDate la normaliza hacia
  // adelante en vez de fallar. Releer el instante como hora de pared y comparar contra la entrada
  // detecta esa normalización silenciosa.
  const partes = formateadorDeVerificacion.formatToParts(instante)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value
  const coincideRoundTrip =
    valor('year') === anioTexto &&
    valor('month') === mesTexto &&
    valor('day') === diaTexto &&
    valor('hour') === horaTexto &&
    valor('minute') === minutoTexto

  if (!coincideRoundTrip) {
    return null
  }

  return new Date(instante.getTime())
}
