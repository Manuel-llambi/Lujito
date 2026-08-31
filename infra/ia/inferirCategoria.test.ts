import { describe, expect, it } from 'vitest'
import {
  inferirCategoria,
  RESPUESTAS_IA,
  type ClienteIA,
  type RespuestaInferencia,
  type SolicitudInferencia,
} from '@/infra/ia/inferirCategoria'
import { CATEGORIAS_INFERIBLES } from '@/dominio/categorizacion/categorizarPorReglas'

function crearClienteSimulado(respuesta: RespuestaInferencia): {
  cliente: ClienteIA
  solicitudesRecibidas: SolicitudInferencia[]
} {
  const solicitudesRecibidas: SolicitudInferencia[] = []
  const cliente: ClienteIA = {
    async inferir(solicitud) {
      solicitudesRecibidas.push(solicitud)
      return respuesta
    },
  }
  return { cliente, solicitudesRecibidas }
}

describe('RESPUESTAS_IA', () => {
  it('es exactamente CATEGORIAS_INFERIBLES más "no_estoy_seguro", en ese orden', () => {
    expect(RESPUESTAS_IA).toEqual([...CATEGORIAS_INFERIBLES, 'no_estoy_seguro'])
    expect(RESPUESTAS_IA).toEqual(['Salidas', 'Comida', 'Extras', 'no_estoy_seguro'])
  })
})

describe('inferirCategoria', () => {
  it('la solicitud restringe la respuesta a RESPUESTAS_IA y nombra el comercio', async () => {
    const { cliente, solicitudesRecibidas } = crearClienteSimulado({
      categoria: 'Extras',
      justificacion: 'FARMACITY es una cadena de farmacias conocida',
    })

    await inferirCategoria('FARMACITY 0333', cliente)

    expect(solicitudesRecibidas).toHaveLength(1)
    expect(solicitudesRecibidas[0]?.comercio).toBe('FARMACITY 0333')
    expect(solicitudesRecibidas[0]?.categoriasPermitidas).toEqual(RESPUESTAS_IA)
  })

  it('con una respuesta pronunciada, devuelve la categoría y la justificación literal', async () => {
    const { cliente } = crearClienteSimulado({
      categoria: 'Extras',
      justificacion: 'FARMACITY es una cadena de farmacias conocida',
    })

    const resultado = await inferirCategoria('FARMACITY 0333', cliente)

    expect(resultado).toEqual({
      categoria: 'Extras',
      justificacion: 'FARMACITY es una cadena de farmacias conocida',
    })
  })

  it('con la abstención "no_estoy_seguro", devuelve nulo', async () => {
    const { cliente } = crearClienteSimulado({
      categoria: 'no_estoy_seguro',
      justificacion: 'el nombre del comercio no permite inferir la categoría con confianza',
    })

    const resultado = await inferirCategoria('XZQW1234', cliente)

    expect(resultado).toBeNull()
  })

  it('la abstención no propone ninguna categoría: el resultado no es un objeto con "categoria"', async () => {
    const { cliente } = crearClienteSimulado({
      categoria: 'no_estoy_seguro',
      justificacion: 'sin confianza',
    })

    const resultado = await inferirCategoria('XZQW1234', cliente)

    // `null` estricto es la única forma del resultado; no hay ninguna rama que devuelva
    // `{ categoria: 'no_estoy_seguro' }` ni ninguna categoría de reemplazo.
    expect(resultado).toBe(null)
  })
})

describe('inferirCategoria: respuesta fuera del enum y falla del modelo (T28)', () => {
  it('con una respuesta fuera de RESPUESTAS_IA, devuelve nulo', async () => {
    const { cliente } = crearClienteSimulado({
      categoria: 'Otra cosa que no está en el enum',
      justificacion: 'el modelo no respetó la restricción del schema',
    })

    const resultado = await inferirCategoria('COMERCIO RARO', cliente)

    expect(resultado).toBeNull()
  })

  it('una respuesta fuera del enum invoca al cliente una sola vez, sin disparar el reintento de 6.5', async () => {
    const { cliente, solicitudesRecibidas } = crearClienteSimulado({
      categoria: 'Otra cosa que no está en el enum',
      justificacion: 'el modelo no respetó la restricción del schema',
    })

    await inferirCategoria('COMERCIO RARO', cliente)

    expect(solicitudesRecibidas).toHaveLength(1)
  })

  it('con un cliente que rechaza todas sus invocaciones, la promesa resuelve en nulo sin lanzar', async () => {
    const cliente: ClienteIA = {
      inferir: async () => {
        throw new Error('el modelo no respondió')
      },
    }

    await expect(inferirCategoria('COMERCIO CUALQUIERA', cliente)).resolves.toBeNull()
  })

  it('en ese caso, el cliente fue invocado más de una vez: hubo reintento real', async () => {
    let invocaciones = 0
    const cliente: ClienteIA = {
      inferir: async () => {
        invocaciones++
        throw new Error('el modelo no respondió')
      },
    }

    await inferirCategoria('COMERCIO CUALQUIERA', cliente)

    expect(invocaciones).toBeGreaterThan(1)
  })

  it('el número de invocaciones es acotado: la promesa resuelve en un tiempo finito de test, sin timers reales', async () => {
    let invocaciones = 0
    const cliente: ClienteIA = {
      inferir: async () => {
        invocaciones++
        throw new Error('el modelo no respondió')
      },
    }

    const resultado = await inferirCategoria('COMERCIO CUALQUIERA', cliente)

    expect(resultado).toBeNull()
    expect(invocaciones).toBe(3) // el número exacto lo fija el Decision log de T28
  })
})
