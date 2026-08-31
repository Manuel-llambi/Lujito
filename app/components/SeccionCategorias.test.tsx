// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SeccionCategorias } from '@/app/components/SeccionCategorias'
import type { DesgloseCategoria } from '@/app/components/resolverDesgloseMes'

const CATEGORIAS: DesgloseCategoria[] = [
  {
    categoria: 'Comida',
    total: 750,
    pct: 75,
    tieneSinConfirmar: false,
    gastos: [
      { comercio: 'ALMACEN DON JOSE', fecha: '2026-08-05', monto: 250 },
      { comercio: 'RESTO SUR', fecha: '2026-08-20', monto: 500 },
    ],
  },
  {
    categoria: 'Salidas',
    total: 250,
    pct: 25,
    tieneSinConfirmar: false,
    gastos: [],
  },
]

describe('SeccionCategorias', () => {
  // Componente controlado (Decision log de este test): `expandida` la maneja el padre
  // (`PantallaDashboard`), acá no hay estado propio — `onToggle` es un `vi.fn()` de solo verificación de
  // llamada, la categoría abierta se fija directo por prop en vez de simular el click.

  it('con la categoría expandida, lista sus gastos individuales con comercio y monto', () => {
    render(<SeccionCategorias categorias={CATEGORIAS} expandida="Comida" onToggle={vi.fn()} />)

    const detalle = screen.getByTestId('categoria-detalle-Comida')
    expect(within(detalle).getByText('ALMACEN DON JOSE')).toBeInTheDocument()
    expect(within(detalle).getByText('RESTO SUR')).toBeInTheDocument()
    // El monto comparte nodo de texto con la fecha ("5 Ago · $ 250,00"), por eso el matcher es por
    // contenido de fila y no por texto exacto de un span.
    const filas = within(screen.getByTestId('categoria-gastos-Comida')).getAllByRole('listitem')
    expect(filas[0]).toHaveTextContent('$ 250,00')
    expect(filas[1]).toHaveTextContent('$ 500,00')
  })

  it('lista los gastos ordenados por fecha (el orden que ya trae la prop, no reordena)', () => {
    render(<SeccionCategorias categorias={CATEGORIAS} expandida="Comida" onToggle={vi.fn()} />)

    const filas = within(screen.getByTestId('categoria-gastos-Comida')).getAllByRole('listitem')
    expect(filas[0]).toHaveTextContent('ALMACEN DON JOSE')
    expect(filas[1]).toHaveTextContent('RESTO SUR')
  })

  it('una categoría sin gastos (arreglo vacío) no renderiza la lista y no rompe', () => {
    render(<SeccionCategorias categorias={CATEGORIAS} expandida="Salidas" onToggle={vi.fn()} />)

    const detalle = screen.getByTestId('categoria-detalle-Salidas')
    expect(screen.queryByTestId('categoria-gastos-Salidas')).not.toBeInTheDocument()
    expect(detalle).toBeInTheDocument()
  })

  it('un gasto sin comercio (null) se muestra con un texto de reemplazo, nunca vacío o roto', () => {
    const conComercioNulo: DesgloseCategoria[] = [
      {
        categoria: 'Extras',
        total: 100,
        pct: 100,
        tieneSinConfirmar: false,
        gastos: [{ comercio: null, fecha: '2026-08-12', monto: 100 }],
      },
    ]
    render(<SeccionCategorias categorias={conComercioNulo} expandida="Extras" onToggle={vi.fn()} />)

    expect(within(screen.getByTestId('categoria-detalle-Extras')).getByText('Comercio sin identificar')).toBeInTheDocument()
  })
})
