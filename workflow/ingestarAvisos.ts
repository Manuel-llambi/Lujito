import { inngest } from '@/workflow/clienteInngest'
import type { ClienteGmail } from '@/infra/gmail/clienteGmail'

export interface DependenciasIngestarAvisos {
  clienteGmail: ClienteGmail
  remitenteConfigurado: string
  /**
   * Resuelve el instante `desde` de la consulta (Decision log de T39): esta tarea no fija dónde se
   * persiste entre corridas —una tabla nueva, un valor gestionado por Inngest, o el máximo
   * `recibido_en` ya guardado en `emails_crudos` son alternativas igual de válidas—, porque ningún
   * criterio numerado lo exige. Se inyecta como función para que quien componga el cron en producción
   * decida la estrategia sin tocar esta función.
   */
  obtenerDesde: () => Date | Promise<Date>
}

/**
 * Función programada que descubre avisos nuevos y emite un evento `aviso/recibido` por cada uno
 * (Req. 1.1, 1.7). No procesa nada: el filtrado por remitente ya lo garantiza `ClienteGmail` (T24);
 * acá solo se prueba que la consulta se hace con el remitente configurado, no con texto libre ni
 * tomado de otra fuente.
 */
export function crearFuncionIngestarAvisos({
  clienteGmail,
  remitenteConfigurado,
  obtenerDesde,
}: DependenciasIngestarAvisos) {
  return inngest.createFunction(
    { id: 'ingestar-avisos', triggers: [{ cron: '*/5 * * * *' }] },
    async ({ step }) => {
      const desde = await obtenerDesde()

      const ids = await step.run('listar-mensajes', () => clienteGmail.listarMensajesDe(remitenteConfigurado, desde))

      if (ids.length > 0) {
        await step.sendEvent(
          'emitir-avisos',
          ids.map((gmailMessageId) => ({ name: 'aviso/recibido' as const, data: { gmailMessageId } })),
        )
      }

      return { cantidadEmitida: ids.length }
    },
  )
}
