import Anthropic from '@anthropic-ai/sdk'
import type { ClienteRedaccion, RespuestaRedaccion, SolicitudRedaccion } from '@/infra/ia/redactarHallazgo'

// Modelo fijado por design.md, sección `infra/ia/clienteRedaccionHttp.ts` (Req. 4.6) — mismo modelo que
// `infra/ia/clienteClaudeHttp.ts`.
const MODELO = 'claude-sonnet-5'
const NOMBRE_HERRAMIENTA = 'redactar_hallazgo'

const INSTRUCCIONES_SISTEMA =
  'Sos un asistente de finanzas personales que redacta hallazgos sobre hábitos de gasto para una app ' +
  'argentina. Escribí en tono informal y rioplatense: usá voseo (vos tenés, gastaste, fijate) y ' +
  'expresiones coloquiales, como si le hablaras a un amigo o amiga, che. Nunca inventes cifras, montos, ' +
  'fechas ni ningún dato que no te haya llegado explícitamente en el mensaje del usuario — los datos que ' +
  'recibís ahí son los únicos que existen, no agregues ni supongas ninguno.'

/**
 * Cliente real de redacción sobre el SDK de Anthropic (T8, Decision log): mismo patrón puerto/adaptador
 * que `crearClienteClaudeHttp` — modelo fijo, salida estructurada forzada vía `tool_choice` a una única
 * tool, sin reintento propio (lo maneja `redactarHallazgo`, T7, por afuera). Sin test de integración
 * contra la red real de Claude (sin credenciales en este entorno) — mismo criterio que
 * `clienteClaudeHttp.ts`.
 */
export function crearClienteRedaccionHttp(apiKey: string): ClienteRedaccion {
  const cliente = new Anthropic({ apiKey })

  return {
    async redactar(solicitud: SolicitudRedaccion): Promise<RespuestaRedaccion> {
      const respuesta = await cliente.messages.create({
        model: MODELO,
        max_tokens: 512,
        system: INSTRUCCIONES_SISTEMA,
        messages: [{ role: 'user', content: construirMensajeUsuario(solicitud) }],
        tools: [
          {
            name: NOMBRE_HERRAMIENTA,
            description: 'Registra el texto redactado del hallazgo y su recomendación asociada.',
            input_schema: {
              type: 'object',
              properties: {
                texto: { type: 'string' },
                recomendacionTexto: { type: 'string' },
              },
              required: ['texto', 'recomendacionTexto'],
            },
          },
        ],
        // Forzado a esta única tool (Decision log, mismo criterio que clienteClaudeHttp.ts): sin esto
        // el modelo podría responder en texto libre y perder la garantía de estructura que
        // `redactarHallazgo` asume.
        tool_choice: { type: 'tool', name: NOMBRE_HERRAMIENTA },
      })

      const bloqueHerramienta = respuesta.content.find(
        (bloque): bloque is Anthropic.ToolUseBlock => bloque.type === 'tool_use' && bloque.name === NOMBRE_HERRAMIENTA,
      )
      if (!bloqueHerramienta) {
        throw new Error('Claude no devolvió el tool_use esperado para redactar_hallazgo')
      }

      const entrada = bloqueHerramienta.input as { texto?: unknown; recomendacionTexto?: unknown }
      if (typeof entrada.texto !== 'string' || typeof entrada.recomendacionTexto !== 'string') {
        throw new Error('Claude devolvió un tool_use con input mal formado para redactar_hallazgo')
      }

      return { texto: entrada.texto, recomendacionTexto: entrada.recomendacionTexto }
    },
  }
}

/**
 * El prompt de usuario se arma únicamente a partir de `solicitud.tipo` y las claves/valores de
 * `solicitud.datos` — ningún otro dato del sistema (fecha actual, otros hallazgos, etc.) se filtra acá.
 */
function construirMensajeUsuario(solicitud: SolicitudRedaccion): string {
  const lineasDatos = Object.entries(solicitud.datos)
    .map(([clave, valor]) => `- ${clave}: ${valor}`)
    .join('\n')

  return `Tipo de hallazgo: ${solicitud.tipo}\nDatos:\n${lineasDatos}`
}
