// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BottomNavBar } from '@/app/components/BottomNavBar'

describe('BottomNavBar — Req. 1.1, 1.2, 1.3', () => {
  it('renderiza el link de Hábitos con href, testid y texto visible (1.1)', () => {
    render(<BottomNavBar cantidadPendientes={0} activa="habitos" />)

    const link = screen.getByTestId('nav-habitos')
    expect(link).toHaveAttribute('href', '/habitos')
    expect(link).toHaveTextContent('Hábitos')
  })

  it('marca Hábitos como activa cuando activa="habitos" (1.2)', () => {
    render(<BottomNavBar cantidadPendientes={0} activa="habitos" />)

    const link = screen.getByTestId('nav-habitos')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link.className).toContain('text-acento')
  })

  it('no marca Hábitos como activa cuando activa="inicio" o "bandeja" (1.2)', () => {
    const { rerender } = render(<BottomNavBar cantidadPendientes={0} activa="inicio" />)
    let link = screen.getByTestId('nav-habitos')
    expect(link).not.toHaveAttribute('aria-current')
    expect(link.className).toContain('text-texto-muted')

    rerender(<BottomNavBar cantidadPendientes={0} activa="bandeja" />)
    link = screen.getByTestId('nav-habitos')
    expect(link).not.toHaveAttribute('aria-current')
    expect(link.className).toContain('text-texto-muted')
  })

  it('con activa="habitos", Inicio y Bandeja siguen presentes con su href y el badge de pendientes intacto (1.3)', () => {
    render(<BottomNavBar cantidadPendientes={3} activa="habitos" />)

    const linkInicio = screen.getByTestId('nav-inicio')
    expect(linkInicio).toHaveAttribute('href', '/dashboard')

    const linkBandeja = screen.getByTestId('nav-bandeja')
    expect(linkBandeja).toHaveAttribute('href', '/bandeja')
    expect(linkBandeja).toHaveTextContent('3')

    const linkHabitos = screen.getByTestId('nav-habitos')
    expect(linkHabitos).not.toHaveTextContent('3')
  })
})
