import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { ejecutarEnTransaccion } from '@/infra/db/ejecutarEnTransaccion'

/**
 * `ejecutarEnTransaccion` es el helper genérico que soluciona el incidente de `confirmarGasto`/
 * `corregirGasto` (dos escrituras sueltas sin transacción compartida). Estos tests prueban el
 * mecanismo aislado, contra una tabla propia —sin tocar `gastos` ni `reglas_categoria`— para no
 * duplicar la reproducción exacta del incidente, que vive en `app/bandeja/corregirGasto.test.ts`.
 */
describe('ejecutarEnTransaccion — BEGIN/COMMIT/ROLLBACK reales contra Postgres', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
    await base.pool.query('CREATE TABLE prueba_transaccion (id serial PRIMARY KEY, valor text NOT NULL)')
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE prueba_transaccion RESTART IDENTITY')
  })

  it('camino feliz: la escritura de fn queda commiteada en la base y ejecutarEnTransaccion devuelve el valor de fn', async () => {
    const resultado = await ejecutarEnTransaccion(base.pool, async (cliente) => {
      await cliente.query("INSERT INTO prueba_transaccion (valor) VALUES ('ok')")
      return 'valor-de-fn'
    })

    expect(resultado).toBe('valor-de-fn')
    const fila = await base.pool.query('SELECT valor FROM prueba_transaccion')
    expect(fila.rows).toEqual([{ valor: 'ok' }])
  })

  it('camino de fallo: fn escribe y después lanza — ejecutarEnTransaccion rechaza con ese mismo error y la fila no queda (rollback real, no un mock)', async () => {
    const errorOriginal = new Error('fallo deliberado después de escribir')

    await expect(
      ejecutarEnTransaccion(base.pool, async (cliente) => {
        await cliente.query("INSERT INTO prueba_transaccion (valor) VALUES ('deberia-desaparecer')")
        throw errorOriginal
      }),
    ).rejects.toBe(errorOriginal)

    const fila = await base.pool.query('SELECT valor FROM prueba_transaccion')
    expect(fila.rows).toEqual([]) // rollback real contra la base, no una aserción sobre un mock
  })
})
