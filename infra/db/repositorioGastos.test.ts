import Decimal from 'decimal.js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos, type Gasto, type OrigenCategoria } from '@/infra/db/repositorioGastos'
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

describe('RepositorioGastos.crear y la migración de gastos (T18)', () => {
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

  async function crearEmailCrudo(gmailMessageId: string): Promise<string> {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return id
  }

  it('un monto_total con decimales persistido y releído devuelve el mismo valor decimal exacto (Req. 3.2)', async () => {
    const emailId = await crearEmailCrudo('msg-decimal')
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const gasto = await repositorioGastos.crear(datosCompletos({ montoTotal: new Decimal('2571.30') }), emailId)

    expect(gasto.montoTotal?.toString()).toBe('2571.3')
    const fila = await base.pool.query<{ monto_total: string }>(
      'SELECT monto_total FROM gastos WHERE id = $1',
      [gasto.id],
    )
    expect(new Decimal(fila.rows[0]!.monto_total).equals(new Decimal('2571.30'))).toBe(true)
  })

  it('un INSERT directo con monto_total en cero o negativo viola la restricción monto_positivo (Req. 3.5)', async () => {
    const emailId1 = await crearEmailCrudo('msg-monto-cero')
    const emailId2 = await crearEmailCrudo('msg-monto-negativo')

    await expect(
      base.pool.query(
        "INSERT INTO gastos (email_id, monto_total, cuotas_total) VALUES ($1, 0, 1)",
        [emailId1],
      ),
    ).rejects.toThrow()
    await expect(
      base.pool.query(
        "INSERT INTO gastos (email_id, monto_total, cuotas_total) VALUES ($1, -5, 1)",
        [emailId2],
      ),
    ).rejects.toThrow()
  })

  it('un INSERT directo con cuotas_total en cero o negativo viola la restricción cuotas_validas (Req. 3.7)', async () => {
    const emailId1 = await crearEmailCrudo('msg-cuotas-cero')
    const emailId2 = await crearEmailCrudo('msg-cuotas-negativas')

    await expect(
      base.pool.query('INSERT INTO gastos (email_id, monto_total, cuotas_total) VALUES ($1, 100, 0)', [
        emailId1,
      ]),
    ).rejects.toThrow()
    await expect(
      base.pool.query('INSERT INTO gastos (email_id, monto_total, cuotas_total) VALUES ($1, 100, -1)', [
        emailId2,
      ]),
    ).rejects.toThrow()
  })

  it('un INSERT con monto_total y cuotas_total en nulo es aceptado por las dos restricciones (Req. 3.5, 3.7, 2.12)', async () => {
    const emailId = await crearEmailCrudo('msg-needs-review')

    await expect(
      base.pool.query('INSERT INTO gastos (email_id, monto_total, cuotas_total) VALUES ($1, NULL, NULL)', [
        emailId,
      ]),
    ).resolves.toBeTruthy()
  })

  it('un gasto se persiste con los seis campos de datos en nulo, y releído los seis siguen en nulo (Req. 2.12)', async () => {
    const emailId = await crearEmailCrudo('msg-todo-null')

    await base.pool.query('INSERT INTO gastos (email_id) VALUES ($1)', [emailId])

    const fila = await base.pool.query(
      `SELECT monto_total, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4, cuotas_total
       FROM gastos WHERE email_id = $1`,
      [emailId],
    )
    expect(fila.rows[0]).toEqual({
      monto_total: null,
      comercio: null,
      fecha_gasto: null,
      tipo_tarjeta: null,
      tarjeta_ultimos4: null,
      cuotas_total: null,
    })
  })

  it('el tipo estado_gasto acepta exactamente los cinco valores del enum y rechaza un sexto (Req. 10.5)', async () => {
    const valores = await base.pool.query<{ valor: string }>(
      `SELECT unnest(enum_range(NULL::estado_gasto))::text AS valor`,
    )
    expect(new Set(valores.rows.map((f) => f.valor))).toEqual(
      new Set(['pendiente', 'extraido', 'categorizado', 'imputado', 'needs_review']),
    )

    const emailId = await crearEmailCrudo('msg-estado-invalido')
    await expect(
      base.pool.query("INSERT INTO gastos (email_id, estado) VALUES ($1, 'archivado')", [emailId]),
    ).rejects.toThrow()
  })

  it('crear deja el gasto en estado extraido, no en pendiente', async () => {
    const emailId = await crearEmailCrudo('msg-extraido')
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)

    expect(gasto.estado).toBe('extraido')
    const fila = await base.pool.query<{ estado: string }>('SELECT estado FROM gastos WHERE id = $1', [
      gasto.id,
    ])
    expect(fila.rows[0]?.estado).toBe('extraido')
  })

  it('crear persiste el GastoNormalizado completo y devuelve el email_id y el id de la fila creada', async () => {
    const emailId = await crearEmailCrudo('msg-completo')
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const datos = datosCompletos({
      comercio: 'FRANCESCA',
      tipoTarjeta: 'credito',
      tarjetaUltimos4: '1324',
      cuotasTotal: 3,
      fechaGasto: new Date('2026-08-22T04:34:00.000Z'),
    })

    const gasto = await repositorioGastos.crear(datos, emailId)

    expect(gasto.emailId).toBe(emailId)
    expect(gasto.comercio).toBe('FRANCESCA')
    expect(gasto.tipoTarjeta).toBe('credito')
    expect(gasto.tarjetaUltimos4).toBe('1324')
    expect(gasto.cuotasTotal).toBe(3)
    expect(gasto.fechaGasto?.toISOString()).toBe('2026-08-22T04:34:00.000Z')
    expect(gasto.moneda).toBe('ARS')
    expect(typeof gasto.id).toBe('string')

    const fila = await base.pool.query('SELECT email_id, comercio FROM gastos WHERE id = $1', [gasto.id])
    expect(fila.rows[0]?.email_id).toBe(emailId)
    expect(fila.rows[0]?.comercio).toBe('FRANCESCA')
  })

  it('email_id es único: un segundo crear con el mismo emailId viola la restricción de unicidad', async () => {
    const emailId = await crearEmailCrudo('msg-duplicado')
    const repositorioGastos = crearRepositorioGastos(base.pool)

    await repositorioGastos.crear(datosCompletos(), emailId)

    await expect(repositorioGastos.crear(datosCompletos(), emailId)).rejects.toThrow()
  })

  it('andamiaje: las migraciones corren desde cero y dejar tipo_tarjeta con exactamente debito y credito; volver a correrlas no falla', async () => {
    const valores = await base.pool.query<{ valor: string }>(
      `SELECT unnest(enum_range(NULL::tipo_tarjeta))::text AS valor`,
    )
    expect(new Set(valores.rows.map((f) => f.valor))).toEqual(new Set(['debito', 'credito']))

    const { aplicarMigraciones } = await import('@/infra/db/migrar')
    await expect(aplicarMigraciones(base.pool)).resolves.not.toThrow()
  })
})

