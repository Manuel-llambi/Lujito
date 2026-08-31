import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import { categorizarPorReglas } from '@/dominio/categorizacion/categorizarPorReglas'

describe('RepositorioReglas.listar', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('devuelve las diez reglas sembradas por T17, con la categoría resuelta por join', async () => {
    const repositorioReglas = crearRepositorioReglas(base.pool)

    const reglas = await repositorioReglas.listar()

    expect(reglas).toHaveLength(10)
    expect(reglas.every((r) => r.activa)).toBe(true)
  })

  it('el resultado sirve de verdad para categorizarPorReglas', async () => {
    const repositorioReglas = crearRepositorioReglas(base.pool)
    const reglas = await repositorioReglas.listar()

    const resultado = categorizarPorReglas('COTO SUCURSAL 0142', reglas)

    expect(resultado?.categoria).toBe('Comida')
  })
})

describe('RepositorioReglas.crear (Req. 7.6, T51)', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('persiste una regla activa con creada_por usuario y la categoría resuelta por el nombre recibido', async () => {
    const repositorioReglas = crearRepositorioReglas(base.pool)

    await repositorioReglas.crear('COMERCIO-NUEVO-T51', 'Salidas')

    const fila = await base.pool.query(
      `SELECT r.patron_comercio, c.nombre AS categoria, r.creada_por, r.activa
       FROM reglas_categoria r JOIN categorias c ON c.id = r.categoria_id
       WHERE r.patron_comercio = $1`,
      ['COMERCIO-NUEVO-T51'],
    )
    expect(fila.rows[0]).toEqual({
      patron_comercio: 'COMERCIO-NUEVO-T51',
      categoria: 'Salidas',
      creada_por: 'usuario',
      activa: true,
    })
  })

  it('la regla creada categoriza de verdad un gasto posterior del mismo comercio (Req. 7.6)', async () => {
    const repositorioReglas = crearRepositorioReglas(base.pool)
    await repositorioReglas.crear('COMERCIO-REGLA-NUEVA', 'Comida')

    const reglas = await repositorioReglas.listar()
    const resultado = categorizarPorReglas('COMERCIO-REGLA-NUEVA SUCURSAL CENTRO', reglas)

    expect(resultado?.categoria).toBe('Comida')
  })
})
