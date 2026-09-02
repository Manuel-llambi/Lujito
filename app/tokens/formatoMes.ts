import type { Mes } from '@/dominio/imputacion/mesDe'

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/**
 * Nombre legible de un mes `AAAA-MM` ("Agosto 2026"), para la reconstrucción visual de `/dashboard`
 * (trabajo ad hoc). Opera sobre la cadena, nunca sobre un `Date` — mismo motivo que `sumarMeses`: sin
 * caso borde de zona horaria posible al convertir un string en fecha.
 */
export function nombreMes(mes: Mes): string {
  const [anio, mesTexto] = mes.split('-')
  const indice = Number(mesTexto) - 1
  const nombre = NOMBRES_MES[indice] ?? mesTexto

  return `${nombre} ${anio}`
}

/** Versión abreviada ("Ago 2026") para las etiquetas del gráfico de barras, donde el espacio es chico. */
export function nombreMesCorto(mes: Mes): string {
  return nombreMes(mes).slice(0, 3)
}

/**
 * Fecha corta de un gasto individual ("24 Ago"), para la lista de gastos del acordeón "Categorías"
 * (trabajo ad hoc). Recibe una fecha civil `AAAA-MM-DD` ya resuelta (`resolverFechaEfectiva`) y la
 * parsea por string, mismo criterio que `formatearRangoSemana`: nunca vía `Date`, sin conversión de
 * huso horario posible sobre una fecha que ya es civil.
 */
export function formatearFechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  const mesAAAAMM = `${anio}-${mes}` as Mes
  const diaSinCero = String(Number(dia))

  return `${diaSinCero} ${nombreMesCorto(mesAAAAMM)}`
}
