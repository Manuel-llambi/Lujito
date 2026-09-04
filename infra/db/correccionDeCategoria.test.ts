import Decimal from 'decimal.js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { GastoNormalizado } from '@/dominio/normalizacion/normalizarAviso'

function datosCompletos(parcial: Partial<GastoNormalizado> = {}): GastoNormalizado {
  return {
    montoTotal: new Decimal('600.00'),
    moneda: 'ARS',
    comercio: 'WWWAYSACOMAR',
    fechaGasto: new Date('2026-08-24T14:14:00.000Z'),
    tipoTarjeta: 'credito',
    tarjetaUltimos4: '9344',
    cuotasTotal: 6,
    ...parcial,
  }
}

/**
 * Req. 9.4: corregir la categoría de un gasto (T50, mismo `RepositorioGastos.confirmar` que T23 ya
 * prueba para 7.4) no toca la tabla `imputaciones` — las imputaciones se leen por `gasto_id`, y la
 * categoría se resuelve en cada consulta por el join contra `gastos.categoria_id` (design.md,
 * `vista_gastos_mensuales`). Este archivo prueba esa consecuencia de punta a punta: un gasto en 6
 * cuotas, corregido de una categoría a otra, mueve sus 6 imputaciones a la nueva categoría en el
 * dashboard sin que nadie recalcule un monto ni un mes.
 */
describe('Corrección de categoría e imputaciones (T50)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE gastos, emails_crudos CASCADE')
  })

  it('tras corregir la categoría de un gasto en 6 cuotas, las 6 imputaciones cuentan en la nueva categoría con los mismos montos y meses (Req. 9.4)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: 'msg-t50-correccion',
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $600,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    const cuotas = Array.from({ length: 6 }, (_, i) => ({
      numeroCuota: i + 1,
      monto: new Decimal('100.00'),
      mes: `2026-${String(8 + i).padStart(2, '0')}`,
    }))
    await repositorioImputaciones.reemplazarPara(gasto.id, cuotas)

    const antesDeCorregir = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2027-01')
    const filasExtrasAntes = antesDeCorregir.filter((f) => f.categoria === 'Extras')
    expect(filasExtrasAntes).toHaveLength(6)

    await repositorioGastos.confirmar(gasto.id, 'Salidas') // corrección (Req. 7.4), no una fila nueva

    const filasImputaciones = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gasto.id],
    )
    expect(filasImputaciones.rows).toEqual(
      cuotas.map((cuota) => ({
        numero_cuota: cuota.numeroCuota,
        monto: cuota.monto.toFixed(2),
        mes: cuota.mes,
      })),
    ) // nadie recalculó ni tocó una fila de imputaciones al corregir

    const despuesDeCorregir = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2027-01')
    const filasExtrasDespues = despuesDeCorregir.filter((f) => f.categoria === 'Extras')
    const filasSalidasDespues = despuesDeCorregir.filter((f) => f.categoria === 'Salidas')

    expect(filasExtrasDespues).toHaveLength(0) // ya no cuenta en la categoría vieja
    expect(filasSalidasDespues).toHaveLength(6) // las 6 cuentan en la nueva

    const montosYMesesAntes = filasExtrasAntes
      .map((f) => ({ mes: f.mes, total: f.total.toString() }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
    const montosYMesesDespues = filasSalidasDespues
      .map((f) => ({ mes: f.mes, total: f.total.toString() }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
    expect(montosYMesesDespues).toEqual(montosYMesesAntes) // mismos montos, mismos meses
  })

  it('corregir un gasto a Descartar lo saca del total mensual sin tocar sus imputaciones (trabajo ad hoc, feature "Descartar")', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: 'msg-t50-descartar',
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $600,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    const cuotas = Array.from({ length: 6 }, (_, i) => ({
      numeroCuota: i + 1,
      monto: new Decimal('100.00'),
      mes: `2026-${String(8 + i).padStart(2, '0')}`,
    }))
    await repositorioImputaciones.reemplazarPara(gasto.id, cuotas)

    await repositorioGastos.confirmar(gasto.id, 'Descartar') // corrección manual a Descartar

    const filasImputaciones = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gasto.id],
    )
    expect(filasImputaciones.rows).toEqual(
      cuotas.map((cuota) => ({
        numero_cuota: cuota.numeroCuota,
        monto: cuota.monto.toFixed(2),
        mes: cuota.mes,
      })),
    ) // corregir nunca toca imputaciones, tampoco cuando la categoría nueva es Descartar

    const totales = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2027-01')
    expect(totales.filter((f) => f.categoria === 'Extras')).toHaveLength(0) // ya no está en la vieja
    expect(totales.filter((f) => f.categoria === 'Descartar')).toHaveLength(0) // ni aparece en la nueva
  })
})
