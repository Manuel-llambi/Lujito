import Decimal from 'decimal.js'
import { InngestTestEngine } from '@inngest/test'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { ClienteGmail } from '@/infra/gmail/clienteGmail'
import type { ClienteIA, RespuestaInferencia } from '@/infra/ia/inferirCategoria'
import type { MensajeCrudo } from '@/infra/db/repositorioEmails'
import { crearFuncionProcesarAviso, ejecutarPasoImputar, manejarFalloDePaso } from '@/workflow/procesarAviso'
import { leerCuerpoHtmlDeAviso } from '@/test/fixtures/avisos-santander/leerAvisoEml'

/** Casilla simulada mínima: siempre se abstiene (Req. 6.7), para los tests que no ejercitan T33-T35. */
function crearClienteIASimulado(respuesta: RespuestaInferencia = { categoria: 'no_estoy_seguro', justificacion: '' }): ClienteIA {
  return {
    inferir: async () => respuesta,
  }
}

const HEADERS_CRUDOS = [
  'From: no-responder@banco-ejemplo.com.ar',
  'Subject: Pagaste $2.571,30',
  'Content-Type: text/html;\r\n\tcharset="UTF-8"',
].join('\r\n')

const CUERPO_CRUDO = ['<html><body>', 'Comprob=', '=C3=B3 la compra', '</body></html>'].join('\r\n')

function crearMensaje(parcial: Partial<MensajeCrudo> = {}): MensajeCrudo {
  return {
    gmailMessageId: 'msg-1',
    remitente: 'no-responder@banco-ejemplo.com.ar',
    asunto: 'Pagaste $2.571,30',
    headersCrudos: HEADERS_CRUDOS,
    cuerpo: CUERPO_CRUDO,
    recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    ...parcial,
  }
}

/** Casilla simulada mínima: entrega el `MensajeCrudo` que el test le carga para cada id. */
function crearClienteGmailSimulado(mensajes: Record<string, MensajeCrudo>): ClienteGmail {
  return {
    listarMensajesDe: async () => Object.keys(mensajes),
    traerMensajeCrudo: async (id) => {
      const mensaje = mensajes[id]
      if (!mensaje) {
        throw new Error(`mensaje ${id} no existe en el buzón simulado`)
      }
      return mensaje
    },
  }
}

describe('procesarAviso: step ingestar (T29)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    // CASCADE: desde T18, `gastos.email_id` referencia `emails_crudos(id)`.
    await base.pool.query('TRUNCATE emails_crudos CASCADE')
  })

  it('persiste el email crudo completo (headers y cuerpo) antes de terminar', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const mensaje = crearMensaje()
    const clienteGmail = crearClienteGmailSimulado({ 'msg-1': mensaje })
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })
    const t = new InngestTestEngine({ function: funcion })

    await t.execute({ events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-1' } }] })

    const fila = await base.pool.query(
      'SELECT headers_crudos, cuerpo FROM emails_crudos WHERE gmail_message_id = $1',
      ['msg-1'],
    )
    expect(fila.rows[0]?.headers_crudos).toBe(HEADERS_CRUDOS)
    expect(fila.rows[0]?.cuerpo).toBe(CUERPO_CRUDO)
  })

  it('un evento cuyo gmail_message_id ya está almacenado termina sin crear un nuevo email crudo', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const mensaje = crearMensaje()
    const clienteGmail = crearClienteGmailSimulado({ 'msg-1': mensaje })
    const dependenciasComunes = {
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    }

    // Primera ejecución: crea el email.
    const primeraFuncion = crearFuncionProcesarAviso(dependenciasComunes)
    await new InngestTestEngine({ function: primeraFuncion }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-1' } }],
    })

    // Segunda ejecución del mismo evento (simula un reintento/reentrega de Inngest).
    const segundaFuncion = crearFuncionProcesarAviso(dependenciasComunes)
    await new InngestTestEngine({ function: segundaFuncion }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-1' } }],
    })

    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM emails_crudos')
    expect(conteo.rows[0]?.count).toBe('1')
  })
})

