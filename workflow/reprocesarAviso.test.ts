import Decimal from 'decimal.js'
import { InngestTestEngine } from '@inngest/test'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { ClienteIA, RespuestaInferencia } from '@/infra/ia/inferirCategoria'
import { crearFuncionReprocesarAviso } from '@/workflow/reprocesarAviso'
import { leerCuerpoHtmlDeAviso } from '@/test/fixtures/avisos-santander/leerAvisoEml'

/** Casilla simulada mínima: siempre se abstiene (Req. 6.7), igual que en `procesarAviso.test.ts`. */
function crearClienteIASimulado(respuesta: RespuestaInferencia = { categoria: 'no_estoy_seguro', justificacion: '' }): ClienteIA {
  return {
    inferir: async () => respuesta,
  }
}

/** HTML sintético con `Cuotas` configurable, igual convención que `procesarAviso.test.ts` (T36). */
function cuerpoSintetico({ monto, comercio, cuotas }: { monto: string; comercio: string; cuotas?: string }) {
  return `
    <html><body>
      <div><div>Monto</div><div>${monto}</div></div>
      <div><div>Comercio</div><div>${comercio}</div></div>
      <div><div>Fecha</div><div>24/08/2026</div></div>
      <div><div>Hora</div><div>10:00</div></div>
      ${cuotas ? `<div><div>Cuotas</div><div>${cuotas}</div></div>` : ''}
      <p>Tarjeta Santander Visa Crédito terminada en 1234.</p>
    </body></html>
  `
}

describe('reprocesarAviso (T40)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos, reglas_categoria CASCADE')
  })

  let contador = 0
  /**
   * Persiste el email crudo directamente con `RepositorioEmails.guardarSiEsNuevo` — sin pasar por
   * ningún `ClienteGmail` —, exactamente como haría un email ya ingerido por una corrida anterior de
   * `procesarAviso`. `DependenciasReprocesarAviso` (T40) no declara ningún campo `clienteGmail`: no
   * hay ningún objeto de ese tipo que pasarle a `crearFuncionReprocesarAviso`, así que "nunca vuelve a
   * Gmail" (Req. 10.3) es una garantía de compilación en vez de un espía en tiempo de ejecución — el
   * mismo idioma que ya usa `RepositorioEmails.traerCrudo` (T21, "sin ClienteGmail en la firma").
   */
  async function crearEmailCrudo(cuerpo: string): Promise<string> {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t40-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo,
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return id
  }

  function crearDependencias() {
    return {
      repositorioEmails: crearRepositorioEmails(base.pool),
      repositorioGastos: crearRepositorioGastos(base.pool),
      repositorioReglas: crearRepositorioReglas(base.pool),
      repositorioImputaciones: crearRepositorioImputaciones(base.pool),
      clienteIA: crearClienteIASimulado(),
    }
  }

  it('sobre un email sin gasto previo, produce el gasto y sus imputaciones tomando el cuerpo desde la base (Req. 10.3)', async () => {
    const emailId = await crearEmailCrudo(leerCuerpoHtmlDeAviso('debito.eml'))
    const dependencias = crearDependencias()
    const funcion = crearFuncionReprocesarAviso(dependencias)

    await new InngestTestEngine({ function: funcion }).execute({
      events: [{ name: 'aviso/reprocesar', data: { emailId } }],
    })

    const filaGasto = await base.pool.query(
      `SELECT id, estado, monto_total, comercio FROM gastos WHERE email_id = $1`,
      [emailId],
    )
    expect(filaGasto.rows).toHaveLength(1)
    expect(filaGasto.rows[0]?.estado).toBe('imputado')
    expect(filaGasto.rows[0]?.monto_total).toBe('20500.00')
    expect(filaGasto.rows[0]?.comercio).toBe('FRANCESCA')

    const imputaciones = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      filaGasto.rows[0]?.id,
    ])
    expect(imputaciones.rows[0]?.count).toBe('1')
  })

  it('sobre un email cuyo gasto ya existe en needs_review, actualiza ese gasto en vez de insertar uno nuevo, sin violar la unicidad de email_id (Req. 10.3)', async () => {
    const cuerpo = cuerpoSintetico({ monto: '$300,00', comercio: 'COMERCIO-REPROCESADO', cuotas: '3' })
    const emailId = await crearEmailCrudo(cuerpo)
    const dependencias = crearDependencias()
    // El gasto que una corrida anterior de `procesarAviso` dejó en `needs_review` (T32) — mismo
    // `email_id`, todavía sin los siete campos de datos.
    const gastoPrevio = await dependencias.repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})

    const funcion = crearFuncionReprocesarAviso(dependencias)
    await new InngestTestEngine({ function: funcion }).execute({
      events: [{ name: 'aviso/reprocesar', data: { emailId, gastoExistenteId: gastoPrevio.id } }],
    })

    const filas = await base.pool.query(
      `SELECT id, estado, monto_total, comercio, cuotas_total FROM gastos WHERE email_id = $1`,
      [emailId],
    )
    // Una sola fila: `actualizarDatos` es un UPDATE, nunca un segundo INSERT (Req. 10.3, T18 UNIQUE).
    expect(filas.rows).toHaveLength(1)
    expect(filas.rows[0]?.id).toBe(gastoPrevio.id)
    expect(filas.rows[0]?.estado).toBe('imputado')
    // `$300,00` es el valor de UNA cuota (Req. 8.8, `resolverMontoTotal` con `INTERPRETACION_MONTO`
    // fijada en `'valor_de_la_cuota'`); el monto total de la compra en 3 cuotas es 900.
    expect(new Decimal(filas.rows[0]?.monto_total).equals(new Decimal('900.00'))).toBe(true)
    expect(filas.rows[0]?.comercio).toBe('COMERCIO-REPROCESADO')
    expect(filas.rows[0]?.cuotas_total).toBe(3)

    const imputaciones = await base.pool.query<{ numero_cuota: number }>(
      'SELECT numero_cuota FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gastoPrevio.id],
    )
    expect(imputaciones.rows.map((f) => f.numero_cuota)).toEqual([1, 2, 3])
  })

  it('reprocesar el mismo email dos veces no duplica el gasto ni las imputaciones (idempotencia de T37)', async () => {
    const cuerpo = cuerpoSintetico({ monto: '$150,00', comercio: 'COMERCIO-IDEMPOTENTE-REPROCESO' })
    const emailId = await crearEmailCrudo(cuerpo)
    const dependencias = crearDependencias()
    const gastoPrevio = await dependencias.repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})

    await new InngestTestEngine({ function: crearFuncionReprocesarAviso(dependencias) }).execute({
      events: [{ name: 'aviso/reprocesar', data: { emailId, gastoExistenteId: gastoPrevio.id } }],
    })
    await new InngestTestEngine({ function: crearFuncionReprocesarAviso(dependencias) }).execute({
      events: [{ name: 'aviso/reprocesar', data: { emailId, gastoExistenteId: gastoPrevio.id } }],
    })

    const filasGasto = await base.pool.query('SELECT count(*)::text AS count FROM gastos WHERE email_id = $1', [
      emailId,
    ])
    expect(filasGasto.rows[0]?.count).toBe('1')

    const imputaciones = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      gastoPrevio.id,
    ])
    expect(imputaciones.rows[0]?.count).toBe('1')
  })
})
