import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SolicitudRedaccion } from '@/infra/ia/redactarHallazgo'

const crearMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: crearMock },
    })),
  }
})

// Import dinámico posterior al mock (el mock de vi.mock se hoistea, así que este import ya ve el doble).
const { crearClienteRedaccionHttp } = await import('@/infra/ia/clienteRedaccionHttp')

function crearBloqueToolUse(input: unknown) {
  return {
    type: 'tool_use' as const,
    id: 'toolu_1',
    name: 'redactar_hallazgo',
    input,
  }
}

describe('crearClienteRedaccionHttp', () => {
  beforeEach(() => {
    crearMock.mockReset()
  })

  it('llama a messages.create con system rioplatense y tool_choice forzado a redactar_hallazgo', async () => {
    crearMock.mockResolvedValue({
      content: [crearBloqueToolUse({ texto: 'texto', recomendacionTexto: 'recomendacion' })],
    })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')
    const solicitud: SolicitudRedaccion = {
      tipo: 'comercioRecurrente',
      datos: { comercio: 'STARBUCKS', cantidadGastos: 5 },
    }

    await cliente.redactar(solicitud)

    expect(crearMock).toHaveBeenCalledTimes(1)
    const argumentos = crearMock.mock.calls[0]![0]

    expect(argumentos.model).toBe('claude-sonnet-5')
    expect(typeof argumentos.system).toBe('string')
    expect(argumentos.system).toMatch(/rioplatens|vos|che/i)
    expect(argumentos.tool_choice).toEqual({ type: 'tool', name: 'redactar_hallazgo' })
    expect(argumentos.tools).toHaveLength(1)
    expect(argumentos.tools[0].name).toBe('redactar_hallazgo')
    expect(argumentos.tools[0].input_schema.required).toEqual(expect.arrayContaining(['texto', 'recomendacionTexto']))
  })

  it('devuelve { texto, recomendacionTexto } extraídos del bloque tool_use', async () => {
    crearMock.mockResolvedValue({
      content: [crearBloqueToolUse({ texto: 'Gastaste bastante en STARBUCKS.', recomendacionTexto: 'Bajale un cambio.' })],
    })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')
    const resultado = await cliente.redactar({
      tipo: 'comercioRecurrente',
      datos: { comercio: 'STARBUCKS', cantidadGastos: 5 },
    })

    expect(resultado).toEqual({
      texto: 'Gastaste bastante en STARBUCKS.',
      recomendacionTexto: 'Bajale un cambio.',
    })
  })

  it('lanza si Claude no devuelve ningún bloque tool_use', async () => {
    crearMock.mockResolvedValue({ content: [{ type: 'text', text: 'no puedo ayudarte con eso' }] })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')

    await expect(
      cliente.redactar({ tipo: 'comercioRecurrente', datos: { comercio: 'STARBUCKS' } }),
    ).rejects.toThrow()
  })

  it('lanza si el tool_use trae texto con un tipo distinto de string', async () => {
    crearMock.mockResolvedValue({
      content: [crearBloqueToolUse({ texto: 123, recomendacionTexto: 'recomendacion' })],
    })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')

    await expect(
      cliente.redactar({ tipo: 'comercioRecurrente', datos: { comercio: 'STARBUCKS' } }),
    ).rejects.toThrow()
  })

  it('lanza si el tool_use trae recomendacionTexto con un tipo distinto de string', async () => {
    crearMock.mockResolvedValue({
      content: [crearBloqueToolUse({ texto: 'texto', recomendacionTexto: null })],
    })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')

    await expect(
      cliente.redactar({ tipo: 'comercioRecurrente', datos: { comercio: 'STARBUCKS' } }),
    ).rejects.toThrow()
  })

  it('el mensaje de usuario se arma solo a partir de solicitud.tipo y solicitud.datos, sin datos adicionales del sistema', async () => {
    crearMock.mockResolvedValue({
      content: [crearBloqueToolUse({ texto: 'texto', recomendacionTexto: 'recomendacion' })],
    })

    const cliente = crearClienteRedaccionHttp('api-key-de-prueba')
    const solicitud: SolicitudRedaccion = {
      tipo: 'ritmoGasto',
      datos: { categoria: 'Comida', montoActual: 15000, montoPromedio: 9000 },
    }

    await cliente.redactar(solicitud)

    const argumentos = crearMock.mock.calls[0]![0]
    const mensajeUsuario = argumentos.messages[0].content as string

    expect(mensajeUsuario).toContain('ritmoGasto')
    expect(mensajeUsuario).toContain('categoria')
    expect(mensajeUsuario).toContain('Comida')
    expect(mensajeUsuario).toContain('montoActual')
    expect(mensajeUsuario).toContain('15000')
    expect(mensajeUsuario).toContain('montoPromedio')
    expect(mensajeUsuario).toContain('9000')

    // Nada de fecha actual ni de otros hallazgos: el mensaje solo puede tener las claves de `datos`
    // más la etiqueta de `tipo` — no debe filtrar campos ajenos a la solicitud.
    expect(mensajeUsuario).not.toMatch(/otros hallazgos|fecha actual/i)
  })
})