describe('procesarAviso: step extraer, camino válido (T30)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos CASCADE')
  })

  it('persiste el gasto en extraido con el monto, comercio, fecha y hora del fixture de débito, y la fecha_gasto no sale del header Date (Req. 2.3, 3.4, 10.5)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const mensaje = crearMensaje({
      gmailMessageId: 'msg-debito',
      // El header `Date` de este mensaje es deliberadamente distinto del 28/08/2026 11:45 que trae
      // el cuerpo del aviso, para que 3.4 sea observable: si el step leyera la fecha del header en
      // vez del cuerpo, este test la vería.
      recibidoEn: new Date('2099-01-01T00:00:00.000Z'),
      cuerpo: leerCuerpoHtmlDeAviso('debito.eml'),
    })
    const clienteGmail = crearClienteGmailSimulado({ 'msg-debito': mensaje })
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })

    // `executeStep`, no `execute`: desde T33-T36 el mismo workflow sigue con categorizar e imputar
    // apenas termina extraer, así que una ejecución completa dejaría el gasto en `imputado`, no en
    // `extraido`. Esta tarea (T30) verifica el estado justo después de extraer, antes de que los
    // pasos que todavía no existían cuando se escribió le muevan el estado más adelante.
    await new InngestTestEngine({ function: funcion }).executeStep('extraer', {
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-debito' } }],
    })

    const fila = await base.pool.query(
      `SELECT g.estado, g.monto_total, g.comercio, g.fecha_gasto, g.tipo_tarjeta, g.tarjeta_ultimos4
       FROM gastos g JOIN emails_crudos e ON e.id = g.email_id
       WHERE e.gmail_message_id = $1`,
      ['msg-debito'],
    )
    expect(fila.rows[0]?.estado).toBe('extraido') // Req. 10.5
    expect(fila.rows[0]?.monto_total).toBe('20500.00')
    expect(fila.rows[0]?.comercio).toBe('FRANCESCA')
    expect(fila.rows[0]?.tipo_tarjeta).toBe('debito')
    expect(fila.rows[0]?.tarjeta_ultimos4).toBe('9344')
    // 28/08/2026 11:45 ART = 14:45 UTC — y no 2099, que es lo que traería el header Date (Req. 3.4).
    expect(new Date(fila.rows[0]?.fecha_gasto).toISOString()).toBe('2026-08-28T14:45:00.000Z')
  })
})

describe('procesarAviso: step extraer, no_es_aviso marca el email descartado (T31)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos CASCADE')
  })

  it('con el fixture real de un email del banco que no es un aviso de consumo, el email queda descartado y no existe ningún gasto asociado (Req. 4.1, 4.2)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const mensaje = crearMensaje({
      gmailMessageId: 'msg-no-consumo',
      cuerpo: leerCuerpoHtmlDeAviso('no-consumo.eml'),
    })
    const clienteGmail = crearClienteGmailSimulado({ 'msg-no-consumo': mensaje })
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })

    const ejecucion = await new InngestTestEngine({ function: funcion }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-no-consumo' } }],
    })

    expect(ejecucion.error).toBeUndefined() // Req. 4.2 — el workflow no termina en error

    const filaEmail = await base.pool.query(
      'SELECT estado FROM emails_crudos WHERE gmail_message_id = $1',
      ['msg-no-consumo'],
    )
    expect(filaEmail.rows[0]?.estado).toBe('descartado')

    const conteoGastos = await base.pool.query(
      `SELECT count(*)::text AS count FROM gastos g
       JOIN emails_crudos e ON e.id = g.email_id
       WHERE e.gmail_message_id = $1`,
      ['msg-no-consumo'],
    )
    expect(conteoGastos.rows[0]?.count).toBe('0')
  })
})

/** HTML sintético de un aviso con Cuotas configurable — para ejercitar el reparto en N cuotas (T36)
 * sin depender de un cuarto fixture. Mismas convenciones de T2/T4: etiquetas normalizadas, sin
 * literales embebidos por fuera del texto del aviso. */
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

/** HTML sintético con la fila `Monto` deliberadamente ausente, pero con el resto de las etiquetas
 * presentes (Req. 2.11): distingue `aviso_ilegible` de `no_es_aviso`, que exige que NINGUNA etiqueta
 * aparezca (Decision log de T5). */
