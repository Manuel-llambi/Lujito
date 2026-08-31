import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'
import type { Mes } from '@/dominio/imputacion/mesDe'

const formateadorDeDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_REFERENCIA, day: '2-digit' })

/**
 * Último día calendario válido de un mes `AAAA-MM` (28, 29, 30 o 31 según corresponda). Aritmética de
 * calendario pura sobre UTC — a diferencia de `mesDe`/`resolverFechaEfectiva`, acá no hay ningún
 * instante que convertir de zona horaria: `Date.UTC(año, mes, 0)` es el "día 0" del mes siguiente, que
 * el motor de `Date` normaliza siempre al último día del mes pedido, sin depender del huso del sistema.
 */
function ultimoDiaDelMes(mes: Mes): number {
  const [anioTexto, mesTexto] = mes.split('-')
  return new Date(Date.UTC(Number(anioTexto), Number(mesTexto), 0)).getUTCDate()
}

/**
 * Fecha efectiva de una imputación (Decision log de la reconstrucción de `/dashboard`, trabajo ad
 * hoc — `infra/db/migraciones/0005_imputaciones.sql` solo tiene columna `mes` (`char(7)`), sin día; la
 * cuota N>1 de una compra en cuotas se imputa a un mes que no tiene ninguna relación con el día real
 * de `gastos.fecha_gasto`). Para bucketear una fila de imputación en un día concreto DENTRO de su
 * propio mes imputado, se usa el día-del-mes de `fechaGasto`, leído en la zona horaria de referencia
 * (mismo punto único de conversión que `mesDe`) — recortado (`LEAST`) al último día válido del mes
 * imputado cuando ese mes es más corto que el mes real de la compra (ej. compra el 31/01, cuota 2
 * imputada a febrero → cae el 28 o 29 de febrero, nunca el 31). Esto mantiene cada imputación DENTRO
 * de su propio mes real —los totales del dashboard no se rompen— y da un día determinístico incluso
 * para cuotas futuras que todavía no vencieron.
 */
export function resolverFechaEfectiva(mes: Mes, fechaGasto: Date): string {
  const diaTexto = formateadorDeDia.formatToParts(fechaGasto).find((p) => p.type === 'day')?.value
  const diaGasto = Number(diaTexto)
  const dia = Math.min(diaGasto, ultimoDiaDelMes(mes))

  return `${mes}-${String(dia).padStart(2, '0')}`
}
