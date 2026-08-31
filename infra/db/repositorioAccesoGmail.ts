import type { Pool } from 'pg'

/**
 * El colaborador real del latch de acceso a Gmail revocado (Req. 1.5). Nombrado en T53 —T26 lo
 * inyecta bajo este nombre sin redeclararlo—: sigue la convención `infra/db/` de `RepositorioEmails`,
 * `RepositorioGastos` y `RepositorioImputaciones`.
 */
export interface RepositorioAccesoGmail {
  marcarRevocado(detalle: string): Promise<void>
  estaRevocado(): Promise<boolean>
}

export function crearRepositorioAccesoGmail(pool: Pool): RepositorioAccesoGmail {
  return {
    async marcarRevocado(detalle) {
      // Idempotente por estado, no por contador: si el acceso YA figura revocado (revocado_en no
      // nulo y restablecido_en nulo), no pisa revocado_en ni detalle — conserva el instante y el
      // mensaje de la primera detección. En cualquier otro estado (nunca revocado, o restablecido)
      // escribe el instante y el detalle nuevos y limpia restablecido_en.
      await pool.query(
        `
        UPDATE estado_acceso_gmail
        SET revocado_en = CASE
              WHEN revocado_en IS NOT NULL AND restablecido_en IS NULL THEN revocado_en
              ELSE now()
            END,
            detalle = CASE
              WHEN revocado_en IS NOT NULL AND restablecido_en IS NULL THEN detalle
              ELSE $1
            END,
            restablecido_en = CASE
              WHEN revocado_en IS NOT NULL AND restablecido_en IS NULL THEN restablecido_en
              ELSE NULL
            END
        WHERE id = 1
        `,
        [detalle],
      )
    },

    async estaRevocado() {
      const resultado = await pool.query<{ revocado: boolean }>(
        `SELECT (revocado_en IS NOT NULL AND restablecido_en IS NULL) AS revocado
         FROM estado_acceso_gmail WHERE id = 1`,
      )
      return resultado.rows[0]?.revocado ?? false
    },
  }
}
