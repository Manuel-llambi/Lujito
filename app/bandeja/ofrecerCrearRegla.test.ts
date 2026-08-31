import { describe, expect, it } from 'vitest'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'
import type { RepositorioReglas } from '@/infra/db/repositorioReglas'

describe('ofrecerCrearRegla — Req. 7.5, 7.6, 7.7', () => {
  it('aceptado: crea la regla con el comercio y la categoría recibidos (Req. 7.6)', async () => {
    let llamada: [string, string] | undefined
    const repositorioReglas: Pick<RepositorioReglas, 'crear'> = {
      async crear(patronComercio, categoria) {
        llamada = [patronComercio, categoria]
      },
    }

    await ofrecerCrearRegla(repositorioReglas, true, 'COMERCIO-X', 'Comida')

    expect(llamada).toEqual(['COMERCIO-X', 'Comida'])
  })

  it('rechazado: no invoca crear, ninguna fila nueva en reglas_categoria (Req. 7.7)', async () => {
    let llamadas = 0
    const repositorioReglas: Pick<RepositorioReglas, 'crear'> = {
      async crear() {
        llamadas += 1
      },
    }

    await ofrecerCrearRegla(repositorioReglas, false, 'COMERCIO-X', 'Comida')

    expect(llamadas).toBe(0)
  })
})