describe('RepositorioGastos.crearManual (T2, Req. 4.1)', () => {
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

  it('crea un gasto sin email de origen, ya categorizado por el usuario (Req. 4.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const gasto: Gasto = await repositorioGastos.crearManual({
      montoTotal: new Decimal('1234.56'),
      comercio: 'Kiosco',
      fechaGasto: new Date('2026-09-03T12:00:00.000Z'),
      categoria: 'Comida',
    })

    expect(gasto.emailId).toBeNull()
    expect(gasto.categoriaOrigen).toBe('usuario')
    expect(gasto.categoria).toBe('Comida')
    expect(gasto.estado).toBe('categorizado')
    expect(gasto.montoTotal?.equals(new Decimal('1234.56'))).toBe(true)
    expect(gasto.comercio).toBe('Kiosco')

    const fila = await base.pool.query<{ email_id: string | null; estado: string; categoria_origen: string }>(
      'SELECT email_id, estado, categoria_origen FROM gastos WHERE id = $1',
      [gasto.id],
    )
    expect(fila.rows[0]?.email_id).toBeNull()
    expect(fila.rows[0]?.estado).toBe('categorizado')
    expect(fila.rows[0]?.categoria_origen).toBe('usuario')
  })
})

describe('RepositorioGastos.asignarCategoria y marcarParaRevision (T22)', () => {
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
  async function crearGastoDePrueba(): Promise<{ id: string; repositorioGastos: ReturnType<typeof crearRepositorioGastos> }> {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t22-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crear(datosCompletos(), emailId)
    return { id: gasto.id, repositorioGastos }
  }

  async function filaCompleta(id: string) {
    const resultado = await base.pool.query(
      `SELECT estado, categoria_id, categoria_origen, categoria_justificacion, confirmado_en,
              motivo_revision, ultimo_error, monto_total, comercio, fecha_gasto, tipo_tarjeta,
              tarjeta_ultimos4, cuotas_total, email_id
       FROM gastos WHERE id = $1`,
      [id],
    )
    return resultado.rows[0]
  }

  it('asignarCategoria con origen ia persiste la justificación del modelo verbatim, con acentos y saltos de línea (Req. 6.6)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()
    const justificacion =
      'El comercio "PAYU*AR*UBER" corresponde a viajes.\nSe infiere Extras por el patrón de gasto habitual — categoría razonable.'

    await repositorioGastos.asignarCategoria(id, 'Extras', 'ia', justificacion)

    const fila = await filaCompleta(id)
    expect(fila.categoria_justificacion).toBe(justificacion)
  })

  it('asignarCategoria con origen ia y una traza de error como justificación la persiste verbatim también (Req. 6.6, 10.4)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()
    const traza = 'Error: fetch failed\n  at inferirCategoria (infra/ia/inferirCategoria.ts:60:23)\n  reintentos agotados'

    await repositorioGastos.asignarCategoria(id, 'Sin categorizar', 'ia', traza)

    const fila = await filaCompleta(id)
    expect(fila.categoria_justificacion).toBe(traza)
  })

  it('asignarCategoria con origen regla y justificación null deja categoria_justificacion en null, no en cadena vacía (Req. 6.6)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()

    await repositorioGastos.asignarCategoria(id, 'Comida', 'regla', null)

    const fila = await filaCompleta(id)
    expect(fila.categoria_justificacion).toBeNull()
  })

  it('confirmado_en según el origen: regla lo deja con un instante, ia lo deja en null (Req. 5.3, 6.3)', async () => {
    const conRegla = await crearGastoDePrueba()
    const conIa = await crearGastoDePrueba()

    await conRegla.repositorioGastos.asignarCategoria(conRegla.id, 'Comida', 'regla', null)
    await conIa.repositorioGastos.asignarCategoria(conIa.id, 'Extras', 'ia', 'justificación del modelo')

    const filaRegla = await filaCompleta(conRegla.id)
    const filaIa = await filaCompleta(conIa.id)
    expect(filaRegla.confirmado_en).not.toBeNull()
    expect(filaIa.confirmado_en).toBeNull()
  })

  it.each(['Salidas', 'Comida', 'Extras', 'Sin categorizar'] as const)(
    'asignarCategoria resuelve categoria_id contra la fila de categorias con nombre %s',
    async (nombreCategoria) => {
      const { id, repositorioGastos } = await crearGastoDePrueba()

      await repositorioGastos.asignarCategoria(id, nombreCategoria, 'regla', null)

      const resultado = await base.pool.query(
        `SELECT c.nombre FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
        [id],
      )
      expect(resultado.rows[0]?.nombre).toBe(nombreCategoria)
    },
  )

  it('asignarCategoria deja estado en categorizado (no imputado ni extraido); marcarParaRevision deja needs_review (Req. 10.4, 10.5)', async () => {
    const paraCategorizar = await crearGastoDePrueba()
    const paraRevision = await crearGastoDePrueba()

    await paraCategorizar.repositorioGastos.asignarCategoria(paraCategorizar.id, 'Comida', 'regla', null)
    await paraRevision.repositorioGastos.marcarParaRevision(paraRevision.id, 'monto_invalido', null)

    expect((await filaCompleta(paraCategorizar.id)).estado).toBe('categorizado')
    expect((await filaCompleta(paraRevision.id)).estado).toBe('needs_review')
  })

  it('marcarParaRevision persiste motivo_revision exacto; dos gastos con motivos distintos conservan el suyo (Req. 10.4)', async () => {
    const gastoA = await crearGastoDePrueba()
    const gastoB = await crearGastoDePrueba()

    await gastoA.repositorioGastos.marcarParaRevision(gastoA.id, 'monto_invalido', null)
    await gastoB.repositorioGastos.marcarParaRevision(gastoB.id, 'error_de_paso', null)

    expect((await filaCompleta(gastoA.id)).motivo_revision).toBe('monto_invalido')
    expect((await filaCompleta(gastoB.id)).motivo_revision).toBe('error_de_paso')
  })

  it('marcarParaRevision persiste ultimo_error verbatim, multilínea, y no lo confunde con motivo_revision (Req. 10.4)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()
    const traza = [
      'TypeError: Cannot read properties of undefined',
      '  at normalizarAviso (dominio/normalizacion/normalizarAviso.ts:52:10)',
      '  at extraer (workflow/procesarAviso.ts:60:5)',
      'Reintento 3/3 agotado.',
    ].join('\n')

    await repositorioGastos.marcarParaRevision(id, 'cuotas_invalidas', traza)

    const fila = await filaCompleta(id)
    expect(fila.ultimo_error).toBe(traza)
    expect(fila.motivo_revision).toBe('cuotas_invalidas')
    expect(fila.ultimo_error).not.toBe(fila.motivo_revision)
  })

  it('un null explícito en ultimoError deja la columna en null, sin fabricar ningún texto (Req. 10.4)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()

    await repositorioGastos.marcarParaRevision(id, 'monto_invalido', null)

    const fila = await filaCompleta(id)
    expect(fila.ultimo_error).toBeNull()
  })

  it('un gasto al que solo se le llamó asignarCategoria tiene motivo_revision y ultimo_error en null (Req. 10.4)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()

    await repositorioGastos.asignarCategoria(id, 'Comida', 'regla', null)

    const fila = await filaCompleta(id)
    expect(fila.motivo_revision).toBeNull()
    expect(fila.ultimo_error).toBeNull()
  })

  it('marcarParaRevision sobre un gasto en categorizado lo lleva igual a needs_review (destino alcanzable desde cualquier paso)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()
    await repositorioGastos.asignarCategoria(id, 'Comida', 'regla', null)

    await repositorioGastos.marcarParaRevision(id, 'error_de_paso', 'fallo en step imputar')

    expect((await filaCompleta(id)).estado).toBe('needs_review')
  })

  it('asignarCategoria cambia categoría, origen, justificación, estado y confirmado_en, y nada más — el resto de las columnas queda idéntico (Req. 2.12)', async () => {
    const { id, repositorioGastos } = await crearGastoDePrueba()
    const antes = await filaCompleta(id)

    await repositorioGastos.asignarCategoria(id, 'Comida', 'regla', null)

    const despues = await filaCompleta(id)
    expect(despues.monto_total).toBe(antes.monto_total)
    expect(despues.comercio).toBe(antes.comercio)
    expect(new Date(despues.fecha_gasto).toISOString()).toBe(new Date(antes.fecha_gasto).toISOString())
    expect(despues.tipo_tarjeta).toBe(antes.tipo_tarjeta)
    expect(despues.tarjeta_ultimos4).toBe(antes.tarjeta_ultimos4)
    expect(despues.cuotas_total).toBe(antes.cuotas_total)
    expect(despues.email_id).toBe(antes.email_id)
  })

  it('marcarParaRevision toca estado, motivo_revision y ultimo_error, y nada más — no completa ningún campo nulo (Req. 2.12)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    contador += 1
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t22-parcial-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    await base.pool.query('INSERT INTO gastos (email_id) VALUES ($1)', [emailId])
    const fila0 = await base.pool.query('SELECT id FROM gastos WHERE email_id = $1', [emailId])
    const gastoId = fila0.rows[0].id as string

    await repositorioGastos.marcarParaRevision(gastoId, 'campos_faltantes', null)

    const fila = await filaCompleta(gastoId)
    expect(fila.estado).toBe('needs_review')
    expect(fila.monto_total).toBeNull()
    expect(fila.comercio).toBeNull()
    expect(fila.fecha_gasto).toBeNull()
    expect(fila.tipo_tarjeta).toBeNull()
    expect(fila.tarjeta_ultimos4).toBeNull()
    expect(fila.cuotas_total).toBeNull()
  })

  it('idempotencia: una segunda marcarParaRevision con otro ultimoError deja el último; una segunda asignarCategoria reemplaza la categoría (Req. 8.7)', async () => {
    const paraRevision = await crearGastoDePrueba()
    await paraRevision.repositorioGastos.marcarParaRevision(paraRevision.id, 'monto_invalido', 'primer error')
    await paraRevision.repositorioGastos.marcarParaRevision(paraRevision.id, 'monto_invalido', 'segundo error')
    const filaRevision = await filaCompleta(paraRevision.id)
    expect(filaRevision.ultimo_error).toBe('segundo error')
    expect(filaRevision.estado).toBe('needs_review')

    const paraCategoria = await crearGastoDePrueba()
    await paraCategoria.repositorioGastos.asignarCategoria(paraCategoria.id, 'Comida', 'regla', null)
    await paraCategoria.repositorioGastos.asignarCategoria(paraCategoria.id, 'Salidas', 'regla', null)
    const resultado = await base.pool.query(
      `SELECT c.nombre FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [paraCategoria.id],
    )
    expect(resultado.rows[0]?.nombre).toBe('Salidas')
    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM gastos WHERE id = $1', [
      paraCategoria.id,
    ])
    expect(conteo.rows[0]?.count).toBe('1')
  })

  it('OrigenCategoria expone exactamente los tres valores del enum de la base (andamiaje)', async () => {
    const origenes: OrigenCategoria[] = ['regla', 'ia', 'usuario']
    const valores = await base.pool.query<{ valor: string }>(
      `SELECT unnest(enum_range(NULL::origen_categoria))::text AS valor`,
    )
    expect(new Set(valores.rows.map((f) => f.valor))).toEqual(new Set(origenes))
  })
})

