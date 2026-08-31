import { describe, expect, it } from 'vitest'
import { obtenerCantidadPendientes } from '@/app/obtenerCantidadPendientes'
import type { RepositorioGastos, Gasto } from '@/infra/db/repositorioGastos'

function crearRepositorioSimulado(
  pendientes: Gasto[],
): Pick<RepositorioGastos, 'pendientesDeConfirmacion'> {
  return {
    async pendientesDeConfirmacion() {
      return pendientes
    },
  }
}

describe('obtenerCantidadPendientes — Req. 7.1', () => {
  it('con dos gastos pendientes devuelve 2, sin recalcular el filtro que ya aplica pendientesDeConfirmacion', async () => {
    const repositorioGastos = crearRepositorioSimulado([{} as Gasto, {} as Gasto])

    await expect(obtenerCantidadPendientes(repositorioGastos)).resolves.toBe(2)
  })

  it('sin gastos pendientes devuelve 0', async () => {
    const repositorioGastos = crearRepositorioSimulado([])

    await expect(obtenerCantidadPendientes(repositorioGastos)).resolves.toBe(0)
  })
})
