import type { MensajeCrudo } from '@/infra/db/repositorioEmails'
import type { RepositorioAccesoGmail } from '@/infra/db/repositorioAccesoGmail'

/** Respuesta de `users.messages.list` de la API de Gmail (proyectada a lo que este adaptador usa). */
export interface RespuestaListado {
  mensajes: { id: string }[]
}

/**
 * Respuesta de `users.messages.get(format=raw)` de la API de Gmail: `raw` es el mensaje MIME
 * completo (headers + cuerpo) codificado en base64url — formato de cable, no contenido.
 * `internalDate` es la marca de recepción que agrega Gmail (epoch millis como string), independiente
 * del header `Date` del propio email.
 */
export interface RespuestaMensaje {
  raw: string
  internalDate: string
}

/**
 * Señal específica de la API para "credencial expirada" (Req. 1.4): dispara renovación y reintento.
 * Deliberadamente distinta de cualquier otra falla de autorización — el discriminador que T26 usa al
 * revés para "permiso retirado", que NO dispara este camino.
 */
export class TokenVencidoError extends Error {}

/**
 * Señal específica de la API para "permiso retirado por el usuario" (Req. 1.5): el token de refresco
 * también dejó de valer, así que renovar es imposible. El adaptador la traduce a `AccesoRevocadoError`
 * después de dejarla registrada.
 */
export class PermisoRevocadoError extends Error {}

/** El error que ve el llamador cuando el acceso a Gmail está revocado (Req. 1.5): no se reintenta. */
export class AccesoRevocadoError extends Error {}

/**
 * El transporte de Gmail, inyectado (Decision log de T24): el adaptador no lo construye, así que el
 * test lo sustituye por un doble sin credenciales, sin red y sin variables de entorno. Cada operación
 * recibe el token de acceso vigente y puede rechazarlo con `TokenVencidoError` (Req. 1.4).
 */
export interface TransporteGmail {
  listarMensajes(args: { q: string; token: string }): Promise<RespuestaListado>
  obtenerMensaje(id: string, token: string): Promise<RespuestaMensaje>
}

/**
 * Credenciales OAuth del adaptador (Decision log de T25: dónde viven en ejecución —variables de
 * entorno leídas por quien compone el `ClienteGmail` real, T29— es responsabilidad de la raíz de
 * composición, no de este módulo, que solo las recibe).
 */
export interface CredencialesGmail {
  tokenAcceso: string
  tokenRefresco: string
}

export interface ClienteGmail {
  listarMensajesDe(remitente: string, desde: Date): Promise<string[]>
  traerMensajeCrudo(id: string): Promise<MensajeCrudo>
}

/**
 * Crea el adaptador de Gmail sobre un transporte inyectado. No decide nada de negocio: traduce
 * entre la API y `MensajeCrudo` (Req. 1.1, 1.7), y renueva el token vencido reintentando la
 * operación original una sola vez (Req. 1.4).
 */