describe('RepositorioGastos.confirmar y pendientesDeConfirmacion (T23)', () => {
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
  async function crearGasto(repositorioGastos: ReturnType<typeof crearRepositorioGastos>) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t23-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return repositorioGastos.crear(datosCompletos(), emailId)
  }

  it('confirmar sobre un pendiente con la misma categoría propuesta deja confirmado_en con un instante, origen usuario y la categoría intacta (Req. 7.3)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    await repositorioGastos.confirmar(gasto.id, 'Extras')

    const fila = await base.pool.query(
      `SELECT c.nombre, g.categoria_origen, g.confirmado_en
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    expect(fila.rows[0]?.nombre).toBe('Extras')
    expect(fila.rows[0]?.categoria_origen).toBe('usuario')
    expect(fila.rows[0]?.confirmado_en).not.toBeNull()
  })

  it('confirmar sobre un propuesto como Extras pasando Salidas reemplaza la categoría por el nombre resuelto por el join (Req. 7.4)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación del modelo')

    await repositorioGastos.confirmar(gasto.id, 'Salidas')

    const fila = await base.pool.query(
      `SELECT c.nombre, g.categoria_origen, g.confirmado_en
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    expect(fila.rows[0]?.nombre).toBe('Salidas')
    expect(fila.rows[0]?.categoria_origen).toBe('usuario')
    expect(fila.rows[0]?.confirmado_en).not.toBeNull()
  })

  it('pendientesDeConfirmacion devuelve exactamente los gastos con origen ia y confirmado_en en nulo, excluyendo regla confirmada, ia ya confirmado, y extraido sin categorizar (Req. 7.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const pendienteIa = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(pendienteIa.id, 'Extras', 'ia', 'justificación')

    const confirmadoPorRegla = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(confirmadoPorRegla.id, 'Comida', 'regla', null)

    const yaConfirmadoPorUsuario = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(yaConfirmadoPorUsuario.id, 'Extras', 'ia', 'justificación')
    await repositorioGastos.confirmar(yaConfirmadoPorUsuario.id, 'Extras')

    const soloExtraido = await crearGasto(repositorioGastos) // sin categorizar todavía

    const pendientes = await repositorioGastos.pendientesDeConfirmacion()

    expect(new Set(pendientes.map((g) => g.id))).toEqual(new Set([pendienteIa.id]))
    expect(pendientes.map((g) => g.id)).not.toContain(confirmadoPorRegla.id)
    expect(pendientes.map((g) => g.id)).not.toContain(yaConfirmadoPorUsuario.id)
    expect(pendientes.map((g) => g.id)).not.toContain(soloExtraido.id)
  })

  it('sin ningún gasto pendiente, pendientesDeConfirmacion devuelve una lista vacía (Req. 7.1)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const pendientes = await repositorioGastos.pendientesDeConfirmacion()

    expect(pendientes).toEqual([])
  })

  it('cada Gasto pendiente trae comercio, montoTotal (decimal exacto), fechaGasto, categoria y categoriaJustificacion verbatim (Req. 7.2)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    const justificacion = 'Comercio "PAYU*AR*UBER": inferencia con acentos, comillas y\nsalto de línea.'
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', justificacion)

    const [pendiente] = await repositorioGastos.pendientesDeConfirmacion()

    expect(pendiente?.comercio).toBe('WWWAYSACOMAR')
    expect(pendiente?.montoTotal?.equals(new Decimal('2571.30'))).toBe(true)
    expect(pendiente?.fechaGasto?.toISOString()).toBe('2026-08-24T14:14:00.000Z')
    expect(pendiente?.categoria).toBe('Extras')
    expect(pendiente?.categoriaJustificacion).toBe(justificacion)
  })

  it('un pendiente con categoría Sin categorizar y origen ia está en el listado, con categoria en "Sin categorizar", y confirmar lo saca por la vía de corrección (Req. 7.10)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Sin categorizar', 'ia', null)

    const antes = await repositorioGastos.pendientesDeConfirmacion()
    expect(antes.find((g) => g.id === gasto.id)?.categoria).toBe('Sin categorizar')

    await repositorioGastos.confirmar(gasto.id, 'Comida')

    const despues = await repositorioGastos.pendientesDeConfirmacion()
    expect(despues.find((g) => g.id === gasto.id)).toBeUndefined()
    const fila = await base.pool.query(
      `SELECT c.nombre, g.categoria_origen, g.confirmado_en
       FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    expect(fila.rows[0]?.nombre).toBe('Comida')
    expect(fila.rows[0]?.categoria_origen).toBe('usuario')
    expect(fila.rows[0]?.confirmado_en).not.toBeNull()
  })

  it('un gasto ia sin confirmar llevado a needs_review no aparece en pendientesDeConfirmacion (exclusión por needs_review)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Sin categorizar', 'ia', null)

    await repositorioGastos.marcarParaRevision(gasto.id, 'error_de_paso', 'traza del intento fallido')

    const pendientes = await repositorioGastos.pendientesDeConfirmacion()
    expect(pendientes.map((g) => g.id)).not.toContain(gasto.id)
  })

  it('confirmar no mueve el estado: un gasto en needs_review sigue en needs_review, y confirmar sobre uno imputado no lo cambia', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    // estado queda en `extraido` (crear); confirmar no tiene por qué depender del paso del pipeline.
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'ia', null)

    await repositorioGastos.confirmar(gasto.id, 'Comida')

    const fila = await base.pool.query('SELECT estado FROM gastos WHERE id = $1', [gasto.id])
    expect(fila.rows[0]?.estado).toBe('categorizado') // el que dejó asignarCategoria, confirmar no lo toca
  })

  it('fidelidad del UPDATE: confirmar cambia categoría, origen y confirmado_en, y nada más — categoria_justificacion se conserva (Req. 2.12)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    const justificacion = 'justificación original del modelo'
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', justificacion)
    const antes = await base.pool.query(
      `SELECT monto_total, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4, cuotas_total,
              email_id, categoria_justificacion
       FROM gastos WHERE id = $1`,
      [gasto.id],
    )

    await repositorioGastos.confirmar(gasto.id, 'Salidas')

    const despues = await base.pool.query(
      `SELECT monto_total, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4, cuotas_total,
              email_id, categoria_justificacion
       FROM gastos WHERE id = $1`,
      [gasto.id],
    )
    expect(despues.rows[0]?.monto_total).toBe(antes.rows[0]?.monto_total)
    expect(despues.rows[0]?.comercio).toBe(antes.rows[0]?.comercio)
    expect(despues.rows[0]?.tipo_tarjeta).toBe(antes.rows[0]?.tipo_tarjeta)
    expect(despues.rows[0]?.tarjeta_ultimos4).toBe(antes.rows[0]?.tarjeta_ultimos4)
    expect(despues.rows[0]?.cuotas_total).toBe(antes.rows[0]?.cuotas_total)
    expect(despues.rows[0]?.email_id).toBe(antes.rows[0]?.email_id)
    // categoria_justificacion se conserva: es el registro de lo que el modelo había propuesto.
    expect(despues.rows[0]?.categoria_justificacion).toBe(justificacion)
    expect(despues.rows[0]?.categoria_justificacion).toBe(antes.rows[0]?.categoria_justificacion)
  })

  it('idempotencia: una segunda confirmar sobre el mismo gasto no falla, no duplica filas, y deja la última categoría pasada (Req. 8.7 análogo, doble envío)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Extras', 'ia', 'justificación')

    await repositorioGastos.confirmar(gasto.id, 'Extras')
    await repositorioGastos.confirmar(gasto.id, 'Comida')

    const fila = await base.pool.query(
      `SELECT c.nombre FROM gastos g JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gasto.id],
    )
    expect(fila.rows[0]?.nombre).toBe('Comida')
    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM gastos WHERE id = $1', [
      gasto.id,
    ])
    expect(conteo.rows[0]?.count).toBe('1')
    const pendientes = await repositorioGastos.pendientesDeConfirmacion()
    expect(pendientes.map((g) => g.id)).not.toContain(gasto.id)
  })

  it('cierre del ciclo: un gasto que aparecía en pendientesDeConfirmacion ya no aparece después de confirmar, y el tamaño baja exactamente en uno', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gastoA = await crearGasto(repositorioGastos)
    const gastoB = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gastoA.id, 'Extras', 'ia', 'justificación A')
    await repositorioGastos.asignarCategoria(gastoB.id, 'Comida', 'ia', 'justificación B')

    const antes = await repositorioGastos.pendientesDeConfirmacion()
    expect(antes.map((g) => g.id)).toContain(gastoA.id)

    await repositorioGastos.confirmar(gastoA.id, 'Extras')

    const despues = await repositorioGastos.pendientesDeConfirmacion()
    expect(despues.length).toBe(antes.length - 1)
    expect(despues.map((g) => g.id)).not.toContain(gastoA.id)
    expect(despues.map((g) => g.id)).toContain(gastoB.id)
  })

  it('un gasto recién creado (crear) tiene los cuatro campos de categoría en null, sin romper ninguna aserción de T18 (Req. andamiaje)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)

    expect(gasto.categoria).toBeNull()
    expect(gasto.categoriaOrigen).toBeNull()
    expect(gasto.categoriaJustificacion).toBeNull()
    expect(gasto.confirmadoEn).toBeNull()
  })
})

