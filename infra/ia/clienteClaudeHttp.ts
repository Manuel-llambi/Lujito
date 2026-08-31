import Anthropic from '@anthropic-ai/sdk'
import type { ClienteIA, RespuestaInferencia, SolicitudInferencia } from '@/infra/ia/inferirCategoria'

// Modelo fijado por design.md, sección `infra/ia/inferirCategoria` (Req. 6).
const MODELO = 'claude-sonnet-5'
const NOMBRE_HERRAMIENTA = 'categorizar_comercio'

const INSTRUCCIONES_SISTEMA =
  'Sos un clasificador de gastos de tarjeta de crédito/débito. Se te da el nombre de un comercio y una ' +
  'lista cerrada de categorías posibles. Elegí la categoría que mejor describe el rubro del comercio, ' +
  'con una justificación breve. Si el nombre del comercio no te permite inferir la categoría con ' +
  'confianza razonable, respondé "no_estoy_seguro" — nunca adivines ni elijas una categoría al azar ' +
  'solo para completar la respuesta.'

/**
 * Cliente real de Claude sobre el SDK de Anthropic (Decision log de T33): salida estructurada
 * restringida a `categoriasPermitidas` vía tool use forzado — el modelo no puede responder en texto
 * libre, así que el enum del schema es la primera línea de defensa (la segunda, la validación en el
 * borde, ya la hace `inferirCategoria`, Req. 6.4). Un solo intento por llamada: el reintento (3
 * intentos) ya lo maneja `inferirCategoria` por afuera. Sin test de integración contra la red real (no
 * hay credenciales en este entorno de build) — mismo criterio que el resto del repo para código que
 * toca red real.
 */
export function crearClienteClaudeHttp(apiKey: string): ClienteIA {
  const cliente = new Anthropic({ apiKey })

  return {
    async inferir({ comercio, categoriasPermitidas }: SolicitudInferencia): Promise<RespuestaInferencia> {
      const respuesta = await cliente.messages.create({
        model: MODELO,
        max_tokens: 256,
        system: INSTRUCCIONES_SISTEMA,
        messages: [{ role: 'user', content: `Comercio: ${comercio}` }],
        tools: [
          {
            name: NOMBRE_HERRAMIENTA,
            description: 'Registra la categoría inferida para el comercio dado, con su justificación.',
            input_schema: {
              type: 'object',
              properties: {
                categoria: { type: 'string', enum: [...categoriasPermitidas] },
                justificacion: { type: 'string' },
              },
              required: ['categoria', 'justificacion'],
            },
          },
        ],
        // Forzado a esta única tool (Decision log): sin esto el modelo podría responder en texto
        // libre y este cliente perdería la garantía de estructura que `inferirCategoria` asume.
        tool_choice: { type: 'tool', name: NOMBRE_HERRAMIENTA },
      })

      const bloqueHerramienta = respuesta.content.find(
        (bloque): bloque is Anthropic.ToolUseBlock => bloque.type === 'tool_use' && bloque.name === NOMBRE_HERRAMIENTA,
      )
      if (!bloqueHerramienta) {
        throw new Error('Claude no devolvió el tool_use esperado para categorizar_comercio')
      }

      const entrada = bloqueHerramienta.input as { categoria?: unknown; justificacion?: unknown }
      if (typeof entrada.categoria !== 'string' || typeof entrada.justificacion !== 'string') {
        throw new Error('Claude devolvió un tool_use con input mal formado para categorizar_comercio')
      }

      return { categoria: entrada.categoria, justificacion: entrada.justificacion }
    },
  }
}
