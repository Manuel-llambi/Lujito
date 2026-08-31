import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioAccesoGmail, type RepositorioAccesoGmail } from '@/infra/db/repositorioAccesoGmail'

describe('RepositorioAccesoGmail', () => {
  let base: BasePostgresDeTest
  let repositorio: RepositorioAccesoGmail

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  beforeEach(async () => {
    await base.pool.query(
      'UPDATE estado_acceso_gmail SET revocado_en = NULL, detalle = NULL, restablecido_en = NULL WHERE id = 1',
    )
    repositorio = crearRepositorioAccesoGmail(base.pool)
  })

  it('estaRevocado devuelve falso sobre una base recién migrada, y verdadero tras marcarRevocado', async () => {
    expect(await repositorio.estaRevocado()).toBe(false)

    await repositorio.marcarRevocado('el usuario retiró el permiso de la app')

    expect(await repositorio.estaRevocado()).toBe(true)
  })

  it('el latch sobrevive a una instancia nueva del repositorio sobre la misma base (reinicio de proceso)', async () => {
    await repositorio.marcarRevocado('el usuario retiró el permiso de la app')

    const otraInstancia = crearRepositorioAccesoGmail(base.pool)
    expect(await otraInstancia.estaRevocado()).toBe(true)
  })

  it('el detalle y el instante quedan consultables con SQL directo sobre la tabla', async () => {
    const antes = new Date()
    await repositorio.marcarRevocado('detalle con acentos: canceló la autorización')
    const despues = new Date()

    const fila = await base.pool.query<{ detalle: string; revocado_en: Date }>(
      'SELECT detalle, revocado_en FROM estado_acceso_gmail WHERE id = 1',
    )
    expect(fila.rows[0]?.detalle).toBe('detalle con acentos: canceló la autorización')
    const revocadoEn = new Date(fila.rows[0]!.revocado_en).getTime()
    expect(revocadoEn).toBeGreaterThanOrEqual(antes.getTime())
    expect(revocadoEn).toBeLessThanOrEqual(despues.getTime())
  })

  it('registro único: un segundo marcarRevocado con detalle distinto no pisa el primero', async () => {
    await repositorio.marcarRevocado('primer detalle')
    const primeraFila = await base.pool.query('SELECT revocado_en, detalle FROM estado_acceso_gmail WHERE id = 1')

    await repositorio.marcarRevocado('segundo detalle, completamente distinto')
    const segundaFila = await base.pool.query('SELECT revocado_en, detalle FROM estado_acceso_gmail WHERE id = 1')

    expect(segundaFila.rows[0]?.detalle).toBe('primer detalle')
    expect(new Date(segundaFila.rows[0]?.revocado_en).getTime()).toBe(
      new Date(primeraFila.rows[0]?.revocado_en).getTime(),
    )

    const conteo = await base.pool.query('SELECT count(*)::text AS count FROM estado_acceso_gmail')
    expect(conteo.rows[0]?.count).toBe('1')
  })

  it('restablecimiento: tras un UPDATE directo que escribe restablecido_en, estaRevocado devuelve falso', async () => {
    await repositorio.marcarRevocado('detalle')
    await base.pool.query('UPDATE estado_acceso_gmail SET restablecido_en = now() WHERE id = 1')

    expect(await repositorio.estaRevocado()).toBe(false)
  })

  it('re-revocación: con el acceso restablecido, un marcarRevocado nuevo vuelve a poner el latch en verdadero', async () => {
    await repositorio.marcarRevocado('primera revocación')
    await base.pool.query('UPDATE estado_acceso_gmail SET restablecido_en = now() WHERE id = 1')
    expect(await repositorio.estaRevocado()).toBe(false)

    await repositorio.marcarRevocado('segunda revocación, después de restablecer')

    expect(await repositorio.estaRevocado()).toBe(true)
    const fila = await base.pool.query(
      'SELECT detalle, restablecido_en FROM estado_acceso_gmail WHERE id = 1',
    )
    expect(fila.rows[0]?.detalle).toBe('segunda revocación, después de restablecer')
    expect(fila.rows[0]?.restablecido_en).toBeNull()
  })

  it('andamiaje: un INSERT directo con id = 2 es rechazado por el CHECK de fila única', async () => {
    await expect(
      base.pool.query('INSERT INTO estado_acceso_gmail (id) VALUES (2)'),
    ).rejects.toThrow()
  })
})
