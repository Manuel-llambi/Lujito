import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { obtenerFilasDashboard, MESES_VISIBLES_EN_DASHBOARD } from '@/app/dashboard/obtenerFilasDashboard'
import type { RepositorioImputaciones, FilaDashboard } from '@/infra/db/repositorioImputaciones'

describe('obtenerFilasDashboard — Req. 9.1, 9.2', () => {
  it('pide al repositorio la ventana de los últimos 12 meses calendario terminando en el mes actual, en la zona horaria de referencia', async () => {
    let rangoRecibido: [string, string] | undefined
    const repositorioImputaciones: Pick<RepositorioImputaciones, 'totalesPorMesYCategoria'> = {
      async totalesPorMesYCategoria(desde, hasta) {
        rangoRecibido = [desde, hasta]
        return []
      },
    }

    expect(MESES_VISIBLES_EN_DASHBOARD).toBe(12)

    // 2026-08-27T02:00:00Z es 2026-08-26 23:00 en America/Argentina/Buenos_Aires (UTC-3) — mismo caso
    // borde de zona horaria que ya cubre mesDe.test.ts: el mes de referencia sigue siendo agosto.
    await obtenerFilasDashboard(repositorioImputaciones, new Date('2026-08-27T02:00:00.000Z'))

    expect(rangoRecibido).toEqual(['2025-09', '2026-08']) // 12 meses: 2025-09 .. 2026-08 inclusive
  })

  it('convierte cada total de Decimal a number sin alterar el resto de la fila, y no vuelve a sumar nada — el contenedor no calcula (Req. 9.1)', async () => {
    const filasSimuladas: FilaDashboard[] = [
      { mes: '2026-08', categoria: 'Comida', total: new Decimal('1234.56'), tieneSinConfirmar: true },
      { mes: '2026-07', categoria: 'Salidas', total: new Decimal('0.10'), tieneSinConfirmar: false },
    ]
    const repositorioImputaciones: Pick<RepositorioImputaciones, 'totalesPorMesYCategoria'> = {
      async totalesPorMesYCategoria() {
        return filasSimuladas
      },
    }

    const filas = await obtenerFilasDashboard(repositorioImputaciones, new Date('2026-08-27T02:00:00.000Z'))

    expect(filas).toEqual([
      { mes: '2026-08', categoria: 'Comida', total: 1234.56, tieneSinConfirmar: true },
      { mes: '2026-07', categoria: 'Salidas', total: 0.1, tieneSinConfirmar: false },
    ])
  })
})
