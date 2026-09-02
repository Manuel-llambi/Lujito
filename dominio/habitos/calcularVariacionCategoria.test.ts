import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calcularVariacionCategoria } from './calcularVariacionCategoria'

describe('calcularVariacionCategoria', () => {
  it('con mes anterior null, no calcula ningún hallazgo (2.6)', () => {
    const resultado = calcularVariacionCategoria(
      [{ categoria: 'Comida', total: new Decimal('800') }],
      null,
    )

    expect(resultado).toEqual([])
  })

  it('calcula un hallazgo por cada categoría presente en cualquiera de los dos meses, unión no intersección (2.5)', () => {
    const resultado = calcularVariacionCategoria(
      [
        { categoria: 'Comida', total: new Decimal('800') },
        { categoria: 'Salidas', total: new Decimal('300') },
      ],
      [{ categoria: 'Comida', total: new Decimal('400') }],
    )

    const categorias = resultado.map((h) => h.categoria).sort()
    expect(categorias).toEqual(['Comida', 'Salidas'])
  })

  it('categoría nueva este mes (ausente en el mes anterior) tiene totalMesAnterior 0 y variacionPct null, nunca división por cero (2.5)', () => {
    const resultado = calcularVariacionCategoria(
      [{ categoria: 'Extras', total: new Decimal('500') }],
      [{ categoria: 'Comida', total: new Decimal('400') }],
    )

    const hallazgoExtras = resultado.find((h) => h.categoria === 'Extras')
    expect(hallazgoExtras).toBeDefined()
    expect(hallazgoExtras?.totalMesAnterior.equals(new Decimal('0'))).toBe(true)
    expect(hallazgoExtras?.variacionPct).toBeNull()
  })

  it('categoría que desaparece este mes (ausente en el mes en foco) tiene totalMesFoco 0 (2.5)', () => {
    const resultado = calcularVariacionCategoria(
      [{ categoria: 'Comida', total: new Decimal('400') }],
      [{ categoria: 'Salidas', total: new Decimal('300') }],
    )

    const hallazgoSalidas = resultado.find((h) => h.categoria === 'Salidas')
    expect(hallazgoSalidas).toBeDefined()
    expect(hallazgoSalidas?.totalMesFoco.equals(new Decimal('0'))).toBe(true)
    expect(hallazgoSalidas?.variacionPct).toBeDefined()
  })

  it('calcula variacionPct correctamente cuando ambos meses tienen total positivo', () => {
    const resultado = calcularVariacionCategoria(
      [{ categoria: 'Comida', total: new Decimal('600') }],
      [{ categoria: 'Comida', total: new Decimal('400') }],
    )

    const hallazgo = resultado.find((h) => h.categoria === 'Comida')
    // (600 - 400) / 400 * 100 = 50%
    expect(hallazgo?.variacionPct).toBe(50)
  })

  it('devuelve textoRespaldo y recomendacionRespaldo en voseo rioplatense para cada hallazgo (4.1, 4.6)', () => {
    const resultado = calcularVariacionCategoria(
      [{ categoria: 'Comida', total: new Decimal('900') }],
      [{ categoria: 'Comida', total: new Decimal('300') }],
    )

    const hallazgo = resultado.find((h) => h.categoria === 'Comida')
    expect(hallazgo?.textoRespaldo).toMatch(/te fue de mambo|vos|te/i)
    expect(hallazgo?.textoRespaldo).toContain('Comida')
    expect(hallazgo?.recomendacionRespaldo.length).toBeGreaterThan(0)
  })

  it('con la unión de categorías vacía (ambos meses vacíos), devuelve [] (3.2)', () => {
    const resultado = calcularVariacionCategoria([], [])
    expect(resultado).toEqual([])
  })
})
