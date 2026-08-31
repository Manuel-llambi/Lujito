import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { normalizarMonto } from './normalizarMonto'

describe('normalizarMonto', () => {
  it('convierte "$2.571,30" en 2571.30 y "$4.663,00" en 4663.00, comparado por igualdad decimal', () => {
    expect(normalizarMonto('$2.571,30')?.equals(new Decimal('2571.30'))).toBe(true)
    expect(normalizarMonto('$4.663,00')?.equals(new Decimal('4663.00'))).toBe(true)
  })

  it('interpreta el punto como separador de miles y la coma como decimal en "$1.234.567,89"', () => {
    const resultado = normalizarMonto('$1.234.567,89')
    expect(resultado?.equals(new Decimal('1234567.89'))).toBe(true)
    // Descarta el modo de falla de leer con reglas de formato en inglés.
    expect(resultado?.equals(new Decimal('1.234'))).toBe(false)
    expect(resultado?.equals(new Decimal('123456789'))).toBe(false)
  })

  it('sostiene aritmética decimal exacta: "$0,10" + "$0,20" da exactamente 0.30', () => {
    const a = normalizarMonto('$0,10')
    const b = normalizarMonto('$0,20')
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    const suma = a!.plus(b!)
    expect(suma.equals(new Decimal('0.30'))).toBe(true)
    expect(suma.toNumber()).not.toBe(0.1 + 0.2) // 0.30000000000000004 en punto flotante binario
  })

  it('devuelve un decimal igual a 0 para "$0,00", no nulo', () => {
    const resultado = normalizarMonto('$0,00')
    expect(resultado).not.toBeNull()
    expect(resultado?.equals(new Decimal('0'))).toBe(true)
  })

  it('devuelve nulo para un texto sin forma de monto', () => {
    expect(normalizarMonto('no es un monto')).toBeNull()
    expect(normalizarMonto('')).toBeNull()
  })
})
