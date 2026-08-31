import Decimal from 'decimal.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import { ejecutarConfirmarGasto } from '@/app/bandeja/confirmarGasto'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'
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
 * Req. 7.7 (T52): cierra el ciclo que T49/T51 ya probaron por separado —`ejecutarConfirmarGasto`
 * siempre confirma (T49) y `ofrecerCrearRegla` no hace nada cuando `aceptado` es `false` (T51)— sobre
 * datos reales, en la misma composición exacta que ejecutan los Server Actions `confirmarGasto` y
 * `corregirGasto` cuando el checkbox de la bandeja llega sin marcar.
 */
describe('Rechazo del ofrecimiento de crear regla (Req. 7.7, T52)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('confirmar sin aceptar la regla deja el gasto confirmado con su categoría intacta y no agrega ninguna fila a reglas_categoria', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)

    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: 'msg-t52-rechazo',
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $250,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    const reglasAntes = await repositorioReglas.listar()

    // Camino exacto de `confirmarGasto` (T49) cuando el checkbox `crearRegla` llega sin marcar: el
    // FormData no trae la clave, así que el Server Action resuelve `aceptado` en `false`.
    await ejecutarConfirmarGasto(repositorioGastos, gasto.id, 'Extras')
    await ofrecerCrearRegla(repositorioReglas, false, gasto.comercio ?? '', 'Extras')

    const filaGasto = await base.pool.query<{
      categoria: string
      categoria_origen: string
      confirmado_en: Date | null
    }>(
      `SELECT c.nombre AS categoria, g.categoria_origen, g.confirmado_en
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    expect(filaGasto.rows[0]?.categoria).toBe('Extras') // sin alterar la categoría que ya tenía
    expect(filaGasto.rows[0]?.categoria_origen).toBe('usuario')
    expect(filaGasto.rows[0]?.confirmado_en).not.toBeNull()

    const reglasDespues = await repositorioReglas.listar()
    expect(reglasDespues).toHaveLength(reglasAntes.length) // ninguna fila nueva en reglas_categoria
  })
})
