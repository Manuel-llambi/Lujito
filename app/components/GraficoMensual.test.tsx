// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GraficoMensual, type FilaDashboard } from '@/app/components/GraficoMensual'
import { CLASE_COLOR_CATEGORIA } from '@/app/tokens/colorCategoria'

const FILAS: FilaDashboard[] = [
  { mes: '2026-08', categoria: 'Salidas', total: 1200.5, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Comida', total: 3400.75, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Extras', total: 500, tieneSinConfirmar: false },
  { mes: '2026-09', categoria: 'Salidas', total: 800, tieneSinConfirmar: false },
  { mes: '2026-09', categoria: 'Comida', total: 2900.25, tieneSinConfirmar: false },
  { mes: '2026-09', categoria: 'Extras', total: 150, tieneSinConfirmar: false },
]

describe('GraficoMensual', () => {
  it('con filas de dos meses y tres categorías, renderiza una serie por categoría en cada mes', () => {
    render(<GraficoMensual filas={FILAS} />)

    const mesAgosto = screen.getByTestId('mes-2026-08')
    expect(within(mesAgosto).getByTestId('serie-2026-08-Salidas')).toHaveTextContent('1200.5')
    expect(within(mesAgosto).getByTestId('serie-2026-08-Comida')).toHaveTextContent('3400.75')
    expect(within(mesAgosto).getByTestId('serie-2026-08-Extras')).toHaveTextContent('500')

    const mesSeptiembre = screen.getByTestId('mes-2026-09')
    expect(within(mesSeptiembre).getByTestId('serie-2026-09-Salidas')).toHaveTextContent('800')
    expect(within(mesSeptiembre).getByTestId('serie-2026-09-Comida')).toHaveTextContent('2900.25')
    expect(within(mesSeptiembre).getByTestId('serie-2026-09-Extras')).toHaveTextContent('150')
  })

  it('el color de cada categoría viene del token semántico compartido, no de un literal', () => {
    render(<GraficoMensual filas={FILAS} />)

    const indicadorSalidas = screen.getByTestId('color-2026-08-Salidas')
    const indicadorComida = screen.getByTestId('color-2026-08-Comida')
    const indicadorExtras = screen.getByTestId('color-2026-08-Extras')

    // La aserción compara contra el módulo de tokens compartido, no contra una clase escrita a mano
    // en el test: si el componente hardcodeara un color propio, este assert seguiría comparando
    // contra la fuente de verdad y fallaría en cuanto divergieran.
    expect(indicadorSalidas.className).toContain(CLASE_COLOR_CATEGORIA.Salidas)
    expect(indicadorComida.className).toContain(CLASE_COLOR_CATEGORIA.Comida)
    expect(indicadorExtras.className).toContain(CLASE_COLOR_CATEGORIA.Extras)

    // Ninguna clase de color es un valor hexadecimal ni un nombre de color de Tailwind sin tokenizar.
    expect(indicadorSalidas.className).not.toMatch(/#[0-9a-fA-F]{3,6}/)
    expect(indicadorSalidas.className).not.toMatch(/bg-(amber|red|blue|green|purple|gray)-\d/)
  })

  it('una fila con tieneSinConfirmar en verdadero muestra su total junto con la etiqueta y el patrón visual de "sin confirmar" (Req. 9.3)', () => {
    const filas: FilaDashboard[] = [
      { mes: '2026-08', categoria: 'Salidas', total: 1200.5, tieneSinConfirmar: true },
    ]

    render(<GraficoMensual filas={filas} />)

    const serie = screen.getByTestId('serie-2026-08-Salidas')
    expect(serie).toHaveTextContent('1200.5')
    expect(within(serie).getByTestId('indicador-sin-confirmar-2026-08-Salidas')).toHaveTextContent(
      'sin confirmar',
    )
    expect(within(serie).getByTestId('patron-sin-confirmar-2026-08-Salidas')).toBeInTheDocument()
  })

  it('una fila con tieneSinConfirmar en falso no muestra ni la etiqueta ni el patrón de "sin confirmar" (Req. 9.3)', () => {
    const filas: FilaDashboard[] = [
      { mes: '2026-08', categoria: 'Salidas', total: 1200.5, tieneSinConfirmar: false },
    ]

    render(<GraficoMensual filas={filas} />)

    const serie = screen.getByTestId('serie-2026-08-Salidas')
    expect(
      within(serie).queryByTestId('indicador-sin-confirmar-2026-08-Salidas'),
    ).not.toBeInTheDocument()
    expect(within(serie).queryByTestId('patron-sin-confirmar-2026-08-Salidas')).not.toBeInTheDocument()
  })
})
