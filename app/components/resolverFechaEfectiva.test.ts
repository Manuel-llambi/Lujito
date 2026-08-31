import { describe, expect, it } from 'vitest'
import { resolverFechaEfectiva } from '@/app/components/resolverFechaEfectiva'

describe('resolverFechaEfectiva', () => {
  it('usa el día-del-mes de fechaGasto cuando el mes imputado lo puede contener sin recorte', () => {
    const resultado = resolverFechaEfectiva('2026-08', new Date('2026-08-15T14:00:00.000Z'))

    expect(resultado).toBe('2026-08-15')
  })

  it('lee el día en la zona horaria de referencia, no en UTC (caso borde de medianoche)', () => {
    // 2026-08-01T02:00:00Z es 2026-07-31 23:00 en America/Argentina/Buenos_Aires (UTC-3): el día
    // efectivo tiene que ser el 31, no el 1, aunque el instante UTC ya haya cruzado la medianoche.
    const resultado = resolverFechaEfectiva('2026-07', new Date('2026-08-01T02:00:00.000Z'))

    expect(resultado).toBe('2026-07-31')
  })

  it('recorta al último día válido de un mes de 30 días cuando la compra fue el 31', () => {
    const resultado = resolverFechaEfectiva('2026-09', new Date('2026-08-31T12:00:00.000Z'))

    expect(resultado).toBe('2026-09-30')
  })

  it('recorta al 28 en un febrero no bisiesto cuando la compra fue el 31', () => {
    const resultado = resolverFechaEfectiva('2026-02', new Date('2026-01-31T12:00:00.000Z'))

    expect(resultado).toBe('2026-02-28')
  })

  it('recorta al 29 en un febrero bisiesto cuando la compra fue el 31', () => {
    const resultado = resolverFechaEfectiva('2028-02', new Date('2028-01-31T12:00:00.000Z'))

    expect(resultado).toBe('2028-02-29')
  })

  it('no recorta un mes de 31 días aunque la compra haya sido el 31', () => {
    const resultado = resolverFechaEfectiva('2026-10', new Date('2026-08-31T12:00:00.000Z'))

    expect(resultado).toBe('2026-10-31')
  })

  it('el día 1 de un mes cualquiera nunca se recorta', () => {
    const resultado = resolverFechaEfectiva('2026-02', new Date('2026-01-01T12:00:00.000Z'))

    expect(resultado).toBe('2026-02-01')
  })
})
