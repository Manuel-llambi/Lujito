import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calcularCategoriaDominante } from './calcularCategoriaDominante'

describe('calcularCategoriaDominante', () => {
  it('con una categoría claramente más alta, arma el hallazgo con el porcentaje redondeado (2.3)', () => {
    const resultado = calcularCategoriaDominante([
      { categoria: 'Comida', total: new Decimal('800') },
      { categoria: 'Salidas', total: new Decimal('400') },
      { categoria: 'Extras', total: new Decimal('200') },
    ])

    expect(resultado).not.toBeNull()
    expect(resultado?.tipo).toBe('categoriaDominante')
    expect(resultado?.categoria).toBe('Comida')
    expect(resultado?.totalCategoria.equals(new Decimal('800'))).toBe(true)
    expect(resultado?.totalMes.equals(new Decimal('1400'))).toBe(true)
    // 800 / 1400 = 57.14...% → redondeado a 57
    expect(resultado?.porcentaje).toBe(57)
  })

  it('devuelve textoRespaldo y recomendacionRespaldo en voseo rioplatense, calculados sin esperar al modelo (4.1, 4.6)', () => {
    const resultado = calcularCategoriaDominante([
      { categoria: 'Comida', total: new Decimal('800') },
      { categoria: 'Salidas', total: new Decimal('200') },
    ])

    expect(resultado?.textoRespaldo).toMatch(/gastaste|te fuiste/i)
    expect(resultado?.textoRespaldo).toContain('Comida')
    expect(resultado?.recomendacionRespaldo.length).toBeGreaterThan(0)
  })

  it('con dos o más categorías empatadas en el total más alto, no calcula el hallazgo (2.4)', () => {
    const resultado = calcularCategoriaDominante([
      { categoria: 'Comida', total: new Decimal('500') },
      { categoria: 'Salidas', total: new Decimal('500') },
      { categoria: 'Extras', total: new Decimal('100') },
    ])

    expect(resultado).toBeNull()
  })

  it('con la lista vacía, no calcula el hallazgo', () => {
    expect(calcularCategoriaDominante([])).toBeNull()
  })
})
