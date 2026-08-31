import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails, type MensajeCrudo, type RepositorioEmails } from '@/infra/db/repositorioEmails'

// Contenido realista de un aviso: acentos, comillas simples y dobles, plegado de headers, la línea
// en blanco que separa headers de cuerpo, y un "=" de quoted-printable al final de línea.
const HEADERS_CRUDOS = [
  'From: "Banco Ejemplo" <no-responder@ejemplo.com.ar>',
  'Subject: Pagaste $2.571,30',
  'Content-Type: text/html;\r\n\tcharset="UTF-8"',
  'Content-Transfer-Encoding: quoted-printable',
].join('\r\n')

const CUERPO_CRUDO = ['<html><body>', 'Comprobó la compra en "Panader=', 'ía y Confitería"', '</body></html>'].join(
  '\n',
)

function crearMensaje(parcial: Partial<MensajeCrudo> = {}): MensajeCrudo {
  return {
    gmailMessageId: 'msg-1',
    remitente: 'no-responder@ejemplo.com.ar',
    asunto: 'Pagaste $2.571,30',
    headersCrudos: HEADERS_CRUDOS,
    cuerpo: CUERPO_CRUDO,
    recibidoEn: new Date('2026-08-24T14:20:00.000Z'),
    ...parcial,
  }
}

describe('RepositorioEmails.guardarSiEsNuevo', () => {
  let base: BasePostgresDeTest
  let repositorio: RepositorioEmails

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
    repositorio = crearRepositorioEmails(base.pool)
  })

  afterAll(async () => {
    await base.destruir()
  })

  beforeEach(async () => {
    // CASCADE: desde T18, `gastos.email_id` referencia `emails_crudos(id)`. La tabla sigue vacía en
    // este archivo (T18 no la toca), pero Postgres exige la cláusula para truncar una tabla
    // referenciada por una foreign key, exista o no una fila que la use.
    await base.pool.query('TRUNCATE emails_crudos CASCADE')
  })

  it('un INSERT directo que repite gmail_message_id viola la restricción de unicidad', async () => {
    await base.pool.query(
      `INSERT INTO emails_crudos (gmail_message_id, remitente, asunto, headers_crudos, cuerpo, recibido_en)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['msg-dup', 'a@b.com', 'asunto', 'headers', 'cuerpo', new Date()],
    )
    await expect(
      base.pool.query(
        `INSERT INTO emails_crudos (gmail_message_id, remitente, asunto, headers_crudos, cuerpo, recibido_en)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['msg-dup', 'a@b.com', 'asunto', 'headers', 'cuerpo', new Date()],
      ),
    ).rejects.toThrow()
  })

  it('la primera llamada devuelve yaExistia en falso y persiste con estado pendiente y procesado_en nulo', async () => {
    const resultado = await repositorio.guardarSiEsNuevo(crearMensaje())
    expect(resultado.yaExistia).toBe(false)

    const fila = await base.pool.query('SELECT estado, procesado_en FROM emails_crudos WHERE id = $1', [
      resultado.id,
    ])
    expect(fila.rows[0]?.estado).toBe('pendiente')
    expect(fila.rows[0]?.procesado_en).toBeNull()
  })

  it('una segunda llamada con el mismo gmailMessageId devuelve yaExistia en verdadero y no duplica la fila', async () => {
    const primero = await repositorio.guardarSiEsNuevo(crearMensaje())

    const segundo = await repositorio.guardarSiEsNuevo(
      crearMensaje({
        asunto: 'Pagaste $9.999,99',
        headersCrudos: 'Subject: otro asunto completamente distinto',
        cuerpo: '<html>otro cuerpo completamente distinto</html>',
      }),
    )

    expect(segundo.yaExistia).toBe(true)
    expect(segundo.id).toBe(primero.id)

    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM emails_crudos')
    expect(conteo.rows[0]?.count).toBe('1')

    // El email crudo original se conserva intacto (Req. 1.6): la segunda llamada no lo pisa.
    const fila = await base.pool.query('SELECT asunto, headers_crudos, cuerpo FROM emails_crudos WHERE id = $1', [
      primero.id,
    ])
    expect(fila.rows[0]?.asunto).toBe('Pagaste $2.571,30')
    expect(fila.rows[0]?.headers_crudos).toBe(HEADERS_CRUDOS)
    expect(fila.rows[0]?.cuerpo).toBe(CUERPO_CRUDO)
  })

  it('headersCrudos y cuerpo releídos son byte a byte idénticos a los de entrada', async () => {
    const resultado = await repositorio.guardarSiEsNuevo(crearMensaje())

    const fila = await base.pool.query('SELECT headers_crudos, cuerpo FROM emails_crudos WHERE id = $1', [
      resultado.id,
    ])
    expect(fila.rows[0]?.headers_crudos).toBe(HEADERS_CRUDOS)
    expect(fila.rows[0]?.cuerpo).toBe(CUERPO_CRUDO)
  })

  it('remitente, asunto y recibidoEn releídos coinciden con los de entrada', async () => {
    const mensaje = crearMensaje()
    const resultado = await repositorio.guardarSiEsNuevo(mensaje)

    const fila = await base.pool.query('SELECT remitente, asunto, recibido_en FROM emails_crudos WHERE id = $1', [
      resultado.id,
    ])
    expect(fila.rows[0]?.remitente).toBe(mensaje.remitente)
    expect(fila.rows[0]?.asunto).toBe(mensaje.asunto)
    expect(new Date(fila.rows[0]?.recibido_en).getTime()).toBe(mensaje.recibidoEn.getTime())
  })
})

