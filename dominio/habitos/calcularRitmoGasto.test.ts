import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calcularRitmoGasto } from './calcularRitmoGasto'

describe('calcularRitmoGasto', () => {
  it('con menos de 2 meses anteriores disponibles (0), devuelve null (2.8)', () => {
    const resultado = calcularRitmoGasto(
      [{ fechaGasto: new Date('2026-08-05T12:00:00.000Z'), montoTotal: new Decimal('100') }],
      [],
      new Date('2026-08-15T12:00:00.000Z'),
    )

    expect(resultado).toBeNull()
  })

  it('con menos de 2 meses anteriores disponibles (1), devuelve null (2.8)', () => {
    const resultado = calcularRitmoGasto(
      [{ fechaGasto: new Date('2026-08-05T12:00:00.000Z'), montoTotal: new Decimal('100') }],
      [[{ fechaGasto: new Date('2026-07-05T12:00:00.000Z'), montoTotal: new Decimal('50') }]],
      new Date('2026-08-15T12:00:00.000Z'),
    )

    expect(resultado).toBeNull()
  })

  it('con 2+ meses anteriores, corta el mes en foco y cada mes anterior por el mismo día calendario que hoy en la zona de referencia (2.7)', () => {
    // hoy: 15/08/2026 (hora de pared en Buenos Aires, offset -03:00)
    const hoy = new Date('2026-08-15T14:00:00.000Z') // 11:00 hora local del 15/08 en Buenos Aires

    const gastosMesFoco = [
      // 10/08 en Buenos Aires (13:00Z = 10:00 local del 10/08) — dentro del corte
      { fechaGasto: new Date('2026-08-10T13:00:00.000Z'), montoTotal: new Decimal('100') },
      // 15/08 en Buenos Aires (13:00Z = 10:00 local del 15/08) — dentro del corte (mismo día que hoy)
      { fechaGasto: new Date('2026-08-15T13:00:00.000Z'), montoTotal: new Decimal('200') },
      // 20/08 en Buenos Aires — EXCLUIDO del corte, es posterior al día de hoy
      { fechaGasto: new Date('2026-08-20T13:00:00.000Z'), montoTotal: new Decimal('9999') },
    ]

    const mesAnterior1 = [
      // 10/07 en Buenos Aires — dentro del corte (día <= 15)
      { fechaGasto: new Date('2026-07-10T13:00:00.000Z'), montoTotal: new Decimal('40') },
      // 20/07 en Buenos Aires — EXCLUIDO, día 20 > 15
      { fechaGasto: new Date('2026-07-20T13:00:00.000Z'), montoTotal: new Decimal('9999') },
    ]

    const mesAnterior2 = [
      // 15/06 en Buenos Aires — dentro del corte (día == 15)
      { fechaGasto: new Date('2026-06-15T13:00:00.000Z'), montoTotal: new Decimal('60') },
    ]

    const resultado = calcularRitmoGasto(gastosMesFoco, [mesAnterior1, mesAnterior2], hoy)

    expect(resultado).not.toBeNull()
    expect(resultado?.totalHastaHoyMesFoco.equals(new Decimal('300'))).toBe(true) // 100 + 200
    // promedio: (40 + 60) / 2 = 50
    expect(resultado?.promedioHastaMismoDiaMesesAnteriores.equals(new Decimal('50'))).toBe(true)
    expect(resultado?.mesesConsiderados).toBe(2)
  })

  it('cuando el promedio de los meses anteriores da 0, variacionPct es null (nunca Infinity/NaN)', () => {
    const hoy = new Date('2026-08-15T13:00:00.000Z')

    const resultado = calcularRitmoGasto(
      [{ fechaGasto: new Date('2026-08-10T13:00:00.000Z'), montoTotal: new Decimal('500') }],
      [[], []],
      hoy,
    )

    expect(resultado).not.toBeNull()
    expect(resultado?.promedioHastaMismoDiaMesesAnteriores.equals(new Decimal('0'))).toBe(true)
    expect(resultado?.variacionPct).toBeNull()
  })

  it('calcula variacionPct correctamente cuando el promedio es positivo', () => {
    const hoy = new Date('2026-08-15T13:00:00.000Z')

    const resultado = calcularRitmoGasto(
      [{ fechaGasto: new Date('2026-08-10T13:00:00.000Z'), montoTotal: new Decimal('600') }],
      [
        [{ fechaGasto: new Date('2026-07-10T13:00:00.000Z'), montoTotal: new Decimal('400') }],
        [{ fechaGasto: new Date('2026-06-10T13:00:00.000Z'), montoTotal: new Decimal('400') }],
      ],
      hoy,
    )

    // (600 - 400) / 400 * 100 = 50%
    expect(resultado?.variacionPct).toBe(50)
  })

  it('devuelve textoRespaldo y recomendacionRespaldo en voseo rioplatense (4.1, 4.6)', () => {
    const hoy = new Date('2026-08-15T13:00:00.000Z')

    const resultado = calcularRitmoGasto(
      [{ fechaGasto: new Date('2026-08-10T13:00:00.000Z'), montoTotal: new Decimal('600') }],
      [
        [{ fechaGasto: new Date('2026-07-10T13:00:00.000Z'), montoTotal: new Decimal('400') }],
        [{ fechaGasto: new Date('2026-06-10T13:00:00.000Z'), montoTotal: new Decimal('400') }],
      ],
      hoy,
    )

    expect(resultado?.textoRespaldo).toMatch(/vas|te|vos/i)
    expect(resultado?.recomendacionRespaldo.length).toBeGreaterThan(0)
  })

  it('nunca lanza, es independiente de las otras reglas (2.12) — se invoca de forma aislada', () => {
    expect(() =>
      calcularRitmoGasto([], [[], []], new Date('2026-08-15T13:00:00.000Z')),
    ).not.toThrow()
  })
})
