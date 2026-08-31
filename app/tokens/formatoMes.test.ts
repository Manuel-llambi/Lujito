import { describe, expect, it } from 'vitest'
import { nombreMes, nombreMesCorto } from '@/app/tokens/formatoMes'

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