function cuerpoSinMonto(comercio: string) {
  return `
    <html><body>
      <div><div>Comercio</div><div>${comercio}</div></div>
      <div><div>Fecha</div><div>24/08/2026</div></div>
      <div><div>Hora</div><div>10:00</div></div>
      <p>Tarjeta Santander Visa Crédito terminada en 1234.</p>
    </body></html>
  `
}

describe('procesarAviso: step extraer, aviso ilegible o inválido deja needs_review (T32)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  afterEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos CASCADE')
  })

  let contador = 0
  async function ejecutarExtraer(gmailMessageId: string, cuerpo: string) {
    contador += 1
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const mensaje = crearMensaje({ gmailMessageId, cuerpo })
    const clienteGmail = crearClienteGmailSimulado({ [gmailMessageId]: mensaje })
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })

    await new InngestTestEngine({ function: funcion }).executeStep('extraer', {
      events: [{ name: 'aviso/recibido', data: { gmailMessageId } }],
    })

    const fila = await base.pool.query(
      `SELECT g.estado, g.motivo_revision, g.monto_total, g.comercio, g.fecha_gasto, g.tipo_tarjeta,
              g.tarjeta_ultimos4, g.cuotas_total, e.estado AS estado_email, e.cuerpo AS cuerpo_email
       FROM emails_crudos e
       LEFT JOIN gastos g ON g.email_id = e.id
       WHERE e.gmail_message_id = $1`,
      [gmailMessageId],
    )
    return fila.rows[0]
  }

  it('con un fixture al que le falta el Monto, el gasto queda en needs_review con motivo_revision campos_faltantes y monto_total en NULL, y el email crudo queda intacto (Req. 2.11, 2.12)', async () => {
    const cuerpo = cuerpoSinMonto('FRANCESCA')

    const fila = await ejecutarExtraer('msg-t32-campos-faltantes', cuerpo)

    expect(fila.estado).toBe('needs_review')
    expect(fila.motivo_revision).toBe('campos_faltantes')
    expect(fila.monto_total).toBeNull()
    expect(fila.comercio).toBeNull()
    expect(fila.fecha_gasto).toBeNull()
    expect(fila.tipo_tarjeta).toBeNull()
    expect(fila.tarjeta_ultimos4).toBeNull()
    expect(fila.cuotas_total).toBeNull()
    expect(fila.estado_email).toBe('pendiente')
    expect(fila.cuerpo_email).toBe(cuerpo)
  })

  it('con un monto que normaliza a un valor no positivo, el gasto queda en needs_review con motivo_revision monto_invalido y ningún campo con un valor por defecto (Req. 3.5, 2.12)', async () => {
    const cuerpo = cuerpoSintetico({ monto: '$0,00', comercio: 'FRANCESCA' })

    const fila = await ejecutarExtraer('msg-t32-monto-invalido', cuerpo)

    expect(fila.estado).toBe('needs_review')
    expect(fila.motivo_revision).toBe('monto_invalido')
    expect(fila.monto_total).toBeNull()
    expect(fila.comercio).toBeNull()
    expect(fila.fecha_gasto).toBeNull()
    expect(fila.tipo_tarjeta).toBeNull()
    expect(fila.tarjeta_ultimos4).toBeNull()
    expect(fila.cuotas_total).toBeNull()
    expect(fila.estado_email).toBe('pendiente')
    expect(fila.cuerpo_email).toBe(cuerpo)
  })

  it('con una fecha posterior al momento de la ingesta, el gasto queda en needs_review con motivo_revision fecha_futura (Req. 3.6, 2.12)', async () => {
    const cuerpo = `
      <html><body>
        <div><div>Monto</div><div>$100,00</div></div>
        <div><div>Comercio</div><div>FRANCESCA</div></div>
        <div><div>Fecha</div><div>24/08/2099</div></div>
        <div><div>Hora</div><div>10:00</div></div>
        <p>Tarjeta Santander Visa Crédito terminada en 1234.</p>
      </body></html>
    `

    const fila = await ejecutarExtraer('msg-t32-fecha-futura', cuerpo)

    expect(fila.estado).toBe('needs_review')
    expect(fila.motivo_revision).toBe('fecha_futura')
    expect(fila.monto_total).toBeNull()
    expect(fila.comercio).toBeNull()
    expect(fila.fecha_gasto).toBeNull()
    expect(fila.tipo_tarjeta).toBeNull()
    expect(fila.tarjeta_ultimos4).toBeNull()
    expect(fila.cuotas_total).toBeNull()
  })

  it('con cuotas que no son un entero mayor o igual a uno, el gasto queda en needs_review con motivo_revision cuotas_invalidas (Req. 3.7, 2.12)', async () => {
    const cuerpo = cuerpoSintetico({ monto: '$100,00', comercio: 'FRANCESCA', cuotas: '0' })

    const fila = await ejecutarExtraer('msg-t32-cuotas-invalidas', cuerpo)

    expect(fila.estado).toBe('needs_review')
    expect(fila.motivo_revision).toBe('cuotas_invalidas')
    expect(fila.monto_total).toBeNull()
    expect(fila.comercio).toBeNull()
    expect(fila.fecha_gasto).toBeNull()
    expect(fila.tipo_tarjeta).toBeNull()
    expect(fila.tarjeta_ultimos4).toBeNull()
    expect(fila.cuotas_total).toBeNull()
  })
})

