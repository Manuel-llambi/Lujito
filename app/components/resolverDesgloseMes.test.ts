import { describe, expect, it } from 'vitest'
import { resolverDesgloseMes, ORDEN_CATEGORIAS } from '@/app/components/resolverDesgloseMes'
import type { FilaDashboard } from '@/app/components/GraficoMensual'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'

const FILAS: FilaDashboard[] = [
  { mes: '2026-08', categoria: 'Salidas', total: 250, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Comida', total: 750, tieneSinConfirmar: true },
  { mes: '2026-09', categoria: 'Extras', total: 100, tieneSinConfirmar: false },
]

const SIN_DETALLE: FilaImputacionDetallada[] = []

describe('resolverDesgloseMes', () => {
  it('suma el total del mes a partir de sus filas, sin tocar los otros meses', () => {
    const resultado = resolverDesgloseMes(FILAS, SIN_DETALLE, '2026-08')

    expect(resultado.totalMes).toBe(1000)
  })

  it('devuelve las cuatro categorías fijas en el mismo orden, con 0 para las ausentes', () => {
    const resultado = resolverDesgloseMes(FILAS, SIN_DETALLE, '2026-08')

    expect(resultado.categorias.map((c) => c.categoria)).toEqual(ORDEN_CATEGORIAS)
    expect(resultado.categorias.find((c) => c.categoria === 'Extras')?.total).toBe(0)
  })

  it('calcula el porcentaje de cada categoría sobre el total del mes', () => {
    const resultado = resolverDesgloseMes(FILAS, SIN_DETALLE, '2026-08')

    expect(resultado.categorias.find((c) => c.categoria === 'Salidas')?.pct).toBe(25)
    expect(resultado.categorias.find((c) => c.categoria === 'Comida')?.pct).toBe(75)
  })

  it('propaga tieneSinConfirmar de la fila, sin excluir su monto del total', () => {
    const resultado = resolverDesgloseMes(FILAS, SIN_DETALLE, '2026-08')

    expect(resultado.categorias.find((c) => c.categoria === 'Comida')?.tieneSinConfirmar).toBe(true)
    expect(resultado.categorias.find((c) => c.categoria === 'Salidas')?.tieneSinConfirmar).toBe(false)
  })

  it('con un mes sin ninguna fila, el total es 0 y todos los porcentajes son 0 (nunca división por cero)', () => {
    const resultado = resolverDesgloseMes(FILAS, SIN_DETALLE, '2026-07')

    expect(resultado.totalMes).toBe(0)
    expect(resultado.categorias.every((c) => c.pct === 0)).toBe(true)
  })

  describe('gastos individuales (trabajo ad hoc, detalle del acordeón "Categorías")', () => {
    const FILAS_DETALLADAS: FilaImputacionDetallada[] = [
      {
        mes: '2026-08',
        categoria: 'Comida',
        monto: 500,
        fechaGasto: new Date('2026-08-20T12:00:00.000Z'),
        comercio: 'RESTO SUR',
        tieneSinConfirmar: false,
      },
      {
        mes: '2026-08',
        categoria: 'Comida',
        monto: 250,
        fechaGasto: new Date('2026-08-05T12:00:00.000Z'),
        comercio: 'ALMACEN DON JOSE',
        tieneSinConfirmar: true,
      },
      {
        mes: '2026-08',
        categoria: 'Salidas',
        monto: 250,
        fechaGasto: new Date('2026-08-10T12:00:00.000Z'),
        comercio: 'CINE NORTE',
        tieneSinConfirmar: false,
      },
      // Otro mes: no debe filtrarse a la categoría 'Comida' de agosto.
      {
        mes: '2026-09',
        categoria: 'Comida',
        monto: 999,
        fechaGasto: new Date('2026-09-01T12:00:00.000Z'),
        comercio: 'NO DEBERIA APARECER',
        tieneSinConfirmar: false,
      },
    ]

    it('lista los gastos de la categoría en el mes, con comercio, fecha y monto', () => {
      const resultado = resolverDesgloseMes(FILAS, FILAS_DETALLADAS, '2026-08')

      const comida = resultado.categorias.find((c) => c.categoria === 'Comida')
      expect(comida?.gastos.map((g) => g.comercio)).toEqual(['ALMACEN DON JOSE', 'RESTO SUR'])
      expect(comida?.gastos.map((g) => g.monto)).toEqual([250, 500])
    })

    it('ordena los gastos por fecha ascendente, sin importar el orden de entrada', () => {
      const resultado = resolverDesgloseMes(FILAS, FILAS_DETALLADAS, '2026-08')

      const comida = resultado.categorias.find((c) => c.categoria === 'Comida')
      expect(comida?.gastos.map((g) => g.fecha)).toEqual(['2026-08-05', '2026-08-20'])
    })

    it('no mezcla gastos de otro mes ni de otra categoría', () => {
      const resultado = resolverDesgloseMes(FILAS, FILAS_DETALLADAS, '2026-08')

      const comida = resultado.categorias.find((c) => c.categoria === 'Comida')
      expect(comida?.gastos.some((g) => g.comercio === 'NO DEBERIA APARECER')).toBe(false)
      expect(comida?.gastos.some((g) => g.comercio === 'CINE NORTE')).toBe(false)
    })

    it('una categoría sin gastos detallados devuelve un arreglo vacío, no rompe', () => {
      const resultado = resolverDesgloseMes(FILAS, FILAS_DETALLADAS, '2026-08')

      expect(resultado.categorias.find((c) => c.categoria === 'Extras')?.gastos).toEqual([])
    })
  })
})