describe('RepositorioGastos.crearParaRevision (T32)', () => {
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
  async function crearEmailCrudo(): Promise<string> {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t32-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return id
  }

  it('sin campos parciales, persiste el gasto en needs_review con el motivo dado y los seis campos de datos en NULL (Req. 2.11, 2.12)', async () => {
    const emailId = await crearEmailCrudo()
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const gasto = await repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})

    expect(gasto.estado).toBe('needs_review')
    expect(gasto.emailId).toBe(emailId)
    expect(gasto.montoTotal).toBeNull()
    expect(gasto.comercio).toBeNull()
    expect(gasto.fechaGasto).toBeNull()
    expect(gasto.tipoTarjeta).toBeNull()
    expect(gasto.tarjetaUltimos4).toBeNull()
    expect(gasto.cuotasTotal).toBeNull()

    const fila = await base.pool.query(
      `SELECT estado, motivo_revision, monto_total, comercio, fecha_gasto, tipo_tarjeta,
              tarjeta_ultimos4, cuotas_total, moneda
       FROM gastos WHERE id = $1`,
      [gasto.id],
    )
    expect(fila.rows[0]?.estado).toBe('needs_review')
    expect(fila.rows[0]?.motivo_revision).toBe('campos_faltantes')
    expect(fila.rows[0]?.monto_total).toBeNull()
    expect(fila.rows[0]?.comercio).toBeNull()
    expect(fila.rows[0]?.fecha_gasto).toBeNull()
    expect(fila.rows[0]?.tipo_tarjeta).toBeNull()
    expect(fila.rows[0]?.tarjeta_ultimos4).toBeNull()
    expect(fila.rows[0]?.cuotas_total).toBeNull()
    // moneda no es un dato del aviso que pueda fallar en extraerse — sigue en el default del schema.
    expect(fila.rows[0]?.moneda).toBe('ARS')
  })

  it('persiste motivo_revision exacto por cada uno de los cuatro motivos de esta tarea (Req. 3.5, 3.6, 3.7)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const motivos = ['monto_invalido', 'fecha_futura', 'cuotas_invalidas', 'campos_faltantes'] as const

    for (const motivo of motivos) {
      const emailId = await crearEmailCrudo()
      const gasto = await repositorioGastos.crearParaRevision(emailId, motivo, {})
      const fila = await base.pool.query('SELECT motivo_revision FROM gastos WHERE id = $1', [gasto.id])
      expect(fila.rows[0]?.motivo_revision).toBe(motivo)
    }
  })

  it('con campos parciales, persiste exactamente los que vinieron y deja el resto en NULL, sin inventar ningún valor (Req. 2.11, 2.12)', async () => {
    const emailId = await crearEmailCrudo()
    const repositorioGastos = crearRepositorioGastos(base.pool)

    const gasto = await repositorioGastos.crearParaRevision(emailId, 'fecha_invalida', {
      comercio: 'FRANCESCA',
      tipoTarjeta: 'credito',
      tarjetaUltimos4: '1324',
    })

    expect(gasto.comercio).toBe('FRANCESCA')
    expect(gasto.tipoTarjeta).toBe('credito')
    expect(gasto.tarjetaUltimos4).toBe('1324')
    expect(gasto.montoTotal).toBeNull()
    expect(gasto.fechaGasto).toBeNull()
    expect(gasto.cuotasTotal).toBeNull()
  })

  it('email_id es único: un segundo crearParaRevision con el mismo emailId viola la restricción de unicidad', async () => {
    const emailId = await crearEmailCrudo()
    const repositorioGastos = crearRepositorioGastos(base.pool)

    await repositorioGastos.crearParaRevision(emailId, 'monto_invalido', {})

    await expect(repositorioGastos.crearParaRevision(emailId, 'monto_invalido', {})).rejects.toThrow()
  })
})

