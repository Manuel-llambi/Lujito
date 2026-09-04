import type { Pool, PoolClient } from 'pg'

/**
 * Ejecuta `fn` dentro de una única transacción real de Postgres —`BEGIN` → `fn(cliente)` → `COMMIT`—
 * y hace `ROLLBACK` si `fn` lanza, re-lanzando el error original sin envolverlo ni silenciarlo. Mismo
 * patrón BEGIN/COMMIT/ROLLBACK con un cliente dedicado (`pool.connect()` + `finally { release() }`)
 * que ya usa `aplicarMigraciones` en `infra/db/migrar.ts` para cada archivo de migración.
 *
 * Motivo de este helper (trabajo ad hoc, incidente de `app/bandeja/confirmarGasto.ts` y
 * `corregirGasto.ts`): confirmar/corregir la categoría de un gasto y crear la regla del comercio eran
 * dos escrituras sueltas contra el `pool` compartido, sin transacción — cuando la segunda fallaba (un
 * `NOT NULL`/FK de `reglas_categoria.categoria_id` porque la categoría todavía no existía en
 * `categorias`), la primera ya había hecho commit sola, y el gasto quedaba con la categoría
 * actualizada pero sin la regla que el usuario pidió, sin ningún rollback. `ejecutarEnTransaccion`
 * hace que las dos escrituras compartan una única transacción: si cualquiera de las dos falla,
 * ninguna de las dos queda.
 */
export async function ejecutarEnTransaccion<T>(
  pool: Pool,
  fn: (cliente: PoolClient) => Promise<T>,
): Promise<T> {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const resultado = await fn(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (error) {
    await cliente.query('ROLLBACK')
    throw error
  } finally {
    cliente.release()
  }
}
