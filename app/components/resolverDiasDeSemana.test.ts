import { describe, expect, it } from 'vitest'
import {
  resolverDiasDeSemana,
  resolverLimitesSemana,
  resolverSemanaFocoInicial,
} from '@/app/components/resolverDiasDeSemana'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'

function fila(parcial: Partial<FilaImputacionDetallada> = {}): FilaImputacionDetallada {
  return {
    mes: '2026-08',
    categoria: 'Comida',
    monto: 100,
    fechaGasto: new Date('2026-08-19T15:00:00.000Z'), // lunes 2026-08-17 es el lunes de esa semana
    tieneSinConfirmar: false,
    ...parcial,
  }
}

describe('resolverDiasDeSemana', () => {
  it('devuelve siempre 7 buckets con las etiquetas LUN..DOM', () => {
    const resultado = resolverDiasDeSemana([], '2026-08-17')

    expect(resultado.map((b) => b.etiqueta)).toEqual(['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'])
  })

  it('ubica cada fila en el índice de su día dentro de la semana lunes-a-domingo', () => {
    const filas = [
      fila({ fechaGasto: new Date('2026-08-17T15:00:00.000Z'), monto: 1 }), // LUN
      fila({ fechaGasto: new Date('2026-08-23T15:00:00.000Z'), monto: 2 }), // DOM
    ]

    const resultado = resolverDiasDeSemana(filas, '2026-08-17')

    expect(resultado[0]?.total).toBe(1)
    expect(resultado[6]?.total).toBe(2)
  })

  it('descarta filas fuera de la semana pedida', () => {
    const filas = [fila({ fechaGasto: new Date('2026-08-24T15:00:00.000Z'), monto: 999 })] // lunes siguiente

    const resultado = resolverDiasDeSemana(filas, '2026-08-17')

    expect(resultado.every((b) => b.total === 0)).toBe(true)
  })

  it('una semana que cruza el borde de dos meses calendario agrupa filas de ambos meses', () => {
    const filas = [
      fila({ mes: '2026-08', fechaGasto: new Date('2026-08-31T15:00:00.000Z'), monto: 30 }), // LUN
      fila({ mes: '2026-09', fechaGasto: new Date('2026-09-06T15:00:00.000Z'), monto: 40 }), // DOM
    ]

    const resultado = resolverDiasDeSemana(filas, '2026-08-31')

    expect(resultado[0]?.total).toBe(30)
    expect(resultado[6]?.total).toBe(40)
  })

  it('una cuota recortada por resolverFechaEfectiva se ubica por su fecha efectiva, no por fecha_gasto cruda', () => {
    // Compra el 31/07 (mes de 31 días), cuota imputada a septiembre (30 días): fecha efectiva
    // recortada a 2026-09-30, un miércoles de la semana que arranca el 2026-09-28.
    const filas = [fila({ mes: '2026-09', fechaGasto: new Date('2026-07-31T15:00:00.000Z'), monto: 70 })]

    const resultado = resolverDiasDeSemana(filas, '2026-09-28')

    expect(resultado[2]?.total).toBe(70) // MIE
  })
})

describe('resolverSemanaFocoInicial', () => {
  it('sin ninguna fila, devuelve null', () => {
    expect(resolverSemanaFocoInicial([], new Date('2026-08-19T12:00:00.000Z'))).toBeNull()
  })

  it('con datos en la semana de hoy, foca esa semana', () => {
    const filas = [fila({ fechaGasto: new Date('2026-08-18T12:00:00.000Z') })] // martes de la semana del 17

    const resultado = resolverSemanaFocoInicial(filas, new Date('2026-08-19T12:00:00.000Z')) // hoy: miércoles

    expect(resultado).toBe('2026-08-17')
  })

  it('sin datos en la semana de hoy, foca la semana más reciente con datos', () => {
    const filas = [
      fila({ mes: '2026-06', fechaGasto: new Date('2026-06-01T12:00:00.000Z') }),
      fila({ mes: '2026-07', fechaGasto: new Date('2026-07-15T12:00:00.000Z') }),
    ]

    const resultado = resolverSemanaFocoInicial(filas, new Date('2026-08-19T12:00:00.000Z'))

    expect(resultado).toBe(resolverSemanaFocoInicial(filas, new Date('2026-08-19T12:00:00.000Z')))
    expect(resultado).toBe('2026-07-13') // lunes de la semana que contiene el 2026-07-15
  })
})

describe('resolverLimitesSemana', () => {
  it('sin ninguna fila, devuelve null', () => {
    expect(resolverLimitesSemana([])).toBeNull()
  })

  it('devuelve el lunes de la semana más antigua y de la más reciente con datos', () => {
    const filas = [
      fila({ mes: '2026-06', fechaGasto: new Date('2026-06-02T12:00:00.000Z') }), // lunes 2026-06-01
      fila({ mes: '2026-08', fechaGasto: new Date('2026-08-19T12:00:00.000Z') }), // lunes 2026-08-17
    ]

    const resultado = resolverLimitesSemana(filas)

    expect(resultado).toEqual({ minLunes: '2026-06-01', maxLunes: '2026-08-17' })
  })
})
