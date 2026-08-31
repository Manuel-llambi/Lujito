import Decimal from 'decimal.js'

/**
 * Reparte el monto total en `cuotas` montos de dos decimales, conservando el total exacto (Req. 8.3).
 * Las primeras `cuotas - 1` son el cociente truncado hacia abajo a dos decimales; la última absorbe
 * el resto. Nunca atraviesa un `number`.
 */
export function dividirEnCuotas(montoTotal: Decimal, cuotas: number): Decimal[] {
  const cociente = montoTotal.dividedBy(cuotas).toDecimalPlaces(2, Decimal.ROUND_DOWN)

  const montos: Decimal[] = []
  for (let i = 0; i < cuotas - 1; i++) {
    montos.push(cociente)
  }

  const sumaParcial = cociente.times(cuotas - 1)
  const ultimaCuota = montoTotal.minus(sumaParcial)
  montos.push(ultimaCuota)

  return montos
}