describe('procesarAviso: step categorizar (T33, T34, T35) y step imputar (T36)', () => {
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
  async function ejecutarPipeline(opciones: {
    comercio: string
    cuotas?: string
    monto?: string
    clienteIA?: ClienteIA
  }) {
    contador += 1
    const gmailMessageId = `msg-cat-${contador}`
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const mensaje = crearMensaje({
      gmailMessageId,
      cuerpo: cuerpoSintetico({
        monto: opciones.monto ?? '$100,00',
        comercio: opciones.comercio,
        cuotas: opciones.cuotas,
      }),
    })
    const clienteGmail = crearClienteGmailSimulado({ [gmailMessageId]: mensaje })
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: opciones.clienteIA ?? crearClienteIASimulado(),
    })

    await new InngestTestEngine({ function: funcion }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId } }],
    })

    const fila = await base.pool.query(
      `SELECT g.id, g.estado, g.monto_total, c.nombre AS categoria, g.categoria_origen, g.confirmado_en,
              g.categoria_justificacion
       FROM gastos g
       JOIN emails_crudos e ON e.id = g.email_id
       LEFT JOIN categorias c ON c.id = g.categoria_id
       WHERE e.gmail_message_id = $1`,
      [gmailMessageId],
    )
    return fila.rows[0]
  }

  it('con una regla activa que cubre el comercio, el gasto queda con la categoría de la regla, origen regla y confirmado_en con valor; el cliente de IA no se invoca (Req. 5.3, 6.2)', async () => {
    await base.pool.query(
      `INSERT INTO reglas_categoria (patron_comercio, categoria_id, prioridad, creada_por, activa)
       SELECT 'WWWAYSACOMAR', id, 10, 'usuario', true FROM categorias WHERE nombre = 'Comida'`,
    )
    let invocado = false
    const clienteIAEspiado: ClienteIA = {
      inferir: async () => {
        invocado = true
        return { categoria: 'Extras', justificacion: 'no debería llegar acá' }
      },
    }

    const gasto = await ejecutarPipeline({ comercio: 'WWWAYSACOMAR', clienteIA: clienteIAEspiado })

    expect(gasto.categoria).toBe('Comida')
    expect(gasto.categoria_origen).toBe('regla')
    expect(gasto.confirmado_en).not.toBeNull()
    expect(invocado).toBe(false) // Req. 6.2
  })

  it('sin regla que coincida, con un cliente de IA que devuelve una categoría del conjunto cerrado, el gasto queda con esa categoría, origen ia y confirmado_en en nulo, con la justificación persistida (Req. 6.3, 6.6)', async () => {
    const gasto = await ejecutarPipeline({
      comercio: 'COMERCIO-SIN-REGLA',
      clienteIA: crearClienteIASimulado({ categoria: 'Extras', justificacion: 'justificación del modelo' }),
    })

    expect(gasto.categoria).toBe('Extras')
    expect(gasto.categoria_origen).toBe('ia')
    expect(gasto.confirmado_en).toBeNull()
    expect(gasto.categoria_justificacion).toBe('justificación del modelo')
  })

  it('con un cliente de IA que devuelve una categoría fuera del conjunto cerrado, el gasto queda con Sin categorizar (Req. 6.4)', async () => {
    const gasto = await ejecutarPipeline({
      comercio: 'COMERCIO-FUERA-DE-ENUM',
      // "as any" del lado del doble: simula lo que 6.4 exige tolerar, una respuesta que el schema no
      // puede prevenir en el borde (Decision log de T28).
      clienteIA: crearClienteIASimulado({ categoria: 'Mascotas', justificacion: 'fuera de enum' }),
    })

    expect(gasto.categoria).toBe('Sin categorizar')
    expect(gasto.categoria_origen).toBe('ia')
    expect(gasto.confirmado_en).toBeNull()
  })

  it('con un cliente de IA que falla siempre, el gasto queda con Sin categorizar y el step de imputación se ejecuta igual (Req. 6.5)', async () => {
    const clienteIAQueFalla: ClienteIA = {
      inferir: async () => {
        throw new Error('fallo simulado de red')
      },
    }

    const gasto = await ejecutarPipeline({ comercio: 'COMERCIO-IA-CAIDA', clienteIA: clienteIAQueFalla })

    expect(gasto.categoria).toBe('Sin categorizar')
    expect(gasto.estado).toBe('imputado') // el pipeline no se frena: llega hasta el step imputar
    const imputaciones = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      gasto.id,
    ])
    expect(imputaciones.rows[0]?.count).toBe('1')
  })

  it('con un cliente de IA que responde no_estoy_seguro, el gasto queda con Sin categorizar, origen ia, sin confirmar y sin ninguna categoría inferible registrada como propuesta (Req. 6.7)', async () => {
    const gasto = await ejecutarPipeline({
      comercio: 'COMERCIO-ABSTENCION',
      clienteIA: crearClienteIASimulado({ categoria: 'no_estoy_seguro', justificacion: 'no tengo suficiente info' }),
    })

    expect(gasto.categoria).toBe('Sin categorizar')
    expect(gasto.categoria_origen).toBe('ia')
    expect(gasto.confirmado_en).toBeNull()
    expect(['Salidas', 'Comida', 'Extras']).not.toContain(gasto.categoria)
  })

  it('un gasto de una sola cuota produce exactamente una imputación cuya suma es igual al monto_total, y el gasto queda en imputado (Req. 8.1, 8.3, 10.5)', async () => {
    const gasto = await ejecutarPipeline({ comercio: 'COMERCIO-UNA-CUOTA', monto: '$250,50' })

    expect(gasto.estado).toBe('imputado')
    const filas = await base.pool.query<{ monto: string }>(
      'SELECT monto FROM imputaciones WHERE gasto_id = $1',
      [gasto.id],
    )
    expect(filas.rows).toHaveLength(1)
    expect(new Decimal(filas.rows[0]!.monto).equals(new Decimal(gasto.monto_total))).toBe(true)
  })

  it('un gasto de seis cuotas produce exactamente seis imputaciones cuya suma es exactamente el monto_total (Req. 8.1, 8.3)', async () => {
    const gasto = await ejecutarPipeline({ comercio: 'COMERCIO-SEIS-CUOTAS', monto: '$100,00', cuotas: '6' })

    const filas = await base.pool.query<{ monto: string; numero_cuota: number }>(
      'SELECT monto, numero_cuota FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gasto.id],
    )
    expect(filas.rows).toHaveLength(6)
    expect(filas.rows.map((f) => f.numero_cuota)).toEqual([1, 2, 3, 4, 5, 6])
    const suma = filas.rows.reduce((acc, f) => acc.plus(new Decimal(f.monto)), new Decimal(0))
    expect(suma.equals(new Decimal(gasto.monto_total))).toBe(true)
  })

  it('débito y crédito en una sola cuota producen una única imputación cada uno, por el mismo código (Req. 8.5)', async () => {
    const debito = await ejecutarPipeline({ comercio: 'COMERCIO-DEBITO', monto: '$80,00' }) // sin fila Cuotas
    const credito = await ejecutarPipeline({ comercio: 'COMERCIO-CREDITO-UNA', monto: '$80,00', cuotas: '1' })

    const filasDebito = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      debito.id,
    ])
    const filasCredito = await base.pool.query('SELECT count(*)::text AS count FROM imputaciones WHERE gasto_id = $1', [
      credito.id,
    ])
    expect(filasDebito.rows[0]?.count).toBe('1')
    expect(filasCredito.rows[0]?.count).toBe('1')
  })
})

