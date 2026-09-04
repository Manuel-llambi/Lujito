// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BotonAgregarGastoFlotante } from '@/app/components/BotonAgregarGastoFlotante'

describe('BotonAgregarGastoFlotante (Req. 1.1, 1.2, T6)', () => {
  it('se renderiza con data-testid="fab-nuevo-gasto" (Req. 1.1)', () => {
    render(<BotonAgregarGastoFlotante onAbrir={vi.fn()} />)

    expect(screen.getByTestId('fab-nuevo-gasto')).toBeInTheDocument()
  })

  it('al hacer click invoca onAbrir, sin conocer crearGastoManual ni disparar navegación (Req. 1.2)', () => {
    const onAbrir = vi.fn()
    render(<BotonAgregarGastoFlotante onAbrir={onAbrir} />)

    fireEvent.click(screen.getByTestId('fab-nuevo-gasto'))

    expect(onAbrir).toHaveBeenCalledTimes(1)
  })
})
