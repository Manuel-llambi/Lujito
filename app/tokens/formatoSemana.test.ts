import { describe, expect, it } from 'vitest'
import { formatearRangoSemana } from '@/app/tokens/formatoSemana'

describe('formatearRangoSemana', () => {
  it('semana dentro de un mismo mes: "19 - 25 Ago 2026"', () => {
    expect(formatearRangoSemana('2026-08-19', '2026-08-25')).toBe('19 - 25 Ago 2026')
  })

  it('semana que cruza el borde de dos meses calendario: muestra ambos meses', () => {
    expect(formatearRangoSemana('2026-08-31', '2026-09-06')).toBe('31 Ago - 6 Sep 2026')
  })

  it('semana que cruza el borde de año: usa el año del domingo', () => {
    expect(formatearRangoSemana('2026-12-28', '2027-01-03')).toBe('28 Dic - 3 Ene 2027')
  })

  it('los días se muestran sin cero a la izquierda', () => {
    expect(formatearRangoSemana('2026-08-03', '2026-08-09')).toBe('3 - 9 Ago 2026')
  })
})
