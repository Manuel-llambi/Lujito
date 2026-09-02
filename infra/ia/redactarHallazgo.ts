import type { Hallazgo } from '@/dominio/habitos/tiposHabitos'

/**
 * El puerto que consume `redactarHallazgo`: una sola operación, inyectada — el test la sustituye por
 * un doble sin credenciales ni red, mismo patrón que `infra/ia/inferirCategoria.ts` (Req. 6 allá, T7
 * acá).
 */
export interface ClienteRedaccion {
  redactar(solicitud: SolicitudRedaccion): Promise<RespuestaRedaccion>
}

export interface SolicitudRedaccion {
  tipo: Hallazgo['tipo']
  datos: Record<string, string | number> // campos numéricos/textuales del hallazgo, serializados
}

export interface RespuestaRedaccion {
  texto: string
  recomendacionTexto: string
}

export interface HallazgoRedactado {
  hallazgo: Hallazgo
  texto: string
  recomendacionTexto: string
  fuente: 'modelo' | 'respaldo' // Decision log / trazabilidad, no está en requirements
}

export const TIMEOUT_REDACCION_MS = 4000

/**
 * Un único intento con timeout — nunca reintenta y nunca lanza (Req. 4.3, 4.4): ante una respuesta a
 * tiempo del cliente, devuelve `fuente: 'modelo'` con su texto; ante una falla del cliente o el
 * vencimiento del timeout, devuelve `fuente: 'respaldo'` con `hallazgo.textoRespaldo` /
 * `hallazgo.recomendacionRespaldo`. Que nunca lance es la precondición para que el llamador (T11)
 * pueda correr varias invocaciones en paralelo con `Promise.all` sin que la falla de una aborte a las
 * demás. No toca ningún campo del `Hallazgo` recibido: lo devuelve tal cual dentro de
 * `HallazgoRedactado.hallazgo` (Req. 4.5).
 */
export async function redactarHallazgo(hallazgo: Hallazgo, cliente: ClienteRedaccion): Promise<HallazgoRedactado> {
  const respaldo: HallazgoRedactado = {
    hallazgo,
    texto: hallazgo.textoRespaldo,
    recomendacionTexto: hallazgo.recomendacionRespaldo,
    fuente: 'respaldo',
  }

  const solicitud: SolicitudRedaccion = {
    tipo: hallazgo.tipo,
    datos: serializarDatosHallazgo(hallazgo),
  }

  const timeout = new Promise<'timeout'>((resolve) => {
    setTimeout(() => resolve('timeout'), TIMEOUT_REDACCION_MS)
  })

  let resultado: RespuestaRedaccion | 'timeout'
  try {
    resultado = await Promise.race([cliente.redactar(solicitud), timeout])
  } catch {
    // La falla del cliente no se propaga (Req. 4.3): cae al respaldo, igual que el timeout.
    return respaldo
  }

  if (resultado === 'timeout') {
    return respaldo
  }

  return {
    hallazgo,
    texto: resultado.texto,
    recomendacionTexto: resultado.recomendacionTexto,
    fuente: 'modelo',
  }
}

/**
 * Serializa los campos propios de cada variante de `Hallazgo` (sin `textoRespaldo` ni
 * `recomendacionRespaldo`, que son del respaldo, no del prompt) a `Record<string, string | number>`
 * — `Decimal` se convierte con `.toString()` porque el prompt solo necesita el número como texto.
 */
function serializarDatosHallazgo(hallazgo: Hallazgo): Record<string, string | number> {
  const { textoRespaldo: _textoRespaldo, recomendacionRespaldo: _recomendacionRespaldo, tipo: _tipo, ...campos } = hallazgo
  const datos: Record<string, string | number> = {}
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor === null) {
      continue
    }
    datos[clave] = typeof valor === 'object' && 'toString' in valor ? valor.toString() : (valor as string | number)
  }
  return datos
}
