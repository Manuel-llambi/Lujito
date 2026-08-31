import { describe, expect, it } from 'vitest'
import { resolverSemanasDelMes } from '@/app/components/resolverSemanasDelMes'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'

function fila(parcial: Partial<FilaImputacionDetallada> = {}): FilaImputacionDetallada {
  return {
    mes: '2026-08',
    categoria: 'Comida',
    monto: 100,
    fechaGasto: new Date('2026-08-10T15:00:00.000Z'),
    tieneSinConfirmar: false,
    ...parcial,
  }
}

describe('resolverSemanasDelMes', () => {
  it('devuelve siempre 4 buckets con las etiquetas Semana 1..4, sin importar cuántos días tenga el mes', () => {
    const resultado = resolverSemanasDelMes([], '2026-02')

    expect(resultado.map((b) => b.etiqueta)).toEqual(['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'])
  })

  it('ignora las filas de otros meses', () => {
    const filas = [fila({ mes: '2026-07', monto: 500 })]

    const resultado = resolverSemanasDelMes(filas, '2026-08')

    expect(resultado.every((b) => b.total === 0)).toBe(true)
  })

  it('ubica el día 1 al 7 en Semana 1 y el día 8 al 14 en Semana 2', () => {
    const filas = [
      fila({ fechaGasto: new Date('2026-08-01T15:00:00.000Z'), monto: 10 }),
      fila({ fechaGasto: new Date('2026-08-07T15:00:00.000Z'), monto: 20 }),
      fila({ fechaGasto: new Date('2026-08-08T15:00:00.000Z'), monto: 30 }),
      fila({ fechaGasto: new Date('2026-08-14T15:00:00.000Z'), monto: 40 }),
    ]

    const resultado = resolverSemanasDelMes(filas, '2026-08')

    expect(resultado[0]?.total).toBe(30) // día 1 + día 7
    expect(resultado[1]?.total).toBe(70) // día 8 + día 14
  })

  it('el bucket "Semana 4" (día 22 en adelante) absorbe hasta el último día del mes, sea de 28, 30 o 31 días', () => {
    const filasFebrero = [fila({ mes: '2026-02', fechaGasto: new Date('2026-02-28T15:00:00.000Z'), monto: 15 })]
    const filasAgosto = [fila({ mes: '2026-08', fechaGasto: new Date('2026-08-31T15:00:00.000Z'), monto: 25 })]

    expect(resolverSemanasDelMes(filasFebrero, '2026-02')[3]?.total).toBe(15)
    expect(resolverSemanasDelMes(filasAgosto, '2026-08')[3]?.total).toBe(25)
  })

  it('una cuota recortada por resolverFechaEfectiva cae en el bucket del último día del mes imputado, no del mes de la compra', () => {
    // Compra el 31 de julio, cuota imputada a un mes de 30 días: la fecha efectiva es 30/08, no 31.
    const filas = [fila({ mes: '2026-08', fechaGasto: new Date('2026-07-31T15:00:00.000Z'), monto: 50 })]

    const resultado = resolverSemanasDelMes(filas, '2026-08')

    expect(resultado[3]?.total).toBe(50) // día 30 → Semana 4
  })

  it('calcula el porcentaje de cada categoría sobre el total de SU bucket, no del mes completo', () => {
    const filas = [
      fila({ categoria: 'Comida', fechaGasto: new Date('2026-08-02T12:00:00.000Z'), monto: 300 }),
      fila({ categoria: 'Salidas', fechaGasto: new Date('2026-08-03T12:00:00.000Z'), monto: 100 }),
      fila({ categoria: 'Extras', fechaGasto: new Date('2026-08-20T12:00:00.000Z'), monto: 999 }),
    ]

    const resultado = resolverSemanasDelMes(filas, '2026-08')

    expect(resultado[0]?.categorias.find((c) => c.categoria === 'Comida')?.pct).toBe(75)
    expect(resultado[0]?.categorias.find((c) => c.categoria === 'Salidas')?.pct).toBe(25)
  })

  it('propaga tieneSinConfirmar por categoría dentro de un bucket', () => {
    const filas = [fila({ fechaGasto: new Date('2026-08-02T12:00:00.000Z'), tieneSinConfirmar: true })]

    const resultado = resolverSemanasDelMes(filas, '2026-08')

    expect(resultado[0]?.categorias.find((c) => c.categoria === 'Comida')?.tieneSinConfirmar).toBe(true)
  })
})
