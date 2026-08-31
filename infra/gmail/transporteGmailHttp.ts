import { TokenVencidoError, type RespuestaListado, type RespuestaMensaje, type TransporteGmail } from '@/infra/gmail/clienteGmail'

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'

/**
 * Respuesta cruda de `users.messages.list` de Gmail — la proyección mínima que este transporte lee
 * antes de mapear a `RespuestaListado`. Gmail omite `messages` por completo (no lo manda como `[]`)
 * cuando la búsqueda no encuentra nada.
 */
interface RespuestaListadoCruda {
  messages?: { id: string; threadId: string }[]
}

/**
 * Traduce un status HTTP de la API de Gmail al error que espera `ClienteGmail` (Decision log de esta
 * tarea, T-transporte-real): un 401 en CUALQUIERA de las dos operaciones es "token de acceso vencido"
 * — Gmail no distingue "vencido" de "revocado" a este nivel; esa distinción solo aparece al intentar
 * renovar (ver `renovarTokenGmail.ts`, `PermisoRevocadoError`). Cualquier otro status (403, 429, 5xx)
 * es un error genérico, con el status y el cuerpo de la respuesta en el mensaje para que quede
 * trazable en `ultimo_error` si el pipeline lo captura.
 *
 * Función pura y deliberadamente aislada del `fetch`: es la parte de este archivo que se puede
 * testear sin mockear la red.
 */
export function traducirErrorHttpGmail(status: number, cuerpo: string): Error {
  if (status === 401) {
    return new TokenVencidoError(`Gmail devolvió 401 (token de acceso vencido): ${cuerpo}`)
  }
  return new Error(`Gmail devolvió ${status}: ${cuerpo}`)
}

/**
 * Transporte HTTP real contra la API de Gmail, con `fetch` nativo de Node — sin librerías nuevas
 * (Decision log de T24/T27/T29). Sin credenciales propias: las recibe por parámetro en cada llamada,
 * como exige `TransporteGmail`. Sin test de integración contra la red real (no hay credenciales en
 * este entorno de build); la traducción de errores sí está testeada, aislada en
 * `traducirErrorHttpGmail`.
 */
export function crearTransporteGmailHttp(): TransporteGmail {
  return {
    async listarMensajes({ q, token }): Promise<RespuestaListado> {
      const url = `${BASE_URL}?q=${encodeURIComponent(q)}`
      const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

      if (!respuesta.ok) {
        throw traducirErrorHttpGmail(respuesta.status, await respuesta.text())
      }

      const cuerpo = (await respuesta.json()) as RespuestaListadoCruda
      // Bandeja sin resultados: Gmail no manda `messages`, no un array vacío. Se normaliza acá para
      // que `ClienteGmail` nunca tenga que distinguir "sin campo" de "campo vacío".
      return { mensajes: (cuerpo.messages ?? []).map((mensaje) => ({ id: mensaje.id })) }
    },

    async obtenerMensaje(id, token): Promise<RespuestaMensaje> {
      const url = `${BASE_URL}/${id}?format=raw`
      const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

      if (!respuesta.ok) {
        throw traducirErrorHttpGmail(respuesta.status, await respuesta.text())
      }

      const cuerpo = (await respuesta.json()) as RespuestaMensaje
      return { raw: cuerpo.raw, internalDate: cuerpo.internalDate }
    },
  }
}
