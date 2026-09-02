import Decimal from 'decimal.js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { GastoNormalizado } from '@/dominio/normalizacion/normalizarAviso'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { Mes } from '@/dominio/imputacion/mesDe'
import { obtenerHallazgosHabitos, MESES_VENTANA_HABITOS } from '@/app/habitos/obtenerHallazgosHabitos'

function datosCompletos(parcial: Partial<GastoNormalizado> = {}): GastoNormalizado {
  return {
    montoTotal: new Decimal('1000.00'),
    moneda: 'ARS',
    comercio: 'WWWAYSACOMAR',
    fechaGasto: new Date('2026-08-05T14:00:00.000Z'),
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '9344',
    cuotasTotal: 1,
    ...parcial,
  }
}

describe('obtenerHallazgosHabitos — Req. 2.1, 2.2, 2.12 (T11)', () => {
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
  /** Crea un gasto con una única imputación en `mes`, para que aparezca tanto en `gastosEntreFechas`
   * (tabla `gastos`) como en `totalesPorMesYCategoria` (`vista_gastos_mensuales`). */
  async function crearGastoImputado(opts: {
    montoTotal: Decimal
    comercio: string
    categoria: Categoria
    fechaGasto: Date
    mes: Mes
  }) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t11-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $1.000,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: opts.fechaGasto,
    })
    const gasto = await repositorioGastos.crear(
      datosCompletos({ montoTotal: opts.montoTotal, comercio: opts.comercio, fechaGasto: opts.fechaGasto }),
      emailId,
    )
    await repositorioGastos.asignarCategoria(gasto.id, opts.categoria, 'regla', null)
    await repositorioImputaciones.reemplazarPara(gasto.id, [
      { numeroCuota: 1, monto: opts.montoTotal, mes: opts.mes },
    ])
    return gasto
  }

  it('con la base vacía de imputaciones devuelve [] sin lanzar (Req. 2.2)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    expect(MESES_VENTANA_HABITOS).toBe(6)

    await expect(
      obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, new Date('2026-08-20T14:00:00.000Z')),
    ).resolves.toEqual([])
  })

  it('resuelve mesEnFoco como el mes más reciente con imputaciones y calcula las cuatro reglas con valores correctos (Req. 2.1, 2.12)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    // Tres meses calendario consecutivos: junio y julio habilitan variación por categoría y ritmo de
    // gasto; agosto (mesEnFoco) trae dos gastos del mismo comercio normalizado para el hallazgo de
    // comercio recurrente, y una única categoría (sin empate) para la categoría dominante.
    await crearGastoImputado({
      montoTotal: new Decimal('200.00'),
      comercio: 'ALMACEN',
      categoria: 'Comida',
      fechaGasto: new Date('2026-06-10T14:00:00.000Z'),
      mes: '2026-06',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('300.00'),
      comercio: 'ALMACEN',
      categoria: 'Comida',
      fechaGasto: new Date('2026-07-10T14:00:00.000Z'),
      mes: '2026-07',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('1000.00'),
      comercio: 'WWWAYSACOMAR',
      categoria: 'Comida',
      fechaGasto: new Date('2026-08-05T14:00:00.000Z'),
      mes: '2026-08',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('500.00'),
      comercio: 'WWWAYSACOMAR',
      categoria: 'Comida',
      fechaGasto: new Date('2026-08-10T14:00:00.000Z'),
      mes: '2026-08',
    })

    const ahora = new Date('2026-08-20T14:00:00.000Z') // día calendario 20 en America/Argentina/Buenos_Aires

    const hallazgos = await obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, ahora)

    expect(hallazgos).toHaveLength(4)

    const categoriaDominante = hallazgos.find((h) => h.tipo === 'categoriaDominante')
    expect(categoriaDominante).toBeDefined()
    if (categoriaDominante?.tipo === 'categoriaDominante') {
      expect(categoriaDominante.categoria).toBe('Comida')
      expect(categoriaDominante.totalCategoria.equals(new Decimal('1500.00'))).toBe(true)
      expect(categoriaDominante.totalMes.equals(new Decimal('1500.00'))).toBe(true)
      expect(categoriaDominante.porcentaje).toBe(100)
    }

    // El mes inmediatamente anterior a agosto (mesEnFoco) es julio, no junio — confirma que mesEnFoco
    // se resolvió como agosto y no como un mes anterior.
    const variacionCategoria = hallazgos.find((h) => h.tipo === 'variacionCategoria')
    expect(variacionCategoria).toBeDefined()
    if (variacionCategoria?.tipo === 'variacionCategoria') {
      expect(variacionCategoria.categoria).toBe('Comida')
      expect(variacionCategoria.totalMesFoco.equals(new Decimal('1500.00'))).toBe(true)
      expect(variacionCategoria.totalMesAnterior.equals(new Decimal('300.00'))).toBe(true)
      expect(variacionCategoria.variacionPct).toBe(400)
    }

    // mesesConsiderados: 2 (junio y julio) — si mesEnFoco fuera otro mes, este número cambiaría.
    const ritmoGasto = hallazgos.find((h) => h.tipo === 'ritmoGasto')
    expect(ritmoGasto).toBeDefined()
    if (ritmoGasto?.tipo === 'ritmoGasto') {
      expect(ritmoGasto.totalHastaHoyMesFoco.equals(new Decimal('1500.00'))).toBe(true)
      expect(ritmoGasto.promedioHastaMismoDiaMesesAnteriores.equals(new Decimal('250.00'))).toBe(true)
      expect(ritmoGasto.mesesConsiderados).toBe(2)
      expect(ritmoGasto.variacionPct).toBe(500)
    }

    const comercioRecurrente = hallazgos.find((h) => h.tipo === 'comercioRecurrente')
    expect(comercioRecurrente).toBeDefined()
    if (comercioRecurrente?.tipo === 'comercioRecurrente') {
      expect(comercioRecurrente.comercio).toBe('WWWAYSACOMAR')
      expect(comercioRecurrente.cantidadGastos).toBe(2)
      expect(comercioRecurrente.totalComercio.equals(new Decimal('1500.00'))).toBe(true)
    }
  })

  it('cuando una regla no puede calcular su hallazgo (sin mes inmediatamente anterior), las otras tres igual aparecen (Req. 2.12)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)

    // Mayo y junio tienen imputaciones, pero julio (el mes inmediatamente anterior a agosto) queda sin
    // ninguna — calcularVariacionCategoria debe devolver [] (2.6) sin impedir que las otras tres reglas
    // se calculen con mayo/junio como meses anteriores disponibles para el ritmo de gasto.
    await crearGastoImputado({
      montoTotal: new Decimal('150.00'),
      comercio: 'FERRETERIA',
      categoria: 'Extras',
      fechaGasto: new Date('2026-05-10T14:00:00.000Z'),
      mes: '2026-05',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('250.00'),
      comercio: 'FERRETERIA',
      categoria: 'Extras',
      fechaGasto: new Date('2026-06-10T14:00:00.000Z'),
      mes: '2026-06',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('400.00'),
      comercio: 'KIOSCO',
      categoria: 'Comida',
      fechaGasto: new Date('2026-08-05T14:00:00.000Z'),
      mes: '2026-08',
    })
    await crearGastoImputado({
      montoTotal: new Decimal('600.00'),
      comercio: 'KIOSCO',
      categoria: 'Comida',
      fechaGasto: new Date('2026-08-12T14:00:00.000Z'),
      mes: '2026-08',
    })

    const ahora = new Date('2026-08-20T14:00:00.000Z')

    const hallazgos = await obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, ahora)

    const variacionCategoria = hallazgos.filter((h) => h.tipo === 'variacionCategoria')
    expect(variacionCategoria).toEqual([])

    const categoriaDominante = hallazgos.find((h) => h.tipo === 'categoriaDominante')
    expect(categoriaDominante).toBeDefined()
    if (categoriaDominante?.tipo === 'categoriaDominante') {
      expect(categoriaDominante.categoria).toBe('Comida')
      expect(categoriaDominante.totalCategoria.equals(new Decimal('1000.00'))).toBe(true)
    }

    const ritmoGasto = hallazgos.find((h) => h.tipo === 'ritmoGasto')
    expect(ritmoGasto).toBeDefined()
    if (ritmoGasto?.tipo === 'ritmoGasto') {
      expect(ritmoGasto.mesesConsiderados).toBe(2)
      expect(ritmoGasto.totalHastaHoyMesFoco.equals(new Decimal('1000.00'))).toBe(true)
      expect(ritmoGasto.promedioHastaMismoDiaMesesAnteriores.equals(new Decimal('200.00'))).toBe(true)
    }

    const comercioRecurrente = hallazgos.find((h) => h.tipo === 'comercioRecurrente')
    expect(comercioRecurrente).toBeDefined()
    if (comercioRecurrente?.tipo === 'comercioRecurrente') {
      expect(comercioRecurrente.comercio).toBe('KIOSCO')
      expect(comercioRecurrente.cantidadGastos).toBe(2)
      expect(comercioRecurrente.totalComercio.equals(new Decimal('1000.00'))).toBe(true)
    }

    expect(hallazgos).toHaveLength(3)
  })
})
