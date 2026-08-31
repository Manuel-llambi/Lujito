import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { obtenerGastosPendientes } from '@/app/bandeja/obtenerGastosPendientes'
import type { Gasto, RepositorioGastos } from '@/infra/db/repositorioGastos'

function crearGastoPendiente(id: string): Gasto {
  return {
    id,
    emailId: `email-${id}`,
    montoTotal: new Decimal('100'),
    moneda: 'ARS',
    comercio: 'COMERCIO',
    fechaGasto: new Date('2026-08-24T00:00:00.000Z'),
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '1234',
    cuotasTotal: 1,
    estado: 'categorizado',
    categoria: 'Comida',
    categoriaOrigen: 'ia',
    categoriaJustificacion: 'justificación',
    confirmadoEn: null,
  }
}

describe('obtenerGastosPendientes — Req. 7.2', () => {
  it('devuelve exactamente los gastos que reporta pendientesDeConfirmacion, sin agregar ni quitar ninguno', async () => {
    const pendientes = [crearGastoPendiente('gasto-1'), crearGastoPendiente('gasto-2')]
    const repositorioGastos: Pick<RepositorioGastos, 'pendientesDeConfirmacion'> = {
      async pendientesDeConfirmacion() {
        return pendientes
      },
    }

    await expect(obtenerGastosPendientes(repositorioGastos)).resolves.toEqual(pendientes)
  })

  it('con la bandeja vacía, devuelve una lista vacía', async () => {
    const repositorioGastos: Pick<RepositorioGastos, 'pendientesDeConfirmacion'> = {
      async pendientesDeConfirmacion() {
        return []
      },
    }

    await expect(obtenerGastosPendientes(repositorioGastos)).resolves.toEqual([])
  })
})
