import { InngestTestEngine, mockCtx } from '@inngest/test'
import { describe, expect, it, vi } from 'vitest'
import { crearFuncionIngestarAvisos } from '@/workflow/ingestarAvisos'
import type { ClienteGmail } from '@/infra/gmail/clienteGmail'

const REMITENTE_CONFIGURADO = 'no-responder@banco-ejemplo.com.ar'

// `@inngest/test` mockea automáticamente `step.run`, pero no `step.sendEvent`: enviar un evento es
// en sí mismo el efecto de red, así que sin este override intentaría publicar contra la API real de
// Inngest (documentado como limitación conocida del paquete). Se reemplaza con un espía propio sobre
// el `ctx` ya mockeado (`mockCtx`), extensión documentada oficialmente por `@inngest/test` — no es un
// harness propio, es la forma soportada de personalizar un colaborador puntual.
function crearMotorDeTest(funcion: ConstructorParameters<typeof InngestTestEngine>[0]['function']) {
  return new InngestTestEngine({
    function: funcion,
    transformCtx: (ctx) => {
      const base = mockCtx(ctx)
      return {
        ...base,
        step: {
          ...base.step,
          sendEvent: vi.fn(async () => ({ ids: [] })),
        },
      }
    },
  })
}

function crearClienteGmailSimulado(ids: string[]): {
  cliente: ClienteGmail
  listarMensajesDe: ReturnType<typeof vi.fn>
} {
  const listarMensajesDe = vi.fn(async (_remitente: string, _desde: Date) => ids)
  const cliente: ClienteGmail = {
    listarMensajesDe,
    traerMensajeCrudo: async () => {
      throw new Error('ingestarAvisos no debería traer el mensaje completo: solo descubre y emite')
    },
  }
  return { cliente, listarMensajesDe }
}

describe('ingestarAvisos', () => {
  it('emite un evento aviso/recibido por cada identificador que devuelve listarMensajesDe', async () => {
    const { cliente } = crearClienteGmailSimulado(['m1', 'm2', 'm3'])
    const funcion = crearFuncionIngestarAvisos({
      clienteGmail: cliente,
      remitenteConfigurado: REMITENTE_CONFIGURADO,
      obtenerDesde: () => new Date('2026-08-01T00:00:00.000Z'),
    })
    const t = crearMotorDeTest(funcion)

    const { ctx, result } = await t.execute()

    expect(result).toEqual({ cantidadEmitida: 3 })
    expect(ctx.step.sendEvent).toHaveBeenCalledTimes(1)
    const [, eventosEnviados] = (ctx.step.sendEvent as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown,
      Array<{ name: string; data: { gmailMessageId: string } }>,
    ]
    expect(eventosEnviados).toHaveLength(3)
    expect(eventosEnviados.map((e) => e.name)).toEqual(['aviso/recibido', 'aviso/recibido', 'aviso/recibido'])
    expect(eventosEnviados.map((e) => e.data.gmailMessageId).sort()).toEqual(['m1', 'm2', 'm3'])
  })

  it('llama a listarMensajesDe con el remitente configurado como parámetro de remitente', async () => {
    const { cliente, listarMensajesDe } = crearClienteGmailSimulado([])
    const funcion = crearFuncionIngestarAvisos({
      clienteGmail: cliente,
      remitenteConfigurado: REMITENTE_CONFIGURADO,
      obtenerDesde: () => new Date('2026-08-01T00:00:00.000Z'),
    })
    const t = crearMotorDeTest(funcion)

    await t.execute()

    expect(listarMensajesDe).toHaveBeenCalledTimes(1)
    expect(listarMensajesDe).toHaveBeenCalledWith(REMITENTE_CONFIGURADO, expect.any(Date))
  })

  it('sin identificadores, no emite ningún evento', async () => {
    const { cliente } = crearClienteGmailSimulado([])
    const funcion = crearFuncionIngestarAvisos({
      clienteGmail: cliente,
      remitenteConfigurado: REMITENTE_CONFIGURADO,
      obtenerDesde: () => new Date('2026-08-01T00:00:00.000Z'),
    })
    const t = crearMotorDeTest(funcion)

    const { ctx, result } = await t.execute()

    expect(result).toEqual({ cantidadEmitida: 0 })
    expect(ctx.step.sendEvent).not.toHaveBeenCalled()
  })
})
