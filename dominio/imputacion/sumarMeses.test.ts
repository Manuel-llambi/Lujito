import { describe, expect, it } from 'vitest'
import { sumarMeses } from './sumarMeses'

describe('sumarMeses', () => {
  it('sumar 0 no corre el mes: sumarMeses("2026-08", 0) da "2026-08"', () => {
    expect(sumarMeses('2026-08', 0)).toBe('2026-08')
  })

  it('cruza el año hacia adelante: sumarMeses("2026-12", 1) da "2027-01"', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
  })

  it('salto de más de doce meses: sumarMeses("2026-08", 12) da "2027-08"', () => {
    expect(sumarMeses('2026-08', 12)).toBe('2027-08')
  })

  it('salto que cruza dos años: sumarMeses("2026-08", 17) da "2028-01"', () => {
    expect(sumarMeses('2026-08', 17)).toBe('2028-01')
  })

  it('conserva el formato de siete caracteres con mes a dos dígitos', () => {
    expect(sumarMeses('2026-09', 1)).toBe('2026-10')
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
  })
})
