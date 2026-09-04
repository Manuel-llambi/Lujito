// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATEGORIAS_MANUAL } from '@/dominio/categorizacion/categorizarPorReglas'

const crearGastoManualMock = vi.fn()

// Mock del Server Action real (T4), no un auto-mock del propio módulo bajo test: `ModalNuevoGasto`
// importa `crearGastoManual` de `@/app/dashboard/crearGastoManualAction`, un módulo hermano — mismo
// espíritu que `clienteRedaccionHttp.test.ts` mockeando el SDK de Anthropic, aplicado acá a la
// Server Action en vez de a un SDK externo. Necesario porque `ModalNuevoGasto` no recibe la acción
// por props (la firma la fija `design.md`: solo `abierto`/`onCerrar`) y este test necesita controlar
// qué devuelve `useActionState` en cada caso (error / éxito) sin tocar una base Postgres real.
vi.mock('@/app/dashboard/crearGastoManualAction', () => ({
  crearGastoManual: (...args: unknown[]) => crearGastoManualMock(...args),
}))

const { ModalNuevoGasto } = await import('@/app/components/ModalNuevoGasto')

function hoyComoInputDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

beforeEach(() => {
  crearGastoManualMock.mockReset()
})

describe('ModalNuevoGasto — contrato de render (soporte de 1.1/1.2, T6)', () => {
  it('con abierto=false, no renderiza ningún campo del formulario', () => {
    render(<ModalNuevoGasto abierto={false} onCerrar={vi.fn()} />)

    expect(screen.queryByTestId('modal-nuevo-gasto')).not.toBeInTheDocument()
    expect(screen.queryByTestId('monto-nuevo-gasto')).not.toBeInTheDocument()
    expect(screen.queryByTestId('comercio-nuevo-gasto')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fecha-nuevo-gasto')).not.toBeInTheDocument()
    expect(screen.queryByTestId('categoria-nuevo-gasto')).not.toBeInTheDocument()
  })
})

describe('ModalNuevoGasto — valores por defecto (Req. 2.3, 2.4, 2.5)', () => {
  it('el input de fecha trae la fecha de hoy como defaultValue, en formato AAAA-MM-DD (Req. 2.3)', () => {
    render(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    expect(screen.getByTestId('fecha-nuevo-gasto')).toHaveValue(hoyComoInputDate())
  })

  it('el input oculto de categoría no trae ninguna categoría preseleccionada que permita un envío válido sin elegir (Req. 2.4)', () => {
    render(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    const hidden = screen.getByTestId('categoria-nuevo-gasto') as HTMLInputElement
    expect(hidden.value).toBe('')
  })

  it('los chips de categoría son exactamente CATEGORIAS_MANUAL, sin Sin categorizar ni Descartar (Req. 2.5)', () => {
    render(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    for (const categoria of CATEGORIAS_MANUAL) {
      expect(screen.getByTestId(`categoria-chip-${categoria}`)).toBeInTheDocument()
    }
    expect(screen.queryByTestId('categoria-chip-Sin categorizar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('categoria-chip-Descartar')).not.toBeInTheDocument()
  })

  it('al clickear un chip de categoría, actualiza el input oculto que viaja en el FormData (Req. 2.4, 2.5)', () => {
    render(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    fireEvent.click(screen.getByTestId(`categoria-chip-${CATEGORIAS_MANUAL[0]}`))

    expect(screen.getByTestId('categoria-nuevo-gasto')).toHaveValue(CATEGORIAS_MANUAL[0])
  })
})

describe('ModalNuevoGasto — cancelar (Req. 1.3)', () => {
  it('al cancelar, invoca onCerrar y no invoca crearGastoManual', () => {
    const onCerrar = vi.fn()
    render(<ModalNuevoGasto abierto={true} onCerrar={onCerrar} />)

    fireEvent.change(screen.getByTestId('comercio-nuevo-gasto'), { target: { value: 'Kiosco tipeado' } })
    fireEvent.click(screen.getByTestId('cancelar-nuevo-gasto'))

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(crearGastoManualMock).not.toHaveBeenCalled()
  })

  it('al reabrir el modal tras cancelar, los campos vuelven a sus valores por defecto, no a lo tipeado antes', () => {
    const { rerender } = render(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    fireEvent.change(screen.getByTestId('comercio-nuevo-gasto'), { target: { value: 'Kiosco tipeado' } })
    rerender(<ModalNuevoGasto abierto={false} onCerrar={vi.fn()} />)
    rerender(<ModalNuevoGasto abierto={true} onCerrar={vi.fn()} />)

    expect(screen.getByTestId('comercio-nuevo-gasto')).toHaveValue('')
  })
})

describe('ModalNuevoGasto — errores inline (Req. 3.1, 3.2, 3.3)', () => {
  it.each([
    ['monto inválido', 'Ingresá un monto válido y mayor a cero, en formato ARS (ej. $1.234,56).'],
    ['comercio vacío', 'Ingresá el nombre del comercio.'],
    ['categoría ausente', 'Elegí una categoría (Salidas, Comida o Extras).'],
  ])('con un error de %s, lo muestra inline y no cierra el modal', async (_caso, mensajeError) => {
    crearGastoManualMock.mockResolvedValueOnce({ error: mensajeError })
    const onCerrar = vi.fn()
    render(<ModalNuevoGasto abierto={true} onCerrar={onCerrar} />)

    fireEvent.click(screen.getByTestId('guardar-nuevo-gasto'))

    await waitFor(() => expect(screen.getByTestId('error-nuevo-gasto')).toHaveTextContent(mensajeError))
    expect(onCerrar).not.toHaveBeenCalled()
    expect(screen.getByTestId('modal-nuevo-gasto')).toBeInTheDocument()
  })
})

describe('ModalNuevoGasto — cierre tras éxito (Req. 5.1)', () => {
  it('cuando el envío resuelve sin error (estado pasa a null tras un submit), invoca onCerrar', async () => {
    crearGastoManualMock.mockResolvedValueOnce(null)
    const onCerrar = vi.fn()
    render(<ModalNuevoGasto abierto={true} onCerrar={onCerrar} />)

    fireEvent.click(screen.getByTestId('guardar-nuevo-gasto'))

    await waitFor(() => expect(onCerrar).toHaveBeenCalledTimes(1))
  })

  it('al montar con abierto=true sin ningún submit previo, no invoca onCerrar aunque el estado inicial de useActionState sea null', async () => {
    const onCerrar = vi.fn()
    render(<ModalNuevoGasto abierto={true} onCerrar={onCerrar} />)

    // Da tiempo a que un efecto mal escrito (que confunda el null inicial con un éxito) se dispare.
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onCerrar).not.toHaveBeenCalled()
    expect(crearGastoManualMock).not.toHaveBeenCalled()
  })
})
