import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mesDe } from './mesDe'

describe('mesDe', () => {
  const tzOriginal = process.env.TZ

  beforeEach(() => {
    process.env.TZ = 'UTC'
  })

  afterEach(() => {
    process.env.TZ = tzOriginal
  })

  it('devuelve "2026-08" para el instante que compone T7 a partir de 24/08/2026 11:14', () => {
    expect(mesDe(new Date('2026-08-24T14:14:00.000Z'))).toBe('2026-08')
  })

  it('caso borde: 2026-02-01T02:50:00.000Z (31/01 23:50 en ART) cae en "2026-01"', () => {
    expect(mesDe(new Date('2026-02-01T02:50:00.000Z'))).toBe('2026-01')
  })

  it('caso borde: 2026-02-01T03:10:00.000Z (01/02 00:10 en ART) cae en "2026-02"', () => {
    expect(mesDe(new Date('2026-02-01T03:10:00.000Z'))).toBe('2026-02')
  })

  it('caso borde: cruza el año hacia atrás sin producir "2027-00"', () => {
    expect(mesDe(new Date('2027-01-01T02:00:00.000Z'))).toBe('2026-12')
  })

  it('rellena el mes a dos dígitos: nunca "2026-1"', () => {
    expect(mesDe(new Date('2026-01-15T15:00:00.000Z'))).toBe('2026-01')
  })
})
