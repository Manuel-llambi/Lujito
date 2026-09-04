import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'

/**
 * T1 — migración `0009_gastos_email_id_nullable.sql`: habilita un alta manual (Req. 4.1), que no
 * tiene ningún email de origen. Antes de esta migración, `email_id` es `NOT NULL` (`0004_gastos.sql`)
 * y este mismo `INSERT` viola esa constraint.
 */
describe('migración de gastos.email_id nullable (T1, Req. 4.1)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('un INSERT en gastos con email_id NULL se ejecuta sin violar ninguna constraint', async () => {
    const resultado = await base.pool.query(
      `INSERT INTO gastos (email_id, monto_total, moneda, categoria_origen, estado)
       VALUES (NULL, 100, 'ARS', 'usuario', 'categorizado') RETURNING id, email_id`,
    )
    expect(resultado.rows[0]?.email_id).toBeNull()
  })

  it('regresión: la constraint UNIQUE sobre email_id sigue vigente para dos filas con el mismo email_id no nulo', async () => {
    const repositorioEmails = crearRepositorioEmails(base.pool)
    const { id: emailId } = await repositorioEmails.guardarSiEsNuevo({
      gmailMessageId: 'msg-unique-email-id',
      remitente: 'no-responder@banco-ejemplo.com.ar',
      asunto: 'Pagaste $100,00',
      headersCrudos: 'From: no-responder@banco-ejemplo.com.ar',
      cuerpo: '<html></html>',
      recibidoEn: new Date('2026-09-01T10:00:00.000Z'),
    })

    await base.pool.query(
      `INSERT INTO gastos (email_id, monto_total, moneda, categoria_origen, estado)
       VALUES ($1, 100, 'ARS', 'usuario', 'categorizado')`,
      [emailId],
    )

    await expect(
      base.pool.query(
        `INSERT INTO gastos (email_id, monto_total, moneda, categoria_origen, estado)
         VALUES ($1, 200, 'ARS', 'usuario', 'categorizado')`,
        [emailId],
      ),
    ).rejects.toThrow()
  })
})
