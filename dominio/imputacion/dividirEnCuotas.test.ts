import Decimal from 'decimal.js'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { dividirEnCuotas } from './dividirEnCuotas'

// Semilla fija (Decision log de T11): un test de propiedades sin semilla fija convierte una falla
// real en una intermitencia que nadie puede reproducir.
const SEMILLA_FIJA = 20260825

describe('dividirEnCuotas', () => {
  it('reparte 10000 en 3 cuotas como [3333.33, 3333.33, 3333.34], el resto va a la última', () => {
    const resultado = dividirEnCuotas(new Decimal('10000'), 3)
    expect(resultado.map((d) => d.toFixed(2))).toEqual(['3333.33', '3333.33', '3333.34'])
  })

  it('reparte sin resto cuando el total ya es divisible: 6000.00 en 6 cuotas da seis montos de 1000.00', () => {
    const resultado = dividirEnCuotas(new Decimal('6000.00'), 6)
    expect(resultado.map((d) => d.toFixed(2))).toEqual([
      '1000.00',
      '1000.00',
      '1000.00',
      '1000.00',
      '1000.00',
      '1000.00',
    ])
  })

  it('devuelve exactamente `cuotas` elementos, ninguno con más de dos decimales', () => {
    const resultado = dividirEnCuotas(new Decimal('10000'), 3)
    expect(resultado).toHaveLength(3)
    for (const monto of resultado) {
      expect(monto.decimalPlaces()).toBeLessThanOrEqual(2)
    }
  })

  it('con 1 cuota devuelve el total sin alterar: 2571.30 en 1 da [2571.30]', () => {
    const resultado = dividirEnCuotas(new Decimal('2571.30'), 1)
    expect(resultado.map((d) => d.toFixed(2))).toEqual(['2571.30'])
  })

  it('caso borde de cobertura obligatoria: 0.01 en 3 cuotas da [0.00, 0.00, 0.01]', () => {
    const resultado = dividirEnCuotas(new Decimal('0.01'), 3)
    expect(resultado.map((d) => d.toFixed(2))).toEqual(['0.00', '0.00', '0.01'])
  })

  it('propiedad: la suma siempre da exactamente el total y ningún monto es negativo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }), // centavos: totales de $0 a $1.000.000,00
        fc.integer({ min: 1, max: 60 }), // cantidad de cuotas
        (centavos, cuotas) => {
          const total = new Decimal(centavos).dividedBy(100)
          const montos = dividirEnCuotas(total, cuotas)

          const suma = montos.reduce((acc, m) => acc.plus(m), new Decimal(0))
          expect(suma.equals(total)).toBe(true)

          for (const monto of montos) {
            expect(monto.greaterThanOrEqualTo(0)).toBe(true)
          }
        },
      ),
      { seed: SEMILLA_FIJA, numRuns: 200 },
    )
  })
})
