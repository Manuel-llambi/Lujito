import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { calcularMesesDeImputacion } from './calcularMesesDeImputacion'

describe('calcularMesesDeImputacion', () => {
  const tzOriginal = process.env.TZ

  beforeEach(() => {
    process.env.TZ = 'UTC'
  })

  afterEach(() => {
    process.env.TZ = tzOriginal
  })

  it('6 cuotas desde el instante de T7 para 24/08/2026 11:14 cruzan el año en orden', () => {
    const resultado = calcularMesesDeImputacion(new Date('2026-08-24T14:14:00.000Z'), 6)
    expect(resultado).toEqual(['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01'])
  })

  it('1 cuota devuelve un único mes, sin depender del tipo de tarjeta (Req. 8.5)', () => {
    const resultado = calcularMesesDeImputacion(new Date('2026-08-24T14:14:00.000Z'), 1)
    expect(resultado).toEqual(['2026-08'])
  })

  it('la única lectura del Date delega en mesDe: no hay una segunda conversión de zona horaria', () => {
    const resultado = calcularMesesDeImputacion(new Date('2026-02-01T02:50:00.000Z'), 2)
    expect(resultado).toEqual(['2026-01', '2026-02'])
  })
})
