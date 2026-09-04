import Decimal from 'decimal.js'
import type { Pool, PoolClient } from 'pg'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { crearBasePostgresDeTest, type BasePostgresDeTest } from '@/infra/db/testUtils/basePostgresDeTest'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import { ejecutarCrearGastoManual, validarDatosGastoManual } from '@/app/dashboard/crearGastoManual'
import type { NuevoGastoManual } from '@/dominio/gastos/nuevoGastoManual'

function formDataCompleto(campos: Record<string, string> = {}): FormData {
  const formData = new FormData()
  const valoresPorDefecto: Record<string, string> = {
    monto: '$1.234,56',
    comercio: 'Kiosco',
    fecha: '2026-08-24',
    categoria: 'Comida',
    ...campos,
  }
  for (const [clave, valor] of Object.entries(valoresPorDefecto)) {
    formData.set(clave, valor)
  }
  return formData
}

function datosCompletos(parcial: Partial<NuevoGastoManual> = {}): NuevoGastoManual {
  return {
    montoTotal: new Decimal('1234.56'),
    comercio: 'Kiosco',
    fechaGasto: new Date('2026-08-24T14:14:00.000Z'),
    categoria: 'Comida',
    ...parcial,
  }
}

/**
 * Envuelve `poolReal` para que la PRIMER query cuyo texto arranca con `textoQueFalla` lance
 * `errorSimulado`, delegando todas las demás queries (incluidos `BEGIN`/`COMMIT`/`ROLLBACK` y el
 * `INSERT` de `crearManual`) al cliente real de Postgres — no es un mock de la base entera, solo un
 * punto de falla inyectado dentro de una transacción que corre de verdad, mismo espíritu que el
 * "camino de fallo" de `ejecutarEnTransaccion.test.ts` pero aplicado a la composición completa de T3.
 * Necesario porque ni `gastos` ni `imputaciones` tienen una constraint que se pueda violar en el paso
 * 3/4 sin también romper el paso 1 (`monto_positivo` es idéntica en ambas tablas para una sola cuota).
 */
function crearPoolQueFallaEnLaPrimerQueryQueEmpiezaCon(poolReal: Pool, textoQueFalla: string, errorSimulado: Error): Pool {
  return {
    async connect(): Promise<PoolClient> {
      const clienteReal = await poolReal.connect()
      const queryOriginal = clienteReal.query.bind(clienteReal)
      let yaFallo = false
      ;(clienteReal as unknown as { query: typeof clienteReal.query }).query = ((...args: Parameters<typeof queryOriginal>) => {
        const texto = typeof args[0] === 'string' ? args[0] : (args[0] as { text?: string })?.text
        if (!yaFallo && typeof texto === 'string' && texto.startsWith(textoQueFalla)) {
          yaFallo = true
          return Promise.reject(errorSimulado)
        }
        return queryOriginal(...args)
      }) as typeof clienteReal.query
      return clienteReal
    },
  } as unknown as Pool
}

