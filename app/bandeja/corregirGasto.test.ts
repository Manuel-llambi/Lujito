import Decimal from 'decimal.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { ejecutarCorregirGastoConRegla } from '@/app/bandeja/corregirGasto'
import type { GastoNormalizado } from '@/dominio/normalizacion/normalizarAviso'

function datosCompletos(parcial: Partial<GastoNormalizado> = {}): GastoNormalizado {
  return {
    montoTotal: new Decimal('250.00'),
    moneda: 'ARS',
    comercio: 'WWWAYSACOMAR',
    fechaGasto: new Date('2026-08-24T14:14:00.000Z'),
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '9344',
    cuotasTotal: 1,
    ...parcial,
  }
}

/**
 * Reproduce el incidente real (trabajo ad hoc, atomicidad confirmar/corregir + crear regla): una
 * categoría válida en el tipo `Categoria` de TypeScript pero ausente de la tabla `categorias` —acá,
 * borrada junto con las reglas semilla que la referenciaban vía FK, para simular la fila faltante—
 * hace fallar el `INSERT` de `ofrecerCrearRegla` (`categoria_id` no puede resolverse). Antes del fix,
 * `ejecutarConfirmarGasto` ya había hecho `UPDATE` y commiteado solo, así que el gasto quedaba con la
 * categoría corregida pero sin la regla pedida. Después del fix, la transacción hace rollback
 * completo y `categoria_id` queda intacto.
 */
describe('corregirGasto — atomicidad entre confirmar la categoría y crear la regla (incidente real)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('si crear la regla falla porque la categoría no existe en la tabla, la categoría del gasto NO queda corregida (Req. atomicidad, incidente real)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: 'msg-incidente-atomicidad',
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $250,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    // Reproduce EXACTAMENTE la condición del incidente real: 'Comida' sigue siendo un valor válido
    // del tipo `Categoria` de TypeScript, pero deja de existir como fila en `categorias`. Hay que
    // soltar antes las reglas semilla que la referencian (FK `reglas_categoria.categoria_id`), si no
    // el DELETE de la categoría viola esa referencia.
    await base.pool.query(
      "DELETE FROM reglas_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE nombre = 'Comida')",
    )
    await base.pool.query("DELETE FROM categorias WHERE nombre = 'Comida'")

    await expect(
      ejecutarCorregirGastoConRegla(base.pool, gasto.id, 'Comida', gasto.comercio ?? '', true),
    ).rejects.toThrow()

    const filaDespues = await base.pool.query<{ nombre: string | null }>(
      `SELECT c.nombre FROM gastos g LEFT JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    // Antes del fix esto daba 'Comida': el UPDATE de ejecutarConfirmarGasto ya había commiteado solo,
    // sin que el fallo de la regla lo revirtiera. Con el fix, el rollback deshace también esa
    // escritura y la categoría sigue siendo la original.
    expect(filaDespues.rows[0]?.nombre).toBe('Extras')
  })
})
