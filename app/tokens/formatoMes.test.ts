import { describe, expect, it } from 'vitest'
import { nombreMes, nombreMesCorto, formatearFechaCorta } from '@/app/tokens/formatoMes'

describe('nombreMes', () => {
  it('convierte AAAA-MM en el nombre del mes en español, sin pasar por Date', () => {
    expect(nombreMes('2026-08')).toBe('Agosto 2026')
  })

  it('funciona para el primer y el último mes del año', () => {
    expect(nombreMes('2026-01')).toBe('Enero 2026')
    expect(nombreMes('2026-12')).toBe('Diciembre 2026')
  })
})

describe('nombreMesCorto', () => {
  it('abrevia el nombre a tres letras', () => {
    expect(nombreMesCorto('2026-08')).toBe('Ago')
  })
})

describe('formatearFechaCorta', () => {
  it('formatea AAAA-MM-DD como "día mes-corto", sin cero a la izquierda en el día', () => {
    expect(formatearFechaCorta('2026-08-05')).toBe('5 Ago')
    expect(formatearFechaCorta('2026-08-24')).toBe('24 Ago')
  })

  it('funciona en el borde de un mes', () => {
    expect(formatearFechaCorta('2026-01-31')).toBe('31 Ene')
  })
})
