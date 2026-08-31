import { describe, expect, it } from 'vitest'
import {
  AccesoRevocadoError,
  crearClienteGmail,
  PermisoRevocadoError,
  TokenVencidoError,
  type CredencialesGmail,
  type TransporteGmail,
} from '@/infra/gmail/clienteGmail'
import type { RepositorioAccesoGmail } from '@/infra/db/repositorioAccesoGmail'

// Credenciales y renovador neutros para los tests de T24, que no ejercitan la renovación: el token
// inicial siempre es válido para el buzón simulado de esa sección, y el renovador explota si se lo
// invoca — la misma guarda que T25 formaliza como criterio propio.
const CREDENCIALES_NEUTRAS: CredencialesGmail = { tokenAcceso: 'token-valido', tokenRefresco: 'no-deberia-usarse' }
const renovadorQueFalla = async (): Promise<string> => {
  throw new Error('no debería renovarse: el token inicial de estos tests siempre es válido')
}

/** Doble en memoria de `RepositorioAccesoGmail` (T53) que nunca informa revocación: neutro para los
 * tests de T24 y T25, que no ejercitan el latch de acceso revocado. */
function repositorioNoRevocado(): RepositorioAccesoGmail {
  return {
    marcarRevocado: async () => {},
    estaRevocado: async () => false,
  }
}

/** Doble en memoria de `RepositorioAccesoGmail` que registra las llamadas a `marcarRevocado` y deja
 * leer/mutar el estado de revocación, para los tests de T26 (latch y "una sola vez"). */
function crearRepositorioAccesoGmailEnMemoria(revocadoInicial = false): {
  repositorio: RepositorioAccesoGmail
  marcarRevocadoInvocaciones: string[]
  estaRevocado: () => boolean
} {
  let revocado = revocadoInicial
  const marcarRevocadoInvocaciones: string[] = []
  const repositorio: RepositorioAccesoGmail = {
    async marcarRevocado(detalle) {
      marcarRevocadoInvocaciones.push(detalle)
      revocado = true
    },
    async estaRevocado() {
      return revocado
    },
  }
  return { repositorio, marcarRevocadoInvocaciones, estaRevocado: () => revocado }
}

// Contenido realista: acentos codificados quoted-printable (contenido, no formato de cable), plegado
// de headers y la línea en blanco que separa headers de cuerpo — la misma forma que T16 fijó para 1.1.
const HEADERS_CRUDOS = [
  'From: no-responder@banco-ejemplo.com.ar',
  'Subject: Pagaste $2.571,30',
  'Content-Type: text/html;\r\n\tcharset="UTF-8"',
  'Content-Transfer-Encoding: quoted-printable',
].join('\r\n')

const CUERPO_CRUDO = ['<html><body>', 'Comprob=', '=C3=B3 la compra en "Panader=C3=ADa"', '</body></html>'].join(
  '\r\n',
)

function crearRawBase64Url(headers: string, cuerpo: string): string {
  return Buffer.from(`${headers}\r\n\r\n${cuerpo}`, 'utf-8').toString('base64url')
}

interface MensajeSimulado {
  id: string
  remitente: string
  internalDate: number
  raw: string
}

/**
 * Casilla simulada mínima que HONRA la consulta que le manda el adaptador (parsea `q` y filtra),
 * en vez de devolver la respuesta que el test espera. Es lo que hace que la aserción de 1.7 falle
 * de verdad si `ClienteGmail` deja de restringir por remitente.
 */
function crearBuzonSimulado(mensajes: MensajeSimulado[]): {
  transporte: TransporteGmail
  consultasRecibidas: string[]
} {
  const consultasRecibidas: string[] = []
  const transporte: TransporteGmail = {
    async listarMensajes({ q }) {
      consultasRecibidas.push(q)
      const matchFrom = /from:(\S+)/.exec(q)
      const matchAfter = /after:(\d+)/.exec(q)
      if (!matchFrom) {
        return { mensajes: [] }
      }
      const remitente = matchFrom[1]
      const despuesDe = matchAfter ? Number(matchAfter[1]) * 1000 : 0
      const coincidentes = mensajes.filter((m) => m.remitente === remitente && m.internalDate >= despuesDe)
      return { mensajes: coincidentes.map((m) => ({ id: m.id })) }
    },
    async obtenerMensaje(id) {
      const mensaje = mensajes.find((m) => m.id === id)
      if (!mensaje) {
        throw new Error(`mensaje ${id} no existe en el buzón simulado`)
      }
      return { raw: mensaje.raw, internalDate: String(mensaje.internalDate) }
    },
  }
  return { transporte, consultasRecibidas }
}

