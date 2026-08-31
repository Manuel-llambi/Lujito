import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { INTERPRETACION_MONTO, resolverMontoTotal } from './resolverMontoTotal'

describe('resolverMontoTotal', () => {
  it('con "valor_de_la_cuota", 1000.00 en 6 cuotas da exactamente 6000.00', () => {
    const resultado = resolverMontoTotal(new Decimal('1000.00'), 6, 'valor_de_la_cuota')
    expect(resultado.equals(new Decimal('6000.00'))).toBe(true)
  })

  it('la constante INTERPRETACION_MONTO vale "valor_de_la_cuota"', () => {
    expect(INTERPRETACION_MONTO).toBe('valor_de_la_cuota')
  })

  it('con "total_de_la_compra" y las mismas entradas devuelve el monto sin multiplicar', () => {
    const resultado = resolverMontoTotal(new Decimal('1000.00'), 6, 'total_de_la_compra')
    expect(resultado.equals(new Decimal('1000.00'))).toBe(true)
  })

  it('el producto es decimal exacto: 3333.33 por 3 da exactamente 9999.99', () => {
    const resultado = resolverMontoTotal(new Decimal('3333.33'), 3, 'valor_de_la_cuota')
    expect(resultado.equals(new Decimal('9999.99'))).toBe(true)
  })

  it('con 1 cuota, ambas interpretaciones devuelven el monto del aviso sin alterarlo', () => {
    const monto = new Decimal('2571.30')
    expect(resolverMontoTotal(monto, 1, 'valor_de_la_cuota').equals(monto)).toBe(true)
    expect(resolverMontoTotal(monto, 1, 'total_de_la_compra').equals(monto)).toBe(true)
  })
})
