import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { aplicarMigraciones } from '@/infra/db/migrar'

describe('aplicarMigraciones', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('corre desde cero contra una base vacía y crea emails_crudos y el tipo estado_email', async () => {
    const columnas = await base.pool.query<{ column_name: string; data_type: string; is_nullable: string }>(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns
       WHERE table_name = 'emails_crudos' ORDER BY ordinal_position`,
    )

    expect(columnas.rows.map((c) => c.column_name)).toEqual([
      'id',
      'gmail_message_id',
      'remitente',
      'asunto',
      'headers_crudos',
      'cuerpo',
      'recibido_en',
      'estado',
      'procesado_en',
    ])

    const noNulas = columnas.rows.filter((c) => c.is_nullable === 'NO').map((c) => c.column_name)
    expect(noNulas).toEqual(
      expect.arrayContaining([
        'id',
        'gmail_message_id',
        'remitente',
        'asunto',
        'headers_crudos',
        'cuerpo',
        'recibido_en',
        'estado',
      ]),
    )

    const tipoEnum = await base.pool.query<{ enumlabel: string }>(
      `SELECT enumlabel FROM pg_enum
       JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
       WHERE pg_type.typname = 'estado_email'
       ORDER BY enumsortorder`,
    )
    expect(tipoEnum.rows.map((r) => r.enumlabel)).toEqual([
      'pendiente',
      'procesado',
      'descartado',
      'error',
    ])
  })

  it('volver a correr las migraciones no falla ni duplica objetos', async () => {
    await expect(aplicarMigraciones(base.pool)).resolves.not.toThrow()

    const tablas = await base.pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM information_schema.tables WHERE table_name = 'emails_crudos'`,
    )
    expect(tablas.rows[0]?.count).toBe('1')
  })
})
