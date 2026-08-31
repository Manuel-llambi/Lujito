import Decimal from 'decimal.js'

// Formato de moneda argentina: punto como separador de miles, coma como separador decimal.
// Ej. "$1.234.567,89" -> 1234567.89. No valida signo ni cero (Req. 3.5 es de T9).
const PATRON_MONTO_ARS = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/

/**
 * Convierte el texto de moneda argentina del aviso en un valor decimal exacto (Req. 3.1, 3.2).
 * Devuelve `null` cuando el texto no tiene forma de monto — nunca lanza.
 */
export function normalizarMonto(texto: string): Decimal | null {
  const limpio = texto.trim().replace(/^\$\s*/, '')
  if (!PATRON_MONTO_ARS.test(limpio)) {
    return null
  }

  const sinSeparadorDeMiles = limpio.replace(/\./g, '')
  const conPuntoDecimal = sinSeparadorDeMiles.replace(',', '.')

  return new Decimal(conPuntoDecimal)
}
