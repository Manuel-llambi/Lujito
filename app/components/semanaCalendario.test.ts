import { describe, expect, it } from 'vitest'
import {
  diferenciaEnDias,
  domingoDeSemana,
  hoyEnZonaReferencia,
  lunesDeSemana,
  sumarDias,
} from '@/app/components/semanaCalendario'

describe('sumarDias', () => {
  it('suma días dentro del mismo mes', () => {
    expect(sumarDias('2026-08-10', 5)).toBe('2026-08-15')
  })

  it('cruza el borde de mes hacia adelante', () => {
    expect(sumarDias('2026-08-28', 5)).toBe('2026-09-02')
  })

  it('cruza el borde de año hacia adelante', () => {
    expect(sumarDias('2026-12-29', 5)).toBe('2027-01-03')
  })

  it('resta días cruzando el borde de mes hacia atrás', () => {
    expect(sumarDias('2026-09-02', -5)).toBe('2026-08-28')
  })
})

describe('lunesDeSemana / domingoDeSemana', () => {
  it('un miércoles resuelve al lunes de esa misma semana', () => {
    expect(lunesDeSemana('2026-08-19')).toBe('2026-08-17')
  })

  it('un lunes es lunes de su propia semana', () => {
    expect(lunesDeSemana('2026-08-17')).toBe('2026-08-17')
  })

  it('un domingo pertenece a la semana que empezó el lunes anterior, no a la siguiente', () => {
    expect(lunesDeSemana('2026-08-23')).toBe('2026-08-17')
    expect(domingoDeSemana('2026-08-23')).toBe('2026-08-23')
  })

  it('domingoDeSemana de una semana que cruza el borde de dos meses calendario', () => {
    expect(lunesDeSemana('2026-08-31')).toBe('2026-08-31')
    expect(domingoDeSemana('2026-08-31')).toBe('2026-09-06')
  })
})

describe('diferenciaEnDias', () => {
  it('devuelve 0 para la misma fecha', () => {
    expect(diferenciaEnDias('2026-08-17', '2026-08-17')).toBe(0)
  })

  it('devuelve el índice de un día dentro de su semana (lunes=0 .. domingo=6)', () => {
    expect(diferenciaEnDias('2026-08-17', '2026-08-23')).toBe(6)
  })

  it('cuenta correctamente cruzando el borde de mes', () => {
    expect(diferenciaEnDias('2026-08-31', '2026-09-06')).toBe(6)
  })
})

describe('hoyEnZonaReferencia', () => {
  it('lee la fecha en America/Argentina/Buenos_Aires, no en UTC', () => {
    // 2026-08-01T02:00:00Z es 2026-07-31 23:00 en Buenos Aires (UTC-3).
    expect(hoyEnZonaReferencia(new Date('2026-08-01T02:00:00.000Z'))).toBe('2026-07-31')
  })
})