export function crearClienteGmail(
  transporte: TransporteGmail,
  credenciales: CredencialesGmail,
  renovarToken: (tokenRefresco: string) => Promise<string>,
  repositorioAccesoGmail: RepositorioAccesoGmail,
): ClienteGmail {
  // Estado mutable local a esta instancia del adaptador: no se persiste ni sobrevive al proceso
  // (1.4 no lo pide), solo evita renovar de nuevo dentro de la misma instancia una vez renovado.
  let tokenActual = credenciales.tokenAcceso

  async function conRenovacion<T>(operacion: (token: string) => Promise<T>): Promise<T> {
    try {
      return await operacion(tokenActual)
    } catch (error) {
      // Solo la señal específica de token vencido dispara la renovación (Req. 1.4). Cualquier otra
      // falla de autorización —incluida la de permiso revocado— se propaga tal cual: generalizar
      // acá se comería el camino que el latch de abajo necesita para fallar distinto.
      if (!(error instanceof TokenVencidoError)) {
        throw error
      }
      const tokenNuevo = await renovarToken(credenciales.tokenRefresco)
      tokenActual = tokenNuevo
      // Presupuesto de un solo reintento: si el token renovado también falla, el error se propaga
      // sin volver a renovar.
      return await operacion(tokenNuevo)
    }
  }

  /**
   * Envuelve una operación con el latch de acceso revocado (Req. 1.5): si el registro dice que el
   * acceso ya está revocado, corta ANTES de tocar el transporte —"no vuelve a llamar a Gmail hasta
   * que el acceso se restablezca"—. Si la operación falla con la señal de permiso retirado, la deja
   * registrada una vez y traduce a `AccesoRevocadoError`; no reintenta ni renueva.
   */
  async function conLatchDeRevocacion<T>(operacion: (token: string) => Promise<T>): Promise<T> {
    if (await repositorioAccesoGmail.estaRevocado()) {
      throw new AccesoRevocadoError('el acceso a Gmail está revocado')
    }
    try {
      return await conRenovacion(operacion)
    } catch (error) {
      if (!(error instanceof PermisoRevocadoError)) {
        throw error
      }
      await repositorioAccesoGmail.marcarRevocado(error.message)
      throw new AccesoRevocadoError(error.message)
    }
  }

  return {
    async listarMensajesDe(remitente, desde) {
      const despuesDe = Math.floor(desde.getTime() / 1000)
      // Restricción de remitente explícita (`from:`), no texto libre: Gmail interpretaría un texto
      // libre como búsqueda de contenido y sobre-emparejaría (Req. 1.7).
      const q = `from:${remitente} after:${despuesDe}`

      const respuesta = await conLatchDeRevocacion((token) => transporte.listarMensajes({ q, token }))
      return respuesta.mensajes.map((mensaje) => mensaje.id)
    },

    async traerMensajeCrudo(id) {
      const { raw, internalDate } = await conLatchDeRevocacion((token) => transporte.obtenerMensaje(id, token))

      // Decodificación de transporte (base64url del MIME completo) — formato de cable, no
      // contenido. El quoted-printable del cuerpo NO se toca acá: es del step extraer, con
      // decodificarQuotedPrintable (T1), sobre el texto crudo que este método entrega tal cual.
      const mimeCompleto = Buffer.from(raw, 'base64url').toString('utf-8')
      const { headersCrudos, cuerpo } = separarHeadersDeCuerpo(mimeCompleto)

      return {
        gmailMessageId: id,
        remitente: extraerHeader(headersCrudos, 'From') ?? '',
        asunto: extraerHeader(headersCrudos, 'Subject') ?? '',
        headersCrudos,
        cuerpo,
        recibidoEn: new Date(Number(internalDate)),
      }
    },
  }
}

function separarHeadersDeCuerpo(mimeCompleto: string): { headersCrudos: string; cuerpo: string } {
  const indiceCRLF = mimeCompleto.indexOf('\r\n\r\n')
  if (indiceCRLF >= 0) {
    return {
      headersCrudos: mimeCompleto.slice(0, indiceCRLF),
      cuerpo: mimeCompleto.slice(indiceCRLF + 4),
    }
  }
  const indiceLF = mimeCompleto.indexOf('\n\n')
  return {
    headersCrudos: mimeCompleto.slice(0, indiceLF),
    cuerpo: mimeCompleto.slice(indiceLF + 2),
  }
}

/** Extrae un header por nombre, desplegando las líneas de continuación (RFC 5322: una continuación
 * empieza con espacio o tab) para devolver un valor de una sola línea. No modifica `headersCrudos`. */
function extraerHeader(bloqueHeaders: string, nombre: string): string | null {
  const lineasDesplegadas: string[] = []
  for (const linea of bloqueHeaders.split(/\r\n|\n/)) {
    if (/^[ \t]/.test(linea) && lineasDesplegadas.length > 0) {
      lineasDesplegadas[lineasDesplegadas.length - 1] += ' ' + linea.trim()
    } else {
      lineasDesplegadas.push(linea)
    }
  }

  const patron = new RegExp(`^${nombre}:\\s*(.*)$`, 'i')
  for (const linea of lineasDesplegadas) {
    const coincidencia = patron.exec(linea)
    if (coincidencia?.[1] !== undefined) {
      return coincidencia[1].trim()
    }
  }
  return null
}