describe('procesarAviso: idempotencia del pipeline completo (T37)', () => {
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

  it('emitir aviso/recibido dos veces con el mismo gmail_message_id produce un único email crudo y un único gasto; la segunda corrida no vuelve a extraer, categorizar ni imputar (Req. 1.3)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastosReal = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const mensaje = crearMensaje({
      gmailMessageId: 'msg-idempotente',
      cuerpo: leerCuerpoHtmlDeAviso('debito.eml'),
    })
    const clienteGmail = crearClienteGmailSimulado({ 'msg-idempotente': mensaje })

    // Espía de escritura: cuenta invocaciones de los métodos que extraer/categorizar/imputar llaman,
    // sin cambiar su comportamiento — es la forma de observar "no se re-ejecutó" sin acoplarse a los
    // nombres internos de los steps de Inngest.
    let llamadasCrear = 0
    let llamadasAsignarCategoria = 0
    let llamadasReemplazarPara = 0
    const repositorioGastos: typeof repositorioGastosReal = {
      ...repositorioGastosReal,
      crear: async (...args) => {
        llamadasCrear += 1
        return repositorioGastosReal.crear(...args)
      },
      asignarCategoria: async (...args) => {
        llamadasAsignarCategoria += 1
        return repositorioGastosReal.asignarCategoria(...args)
      },
    }
    const repositorioImputacionesEspiado: typeof repositorioImputaciones = {
      ...repositorioImputaciones,
      reemplazarPara: async (...args) => {
        llamadasReemplazarPara += 1
        return repositorioImputaciones.reemplazarPara(...args)
      },
    }
    const dependencias = {
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones: repositorioImputacionesEspiado,
      clienteIA: crearClienteIASimulado(),
    }

    await new InngestTestEngine({ function: crearFuncionProcesarAviso(dependencias) }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-idempotente' } }],
    })
    // Segunda emisión del mismo evento (reentrega/reintento real de Inngest, Req. 1.3).
    await new InngestTestEngine({ function: crearFuncionProcesarAviso(dependencias) }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-idempotente' } }],
    })

    expect(llamadasCrear).toBe(1)
    expect(llamadasAsignarCategoria).toBe(1)
    expect(llamadasReemplazarPara).toBe(1)

    const conteoEmails = await base.pool.query('SELECT count(*)::text AS count FROM emails_crudos')
    expect(conteoEmails.rows[0]?.count).toBe('1')
    const conteoGastos = await base.pool.query(
      `SELECT count(*)::text AS count FROM gastos g JOIN emails_crudos e ON e.id = g.email_id
       WHERE e.gmail_message_id = $1`,
      ['msg-idempotente'],
    )
    expect(conteoGastos.rows[0]?.count).toBe('1')
  })

  it('invocar el step imputar una segunda vez sobre un gasto que ya tiene imputaciones no las duplica, y el resultado es idéntico al de la primera invocación (Req. 8.6, 8.7)', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const mensaje = crearMensaje({
      gmailMessageId: 'msg-imputar-dos-veces',
      cuerpo: cuerpoSintetico({ monto: '$300,00', comercio: 'COMERCIO-IDEMPOTENTE', cuotas: '3' }),
    })
    const clienteGmail = crearClienteGmailSimulado({ 'msg-imputar-dos-veces': mensaje })
    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })

    await new InngestTestEngine({ function: funcion }).execute({
      events: [{ name: 'aviso/recibido', data: { gmailMessageId: 'msg-imputar-dos-veces' } }],
    })

    const filaGasto = await base.pool.query(
      `SELECT g.id, g.estado, c.nombre AS categoria
       FROM gastos g JOIN emails_crudos e ON e.id = g.email_id
       LEFT JOIN categorias c ON c.id = g.categoria_id
       WHERE e.gmail_message_id = $1`,
      ['msg-imputar-dos-veces'],
    )
    const gastoId = filaGasto.rows[0]?.id as string
    const antes = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gastoId],
    )

    // Invocación directa, sin pasar por el evento — la segunda re-ejecución real (Req. 1.3) nunca
    // llega hasta acá, así que esta es la única forma de ejercitar la idempotencia del step en sí.
    await ejecutarPasoImputar(gastoId, { repositorioGastos, repositorioImputaciones })

    const despues = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1 ORDER BY numero_cuota',
      [gastoId],
    )
    expect(despues.rows).toEqual(antes.rows) // 8.6: ni una fila de más ni de menos, mismos valores

    const filaGastoDespues = await base.pool.query(
      `SELECT g.estado, c.nombre AS categoria FROM gastos g
       LEFT JOIN categorias c ON c.id = g.categoria_id WHERE g.id = $1`,
      [gastoId],
    )
    expect(filaGastoDespues.rows[0]?.estado).toBe(filaGasto.rows[0]?.estado) // 8.7
    expect(filaGastoDespues.rows[0]?.categoria).toBe(filaGasto.rows[0]?.categoria) // 8.7
  })
})

