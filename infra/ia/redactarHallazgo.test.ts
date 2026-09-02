import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { redactarHallazgo, TIMEOUT_REDACCION_MS, type ClienteRedaccion, type RespuestaRedaccion } from '@/infra/ia/redactarHallazgo'
import type { HallazgoComercioRecurrente } from '@/dominio/habitos/tiposHabitos'

function crearHallazgoDoble(): HallazgoComercioRecurrente {
  return {
    tipo: 'comercioRecurrente',
    comercio: 'STARBUCKS',
    cantidadGastos: 5,
    totalComercio: { toString: () => '12500' } as unknown as HallazgoComercioRecurrente['totalComercio'],
    textoRespaldo: 'Gastaste en STARBUCKS 5 veces este mes.',
    recomendacionRespaldo: 'Fijate si podés reducir la frecuencia.',
  }
}

function crearClienteSimulado(respuesta: RespuestaRedaccion): ClienteRedaccion {
  return {
    async redactar() {
      return respuesta
    },
  }
}

describe('TIMEOUT_REDACCION_MS', () => {
  it('está exportado con el valor 4000', () => {
    expect(TIMEOUT_REDACCION_MS).toBe(4000)
  })
})

describe('redactarHallazgo', () => {
  it('con un cliente que resuelve a tiempo, devuelve fuente "modelo" con los textos del cliente', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente = crearClienteSimulado({
      texto: 'Este mes fuiste 5 veces a STARBUCKS.',
      recomendacionTexto: 'Probá espaciar las visitas.',
    })

    const resultado = await redactarHallazgo(hallazgo, cliente)

    expect(resultado).toEqual({
      hallazgo,
      texto: 'Este mes fuiste 5 veces a STARBUCKS.',
      recomendacionTexto: 'Probá espaciar las visitas.',
      fuente: 'modelo',
    })
  })

  it('con un cliente cuyo redactar rechaza, no propaga la excepción: resuelve con el texto de respaldo', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente: ClienteRedaccion = {
      redactar: async () => {
        throw new Error('el modelo no respondió')
      },
    }

    await expect(redactarHallazgo(hallazgo, cliente)).resolves.toEqual({
      hallazgo,
      texto: hallazgo.textoRespaldo,
      recomendacionTexto: hallazgo.recomendacionRespaldo,
      fuente: 'respaldo',
    })
  })

  describe('timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('con un cliente cuya promesa nunca resuelve dentro de TIMEOUT_REDACCION_MS, resuelve con el texto de respaldo sin esperar tiempo real', async () => {
      const hallazgo = crearHallazgoDoble()
      const cliente: ClienteRedaccion = {
        redactar: () => new Promise<RespuestaRedaccion>(() => {}), // nunca resuelve
      }

      const promesa = redactarHallazgo(hallazgo, cliente)
      const expectativa = expect(promesa).resolves.toEqual({
        hallazgo,
        texto: hallazgo.textoRespaldo,
        recomendacionTexto: hallazgo.recomendacionRespaldo,
        fuente: 'respaldo',
      })

      await vi.advanceTimersByTimeAsync(TIMEOUT_REDACCION_MS)

      await expectativa
    })
  })

  it('nunca lanza una excepción bajo ningún resultado del cliente (éxito)', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente = crearClienteSimulado({ texto: 'texto', recomendacionTexto: 'recomendacion' })

    await expect(redactarHallazgo(hallazgo, cliente)).resolves.not.toThrow
  })

  it('nunca lanza una excepción bajo ningún resultado del cliente (rechazo)', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente: ClienteRedaccion = {
      redactar: async () => {
        throw new Error('boom')
      },
    }

    await expect(redactarHallazgo(hallazgo, cliente)).resolves.toBeDefined()
  })

  it('en el caso de éxito, HallazgoRedactado.hallazgo es exactamente el objeto recibido, sin campos alterados', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente = crearClienteSimulado({ texto: 'texto modelo', recomendacionTexto: 'recomendacion modelo' })

    const resultado = await redactarHallazgo(hallazgo, cliente)

    expect(resultado.hallazgo).toBe(hallazgo)
    expect(resultado.hallazgo).toEqual(hallazgo)
  })

  it('en el caso de respaldo, HallazgoRedactado.hallazgo es exactamente el objeto recibido, sin campos alterados', async () => {
    const hallazgo = crearHallazgoDoble()
    const cliente: ClienteRedaccion = {
      redactar: async () => {
        throw new Error('el modelo no respondió')
      },
    }

    const resultado = await redactarHallazgo(hallazgo, cliente)

    expect(resultado.hallazgo).toBe(hallazgo)
    expect(resultado.hallazgo).toEqual(hallazgo)
  })
})
