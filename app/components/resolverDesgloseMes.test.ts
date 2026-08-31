import { describe, expect, it } from 'vitest'
import { resolverDesgloseMes, ORDEN_CATEGORIAS } from '@/app/components/resolverDesgloseMes'
import type { FilaDashboard } from '@/app/components/GraficoMensual'

const FILAS: FilaDashboard[] = [
  { mes: '2026-08', categoria: 'Salidas', total: 250, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Comida', total: 750, tieneSinConfirmar: true },
  { mes: '2026-09', categoria: 'Extras', total: 100, tieneSinConfirmar: false },
]

describe('resolverDesgloseMes', () => {
  it('suma el total del mes a partir de sus filas, sin tocar los otros meses', () => {
    const resultado = resolverDesgloseMes(FILAS, '2026-08')

    expect(resultado.totalMes).toBe(1000)
  })

  it('devuelve las cuatro categorías fijas en el mismo orden, con 0 para las ausentes', () => {
    const resultado = resolverDesgloseMes(FILAS, '2026-08')

    expect(resultado.categorias.map((c) => c.categoria)).toEqual(ORDEN_CATEGORIAS)
    expect(resultado.categorias.find((c) => c.categoria === 'Extras')?.total).toBe(0)
  })

  it('calcula el porcentaje de cada categoría sobre el total del mes', () => {
    const resultado = resolverDesgloseMes(FILAS, '2026-08')

    expect(resultado.categorias.find((c) => c.categoria === 'Salidas')?.pct).toBe(25)
    expect(resultado.categorias.find((c) => c.categoria === 'Comida')?.pct).toBe(75)
  })

  it('propaga tieneSinConfirmar de la fila, sin excluir su monto del total', () => {
    const resultado = resolverDesgloseMes(FILAS, '2026-08')

    expect(resultado.categorias.find((c) => c.categoria === 'Comida')?.tieneSinConfirmar).toBe(true)
    expect(resultado.categorias.find((c) => c.categoria === 'Salidas')?.tieneSinConfirmar).toBe(false)
  })

  it('con un mes sin ninguna fila, el total es 0 y todos los porcentajes son 0 (nunca división por cero)', () => {
    const resultado = resolverDesgloseMes(FILAS, '2026-07')

    expect(resultado.totalMes).toBe(0)
    expect(resultado.categorias.every((c) => c.pct === 0)).toBe(true)
  })
})
