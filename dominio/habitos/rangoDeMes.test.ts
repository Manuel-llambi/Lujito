import { describe, expect, it } from 'vitest'
import { rangoDeMes } from './rangoDeMes'

describe('rangoDeMes', () => {
  it('da el rango [desde, hasta) de un mes calendario en la zona de referencia', () => {
    const { desde, hasta } = rangoDeMes('2026-08')
    expect(desde.toISOString()).toBe('2026-08-01T03:00:00.000Z')
    expect(hasta.toISOString()).toBe('2026-09-01T03:00:00.000Z')
  })

  it('caso borde de año: rangoDeMes("2026-12") da hasta = 2027-01-01T03:00:00.000Z, exclusivo', () => {
    const { hasta } = rangoDeMes('2026-12')
    expect(hasta.toISOString()).toBe('2027-01-01T03:00:00.000Z')

    // Un gasto justo antes del límite (todavía diciembre en Buenos Aires) cae dentro del rango.
    const gastoDentro = new Date('2027-01-01T02:59:59.000Z')
    expect(gastoDentro.getTime() < hasta.getTime()).toBe(true)

    // Un gasto exactamente en el límite ya no cae dentro del rango (hasta es exclusivo).
    const gastoEnElLimite = new Date('2027-01-01T03:00:00.000Z')
    expect(gastoEnElLimite.getTime() < hasta.getTime()).toBe(false)
  })

  it('primer mes del año, sin desborde: rangoDeMes("2026-01")', () => {
    const { desde, hasta } = rangoDeMes('2026-01')
    expect(desde.toISOString()).toBe('2026-01-01T03:00:00.000Z')
    expect(hasta.toISOString()).toBe('2026-02-01T03:00:00.000Z')
  })
})
