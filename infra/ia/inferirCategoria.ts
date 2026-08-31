import { CATEGORIAS_INFERIBLES } from '@/dominio/categorizacion/categorizarPorReglas'

/**
 * Conjunto cerrado que se le pide al modelo (Req. 6.1): las categorías ofrecibles más la abstención.
 * Deriva de `CATEGORIAS_INFERIBLES` en vez de copiarla a mano — una copia literal se desincroniza en
 * silencio el día que el dominio agregue una categoría. `no_estoy_seguro` es un valor del protocolo
 * con el modelo, no una categoría del dominio: no se declara en `dominio/categorizacion/`.
 */
export const RESPUESTAS_IA = [...CATEGORIAS_INFERIBLES, 'no_estoy_seguro'] as const

export interface InferenciaCategoria {
  categoria: (typeof CATEGORIAS_INFERIBLES)[number]
  justificacion: string
}

export interface SolicitudInferencia {
  comercio: string
  categoriasPermitidas: readonly string[]
}

export interface RespuestaInferencia {
  // `string` y no `(typeof RESPUESTAS_IA)[number]` (T28, Decision log): la restricción del schema es
  // una ayuda, no una garantía (Req. 6.4), así que el tipo tiene que admitir una respuesta que la
  // viole para poder validarla en el borde.
  categoria: string
  justificacion: string
}

// Presupuesto de reintentos de esta llamada (Req. 6.5): 1 intento inicial + 2 reintentos. Vive dentro
// de esta invocación, no en el nivel del step (T38/10.1), para que el pipeline pueda seguir a
// `imputar` con `null` en vez de que el `step.run` entero quede marcado como fallido.
const INTENTOS_MAXIMOS = 3

/**
 * El puerto que estrena esta tarea (Decision log de T27): una sola operación, la que
 * `inferirCategoria` ejercita. El cliente se inyecta —no se construye adentro—, así que el test lo
 * sustituye por un doble sin credenciales, sin red y sin variables de entorno.
 */
export interface ClienteIA {
  inferir(solicitud: SolicitudInferencia): Promise<RespuestaInferencia>
}

/**
 * Le pide al modelo, con salida estructurada, una respuesta restringida al conjunto cerrado
 * `RESPUESTAS_IA` (Req. 6.1) para el comercio dado, y traduce la respuesta al tipo del dominio: una
 * categoría con su justificación cuando el modelo se pronunció, o `null` cuando se abstuvo
 * (`no_estoy_seguro`, Req. 6.7), cuando la respuesta cae fuera del conjunto cerrado (Req. 6.4) o
 * cuando el cliente falla tras agotar sus reintentos (Req. 6.5) — sin proponer ninguna categoría de
 * reemplazo y sin que el llamador vea nunca una excepción. Único punto de todo el sistema donde se
 * invoca un modelo.
 */
export async function inferirCategoria(comercio: string, cliente: ClienteIA): Promise<InferenciaCategoria | null> {
  let respuesta: RespuestaInferencia | null = null

  // El reintento cubre la falla de la llamada (Req. 6.5), no una respuesta inválida (Req. 6.4): una
  // vez que `inferir` resuelve —aunque resuelva con una categoría fuera del enum— el bucle corta acá,
  // sin volver a invocar al cliente.
  for (let intento = 0; intento < INTENTOS_MAXIMOS; intento++) {
    try {
      respuesta = await cliente.inferir({ comercio, categoriasPermitidas: RESPUESTAS_IA })
      break
    } catch {
      // Se agota el presupuesto de intentos en silencio: la última falla no se propaga (Req. 6.5,
      // "el pipeline continúa"). `respuesta` sigue en `null` si esta era la última vuelta.
    }
  }

  if (respuesta === null) {
    return null // Req. 6.5 — reintentos agotados
  }
  if (respuesta.categoria === 'no_estoy_seguro') {
    return null // Req. 6.7 — abstención
  }
  if (!(CATEGORIAS_INFERIBLES as readonly string[]).includes(respuesta.categoria)) {
    return null // Req. 6.4 — fuera del conjunto cerrado; la restricción del schema es una ayuda, no una garantía
  }

  return { categoria: respuesta.categoria as (typeof CATEGORIAS_INFERIBLES)[number], justificacion: respuesta.justificacion }
}