describe('RepositorioGastos.actualizarDatos (T40)', () => {
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
  async function crearGastoEnRevision(): Promise<{ id: string; emailId: string; repositorioGastos: ReturnType<typeof crearRepositorioGastos> }> {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t40-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})
    return { id: gasto.id, emailId, repositorioGastos }
  }

  it('sobreescribe los siete campos de datos de un gasto en needs_review, sin insertar una segunda fila (Req. 10.3)', async () => {
    const { id, emailId, repositorioGastos } = await crearGastoEnRevision()
    const datos = datosCompletos({
      montoTotal: new Decimal('999.99'),
      comercio: 'FRANCESCA',
      tipoTarjeta: 'credito',
      tarjetaUltimos4: '1324',
      cuotasTotal: 3,
      fechaGasto: new Date('2026-08-22T04:34:00.000Z'),
    })

    await repositorioGastos.actualizarDatos(id, datos)

    const fila = await base.pool.query(
      `SELECT monto_total, moneda, comercio, fecha_gasto, tipo_tarjeta, tarjeta_ultimos4, cuotas_total, email_id
       FROM gastos WHERE id = $1`,
      [id],
    )
    expect(new Decimal(fila.rows[0]?.monto_total).equals(new Decimal('999.99'))).toBe(true)
    expect(fila.rows[0]?.moneda).toBe('ARS')
    expect(fila.rows[0]?.comercio).toBe('FRANCESCA')
    expect(new Date(fila.rows[0]?.fecha_gasto).toISOString()).toBe('2026-08-22T04:34:00.000Z')
    expect(fila.rows[0]?.tipo_tarjeta).toBe('credito')
    expect(fila.rows[0]?.tarjeta_ultimos4).toBe('1324')
    expect(fila.rows[0]?.cuotas_total).toBe(3)
    expect(fila.rows[0]?.email_id).toBe(emailId)

    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM gastos WHERE email_id = $1', [
      emailId,
    ])
    expect(conteo.rows[0]?.count).toBe('1')
  })

  it('no toca estado, categoria_id, categoria_origen, confirmado_en, motivo_revision ni ultimo_error (Req. 2.12)', async () => {
    const { id, repositorioGastos } = await crearGastoEnRevision()
    const antes = await base.pool.query(
      `SELECT estado, categoria_id, categoria_origen, categoria_justificacion, confirmado_en,
              motivo_revision, ultimo_error
       FROM gastos WHERE id = $1`,
      [id],
    )

    await repositorioGastos.actualizarDatos(id, datosCompletos())

    const despues = await base.pool.query(
      `SELECT estado, categoria_id, categoria_origen, categoria_justificacion, confirmado_en,
              motivo_revision, ultimo_error
       FROM gastos WHERE id = $1`,
      [id],
    )
    expect(despues.rows[0]).toEqual(antes.rows[0])
    expect(despues.rows[0]?.estado).toBe('needs_review')
    expect(despues.rows[0]?.motivo_revision).toBe('campos_faltantes')
  })
})