/**
 * Transporte que VALIDA el token que recibe (Decision log de T25): rechaza con `TokenVencidoError`
 * cualquier llamada que no traiga `tokenValido`, y aplica la misma lógica de `crearBuzonSimulado`
 * para el resto. Registra los tokens recibidos en orden, para poder asertar que el reintento viaja
 * con el token nuevo y no con el vencido.
 */
function crearTransporteQueValidaToken(
  tokenValido: string,
  mensajes: MensajeSimulado[],
): { transporte: TransporteGmail; tokensRecibidos: string[] } {
  const tokensRecibidos: string[] = []
  const transporte: TransporteGmail = {
    async listarMensajes({ q, token }) {
      tokensRecibidos.push(token)
      if (token !== tokenValido) {
        throw new TokenVencidoError('token vencido')
      }
      const matchFrom = /from:(\S+)/.exec(q)
      if (!matchFrom) {
        return { mensajes: [] }
      }
      const remitente = matchFrom[1]
      return { mensajes: mensajes.filter((m) => m.remitente === remitente).map((m) => ({ id: m.id })) }
    },
    async obtenerMensaje(id, token) {
      tokensRecibidos.push(token)
      if (token !== tokenValido) {
        throw new TokenVencidoError('token vencido')
      }
      const mensaje = mensajes.find((m) => m.id === id)
      if (!mensaje) {
        throw new Error(`mensaje ${id} no existe en el buzón simulado`)
      }
      return { raw: mensaje.raw, internalDate: String(mensaje.internalDate) }
    },
  }
  return { transporte, tokensRecibidos }
}

describe('ClienteGmail.listarMensajesDe', () => {
  it('devuelve exactamente los ids del remitente configurado, excluyendo otros remitentes', async () => {
    const { transporte } = crearBuzonSimulado([
      { id: 'm1', remitente: 'no-responder@banco-ejemplo.com.ar', internalDate: Date.now(), raw: '' },
      { id: 'm2', remitente: 'otro@spam.com', internalDate: Date.now(), raw: '' },
      { id: 'm3', remitente: 'no-responder@banco-ejemplo.com.ar', internalDate: Date.now(), raw: '' },
    ])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    const ids = await cliente.listarMensajesDe('no-responder@banco-ejemplo.com.ar', new Date(0))

    expect([...ids].sort()).toEqual(['m1', 'm3'])
  })

  it('restringe por remitente en la consulta que le manda al transporte, no como texto libre', async () => {
    const { transporte, consultasRecibidas } = crearBuzonSimulado([])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    await cliente.listarMensajesDe('no-responder@banco-ejemplo.com.ar', new Date('2026-08-01T00:00:00.000Z'))

    expect(consultasRecibidas).toHaveLength(1)
    expect(consultasRecibidas[0]).toMatch(/(^|\s)from:no-responder@banco-ejemplo\.com\.ar(\s|$)/)
  })

  it('traslada "desde" como cota temporal inferior: excluye mensajes anteriores', async () => {
    const corte = new Date('2026-08-01T00:00:00.000Z')
    const { transporte } = crearBuzonSimulado([
      { id: 'antes', remitente: 'x@banco.com', internalDate: corte.getTime() - 1000, raw: '' },
      { id: 'despues', remitente: 'x@banco.com', internalDate: corte.getTime() + 1000, raw: '' },
    ])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    const ids = await cliente.listarMensajesDe('x@banco.com', corte)

    expect(ids).toEqual(['despues'])
  })
})

