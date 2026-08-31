import { PermisoRevocadoError } from '@/infra/gmail/clienteGmail'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

interface RespuestaTokenOk {
  access_token?: unknown
}

interface RespuestaTokenError {
  error?: unknown
  error_description?: unknown
}

/**
 * Traduce la respuesta de OAuth de Google (status ya separado, cuerpo ya parseado como JSON) al
 * token nuevo o al error que espera `crearClienteGmail` (Decision log de esta tarea,
 * T-renovacion-real): `invalid_grant` es la única señal de "el usuario revocó el permiso o el refresh
 * token expiró" — Google no la distingue de ningún otro fallo salvo por este código de error, así que
 * es el único disparador de `PermisoRevocadoError`, el latch de revocación de `clienteGmail.ts`.
 * Cualquier otro fallo (red, 5xx, un `error` distinto de `invalid_grant`) es un `Error` genérico:
 * generalizar acá dispararía el latch por causas que no son revocación.
 *
 * Función pura y deliberadamente aislada del `fetch`: es la parte de este archivo que se puede
 * testear sin mockear la red.
 */
export function interpretarRespuestaRenovacion(status: number, cuerpo: unknown): string {
  if (status >= 200 && status < 300) {
    const ok = (cuerpo ?? {}) as RespuestaTokenOk
    if (typeof ok.access_token === 'string' && ok.access_token.length > 0) {
      return ok.access_token
    }
    throw new Error(`Google respondió ${status} al renovar el token, sin access_token: ${JSON.stringify(cuerpo)}`)
  }

  const error = (cuerpo ?? {}) as RespuestaTokenError
  if (error.error === 'invalid_grant') {
    const descripcion = typeof error.error_description === 'string' ? error.error_description : 'invalid_grant'
    throw new PermisoRevocadoError(descripcion)
  }

  throw new Error(`Google devolvió ${status} al renovar el token: ${JSON.stringify(cuerpo)}`)
}

/**
 * Renovador real de token OAuth de Gmail (Decision log de T24/T27/T29): `POST` a
 * `https://oauth2.googleapis.com/token` con `grant_type=refresh_token`. Sin test de integración
 * contra la red real (no hay credenciales en este entorno de build); la traducción de la respuesta sí
 * está testeada, aislada en `interpretarRespuestaRenovacion`.
 */
export function crearRenovarTokenGmail(
  clientId: string,
  clientSecret: string,
): (tokenRefresco: string) => Promise<string> {
  return async (tokenRefresco: string): Promise<string> => {
    const cuerpoSolicitud = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRefresco,
      grant_type: 'refresh_token',
    })

    const respuesta = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpoSolicitud.toString(),
    })

    const cuerpo: unknown = await respuesta.json().catch(() => ({}))
    return interpretarRespuestaRenovacion(respuesta.status, cuerpo)
  }
}
