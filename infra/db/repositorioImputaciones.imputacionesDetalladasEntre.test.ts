import Decimal from 'decimal.js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { GastoNormalizado } from '@/dominio/normalizacion/normalizarAviso'

function datosCompletos(parcial: Partial<GastoNormalizado> = {}): GastoNormalizado {
  return {
    montoTotal: new Decimal('2571.30'),
    moneda: 'ARS',
    comercio: 'WWWAYSACOMAR',
    fechaGasto: new Date('2026-08-24T14:14:00.000Z'),
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '9344',
    cuotasTotal: 1,
    ...parcial,
  }
}

describe('RepositorioImputaciones.imputacionesDetalladasEntre (trabajo ad hoc /dashboard)', () => {
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

  let contador = 0
  async function crearGasto(datos: Partial<GastoNormalizado> = {}) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-detalle-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return repositorioGastos.crear(datosCompletos(datos), emailId)
  }

  it('devuelve una fila por imputación, no un total agregado', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('300.00'), cuotasTotal: 3 })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
      { numeroCuota: 2, monto: new Decimal('100.00'), mes: '2026-09' },
      { numeroCuota: 3, monto: new Decimal('100.00'), mes: '2026-10' },
    ])

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-10')

    expect(filas).toHaveLength(3)
    expect(new Set(filas.map((f) => f.mes))).toEqual(new Set(['2026-08', '2026-09', '2026-10']))
  })

  it('cada fila trae la fechaGasto real del gasto, igual para las tres cuotas', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const fechaGasto = new Date('2026-07-31T14:14:00.000Z')
    const gasto = await crearGasto({ montoTotal: new Decimal('300.00'), cuotasTotal: 3, fechaGasto })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
      { numeroCuota: 2, monto: new Decimal('100.00'), mes: '2026-09' },
      { numeroCuota: 3, monto: new Decimal('100.00'), mes: '2026-10' },
    ])

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-10')

    expect(filas.every((f) => f.fechaGasto.getTime() === fechaGasto.getTime())).toBe(true)
  })

  it('dos gastos del mismo mes y la misma categoría producen dos filas, no una fusionada', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gastoA = await crearGasto({ montoTotal: new Decimal('300.00') })
    const gastoB = await crearGasto({ montoTotal: new Decimal('200.00') })
    await repositorioGastos.asignarCategoria(gastoA.id, 'Comida', 'regla', null)
    await repositorioGastos.asignarCategoria(gastoB.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gastoA.id, [
      { numeroCuota: 1, monto: new Decimal('300.00'), mes: '2026-08' },
    ])
    await repositorioImputaciones.reemplazarPara(gastoB.id, [
      { numeroCuota: 1, monto: new Decimal('200.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-08')

    expect(filas).toHaveLength(2)
    expect(filas.some((f) => f.monto.equals(new Decimal('300.00')))).toBe(true)
    expect(filas.some((f) => f.monto.equals(new Decimal('200.00')))).toBe(true)
  })

  it('tieneSinConfirmar de una fila refleja si SU gasto está confirmado, no el estado de otro gasto (Req. 9.3)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const confirmado = await crearGasto({ montoTotal: new Decimal('100.00') })
    const sinConfirmar = await crearGasto({ montoTotal: new Decimal('50.00') })
    await repositorioGastos.asignarCategoria(confirmado.id, 'Extras', 'regla', null)
    await repositorioGastos.asignarCategoria(sinConfirmar.id, 'Extras', 'ia', 'justificación')
    await repositorioImputaciones.reemplazarPara(confirmado.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
    ])
    await repositorioImputaciones.reemplazarPara(sinConfirmar.id, [
      { numeroCuota: 1, monto: new Decimal('50.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-08')

    expect(filas.find((f) => f.monto.equals(new Decimal('100.00')))?.tieneSinConfirmar).toBe(false)
    expect(filas.find((f) => f.monto.equals(new Decimal('50.00')))?.tieneSinConfirmar).toBe(true)
  })

  it('un gasto en needs_review con imputaciones escritas queda excluido (Req. 9.5)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const enRevision = await crearGasto({ montoTotal: new Decimal('900.00') })
    await repositorioGastos.asignarCategoria(enRevision.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(enRevision.id, [
      { numeroCuota: 1, monto: new Decimal('900.00'), mes: '2026-08' },
    ])
    await repositorioGastos.marcarParaRevision(enRevision.id, 'error_de_paso', 'traza')

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-08')

    expect(filas).toEqual([])
  })

  it('un gasto con categoria_id en null falla con un error propio y distinguible (comportamiento defensivo)', async () => {
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('75.00') }) // nunca se le asigna categoría
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('75.00'), mes: '2026-08' },
    ])

    await expect(repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-08')).rejects.toThrow()
  })

  it('respeta el rango de meses con ambos extremos incluidos, y omite lo de afuera', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('300.00'), cuotasTotal: 3 })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-07' }, // antes del rango
      { numeroCuota: 2, monto: new Decimal('100.00'), mes: '2026-08' }, // extremo desde
      { numeroCuota: 3, monto: new Decimal('100.00'), mes: '2026-09' }, // extremo hasta
    ])

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-08', '2026-09')

    expect(new Set(filas.map((f) => f.mes))).toEqual(new Set(['2026-08', '2026-09']))
  })

  it('un rango sin imputaciones devuelve un arreglo vacío, no un error', async () => {
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    const filas = await repositorioImputaciones.imputacionesDetalladasEntre('2026-01', '2026-12')

    expect(filas).toEqual([])
  })
})
