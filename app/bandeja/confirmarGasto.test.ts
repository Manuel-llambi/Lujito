import { describe, expect, it } from 'vitest'
import { ejecutarConfirmarGasto } from '@/app/bandeja/confirmarGasto'
import type { RepositorioGastos } from '@/infra/db/repositorioGastos'

describe('ejecutarConfirmarGasto — Req. 7.3', () => {
  it('confirma el gasto con la categoría recibida, delegando en RepositorioGastos.confirmar sin transformarla', async () => {
    let llamada: [string, string] | undefined
    const repositorioGastos: Pick<RepositorioGastos, 'confirmar'> = {
      async confirmar(id, categoria) {
        llamada = [id, categoria]
      },
    }

    await ejecutarConfirmarGasto(repositorioGastos, 'gasto-1', 'Comida')

    expect(llamada).toEqual(['gasto-1', 'Comida'])
  })
})
