import { describe, expect, it } from 'vitest'
import { esUltimoIntento } from './esUltimoIntento'

describe('esUltimoIntento — Req. 10.1, 10.2', () => {
  it('con attempt en el penúltimo valor (maxAttempts - 2), no es el último intento', () => {
    expect(esUltimoIntento(1, 4)).toBe(false)
  })

  it('con attempt exactamente en maxAttempts - 1, es el último intento (caso borde exacto)', () => {
    expect(esUltimoIntento(3, 4)).toBe(true)
  })

  it('con attempt un valor por debajo del borde, no es el último intento', () => {
    expect(esUltimoIntento(2, 4)).toBe(false)
  })

  it('con maxAttempts en 1 (sin reintentos configurados), el primer y único intento ya es el último', () => {
    expect(esUltimoIntento(0, 1)).toBe(true)
  })

  it('en el primer intento (attempt = 0) con margen de reintentos, no es el último', () => {
    expect(esUltimoIntento(0, 4)).toBe(false)
  })

  it('con maxAttempts en undefined (dato no disponible en el contexto), nunca se considera el último', () => {
    expect(esUltimoIntento(0, undefined)).toBe(false)
    expect(esUltimoIntento(10, undefined)).toBe(false)
  })

  it('con attempt por encima de maxAttempts - 1 (no debería ocurrir, pero no debe dar false negativo), sigue siendo el último', () => {
    expect(esUltimoIntento(5, 4)).toBe(true)
  })
})
