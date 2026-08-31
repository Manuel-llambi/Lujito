// @vitest-environment jsdom
import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PantallaDashboard } from '@/app/components/PantallaDashboard'
import type { FilaDashboard } from '@/app/components/GraficoMensual'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'

const FILAS: FilaDashboard[] = [
  { mes: '2026-07', categoria: 'Salidas', total: 100, tieneSinConfirmar: false },
  { mes: '2026-07', categoria: 'Comida', total: 100, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Salidas', total: 250, tieneSinConfirmar: false },
  { mes: '2026-08', categoria: 'Comida', total: 750, tieneSinConfirmar: true },
]

// El total de arriba y SeccionCategorias (Req. 9.1/9.3) se resuelven a partir de FILAS, no de esto —
// ninguno de los tests de este archivo ejercita la pestaña "Semana", así que un arreglo vacío alcanza.
const FILAS_DETALLADAS: FilaImputacionDetallada[] = []

describe('PantallaDashboard', () => {
  it('muestra el total acumulado del mes más reciente de las filas recibidas', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    expect(screen.getByTestId('total-acumulado')).toHaveTextContent('$ 1.000')
    expect(screen.getByTestId('periodo-foco')).toHaveTextContent('Agosto 2026')
  })

  it('sin gastos pendientes, no muestra el banner de alerta', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    expect(screen.queryByTestId('banner-pendientes')).not.toBeInTheDocument()
  })

  it('con gastos pendientes, muestra el banner con la cantidad real', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={3} />)

    expect(screen.getByTestId('banner-pendientes')).toHaveTextContent('3')
  })

  it('navegar al período anterior cambia el mes en foco al mes previo real, sin refetch', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByLabelText('Período anterior'))

    expect(screen.getByTestId('periodo-foco')).toHaveTextContent('Julio 2026')
    expect(screen.getByTestId('total-acumulado')).toHaveTextContent('$ 200')
  })

  it('expandir una categoría muestra su total y ninguna otra categoría muestra su detalle', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByTestId('categoria-toggle-Comida'))

    const detalleComida = screen.getByTestId('categoria-detalle-Comida')
    expect(within(detalleComida).getByText('$ 750,00')).toBeInTheDocument()
    expect(within(detalleComida).getByText(/sin confirmar/)).toBeInTheDocument()
    expect(screen.queryByTestId('categoria-detalle-Salidas')).not.toBeInTheDocument()
  })

  it('quitó la pestaña "Día": el selector de granularidad solo tiene Semana y Mes', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    expect(screen.getByTestId('granularidad-semana')).toBeInTheDocument()
    expect(screen.getByTestId('granularidad-mes')).toBeInTheDocument()
    expect(screen.queryByTestId('granularidad-dia')).not.toBeInTheDocument()
  })

  it('cambiar a la pestaña "Semana" no cambia el total acumulado ni las categorías, que siguen atados al mes en foco (Req. 9.1/9.3)', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByTestId('granularidad-semana'))

    expect(screen.getByTestId('total-acumulado')).toHaveTextContent('$ 1.000')
    expect(screen.getByTestId('categoria-toggle-Comida')).toBeInTheDocument()
  })

  it('en la pestaña "Semana", sin filasDetalladas el período muestra "Sin datos" en vez de romper', () => {
    render(<PantallaDashboard filas={FILAS} filasDetalladas={FILAS_DETALLADAS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByTestId('granularidad-semana'))

    expect(screen.getByTestId('periodo-foco')).toHaveTextContent('Sin datos')
  })
})

describe('PantallaDashboard — pestañas de granularidad con datos reales (trabajo ad hoc)', () => {
  const FILAS_CON_DETALLE: FilaDashboard[] = [
    { mes: '2026-08', categoria: 'Comida', total: 300, tieneSinConfirmar: false },
    { mes: '2026-08', categoria: 'Salidas', total: 100, tieneSinConfirmar: false },
  ]
  const FILAS_DETALLADAS_CON_DATOS: FilaImputacionDetallada[] = [
    { mes: '2026-08', categoria: 'Comida', monto: 300, fechaGasto: new Date('2026-08-05T12:00:00.000Z'), tieneSinConfirmar: false }, // día 5 → Semana 1
    { mes: '2026-08', categoria: 'Salidas', monto: 100, fechaGasto: new Date('2026-08-20T12:00:00.000Z'), tieneSinConfirmar: false }, // día 20 → Semana 3
  ]

  it('la pestaña "Mes" dibuja 4 barras — las semanas del mes en foco, no los últimos 4 meses', () => {
    render(<PantallaDashboard filas={FILAS_CON_DETALLE} filasDetalladas={FILAS_DETALLADAS_CON_DATOS} cantidadPendientes={0} />)

    expect(screen.getByText('Semana 1')).toBeInTheDocument()
    expect(screen.getByText('Semana 4')).toBeInTheDocument()
  })

  it('la pestaña "Semana" dibuja 7 barras LUN..DOM con su propio rango de fechas en el header', () => {
    render(<PantallaDashboard filas={FILAS_CON_DETALLE} filasDetalladas={FILAS_DETALLADAS_CON_DATOS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByTestId('granularidad-semana'))

    expect(screen.getByText('LUN')).toBeInTheDocument()
    expect(screen.getByText('DOM')).toBeInTheDocument()
    expect(screen.getByTestId('periodo-foco')).not.toHaveTextContent('Sin datos')
  })

  it('la pestaña "Semana" pagina semanas de forma independiente del mes enfocado, sin refetch', () => {
    render(<PantallaDashboard filas={FILAS_CON_DETALLE} filasDetalladas={FILAS_DETALLADAS_CON_DATOS} cantidadPendientes={0} />)

    fireEvent.click(screen.getByTestId('granularidad-semana'))
    const etiquetaInicial = screen.getByTestId('periodo-foco').textContent

    fireEvent.click(screen.getByLabelText('Período anterior'))

    expect(screen.getByTestId('periodo-foco').textContent).not.toBe(etiquetaInicial)
    // El mes en foco (Req. 9.1/9.3, usado por el total de arriba) no se movió con la navegación de semana.
    expect(screen.getByTestId('total-acumulado')).toHaveTextContent('$ 400')
  })
})
