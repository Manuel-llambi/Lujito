import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { Pool } from 'pg'

const DIRECTORIO_MIGRACIONES = path.join(import.meta.dirname, 'migraciones')

/**
 * Aplica, en orden alfabético de archivo, las migraciones `.sql` de `infra/db/migraciones/` que
 * todavía no se aplicaron contra `pool`. Cada migración corre dentro de su propia transacción y
 * queda registrada en `_migraciones_aplicadas`, así que volver a llamar a esta función es un no-op
 * para las que ya se aplicaron: no falla y no duplica objetos.
 */
export async function aplicarMigraciones(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migraciones_aplicadas (
      nombre       text PRIMARY KEY,
      aplicada_en  timestamptz NOT NULL DEFAULT now()
    )
  `)

  const archivos = readdirSync(DIRECTORIO_MIGRACIONES)
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort()

  for (const archivo of archivos) {
    const yaAplicada = await pool.query('SELECT 1 FROM _migraciones_aplicadas WHERE nombre = $1', [
      archivo,
    ])
    if ((yaAplicada.rowCount ?? 0) > 0) {
      continue
    }

    const sql = readFileSync(path.join(DIRECTORIO_MIGRACIONES, archivo), 'utf-8')
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')
      await cliente.query(sql)
      await cliente.query('INSERT INTO _migraciones_aplicadas (nombre) VALUES ($1)', [archivo])
      await cliente.query('COMMIT')
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }
}
