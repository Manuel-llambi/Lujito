import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { aplicarMigraciones } from '@/infra/db/migrar'
import { categorizarPorReglas, type Categoria, type Regla } from '@/dominio/categorizacion/categorizarPorReglas'

const PATRONES_ESPERADOS: Array<{ patron: string; categoria: Categoria }> = [
  { patron: 'MERPAGO*LAFRUTAALEGRE', categoria: 'Comida' },
  { patron: 'SUPER CORAZON', categoria: 'Comida' },
  { patron: 'COTO SUCURSAL', categoria: 'Comida' },
  { patron: 'RES SOLDADO', categoria: 'Comida' },
  { patron: 'PANADERIA Y CONFITERIA', categoria: 'Comida' },
  { patron: 'SUBE', categoria: 'Salidas' },
  { patron: 'PAY*AR*UBER', categoria: 'Salidas' },
  { patron: 'MISTER PEDRO', categoria: 'Salidas' },
  { patron: 'HAVANNA', categoria: 'Salidas' },
  { patron: 'FARMACITY', categoria: 'Extras' },
]

async function leerReglas(base: BasePostgresDeTest): Promise<Regla[]> {
  const resultado = await base.pool.query<{
    id: string
    patron_comercio: string
    nombre: string
    prioridad: number
    creada_por: string
    activa: boolean
  }>(
    `SELECT r.id, r.patron_comercio, c.nombre, r.prioridad, r.creada_por, r.activa
     FROM reglas_categoria r JOIN categorias c ON c.id = r.categoria_id
     ORDER BY r.id`,
  )
  return resultado.rows.map((fila) => ({
    id: fila.id,
    patronComercio: fila.patron_comercio,
    categoria: fila.nombre as Categoria,
    prioridad: fila.prioridad,
    activa: fila.activa,
  }))
}

describe('migración de categorias y reglas_categoria', () => {
  let base: BasePostgresDeTest

  beforeAll(async () => {
    base = await crearBasePostgresDeTest()
  })

  afterAll(async () => {
    await base.destruir()
  })

  it('categorias contiene exactamente las cuatro categorías, cada una con color no vacío', async () => {
    const resultado = await base.pool.query<{ nombre: string; color: string }>(
      'SELECT nombre, color FROM categorias ORDER BY nombre',
    )
    expect(resultado.rows.map((r) => r.nombre).sort()).toEqual(
      ['Comida', 'Extras', 'Salidas', 'Sin categorizar'].sort(),
    )
    for (const fila of resultado.rows) {
      expect(fila.color.length).toBeGreaterThan(0)
    }
  })

  it('reglas_categoria contiene exactamente las diez filas de la semilla, con el JOIN resuelto', async () => {
    const reglas = await leerReglas(base)
    const pares = reglas
      .map((r) => ({ patron: r.patronComercio, categoria: r.categoria }))
      .sort((a, b) => a.patron.localeCompare(b.patron))
    const esperado = [...PATRONES_ESPERADOS].sort((a, b) => a.patron.localeCompare(b.patron))
    expect(pares).toEqual(esperado)
  })

  it('las diez filas tienen creada_por "usuario" y activa en verdadero', async () => {
    const reglas = await leerReglas(base)
    expect(reglas).toHaveLength(10)
    for (const regla of reglas) {
      expect(regla.activa).toBe(true)
    }
    const creadaPor = await base.pool.query<{ creada_por: string }>(
      'SELECT DISTINCT creada_por FROM reglas_categoria',
    )
    expect(creadaPor.rows.map((r) => r.creada_por)).toEqual(['usuario'])
  })

  it('las diez filas tienen prioridad 0', async () => {
    const reglas = await leerReglas(base)
    for (const regla of reglas) {
      expect(regla.prioridad).toBe(0)
    }
  })

  it('la semilla sirve de verdad: categorizarPorReglas clasifica comercios reales con ella', async () => {
    const reglas = await leerReglas(base)

    const coto = categorizarPorReglas('COTO SUCURSAL 0142', reglas)
    expect(coto?.categoria).toBe('Comida')

    const farmacity = categorizarPorReglas('FARMACITY 0333', reglas)
    expect(farmacity?.categoria).toBe('Extras')
  })

  it('ningún patrón sembrado está contenido en otro', async () => {
    const reglas = await leerReglas(base)
    for (const a of reglas) {
      for (const b of reglas) {
        if (a.id === b.id) continue
        expect(a.patronComercio.includes(b.patronComercio)).toBe(false)
      }
    }
  })

  it('andamiaje: volver a correr las migraciones no falla ni duplica filas', async () => {
    await expect(aplicarMigraciones(base.pool)).resolves.not.toThrow()

    const conteoCategorias = await base.pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM categorias',
    )
    expect(conteoCategorias.rows[0]?.count).toBe('4')

    const conteoReglas = await base.pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM reglas_categoria',
    )
    expect(conteoReglas.rows[0]?.count).toBe('10')
  })
})
