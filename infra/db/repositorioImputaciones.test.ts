import Decimal from 'decimal.js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioImputaciones, type NuevaImputacion } from '@/infra/db/repositorioImputaciones'
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

function imputacion(numeroCuota: number, monto: string, mes: string): NuevaImputacion {
  return { numeroCuota, monto: new Decimal(monto), mes }
}

describe('RepositorioImputaciones.reemplazarPara y la migración de imputaciones (T19)', () => {
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
  async function crearGasto(): Promise<string> {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t19-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    return gasto.id
  }

  async function filasDe(gastoId: string) {
    const resultado = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gastoId],
    )
    return resultado.rows
  }

  it('dos llamadas consecutivas con el mismo arreglo dejan exactamente las mismas filas (Req. 8.6)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const arreglo = [imputacion(1, '428.55', '2026-08'), imputacion(2, '428.55', '2026-09')]

    await repositorioImputaciones.reemplazarPara(gastoId, arreglo)
    await repositorioImputaciones.reemplazarPara(gastoId, arreglo)
    await repositorioImputaciones.reemplazarPara(gastoId, arreglo)

    const filas = await filasDe(gastoId)
    expect(filas).toHaveLength(2)
    expect(filas[0]).toMatchObject({ numero_cuota: 1, mes: '2026-08' })
    expect(filas[1]).toMatchObject({ numero_cuota: 2, mes: '2026-09' })
  })

  it('un segundo reemplazarPara con un arreglo más corto deja solo las filas del arreglo nuevo (Req. 8.6)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const seis = Array.from({ length: 6 }, (_, i) =>
      imputacion(i + 1, '100.00', `2026-${String(8 + i).padStart(2, '0')}`),
    )
    await repositorioImputaciones.reemplazarPara(gastoId, seis)

    const tres = seis.slice(0, 3)
    await repositorioImputaciones.reemplazarPara(gastoId, tres)

    const filas = await filasDe(gastoId)
    expect(filas).toHaveLength(3)
    expect(filas.map((f) => f.numero_cuota)).toEqual([1, 2, 3])
  })

  it('un INSERT directo que repite gasto_id y numero_cuota viola la restricción de unicidad (Req. 8.6)', async () => {
    const gastoId = await crearGasto()
    await base.pool.query(
      "INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, 1, 100, '2026-08')",
      [gastoId],
    )

    await expect(
      base.pool.query(
        "INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, 1, 200, '2026-09')",
        [gastoId],
      ),
    ).rejects.toThrow()
  })

  it('reemplazarPara con un arreglo que repite numero_cuota rechaza la llamada y deja intactas las filas anteriores (atomicidad, Req. 8.6)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    await repositorioImputaciones.reemplazarPara(gastoId, [imputacion(1, '2571.30', '2026-08')])

    await expect(
      repositorioImputaciones.reemplazarPara(gastoId, [
        imputacion(1, '1000.00', '2026-08'),
        imputacion(1, '1571.30', '2026-09'),
      ]),
    ).rejects.toThrow()

    const filas = await filasDe(gastoId)
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ numero_cuota: 1, mes: '2026-08' })
    expect(new Decimal(filas[0]!.monto).equals(new Decimal('2571.30'))).toBe(true)
  })

  it('reemplazarPara sobre un gasto deja intactas las imputaciones de otro gasto (aislamiento)', async () => {
    const gastoA = await crearGasto()
    const gastoB = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    await repositorioImputaciones.reemplazarPara(gastoA, [imputacion(1, '100.00', '2026-08')])
    await repositorioImputaciones.reemplazarPara(gastoB, [imputacion(1, '200.00', '2026-08')])

    await repositorioImputaciones.reemplazarPara(gastoA, [
      imputacion(1, '50.00', '2026-08'),
      imputacion(2, '50.00', '2026-09'),
    ])

    const filasB = await filasDe(gastoB)
    expect(filasB).toHaveLength(1)
    expect(new Decimal(filasB[0]!.monto).equals(new Decimal('200.00'))).toBe(true)
  })

  it('un monto con decimales escrito y releído devuelve el mismo valor decimal exacto (fidelidad decimal)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    await repositorioImputaciones.reemplazarPara(gastoId, [imputacion(1, '428.55', '2026-08')])

    const filas = await filasDe(gastoId)
    expect(new Decimal(filas[0]!.monto).equals(new Decimal('428.55'))).toBe(true)
  })

  it('el mes releído es igual a la cadena AAAA-MM de entrada, sin relleno de columna (fidelidad del mes)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    await repositorioImputaciones.reemplazarPara(gastoId, [imputacion(1, '100.00', '2026-08')])

    const filas = await filasDe(gastoId)
    expect(filas[0]?.mes).toBe('2026-08')
    expect(filas[0]?.mes.length).toBe(7)
  })

  it('cardinalidad: un arreglo de seis elementos deja seis filas, y uno de un elemento deja una (andamiaje)', async () => {
    const gastoSeis = await crearGasto()
    const gastoUno = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const seis = Array.from({ length: 6 }, (_, i) =>
      imputacion(i + 1, '100.00', `2026-${String(8 + i).padStart(2, '0')}`),
    )

    await repositorioImputaciones.reemplazarPara(gastoSeis, seis)
    await repositorioImputaciones.reemplazarPara(gastoUno, [imputacion(1, '2571.30', '2026-08')])

    expect(await filasDe(gastoSeis)).toHaveLength(6)
    expect(await filasDe(gastoUno)).toHaveLength(1)
  })

  it('andamiaje: las migraciones dejan imputaciones con la forma del modelo de datos y volver a correrlas no falla', async () => {
    const { aplicarMigraciones } = await import('@/infra/db/migrar')
    await expect(aplicarMigraciones(base.pool)).resolves.not.toThrow()

    const indices = await base.pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'imputaciones'`,
    )
    const nombresIndices = indices.rows.map((f) => f.indexname)
    expect(nombresIndices.some((n) => n.includes('mes'))).toBe(true)
  })

  it('andamiaje: borrar la fila de gastos elimina sus imputaciones y no falla por integridad referencial (ON DELETE CASCADE)', async () => {
    const gastoId = await crearGasto()
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    await repositorioImputaciones.reemplazarPara(gastoId, [imputacion(1, '100.00', '2026-08')])

    await expect(base.pool.query('DELETE FROM gastos WHERE id = $1', [gastoId])).resolves.toBeTruthy()

    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      gastoId,
    ])
    expect(conteo.rows[0]?.count).toBe('0')
  })

  it('los CHECK de numero_cuota >= 1 y monto >= 0 rechazan valores fuera de rango', async () => {
    const gastoId = await crearGasto()
    await expect(
      base.pool.query(
        "INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, 0, 100, '2026-08')",
        [gastoId],
      ),
    ).rejects.toThrow()
    await expect(
      base.pool.query(
        "INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, 1, -1, '2026-08')",
        [gastoId],
      ),
    ).rejects.toThrow()
  })
})
