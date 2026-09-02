// @vitest-environment jsdom
import Decimal from 'decimal.js'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PantallaHabitos } from '@/app/components/habitos/PantallaHabitos'
import type { HallazgoRedactado } from '@/infra/ia/redactarHallazgo'

const HALLAZGOS: HallazgoRedactado[] = [
  {
    hallazgo: {
      tipo: 'categoriaDominante',
      categoria: 'Comida',
      totalCategoria: new Decimal(1000),
      totalMes: new Decimal(2000),
      porcentaje: 50,
      textoRespaldo: 'texto de respaldo categoría',
      recomendacionRespaldo: 'recomendación de respaldo categoría',
    },
    texto: 'Este mes te la pasaste gastando en Comida',
    recomendacionTexto: 'Frená un poco con la comida afuera',
    fuente: 'modelo',
  },
  {
    hallazgo: {
      tipo: 'comercioRecurrente',
      comercio: 'WWWAYSACOMAR',
      cantidadGastos: 3,
      totalComercio: new Decimal(1500),
      textoRespaldo: 'texto de respaldo comercio',
      recomendacionRespaldo: 'recomendación de respaldo comercio',
    },
    texto: 'Volviste varias veces a WWWAYSACOMAR',
    recomendacionTexto: 'Fijate si te conviene un plan ahí',
    fuente: 'respaldo',
  },
]

describe('PantallaHabitos — Req. 1.2, 5.1, 5.2, 5.3, 6.1, 6.2', () => {
  it('con hallazgos, muestra la sección Hallazgos con el texto de cada ítem (5.1)', () => {
    render(<PantallaHabitos hallazgos={HALLAZGOS} cantidadPendientes={0} />)

    expect(screen.getByText('Hallazgos')).toBeInTheDocument()
    expect(screen.getByText('Este mes te la pasaste gastando en Comida')).toBeInTheDocument()
    expect(screen.getByText('Volviste varias veces a WWWAYSACOMAR')).toBeInTheDocument()
  })

  it('con hallazgos, muestra la sección Recomendaciones con el texto de cada ítem (5.2)', () => {
    render(<PantallaHabitos hallazgos={HALLAZGOS} cantidadPendientes={0} />)

    expect(screen.getByText('Recomendaciones')).toBeInTheDocument()
    expect(screen.getByText('Frená un poco con la comida afuera')).toBeInTheDocument()
    expect(screen.getByText('Fijate si te conviene un plan ahí')).toBeInTheDocument()
  })

  it('las tarjetas de ambas secciones reusan la clase de tarjeta de SeccionCategorias (5.3)', () => {
    render(<PantallaHabitos hallazgos={HALLAZGOS} cantidadPendientes={0} />)

    const tarjetaHallazgo = screen.getByText('Este mes te la pasaste gastando en Comida').closest('div')
    const tarjetaRecomendacion = screen.getByText('Frená un poco con la comida afuera').closest('div')

    expect(tarjetaHallazgo?.className).toContain('rounded-3xl border border-texto-muted/15 bg-superficie')
    expect(tarjetaRecomendacion?.className).toContain('rounded-3xl border border-texto-muted/15 bg-superficie')
  })

  it('con hallazgos vacíos, muestra el mensaje de datos insuficientes y no las secciones (6.1)', () => {
    render(<PantallaHabitos hallazgos={[]} cantidadPendientes={0} />)

    expect(screen.getByText('Todavía no hay datos suficientes para mostrar hábitos')).toBeInTheDocument()
    expect(screen.queryByText('Hallazgos')).not.toBeInTheDocument()
    expect(screen.queryByText('Recomendaciones')).not.toBeInTheDocument()
  })

  it('con hallazgos vacíos, BottomNavBar sigue presente (6.2)', () => {
    render(<PantallaHabitos hallazgos={[]} cantidadPendientes={0} />)

    expect(screen.getByTestId('nav-habitos')).toBeInTheDocument()
  })

  it('en ambos casos, BottomNavBar recibe activa="habitos" (1.2)', () => {
    const { rerender } = render(<PantallaHabitos hallazgos={HALLAZGOS} cantidadPendientes={0} />)
    expect(screen.getByTestId('nav-habitos')).toHaveAttribute('aria-current', 'page')

    rerender(<PantallaHabitos hallazgos={[]} cantidadPendientes={0} />)
    expect(screen.getByTestId('nav-habitos')).toHaveAttribute('aria-current', 'page')
  })
})