describe('ClienteGmail.traerMensajeCrudo', () => {
  it('devuelve headersCrudos completo, byte a byte idéntico al del mensaje entregado', async () => {
    const raw = crearRawBase64Url(HEADERS_CRUDOS, CUERPO_CRUDO)
    const { transporte } = crearBuzonSimulado([{ id: 'm1', remitente: 'x', internalDate: Date.now(), raw }])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    const resultado = await cliente.traerMensajeCrudo('m1')

    expect(resultado.headersCrudos).toBe(HEADERS_CRUDOS)
  })

  it('devuelve el cuerpo byte a byte idéntico, con quoted-printable sin decodificar', async () => {
    const raw = crearRawBase64Url(HEADERS_CRUDOS, CUERPO_CRUDO)
    const { transporte } = crearBuzonSimulado([{ id: 'm1', remitente: 'x', internalDate: Date.now(), raw }])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    const resultado = await cliente.traerMensajeCrudo('m1')

    expect(resultado.cuerpo).toBe(CUERPO_CRUDO)
    expect(resultado.cuerpo).toContain('Comprob=\r\n') // salto suave sin resolver (Req. 2.1 es de T1/T30)
    expect(resultado.cuerpo).toContain('=C3=B3') // secuencia quoted-printable sin resolver
  })

  it('decodifica la codificación de transporte (base64url del MIME) y mapea los campos consultables', async () => {
    const internalDate = new Date('2026-08-24T14:20:00.000Z').getTime()
    const raw = crearRawBase64Url(HEADERS_CRUDOS, CUERPO_CRUDO)
    const { transporte } = crearBuzonSimulado([{ id: 'm1', remitente: 'x', internalDate, raw }])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorioNoRevocado())

    const resultado = await cliente.traerMensajeCrudo('m1')

    expect(resultado.gmailMessageId).toBe('m1')
    expect(resultado.remitente).toBe('no-responder@banco-ejemplo.com.ar')
    expect(resultado.asunto).toBe('Pagaste $2.571,30')
    expect(resultado.recibidoEn.getTime()).toBe(internalDate)
  })
})

