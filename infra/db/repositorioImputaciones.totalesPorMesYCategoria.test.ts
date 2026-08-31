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

describe('RepositorioImputaciones.totalesPorMesYCategoria y vista_gastos_mensuales (T20)', () => {
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
      gmailMessageId: `msg-t20-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return repositorioGastos.crear(datosCompletos(datos), emailId)
  }

  it('el total del mes es la suma de las imputaciones, no del monto_total del gasto (Req. 9.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('6000.00'), cuotasTotal: 6 })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(
      gasto.id,
      Array.from({ length: 6 }, (_, i) => ({
        numeroCuota: i + 1,
        monto: new Decimal('1000.00'),
        mes: `2026-${String(8 + i).padStart(2, '0')}`,
      })),
    )

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2027-01')

    expect(filas).toHaveLength(6)
    for (const fila of filas) {
      expect(fila.total.equals(new Decimal('1000.00'))).toBe(true)
    }
    expect(filas.every((f) => !f.total.equals(new Decimal('6000.00')))).toBe(true)
  })

  it('dos gastos del mismo mes y la misma categoría producen una sola fila con la suma de ambos (Req. 9.1)', async () => {
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

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    const deComida = filas.filter((f) => f.categoria === 'Comida')
    expect(deComida).toHaveLength(1)
    expect(deComida[0]?.total.equals(new Decimal('500.00'))).toBe(true)
  })

  it('un mismo mes con categorías distintas produce una fila por categoría (Req. 9.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gastoComida = await crearGasto({ montoTotal: new Decimal('100.00') })
    const gastoSalidas = await crearGasto({ montoTotal: new Decimal('50.00') })
    await repositorioGastos.asignarCategoria(gastoComida.id, 'Comida', 'regla', null)
    await repositorioGastos.asignarCategoria(gastoSalidas.id, 'Salidas', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gastoComida.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
    ])
    await repositorioImputaciones.reemplazarPara(gastoSalidas.id, [
      { numeroCuota: 1, monto: new Decimal('50.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(filas).toHaveLength(2)
    const categorias = new Set(filas.map((f) => f.categoria))
    expect(categorias).toEqual(new Set(['Comida', 'Salidas']))
  })

  it('la suma de los totales de todos los meses de un gasto en cuotas es exactamente igual a su monto_total (Req. 9.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('1000.00'), cuotasTotal: 3 })
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('333.34'), mes: '2026-08' },
      { numeroCuota: 2, monto: new Decimal('333.33'), mes: '2026-09' },
      { numeroCuota: 3, monto: new Decimal('333.33'), mes: '2026-10' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-10')

    const suma = filas.reduce((acc, f) => acc.plus(f.total), new Decimal(0))
    expect(suma.equals(new Decimal('1000.00'))).toBe(true)
  })

  it('un grupo con un gasto ia sin confirmar incluye su monto en el total y devuelve tieneSinConfirmar en verdadero (Req. 9.3)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const confirmado = await crearGasto({ montoTotal: new Decimal('100.00') })
    const sinConfirmar = await crearGasto({ montoTotal: new Decimal('50.00') })
    await repositorioGastos.asignarCategoria(confirmado.id, 'Extras', 'regla', null) // confirma en el acto
    await repositorioGastos.asignarCategoria(sinConfirmar.id, 'Extras', 'ia', 'justificación') // sin confirmar
    await repositorioImputaciones.reemplazarPara(confirmado.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
    ])
    await repositorioImputaciones.reemplazarPara(sinConfirmar.id, [
      { numeroCuota: 1, monto: new Decimal('50.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    const fila = filas.find((f) => f.categoria === 'Extras')
    expect(fila?.total.equals(new Decimal('150.00'))).toBe(true)
    expect(fila?.tieneSinConfirmar).toBe(true)
  })

  it('bool_or, no bool_and: un grupo enteramente confirmado devuelve tieneSinConfirmar en falso (Req. 9.3)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('100.00') })
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(filas.find((f) => f.categoria === 'Extras')?.tieneSinConfirmar).toBe(false)
  })

  it('un gasto en needs_review con imputaciones escritas queda excluido del total (Req. 9.5)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const sano = await crearGasto({ montoTotal: new Decimal('100.00') })
    await repositorioGastos.asignarCategoria(sano.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(sano.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-08' },
    ])
    const totalSinElOtro = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    const enRevision = await crearGasto({ montoTotal: new Decimal('900.00') })
    await repositorioGastos.asignarCategoria(enRevision.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(enRevision.id, [
      { numeroCuota: 1, monto: new Decimal('900.00'), mes: '2026-08' },
    ])
    await repositorioGastos.marcarParaRevision(enRevision.id, 'error_de_paso', 'traza')

    const totalConElOtro = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(
      totalConElOtro.find((f) => f.categoria === 'Comida')?.total.toString(),
    ).toBe(totalSinElOtro.find((f) => f.categoria === 'Comida')?.total.toString())

    const conteoImputaciones = await base.pool.query(
      'SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1',
      [enRevision.id],
    )
    expect(conteoImputaciones.rows[0]?.count).toBe('1') // T20 lee, no borra
  })

  it('si el único gasto de un grupo está en needs_review, el grupo no aparece — no vuelve con total en cero (Req. 9.5)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('500.00') })
    await repositorioGastos.asignarCategoria(gasto.id, 'Salidas', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('500.00'), mes: '2026-08' },
    ])
    await repositorioGastos.marcarParaRevision(gasto.id, 'monto_invalido', null)

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(filas.find((f) => f.categoria === 'Salidas')).toBeUndefined()
  })

  it('un gasto con categoria_id en null, construido sin pasar por asignarCategoria, conserva su monto en la vista pero totalesPorMesYCategoria falla con un error propio y distinguible (comportamiento defensivo)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('75.00') }) // nunca se le asigna categoría
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('75.00'), mes: '2026-08' },
    ])

    // La vista sí conserva el monto (LEFT JOIN, no INNER JOIN) — se verifica directo contra la vista.
    const filaVista = await base.pool.query(
      "SELECT total, categoria FROM vista_gastos_mensuales WHERE mes = '2026-08'",
    )
    expect(filaVista.rows[0]?.categoria).toBeNull()
    expect(new Decimal(filaVista.rows[0]?.total).equals(new Decimal('75.00'))).toBe(true)

    // El repositorio, en cambio, no lo presenta como una fila más: falla explícitamente.
    await expect(repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')).rejects.toThrow()
  })

  it('devuelve los meses del rango con ambos extremos incluidos, y omite los de afuera (rango de meses)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('300.00'), cuotasTotal: 3 })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-07' }, // antes del rango
      { numeroCuota: 2, monto: new Decimal('100.00'), mes: '2026-08' }, // extremo desde
      { numeroCuota: 3, monto: new Decimal('100.00'), mes: '2026-09' }, // extremo hasta
    ])
    const otroGasto = await crearGasto({ montoTotal: new Decimal('100.00') })
    await repositorioGastos.asignarCategoria(otroGasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(otroGasto.id, [
      { numeroCuota: 1, monto: new Decimal('100.00'), mes: '2026-10' }, // después del rango
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-09')

    expect(new Set(filas.map((f) => f.mes))).toEqual(new Set(['2026-08', '2026-09']))
  })

  it('un rango sin imputaciones devuelve un arreglo vacío, no un error (rango de meses)', async () => {
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-01', '2026-12')

    expect(filas).toEqual([])
  })

  it('un total agregado a partir de montos sin representación exacta en binario devuelve el valor decimal exacto (fidelidad decimal)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gastoA = await crearGasto({ montoTotal: new Decimal('428.55') })
    const gastoB = await crearGasto({ montoTotal: new Decimal('1234.57') })
    await repositorioGastos.asignarCategoria(gastoA.id, 'Comida', 'regla', null)
    await repositorioGastos.asignarCategoria(gastoB.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gastoA.id, [
      { numeroCuota: 1, monto: new Decimal('428.55'), mes: '2026-08' },
    ])
    await repositorioImputaciones.reemplazarPara(gastoB.id, [
      { numeroCuota: 1, monto: new Decimal('1234.57'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(filas.find((f) => f.categoria === 'Comida')?.total.equals(new Decimal('1663.12'))).toBe(true)
  })

  it('el mes de cada fila es la cadena AAAA-MM exacta, sin el relleno de la columna char(7) (fidelidad del mes)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await crearGasto({ montoTotal: new Decimal('10.00') })
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: new Decimal('10.00'), mes: '2026-08' },
    ])

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    expect(filas[0]?.mes).toBe('2026-08')
    expect(filas[0]?.mes.length).toBe(7)
  })

  it('andamiaje: la migración crea vista_gastos_mensuales y volver a correrla no falla', async () => {
    const { aplicarMigraciones } = await import('@/infra/db/migrar')
    await expect(aplicarMigraciones(base.pool)).resolves.not.toThrow()

    const vistas = await base.pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.views WHERE table_name = 'vista_gastos_mensuales'`,
    )
    expect(vistas.rows).toHaveLength(1)
  })
})