describe('ejecutarCrearGastoManual (T3, Req. 3.4, 4.2, 4.3, 4.4, 5.2)', () => {
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

  it('crea el gasto sin email de origen y lo deja imputado (Req. 4.1 vía T2, 4.3)', async () => {
    const gasto = await ejecutarCrearGastoManual(base.pool, datosCompletos())

    expect(gasto.emailId).toBeNull()
    expect(gasto.categoriaOrigen).toBe('usuario')
    expect(gasto.estado).toBe('imputado')

    const fila = await base.pool.query<{ estado: string; email_id: string | null }>(
      'SELECT estado, email_id FROM gastos WHERE id = $1',
      [gasto.id],
    )
    expect(fila.rows[0]?.estado).toBe('imputado')
    expect(fila.rows[0]?.email_id).toBeNull()
  })

  it('crea exactamente una imputación por el monto total, en el mes que resulta de mesDe(fechaGasto) (Req. 4.2)', async () => {
    const gasto = await ejecutarCrearGastoManual(base.pool, datosCompletos())

    const filas = await base.pool.query<{ numero_cuota: number; monto: string; mes: string }>(
      'SELECT numero_cuota, monto, mes FROM imputaciones WHERE gasto_id = $1',
      [gasto.id],
    )
    expect(filas.rows).toHaveLength(1)
    expect(filas.rows[0]?.numero_cuota).toBe(1)
    expect(new Decimal(filas.rows[0]?.monto ?? '0').equals(new Decimal('1234.56'))).toBe(true)
    expect(filas.rows[0]?.mes).toBe('2026-08')
  })

  it('si falla el INSERT de la imputación, ni el gasto ni la imputación quedan escritos (Req. 3.4, 4.4)', async () => {
    const errorSimulado = new Error('fallo simulado en el INSERT de imputaciones (T3, rollback)')
    const poolQueFalla = crearPoolQueFallaEnLaPrimerQueryQueEmpiezaCon(
      base.pool,
      'INSERT INTO imputaciones',
      errorSimulado,
    )

    await expect(ejecutarCrearGastoManual(poolQueFalla, datosCompletos({ comercio: 'Kiosco Rollback' }))).rejects.toBe(
      errorSimulado,
    )

    const gastos = await base.pool.query('SELECT id FROM gastos WHERE comercio = $1', ['Kiosco Rollback'])
    expect(gastos.rows).toHaveLength(0)
    const imputaciones = await base.pool.query('SELECT id FROM imputaciones')
    expect(imputaciones.rows).toHaveLength(0)
  })

  it('si falla marcarImputado, ni el gasto ni la imputación quedan escritos (Req. 3.4, 4.4)', async () => {
    const errorSimulado = new Error('fallo simulado en marcarImputado (T3, rollback)')
    const poolQueFalla = crearPoolQueFallaEnLaPrimerQueryQueEmpiezaCon(
      base.pool,
      "UPDATE gastos SET estado = 'imputado'",
      errorSimulado,
    )

    await expect(
      ejecutarCrearGastoManual(poolQueFalla, datosCompletos({ comercio: 'Kiosco Rollback Imputado' })),
    ).rejects.toBe(errorSimulado)

    const gastos = await base.pool.query('SELECT id FROM gastos WHERE comercio = $1', ['Kiosco Rollback Imputado'])
    expect(gastos.rows).toHaveLength(0)
    const imputaciones = await base.pool.query('SELECT id FROM imputaciones')
    expect(imputaciones.rows).toHaveLength(0)
  })

  it('el gasto cargado a mano entra en totalesPorMesYCategoria en pie de igualdad con uno de email (Req. 5.2)', async () => {
    const repositorioImputaciones = crearRepositorioImputaciones(base.pool)
    const gasto = await ejecutarCrearGastoManual(base.pool, datosCompletos({ montoTotal: new Decimal('300.00') }))

    const filas = await repositorioImputaciones.totalesPorMesYCategoria('2026-08', '2026-08')

    const fila = filas.find((f) => f.categoria === 'Comida')
    expect(fila?.total.equals(new Decimal('300.00'))).toBe(true)
    expect(gasto.categoria).toBe('Comida')
  })
})

describe('validarDatosGastoManual (T4, Req. 2.1, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4)', () => {
  it('con datos válidos, arma { datos } con el Decimal de normalizarMonto, comercio y categoría (Req. 4.1 vía T2)', () => {
    const resultado = validarDatosGastoManual(formDataCompleto())

    expect('datos' in resultado).toBe(true)
    if ('datos' in resultado) {
      expect(resultado.datos.montoTotal.equals(new Decimal('1234.56'))).toBe(true)
      expect(resultado.datos.comercio).toBe('Kiosco')
      expect(resultado.datos.categoria).toBe('Comida')
    }
  })

  it.each([
    ['vacío', ''],
    ['no numérico', 'no es un monto'],
    ['cero', '$0,00'],
  ])('con un monto %s, devuelve { error } y no arma { datos } (Req. 2.1, 3.1)', (_caso, monto) => {
    const resultado = validarDatosGastoManual(formDataCompleto({ monto }))

    expect('error' in resultado).toBe(true)
    expect('datos' in resultado).toBe(false)
  })

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
  ])('con un comercio %s, devuelve { error } y no arma { datos } (Req. 2.2, 3.2)', (_caso, comercio) => {
    const resultado = validarDatosGastoManual(formDataCompleto({ comercio }))

    expect('error' in resultado).toBe(true)
    expect('datos' in resultado).toBe(false)
  })

  it('con categoría ausente, devuelve { error } y no arma { datos } (Req. 2.4, 3.3)', () => {
    const formData = formDataCompleto()
    formData.delete('categoria')

    const resultado = validarDatosGastoManual(formData)

    expect('error' in resultado).toBe(true)
    expect('datos' in resultado).toBe(false)
  })

  it('con una categoría fuera de CATEGORIAS_MANUAL, devuelve { error } y no arma { datos } (Req. 2.4, 3.3)', () => {
    const resultado = validarDatosGastoManual(formDataCompleto({ categoria: 'Sin categorizar' }))

    expect('error' in resultado).toBe(true)
    expect('datos' in resultado).toBe(false)
  })
})