describe('RepositorioGastos.traerPorId y marcarImputado (T36)', () => {
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
  async function crearGasto(repositorioGastos: ReturnType<typeof crearRepositorioGastos>, datos: Partial<GastoNormalizado> = {}) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t36-repo-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return repositorioGastos.crear(datosCompletos(datos), emailId)
  }

  it('traerPorId devuelve el gasto completo, con montoTotal en Decimal y fechaGasto en Date', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const creado = await crearGasto(repositorioGastos, {
      montoTotal: new Decimal('999.99'),
      cuotasTotal: 3,
    })

    const traido = await repositorioGastos.traerPorId(creado.id)

    expect(traido.montoTotal?.equals(new Decimal('999.99'))).toBe(true)
    expect(traido.cuotasTotal).toBe(3)
    expect(traido.fechaGasto).toBeInstanceOf(Date)
  })

  it('traerPorId sobre un id inexistente rechaza la promesa', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)

    await expect(
      repositorioGastos.traerPorId('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow()
  })

  it('marcarImputado deja el gasto en estado imputado, y no en categorizado ni ningún otro valor', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const gasto = await crearGasto(repositorioGastos)
    await repositorioGastos.asignarCategoria(gasto.id, 'Comida', 'regla', null)

    await repositorioGastos.marcarImputado(gasto.id)

    const traido = await repositorioGastos.traerPorId(gasto.id)
    expect(traido.estado).toBe('imputado')
  })
})

