// @vitest-environment jsdom
import Decimal from 'decimal.js'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ListaBandeja } from '@/app/components/ListaBandeja'
import type { Gasto } from '@/infra/db/repositorioGastos'

function crearGastoPendiente(parcial: Partial<Gasto> = {}): Gasto {
  return {
    id: 'gasto-1',
    emailId: 'email-1',
    montoTotal: new Decimal('1234.5'),
    moneda: 'ARS',
    comercio: 'WWWAYSACOMAR',
    fechaGasto: new Date('2026-08-24T14:14:00.000Z'),
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '9344',
    cuotasTotal: 1,
    estado: 'categorizado',
    categoria: 'Comida',
    categoriaOrigen: 'ia',
    categoriaJustificacion: 'El nombre del comercio coincide con una cadena de comida conocida',
    confirmadoEn: null,
    ...parcial,
  }
}

describe('ListaBandeja — Req. 7.2, 7.10', () => {
  it('lista un gasto pendiente con sus cinco datos: comercio, monto, fecha, categoría propuesta y justificación', () => {
    const gasto = crearGastoPendiente()

    render(<ListaBandeja gastos={[gasto]} />)

    const fila = screen.getByTestId('gasto-gasto-1')
    expect(within(fila).getByTestId('comercio-gasto-1')).toHaveTextContent('WWWAYSACOMAR')
    expect(within(fila).getByTestId('monto-gasto-1')).toHaveTextContent('1234.50')
    expect(within(fila).getByTestId('fecha-gasto-1')).toHaveTextContent('2026-08-24')
    expect(within(fila).getByTestId('categoria-propuesta-gasto-1')).toHaveTextContent('Comida')
    expect(within(fila).getByTestId('justificacion-gasto-1')).toHaveTextContent(
      'El nombre del comercio coincide con una cadena de comida conocida',
    )
  })

  it('la lista renderizada es exactamente la que recibe por props: no agrega ni quita gastos', () => {
    const gastos = [
      crearGastoPendiente({ id: 'gasto-1' }),
      crearGastoPendiente({ id: 'gasto-2' }),
      crearGastoPendiente({ id: 'gasto-3' }),
    ]

    render(<ListaBandeja gastos={gastos} />)

    expect(screen.getAllByTestId(/^gasto-gasto-\d$/)).toHaveLength(3)
  })

  it('un gasto pendiente con categoría Sin categorizar se lista con sus otros cuatro datos, sin renderizar Sin categorizar como categoría propuesta (Req. 7.10)', () => {
    const gasto = crearGastoPendiente({ categoria: 'Sin categorizar', categoriaJustificacion: null })

    render(<ListaBandeja gastos={[gasto]} />)

    const fila = screen.getByTestId('gasto-gasto-1')
    expect(within(fila).getByTestId('comercio-gasto-1')).toHaveTextContent('WWWAYSACOMAR')
    expect(within(fila).getByTestId('monto-gasto-1')).toHaveTextContent('1234.50')
    expect(within(fila).getByTestId('fecha-gasto-1')).toHaveTextContent('2026-08-24')
    expect(within(fila).queryByTestId('categoria-propuesta-gasto-1')).not.toBeInTheDocument()
  })
})

describe('ListaBandeja — confirmar (Req. 7.3, T49)', () => {
  it('al confirmar, envía la MISMA categoría que ya mostraba la fila, nunca una distinta', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Comida' })
    const onConfirmar = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onConfirmar={onConfirmar} />)
    fireEvent.click(screen.getByTestId('confirmar-gasto-1'))

    // React 19 invoca `onConfirmar` con el FormData del <form> al enviarlo.
    await vi.waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1))
    const formData = onConfirmar.mock.calls[0]?.[0] as FormData
    expect(formData.get('id')).toBe('gasto-1')
    expect(formData.get('categoria')).toBe('Comida')
  })

  it('sin onConfirmar, no renderiza ningún botón de confirmar (sigue siendo el componente de solo lectura de T48)', () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1' })

    render(<ListaBandeja gastos={[gasto]} />)

    expect(screen.queryByTestId('confirmar-gasto-1')).not.toBeInTheDocument()
  })

  it('un gasto con categoría Sin categorizar no ofrece confirmar — no hay una propuesta que confirmar (Req. 7.10)', () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Sin categorizar' })
    const onConfirmar = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onConfirmar={onConfirmar} />)

    expect(screen.queryByTestId('confirmar-gasto-1')).not.toBeInTheDocument()
  })
})

