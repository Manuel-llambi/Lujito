import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { calcularComerciosRecurrentes } from './calcularComerciosRecurrentes'

describe('calcularComerciosRecurrentes', () => {
  it('con dos gastos del mismo comercio, arma un hallazgo con el total exacto en Decimal (2.9)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'WWWAYSACOMAR', montoTotal: new Decimal('1000') },
      { comercio: 'WWWAYSACOMAR', montoTotal: new Decimal('500') },
      { comercio: 'OTRO COMERCIO', montoTotal: new Decimal('300') },
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.tipo).toBe('comercioRecurrente')
    expect(resultado[0]?.comercio).toBe('WWWAYSACOMAR')
    expect(resultado[0]?.cantidadGastos).toBe(2)
    expect(resultado[0]?.totalComercio.equals(new Decimal('1500'))).toBe(true)
  })

  it('agrupa por comercio normalizado: mismo comercio con espacio final cuenta como uno solo (2.9)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'WWWAYSACOMAR', montoTotal: new Decimal('100') },
      { comercio: 'WWWAYSACOMAR ', montoTotal: new Decimal('200') },
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.cantidadGastos).toBe(2)
    expect(resultado[0]?.comercio).toBe('WWWAYSACOMAR')
  })

  it('agrupa por comercio normalizado: espacios internos consecutivos colapsan a uno solo (2.9)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'WWWAYSA  COMAR', montoTotal: new Decimal('100') },
      { comercio: 'WWWAYSA COMAR', montoTotal: new Decimal('200') },
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.cantidadGastos).toBe(2)
  })

  it('sin comercios repetidos, devuelve [] (2.10)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'COMERCIO A', montoTotal: new Decimal('100') },
      { comercio: 'COMERCIO B', montoTotal: new Decimal('200') },
    ])

    expect(resultado).toEqual([])
  })

  it('con arreglo vacío, devuelve [] sin lanzar (2.10)', () => {
    expect(calcularComerciosRecurrentes([])).toEqual([])
  })

  it('excluye gastos sin comercio: dos gastos con comercio null no cuentan como repetidos (2.11)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: null, montoTotal: new Decimal('100') },
      { comercio: null, montoTotal: new Decimal('200') },
    ])

    expect(resultado).toEqual([])
  })

  it('no depende de ni acopla con las otras reglas de dominio/habitos (2.12)', () => {
    expect(() =>
      calcularComerciosRecurrentes([
        { comercio: 'COMERCIO X', montoTotal: new Decimal('10') },
        { comercio: 'COMERCIO X', montoTotal: new Decimal('20') },
      ]),
    ).not.toThrow()
  })

  it('cada hallazgo trae recomendacionRespaldo no vacío en la misma pasada (3.1)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'COMERCIO X', montoTotal: new Decimal('10') },
      { comercio: 'COMERCIO X', montoTotal: new Decimal('20') },
    ])

    expect(resultado[0]?.recomendacionRespaldo.length).toBeGreaterThan(0)
  })

  it('textoRespaldo y recomendacionRespaldo son deterministas: misma entrada, mismo texto (4.1)', () => {
    const entrada = [
      { comercio: 'COMERCIO X', montoTotal: new Decimal('10') },
      { comercio: 'COMERCIO X', montoTotal: new Decimal('20') },
    ]

    const primeraCorrida = calcularComerciosRecurrentes(entrada)
    const segundaCorrida = calcularComerciosRecurrentes(entrada)

    expect(primeraCorrida[0]?.textoRespaldo).toBe(segundaCorrida[0]?.textoRespaldo)
    expect(primeraCorrida[0]?.recomendacionRespaldo).toBe(segundaCorrida[0]?.recomendacionRespaldo)
  })

  it('textoRespaldo y recomendacionRespaldo usan voseo rioplatense e incluyen comercio y monto (4.6)', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'COMERCIO X', montoTotal: new Decimal('1000') },
      { comercio: 'COMERCIO X', montoTotal: new Decimal('500') },
    ])

    expect(resultado[0]?.textoRespaldo).toMatch(/gastaste|te repetiste|volviste/i)
    expect(resultado[0]?.textoRespaldo).toContain('COMERCIO X')
    expect(resultado[0]?.textoRespaldo).toContain('1.500')
    expect(resultado[0]?.recomendacionRespaldo).toContain('COMERCIO X')
  })

  it('con tres comercios recurrentes, ordena el resultado por totalComercio descendente', () => {
    const resultado = calcularComerciosRecurrentes([
      { comercio: 'BAJO', montoTotal: new Decimal('50') },
      { comercio: 'BAJO', montoTotal: new Decimal('50') },
      { comercio: 'ALTO', montoTotal: new Decimal('900') },
      { comercio: 'ALTO', montoTotal: new Decimal('900') },
      { comercio: 'MEDIO', montoTotal: new Decimal('300') },
      { comercio: 'MEDIO', montoTotal: new Decimal('300') },
    ])

    expect(resultado.map((hallazgo) => hallazgo.comercio)).toEqual(['ALTO', 'MEDIO', 'BAJO'])
  })
})