describe('RepositorioEmails.marcarDescartado y traerCrudo (T21)', () => {
  let base: BasePostgresDeTest
  let repositorio: RepositorioEmails

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
    repositorio = crearRepositorioEmails(base.pool)
  })

  afterAll(async () => {
    await base.destruir()
  })

  beforeEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos CASCADE') // ver comentario más arriba (T18)
  })

  it('marcarDescartado deja el estado en descartado, distinto de error', async () => {
    const { id } = await repositorio.guardarSiEsNuevo(crearMensaje())

    await repositorio.marcarDescartado(id)

    const fila = await base.pool.query('SELECT estado FROM emails_crudos WHERE id = $1', [id])
    expect(fila.rows[0]?.estado).toBe('descartado')
    expect(fila.rows[0]?.estado).not.toBe('error')
  })

  it('la cola de errores (estado = error) no devuelve el email descartado, con control positivo', async () => {
    const { id: idDescartado } = await repositorio.guardarSiEsNuevo(crearMensaje({ gmailMessageId: 'msg-descartado' }))
    await repositorio.marcarDescartado(idDescartado)

    const { id: idError } = await repositorio.guardarSiEsNuevo(crearMensaje({ gmailMessageId: 'msg-error' }))
    await base.pool.query("UPDATE emails_crudos SET estado = 'error' WHERE id = $1", [idError])

    const colaDeErrores = await base.pool.query<{ id: string }>("SELECT id FROM emails_crudos WHERE estado = 'error'")
    const ids = colaDeErrores.rows.map((f) => f.id)

    expect(ids).toContain(idError) // control positivo: la consulta sí trae lo que corresponde
    expect(ids).not.toContain(idDescartado)
  })

  it('marcarDescartado no altera cuerpo, headersCrudos, remitente, asunto ni recibidoEn', async () => {
    const mensaje = crearMensaje()
    const { id } = await repositorio.guardarSiEsNuevo(mensaje)

    await repositorio.marcarDescartado(id)

    const fila = await base.pool.query(
      'SELECT cuerpo, headers_crudos, remitente, asunto, recibido_en FROM emails_crudos WHERE id = $1',
      [id],
    )
    expect(fila.rows[0]?.cuerpo).toBe(mensaje.cuerpo)
    expect(fila.rows[0]?.headers_crudos).toBe(mensaje.headersCrudos)
    expect(fila.rows[0]?.remitente).toBe(mensaje.remitente)
    expect(fila.rows[0]?.asunto).toBe(mensaje.asunto)
    expect(new Date(fila.rows[0]?.recibido_en).getTime()).toBe(mensaje.recibidoEn.getTime())
  })

  it('una segunda llamada a marcarDescartado no falla y conserva el estado', async () => {
    const { id } = await repositorio.guardarSiEsNuevo(crearMensaje())

    await repositorio.marcarDescartado(id)
    await expect(repositorio.marcarDescartado(id)).resolves.not.toThrow()

    const fila = await base.pool.query('SELECT estado FROM emails_crudos WHERE id = $1', [id])
    expect(fila.rows[0]?.estado).toBe('descartado')
  })

  it('traerCrudo devuelve headersCrudos y cuerpo byte a byte idénticos, sin consultar Gmail', async () => {
    const mensaje = crearMensaje()
    const { id } = await repositorio.guardarSiEsNuevo(mensaje)

    // La garantía "sin volver a Gmail" (Req. 10.3) la sostiene la firma, no un doble inyectado:
    // `traerCrudo(id: string): Promise<MensajeCrudo>` no recibe ningún `ClienteGmail` como
    // parámetro, así que Gmail es inalcanzable desde esta función — la misma técnica que usó T8
    // para "el header Date es inalcanzable". Nada que invocar acá tiene forma de llegar a la red.
    const resultado = await repositorio.traerCrudo(id)

    expect(resultado.headersCrudos).toBe(mensaje.headersCrudos)
    expect(resultado.cuerpo).toBe(mensaje.cuerpo)
    expect(resultado.gmailMessageId).toBe(mensaje.gmailMessageId)
    expect(resultado.remitente).toBe(mensaje.remitente)
    expect(resultado.asunto).toBe(mensaje.asunto)
    expect(resultado.recibidoEn.getTime()).toBe(mensaje.recibidoEn.getTime())
  })
})

describe('RepositorioEmails.obtenerUltimaRecepcion', () => {
  let base: BasePostgresDeTest
  let repositorio: RepositorioEmails

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
    repositorio = crearRepositorioEmails(base.pool)
  })

  afterAll(async () => {
    await base.destruir()
  })

  beforeEach(async () => {
    await base.pool.query('TRUNCATE emails_crudos CASCADE') // ver comentario más arriba (T18)
  })

  it('con la tabla vacía devuelve null', async () => {
    const resultado = await repositorio.obtenerUltimaRecepcion()

    expect(resultado).toBeNull()
  })

  it('con varias filas devuelve la recibidoEn más reciente, no la última insertada', async () => {
    await repositorio.guardarSiEsNuevo(
      crearMensaje({ gmailMessageId: 'msg-mas-viejo', recibidoEn: new Date('2026-08-01T00:00:00.000Z') }),
    )
    await repositorio.guardarSiEsNuevo(
      crearMensaje({ gmailMessageId: 'msg-mas-nuevo', recibidoEn: new Date('2026-08-20T00:00:00.000Z') }),
    )
    await repositorio.guardarSiEsNuevo(
      crearMensaje({ gmailMessageId: 'msg-intermedio', recibidoEn: new Date('2026-08-10T00:00:00.000Z') }),
    )

    const resultado = await repositorio.obtenerUltimaRecepcion()

    expect(resultado?.getTime()).toBe(new Date('2026-08-20T00:00:00.000Z').getTime())
  })
})