describe('ListaBandeja — corregir (Req. 7.4, 7.10, T50)', () => {
  it('al elegir una categoría y corregir, envía la categoría ELEGIDA, no la que la fila proponía', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Extras' })
    const onCorregir = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onCorregir={onCorregir} />)
    fireEvent.change(screen.getByTestId('categoria-select-gasto-1'), { target: { value: 'Salidas' } })
    fireEvent.click(screen.getByTestId('corregir-gasto-1'))

    await vi.waitFor(() => expect(onCorregir).toHaveBeenCalledTimes(1))
    const formData = onCorregir.mock.calls[0]?.[0] as FormData
    expect(formData.get('id')).toBe('gasto-1')
    expect(formData.get('categoria')).toBe('Salidas') // elegida, no 'Extras'
  })

  it('el selector ofrece exactamente las tres categorías inferibles, nunca Sin categorizar como opción', () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1' })

    render(<ListaBandeja gastos={[gasto]} onCorregir={vi.fn()} />)

    const opciones = within(screen.getByTestId('categoria-select-gasto-1'))
      .getAllByRole('option')
      .map((opcion) => opcion.getAttribute('value'))
      .filter((valor) => valor !== '')
    expect(opciones.sort()).toEqual(['Comida', 'Extras', 'Salidas'])
  })

  it('un gasto con categoría Sin categorizar SÍ ofrece corregir — es su único camino a salir de la bandeja (Req. 7.10)', () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Sin categorizar' })

    render(<ListaBandeja gastos={[gasto]} onCorregir={vi.fn()} />)

    expect(screen.getByTestId('corregir-gasto-1')).toBeInTheDocument()
  })

  it('sin onCorregir, no renderiza ningún selector ni botón de corregir', () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1' })

    render(<ListaBandeja gastos={[gasto]} />)

    expect(screen.queryByTestId('corregir-gasto-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('categoria-select-gasto-1')).not.toBeInTheDocument()
  })
})

describe('ListaBandeja — ofrecimiento de crear regla (Req. 7.5, 7.7, T51/T52)', () => {
  it('al confirmar con el checkbox marcado, el FormData lleva comercio y crearRegla en "true"', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Comida', comercio: 'COMERCIO-X' })
    const onConfirmar = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onConfirmar={onConfirmar} />)
    fireEvent.click(screen.getByTestId('crear-regla-confirmar-gasto-1'))
    fireEvent.click(screen.getByTestId('confirmar-gasto-1'))

    await vi.waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1))
    const formData = onConfirmar.mock.calls[0]?.[0] as FormData
    expect(formData.get('comercio')).toBe('COMERCIO-X')
    expect(formData.get('crearRegla')).toBe('true')
  })

  it('al confirmar sin marcar el checkbox (rechazo, Req. 7.7), el FormData no lleva crearRegla', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', categoria: 'Comida' })
    const onConfirmar = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onConfirmar={onConfirmar} />)
    fireEvent.click(screen.getByTestId('confirmar-gasto-1'))

    await vi.waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1))
    const formData = onConfirmar.mock.calls[0]?.[0] as FormData
    expect(formData.get('crearRegla')).toBeNull()
  })

  it('al corregir con el checkbox marcado, el FormData lleva comercio y crearRegla en "true"', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1', comercio: 'COMERCIO-Y' })
    const onCorregir = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onCorregir={onCorregir} />)
    fireEvent.change(screen.getByTestId('categoria-select-gasto-1'), { target: { value: 'Salidas' } })
    fireEvent.click(screen.getByTestId('crear-regla-corregir-gasto-1'))
    fireEvent.click(screen.getByTestId('corregir-gasto-1'))

    await vi.waitFor(() => expect(onCorregir).toHaveBeenCalledTimes(1))
    const formData = onCorregir.mock.calls[0]?.[0] as FormData
    expect(formData.get('comercio')).toBe('COMERCIO-Y')
    expect(formData.get('crearRegla')).toBe('true')
  })

  it('al corregir sin marcar el checkbox (rechazo, Req. 7.7), el FormData no lleva crearRegla', async () => {
    const gasto = crearGastoPendiente({ id: 'gasto-1' })
    const onCorregir = vi.fn()

    render(<ListaBandeja gastos={[gasto]} onCorregir={onCorregir} />)
    fireEvent.change(screen.getByTestId('categoria-select-gasto-1'), { target: { value: 'Salidas' } })
    fireEvent.click(screen.getByTestId('corregir-gasto-1'))

    await vi.waitFor(() => expect(onCorregir).toHaveBeenCalledTimes(1))
    const formData = onCorregir.mock.calls[0]?.[0] as FormData
    expect(formData.get('crearRegla')).toBeNull()
  })
})