describe('ClienteGmail: renovación de token vencido y reintento (T25)', () => {
  const mensajeSimulado: MensajeSimulado = {
    id: 'm1',
    remitente: 'no-responder@banco-ejemplo.com.ar',
    internalDate: new Date('2026-08-24T14:20:00.000Z').getTime(),
    raw: crearRawBase64Url(HEADERS_CRUDOS, CUERPO_CRUDO),
  }

  it('camino feliz: renueva, reintenta con el token nuevo y devuelve el resultado esperado', async () => {
    const { transporte, tokensRecibidos } = crearTransporteQueValidaToken('token-nuevo', [mensajeSimulado])
    const renovadorInvocaciones: string[] = []
    const cliente = crearClienteGmail(
      transporte,
      { tokenAcceso: 'token-viejo', tokenRefresco: 'refresco-1' },
      async (tokenRefresco) => {
        renovadorInvocaciones.push(tokenRefresco)
        return 'token-nuevo'
      },
      repositorioNoRevocado(),
    )

    const resultado = await cliente.traerMensajeCrudo('m1')

    // La operación devuelve su resultado, no solo "no lanzó" (la mitad que se olvida del criterio).
    expect(resultado.gmailMessageId).toBe('m1')
    expect(resultado.remitente).toBe('no-responder@banco-ejemplo.com.ar')

    // La segunda llamada (el reintento) viaja con el token nuevo, no con el vencido.
    expect(tokensRecibidos).toEqual(['token-viejo', 'token-nuevo'])

    // El renovador se invoca exactamente una vez, con el token de refresco.
    expect(renovadorInvocaciones).toEqual(['refresco-1'])
  })

  it('la renovación cubre las dos operaciones de la interfaz, no solo una', async () => {
    const { transporte, tokensRecibidos } = crearTransporteQueValidaToken('token-nuevo', [mensajeSimulado])
    const cliente = crearClienteGmail(
      transporte,
      { tokenAcceso: 'token-viejo', tokenRefresco: 'refresco-1' },
      async () => 'token-nuevo',
      repositorioNoRevocado(),
    )

    const ids = await cliente.listarMensajesDe('no-responder@banco-ejemplo.com.ar', new Date(0))

    expect(ids).toEqual(['m1'])
    expect(tokensRecibidos).toEqual(['token-viejo', 'token-nuevo'])
  })

  it('guarda del token válido: si el token inicial es válido, el renovador nunca se invoca', async () => {
    const { transporte, tokensRecibidos } = crearTransporteQueValidaToken('token-valido', [mensajeSimulado])
    const cliente = crearClienteGmail(
      transporte,
      { tokenAcceso: 'token-valido', tokenRefresco: 'no-deberia-usarse' },
      renovadorQueFalla, // doble que explota: si se invoca, el test falla
      repositorioNoRevocado(),
    )

    const resultado = await cliente.traerMensajeCrudo('m1')

    expect(resultado.gmailMessageId).toBe('m1')
    expect(tokensRecibidos).toEqual(['token-valido'])
  })

  it('reintento acotado: si el token renovado también está vencido, propaga el error sin reintentar de nuevo', async () => {
    const { transporte, tokensRecibidos } = crearTransporteQueValidaToken('el-unico-valido', [mensajeSimulado])
    const renovadorInvocaciones: string[] = []
    const cliente = crearClienteGmail(
      transporte,
      { tokenAcceso: 'token-viejo', tokenRefresco: 'refresco-1' },
      async (tokenRefresco) => {
        renovadorInvocaciones.push(tokenRefresco)
        return 'token-tambien-vencido'
      },
      repositorioNoRevocado(),
    )

    await expect(cliente.traerMensajeCrudo('m1')).rejects.toThrow(TokenVencidoError)

    expect(renovadorInvocaciones).toEqual(['refresco-1']) // exactamente una vez, no un bucle
    expect(tokensRecibidos).toEqual(['token-viejo', 'token-tambien-vencido']) // exactamente dos llamadas al transporte
  })

  it('frontera con T26: un error que no es TokenVencidoError no dispara la renovación', async () => {
    const otroError = new Error('permiso retirado por el usuario') // señal distinta, no de esta tarea
    const transporte: TransporteGmail = {
      listarMensajes: async () => {
        throw otroError
      },
      obtenerMensaje: async () => {
        throw otroError
      },
    }
    const cliente = crearClienteGmail(
      transporte,
      { tokenAcceso: 'token-viejo', tokenRefresco: 'refresco-1' },
      renovadorQueFalla, // no debería invocarse: la señal no es de token vencido
      repositorioNoRevocado(),
    )

    await expect(cliente.traerMensajeCrudo('m1')).rejects.toThrow('permiso retirado por el usuario')
  })
})

