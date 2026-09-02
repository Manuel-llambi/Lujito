import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { obtenerFilasDetalladas } from '@/app/dashboard/obtenerFilasDetalladas'
import { MESES_VISIBLES_EN_DASHBOARD } from '@/app/dashboard/obtenerFilasDashboard'
import type { RepositorioImputaciones, FilaImputacionDetallada } from '@/infra/db/repositorioImputaciones'

describe('obtenerFilasDetalladas (trabajo ad hoc /dashboard)', () => {
  it('pide al repositorio la misma ventana de doce meses que obtenerFilasDashboard', async () => {
    let rangoRecibido: [string, string] | undefined
    const repositorioImputaciones: Pick<RepositorioImputaciones, 'imputacionesDetalladasEntre'> = {
      async imputacionesDetalladasEntre(desde, hasta) {
        rangoRecibido = [desde, hasta]
        return []
      },
    }

    expect(MESES_VISIBLES_EN_DASHBOARD).toBe(12)

    await obtenerFilasDetalladas(repositorioImputaciones, new Date('2026-08-27T02:00:00.000Z'))

    expect(rangoRecibido).toEqual(['2025-09', '2026-08'])
  })

  it('convierte monto de Decimal a number sin alterar el resto de la fila, y no suma nada', async () => {
    const fechaGasto = new Date('2026-08-15T14:14:00.000Z')
    const filasSimuladas: FilaImputacionDetallada[] = [
      {
        mes: '2026-08',
        categoria: 'Comida',
        monto: new Decimal('1234.56'),
        fechaGasto,
        comercio: 'ALMACEN DON JOSE',
        tieneSinConfirmar: true,
      },
    ]
    const repositorioImputaciones: Pick<RepositorioImputaciones, 'imputacionesDetalladasEntre'> = {
      async imputacionesDetalladasEntre() {
        return filasSimuladas
      },
    }

    const filas = await obtenerFilasDetalladas(repositorioImputaciones, new Date('2026-08-27T02:00:00.000Z'))

    expect(filas).toEqual([
      {
        mes: '2026-08',
        categoria: 'Comida',
        monto: 1234.56,
        fechaGasto,
        comercio: 'ALMACEN DON JOSE',
        tieneSinConfirmar: true,
      },
    ])
  })

  it('propaga comercio sin transformar, incluido el caso null (parser que nunca lo completó)', async () => {
    const fechaGasto = new Date('2026-08-15T14:14:00.000Z')
    const filasSimuladas: FilaImputacionDetallada[] = [
      { mes: '2026-08', categoria: 'Comida', monto: new Decimal('10.00'), fechaGasto, comercio: null, tieneSinConfirmar: false },
    ]
    const repositorioImputaciones: Pick<RepositorioImputaciones, 'imputacionesDetalladasEntre'> = {
      async imputacionesDetalladasEntre() {
        return filasSimuladas
      },
    }

    const filas = await obtenerFilasDetalladas(repositorioImputaciones, new Date('2026-08-27T02:00:00.000Z'))

    expect(filas[0]?.comercio).toBeNull()
  })
})
