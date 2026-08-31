import { describe, expect, it } from 'vitest'
import { formatearMoneda } from '@/app/tokens/formatoMoneda'

describe('formatearMoneda', () => {
  it('formatea miles con "." y decimales con "," (es-AR)', () => {
    expect(formatearMoneda(452300)).toBe('$ 452.300,00')
  })

  it('siempre muestra dos decimales, incluso para un entero', () => {
    expect(formatearMoneda(500)).toBe('$ 500,00')
  })

  it('formatea cero', () => {
    expect(formatearMoneda(0)).toBe('$ 0,00')
  })
})