describe('ClienteGmail: acceso revocado, sin reintentos y sin volver a llamar (T26)', () => {
  const mensajeSimulado: MensajeSimulado = {
    id: 'm1',
    remitente: 'no-responder@banco-ejemplo.com.ar',
    internalDate: new Date('2026-08-24T14:20:00.000Z').getTime(),
    raw: crearRawBase64Url(HEADERS_CRUDOS, CUERPO_CRUDO),
  }

  function transporteQuePermisoRevocado(invocaciones: { conteo: number }): TransporteGmail {
    return {
      listarMensajes: async () => {
        invocaciones.conteo++
        throw new PermisoRevocadoError('el usuario retiró el permiso de la app')
      },
      obtenerMensaje: async () => {
        invocaciones.conteo++
        throw new PermisoRevocadoError('el usuario retiró el permiso de la app')
      },
    }
  }

  function transporteQueExplota(): TransporteGmail {
    return {
      listarMensajes: async () => {
        throw new Error('no debería llamarse a Gmail: el acceso está revocado')
      },
      obtenerMensaje: async () => {
        throw new Error('no debería llamarse a Gmail: el acceso está revocado')
      },
    }
  }

  it('traerMensajeCrudo lanza AccesoRevocadoError, invoca el transporte una vez y nunca el renovador', async () => {
    const invocaciones = { conteo: 0 }
    const { repositorio, marcarRevocadoInvocaciones } = crearRepositorioAccesoGmailEnMemoria()
    const cliente = crearClienteGmail(
      transporteQuePermisoRevocado(invocaciones),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )

    await expect(cliente.traerMensajeCrudo('m1')).rejects.toThrow(AccesoRevocadoError)

    expect(invocaciones.conteo).toBe(1)
    expect(marcarRevocadoInvocaciones).toHaveLength(1)
  })

  it('listarMensajesDe lanza AccesoRevocadoError con las mismas cotas de invocación', async () => {
    const invocaciones = { conteo: 0 }
    const { repositorio, marcarRevocadoInvocaciones } = crearRepositorioAccesoGmailEnMemoria()
    const cliente = crearClienteGmail(
      transporteQuePermisoRevocado(invocaciones),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )

    await expect(cliente.listarMensajesDe('no-responder@banco-ejemplo.com.ar', new Date(0))).rejects.toThrow(
      AccesoRevocadoError,
    )

    expect(invocaciones.conteo).toBe(1)
    expect(marcarRevocadoInvocaciones).toHaveLength(1)
  })

  it('registra la revocación una sola vez, con el detalle del error recibido', async () => {
    const invocaciones = { conteo: 0 }
    const { repositorio, marcarRevocadoInvocaciones } = crearRepositorioAccesoGmailEnMemoria()
    const cliente = crearClienteGmail(
      transporteQuePermisoRevocado(invocaciones),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )

    await expect(cliente.traerMensajeCrudo('m1')).rejects.toThrow()

    expect(marcarRevocadoInvocaciones).toEqual(['el usuario retiró el permiso de la app'])
  })

  it('latch: tras la revocación, la llamada siguiente termina en AccesoRevocadoError sin tocar el transporte', async () => {
    const invocaciones = { conteo: 0 }
    const { repositorio } = crearRepositorioAccesoGmailEnMemoria()
    const cliente = crearClienteGmail(
      transporteQuePermisoRevocado(invocaciones),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )

    await expect(cliente.traerMensajeCrudo('m1')).rejects.toThrow(AccesoRevocadoError)
    expect(invocaciones.conteo).toBe(1)

    // El transporte se reemplaza por uno que falla el test si se lo invoca: la llamada siguiente no
    // debe tocarlo, porque el latch ya sabe que el acceso está revocado.
    const clienteConTransporteQueExplota = crearClienteGmail(
      transporteQueExplota(),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )
    await expect(clienteConTransporteQueExplota.traerMensajeCrudo('m1')).rejects.toThrow(AccesoRevocadoError)
  })

  it('latch persistente: una instancia nueva de ClienteGmail sobre el mismo registro también rechaza sin llamar', async () => {
    const invocaciones = { conteo: 0 }
    const { repositorio } = crearRepositorioAccesoGmailEnMemoria()
    const primerCliente = crearClienteGmail(
      transporteQuePermisoRevocado(invocaciones),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )
    await expect(primerCliente.traerMensajeCrudo('m1')).rejects.toThrow(AccesoRevocadoError)

    // Instancia nueva de ClienteGmail (simula el reinicio de proceso entre corridas de Inngest),
    // sobre el mismo repositorio y con un transporte que explota si se lo invoca.
    const clienteReiniciado = crearClienteGmail(
      transporteQueExplota(),
      { tokenAcceso: 'token', tokenRefresco: 'refresco' },
      renovadorQueFalla,
      repositorio,
    )

    await expect(clienteReiniciado.traerMensajeCrudo('m1')).rejects.toThrow(AccesoRevocadoError)
  })

  it('restablecimiento: con el acceso no revocado, la operación sale al transporte y devuelve su resultado', async () => {
    const { repositorio } = crearRepositorioAccesoGmailEnMemoria(false) // nunca revocado
    const { transporte } = crearBuzonSimulado([mensajeSimulado])
    const cliente = crearClienteGmail(transporte, CREDENCIALES_NEUTRAS, renovadorQueFalla, repositorio)

    const resultado = await cliente.traerMensajeCrudo('m1')

    expect(resultado.gmailMessageId).toBe('m1')
  })
})