describe('RepositorioGastos.gastosEntreFechas (T6)', () => {
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
  async function crearGasto(
    repositorioGastos: ReturnType<typeof crearRepositorioGastos>,
    datos: Partial<GastoNormalizado> = {},
  ) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t6-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    return repositorioGastos.crear(datosCompletos(datos), emailId)
  }

  // `crearParaRevision` deja los campos de datos en NULL — para un needs_review CON fecha_gasto y
  // monto_total dentro del rango (el caso que realmente ejercita el filtro `estado <> 'needs_review'`)
  // hace falta `actualizarDatos` después (T40), que sobreescribe los siete campos sin tocar `estado`.
  async function crearGastoNeedsReviewConDatos(
    repositorioGastos: ReturnType<typeof crearRepositorioGastos>,
    datos: Partial<GastoNormalizado> = {},
  ) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t6-nr-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    const gasto = await repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})
    await repositorioGastos.actualizarDatos(gasto.id, datosCompletos(datos))
    return gasto
  }

  it('un gasto con fecha_gasto exactamente igual a hasta NO aparece (límite superior exclusivo, Req. 2.7, 2.9)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    await crearGasto(repositorioGastos, { fechaGasto: hasta })

    const resultado = await repositorioGastos.gastosEntreFechas(new Date('2026-08-01T00:00:00.000Z'), hasta)

    expect(resultado).toEqual([])
  })

  it('un gasto con fecha_gasto un milisegundo antes de hasta SÍ aparece (Req. 2.7, 2.9)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    const fechaGasto = new Date(hasta.getTime() - 1)
    await crearGasto(repositorioGastos, { fechaGasto })

    const resultado = await repositorioGastos.gastosEntreFechas(new Date('2026-08-01T00:00:00.000Z'), hasta)

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaGasto.toISOString()).toBe(fechaGasto.toISOString())
  })

  it('un gasto con fecha_gasto exactamente igual a desde SÍ aparece (límite inferior inclusivo, Req. 2.7, 2.9)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const desde = new Date('2026-08-01T00:00:00.000Z')
    await crearGasto(repositorioGastos, { fechaGasto: desde })

    const resultado = await repositorioGastos.gastosEntreFechas(desde, new Date('2026-09-01T00:00:00.000Z'))

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaGasto.toISOString()).toBe(desde.toISOString())
  })

  it('el resultado viene ordenado por fecha_gasto ascendente (Req. 2.7, 2.9)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const desde = new Date('2026-08-01T00:00:00.000Z')
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    const fechaTardia = new Date('2026-08-20T00:00:00.000Z')
    const fechaTemprana = new Date('2026-08-05T00:00:00.000Z')
    const fechaMedia = new Date('2026-08-12T00:00:00.000Z')
    await crearGasto(repositorioGastos, { fechaGasto: fechaTardia, comercio: 'TARDIO' })
    await crearGasto(repositorioGastos, { fechaGasto: fechaTemprana, comercio: 'TEMPRANO' })
    await crearGasto(repositorioGastos, { fechaGasto: fechaMedia, comercio: 'MEDIO' })

    const resultado = await repositorioGastos.gastosEntreFechas(desde, hasta)

    expect(resultado.map((g) => g.comercio)).toEqual(['TEMPRANO', 'MEDIO', 'TARDIO'])
  })

  it('un gasto en needs_review dentro del rango NO aparece, aunque su fecha_gasto esté en rango (Req. 2.7, 2.9)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const desde = new Date('2026-08-01T00:00:00.000Z')
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    await crearGastoNeedsReviewConDatos(repositorioGastos, { fechaGasto: new Date('2026-08-15T00:00:00.000Z') })

    const resultado = await repositorioGastos.gastosEntreFechas(desde, hasta)

    expect(resultado).toEqual([])
  })

  it('un gasto con comercio null dentro del rango SÍ aparece, con comercio en null (Req. 2.11)', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const desde = new Date('2026-08-01T00:00:00.000Z')
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    // `GastoNormalizado.comercio` es `string`, nunca `null` — un gasto sin comercio solo puede
    // llegar por la vía de `needs_review`/`crearParaRevision`, que no sirve acá porque esta consulta
    // los excluye. El único camino para dejar un gasto NO needs_review con `comercio` en `NULL` en
    // este test es un INSERT directo, igual que ya hacen los tests de restricciones de T18 más arriba.
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: `msg-t6-sin-comercio-${contador}`,
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $2.571,30',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    })
    await base.pool.query(
      `INSERT INTO gastos (email_id, monto_total, comercio, fecha_gasto, cuotas_total, estado)
       VALUES ($1, $2, NULL, $3, $4, 'extraido')`,
      [emailId, '2571.30', new Date('2026-08-15T00:00:00.000Z'), 1],
    )

    const resultado = await repositorioGastos.gastosEntreFechas(desde, hasta)

    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.comercio).toBeNull()
  })

  it('montoTotal es una instancia de Decimal, no number ni el string crudo de la columna', async () => {
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const desde = new Date('2026-08-01T00:00:00.000Z')
    const hasta = new Date('2026-09-01T00:00:00.000Z')
    await crearGasto(repositorioGastos, {
      fechaGasto: new Date('2026-08-15T00:00:00.000Z'),
      montoTotal: new Decimal('2571.30'),
    })

    const resultado = await repositorioGastos.gastosEntreFechas(desde, hasta)

    expect(resultado[0]?.montoTotal).toBeInstanceOf(Decimal)
    expect(resultado[0]?.montoTotal.equals(new Decimal('2571.30'))).toBe(true)
  })
})
