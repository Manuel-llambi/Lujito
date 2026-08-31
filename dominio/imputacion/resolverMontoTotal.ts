import Decimal from 'decimal.js'

export type InterpretacionMonto = 'total_de_la_compra' | 'valor_de_la_cuota'

// Decisión resuelta el 2026-08-26 (requirements.md, "Decisiones resueltas"): el aviso informa el
// valor de una sola cuota. Único punto de la aplicación que codifica esta interpretación (Req. 8.8).
export const INTERPRETACION_MONTO: InterpretacionMonto = 'valor_de_la_cuota'

/**
 * Convierte el monto que trae el aviso en el monto total de la compra (Req. 8.8).
 */
export function resolverMontoTotal(
  montoDelAviso: Decimal,
  cuotas: number,
  interpretacion: InterpretacionMonto,
): Decimal {
  if (interpretacion === 'valor_de_la_cuota') {
    return montoDelAviso.times(cuotas)
  }
  return montoDelAviso
}