describe('procesarAviso: reintentos y agotamiento a needs_review (T38)', () => {
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

  it('la función queda configurada con reintentos (Req. 10.1) — la espera creciente entre intentos es la política por defecto de Inngest, no algo que este código calcule', () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const repositorioGastos = crearRepositorioGastos(base.pool)
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const clienteGmail = crearClienteGmailSimulado({})

    const funcion = crearFuncionProcesarAviso({
      repositorioEmails,
      clienteGmail,
      repositorioGastos,
      repositorioReglas,
      repositorioImputaciones,
      clienteIA: crearClienteIASimulado(),
    })

    expect(funcion.opts.retries).toBeGreaterThan(0)
  })

  // Las dos escenas de agotamiento/reintento de `manejarFalloDePaso` (T38) se testean invocando la
  // función directamente, sin `step.run` ni `InngestTestEngine` de por medio — ver Decision log de T38
  // en tasks.md y el docstring de `manejarFalloDePaso`: verificado empíricamente que el harness de
  // `@inngest/test` nunca deja que el rechazo de un `step.run` llegue al `try/catch` del código de
  // usuario (el error termina siempre en `ejecucion.error`, con `retries: 0` y con `retries: 3` por
  // igual), así que probar esta decisión de punta a punta ejecutando la función completa es una guerra
  // perdida. La decisión "es el último intento" en sí ya está exhaustivamente testeada en
  // `esUltimoIntento.test.ts`; lo que falta cubrir acá es el efecto: a qué llama `manejarFalloDePaso`
  // en cada rama.

  it('en el último intento, degrada el gasto a needs_review con el último error registrado en vez de relanzarlo (Req. 10.2, 1.6)', async () => {
    const repositorioGastosReal = crearRepositorioGastos(base.pool)
    let llamada: [string, string, string | null] | undefined
    const repositorioGastos: typeof repositorioGastosReal = {
      ...repositorioGastosReal,
      marcarParaRevision: async (id, motivo, ultimoError) => {
        llamada = [id, motivo, ultimoError]
      },
    }

    // `esUltimoIntento(0, 1)` es `true` (verificado exhaustivamente en `esUltimoIntento.test.ts`): el
    // primer y único intento ya es el último.
    await expect(
      manejarFalloDePaso(new Error('fallo transitorio simulado en categorizar'), 'gasto-1', 0, 1, {
        repositorioGastos,
      }),
    ).resolves.toBeUndefined() // no relanza: la función se resuelve, no termina en error

    expect(llamada).toEqual(['gasto-1', 'error_de_paso', 'fallo transitorio simulado en categorizar'])
  })

  it('cuando todavía quedan reintentos disponibles, relanza el error tal cual y no marca needs_review — deja que Inngest reintente (Req. 10.1)', async () => {
    const repositorioGastosReal = crearRepositorioGastos(base.pool)
    let llamadasMarcarParaRevision = 0
    const repositorioGastos: typeof repositorioGastosReal = {
      ...repositorioGastosReal,
      marcarParaRevision: async () => {
        llamadasMarcarParaRevision += 1
      },
    }
    const error = new Error('fallo transitorio simulado')

    // `esUltimoIntento(0, 4)` es `false`: el primer intento no es el último de los cuatro permitidos.
    await expect(
      manejarFalloDePaso(error, 'gasto-1', 0, 4, { repositorioGastos }),
    ).rejects.toBe(error) // relanza el mismo objeto de error, sin envolverlo

    expect(llamadasMarcarParaRevision).toBe(0)
  })
})
