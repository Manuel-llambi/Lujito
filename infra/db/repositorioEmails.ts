import type { Pool } from 'pg'

/**
 * El email completo tal como lo entrega Gmail, sin parsear (Req. 1.1). Definido acá porque
 * `emails_crudos` (T16) es la primera tabla que lo necesita; `ClienteGmail.traerMensajeCrudo` (T24)
 * y `RepositorioEmails.traerCrudo` (T21) lo importan de acá y no lo redeclaran.
 */
export interface MensajeCrudo {
  gmailMessageId: string
  remitente: string
  asunto: string
  headersCrudos: string
  cuerpo: string
  recibidoEn: Date
}

export interface RepositorioEmails {
  guardarSiEsNuevo(mensaje: MensajeCrudo): Promise<{ id: string; yaExistia: boolean }>
  marcarDescartado(id: string): Promise<void> // Req. 4.1
  traerCrudo(id: string): Promise<MensajeCrudo> // Req. 10.3 — sin ClienteGmail en la firma: Gmail es inalcanzable
  /**
   * La marca de recepción más reciente ya guardada (Decision log de T-wiring-real): la raíz de
   * composición la usa como `obtenerDesde` del cron de ingesta, para no repetir la ventana temporal ya
   * cubierta en la corrida anterior. `null` cuando la tabla está vacía (primera corrida).
   */
  obtenerUltimaRecepcion(): Promise<Date | null>
}

interface FilaGuardado {
  id: string
  insertado: boolean
}

interface FilaEmailCrudo {
  gmail_message_id: string
  remitente: string
  asunto: string
  headers_crudos: string
  cuerpo: string
  recibido_en: Date
}

export function crearRepositorioEmails(pool: Pool): RepositorioEmails {
  return {
    async guardarSiEsNuevo(mensaje) {
      // Una sola sentencia atómica: el `INSERT ... ON CONFLICT DO NOTHING` es lo que evita la
      // ventana entre leer y escribir que abriría un SELECT seguido de un INSERT (Req. 1.3), y que
      // dos ejecuciones solapadas del step de ingesta (reintento de Inngest) puedan pisarse. Si el
      // INSERT no insertó nada, la segunda rama del UNION ALL trae el `id` de la fila existente, que
      // ya está confirmada por definición: quien ganó la carrera del UNIQUE ya hizo commit.
      const resultado = await pool.query<FilaGuardado>(
        `
        WITH insertado AS (
          INSERT INTO emails_crudos (gmail_message_id, remitente, asunto, headers_crudos, cuerpo, recibido_en)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (gmail_message_id) DO NOTHING
          RETURNING id, true AS insertado
        )
        SELECT id, insertado FROM insertado
        UNION ALL
        SELECT id, false AS insertado FROM emails_crudos
        WHERE gmail_message_id = $1 AND NOT EXISTS (SELECT 1 FROM insertado)
        `,
        [
          mensaje.gmailMessageId,
          mensaje.remitente,
          mensaje.asunto,
          mensaje.headersCrudos,
          mensaje.cuerpo,
          mensaje.recibidoEn,
        ],
      )

      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error('guardarSiEsNuevo: la consulta no devolvió ninguna fila')
      }

      return { id: fila.id, yaExistia: !fila.insertado }
    },

    async marcarDescartado(id) {
      // No toca ninguna otra columna (ni siquiera `procesado_en`): un email descartado se sigue
      // pudiendo reprocesar (Req. 10.3), y un UPDATE más amplio lo comprometería en silencio. Es
      // naturalmente idempotente: repetir el mismo UPDATE dos veces deja el mismo estado.
      await pool.query("UPDATE emails_crudos SET estado = 'descartado' WHERE id = $1", [id])
    },

    async traerCrudo(id) {
      const resultado = await pool.query<FilaEmailCrudo>(
        'SELECT gmail_message_id, remitente, asunto, headers_crudos, cuerpo, recibido_en FROM emails_crudos WHERE id = $1',
        [id],
      )

      const fila = resultado.rows[0]
      if (!fila) {
        throw new Error(`traerCrudo: no existe un email crudo con id ${id}`)
      }

      return {
        gmailMessageId: fila.gmail_message_id,
        remitente: fila.remitente,
        asunto: fila.asunto,
        headersCrudos: fila.headers_crudos,
        cuerpo: fila.cuerpo,
        recibidoEn: fila.recibido_en,
      }
    },

    async obtenerUltimaRecepcion() {
      const resultado = await pool.query<{ max: Date | null }>('SELECT MAX(recibido_en) AS max FROM emails_crudos')
      return resultado.rows[0]?.max ?? null
    },
  }
}
