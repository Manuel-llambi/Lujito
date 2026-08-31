import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { DatosAviso } from '@/dominio/parseo/parsearAvisoSantander'
import { normalizarAviso } from './normalizarAviso'

const AHORA = new Date('2026-08-25T12:00:00.000Z')

function datos(parcial: Partial<DatosAviso> = {}): DatosAviso {
  return {
    montoTexto: '$1.000,00',
    comercio: 'WWWAYSACOMAR',
    fechaTexto: '20/08/2026',
    horaTexto: '10:00',
    cuotasTexto: null,
    tipoTarjeta: 'debito',
    tarjetaUltimos4: '9344',
    ...parcial,
  }
}

describe('normalizarAviso — camino válido a GastoNormalizado (T8)', () => {
  it('la fechaGasto sale de fechaTexto/horaTexto de DatosAviso, nunca del header Date del email (Req. 3.4)', () => {
    // DatosAviso no tiene ningún campo de header de email, y normalizarAviso no recibe más
    // parámetros que datos y ahora: el header `Date` es inalcanzable desde esta función por tipo.
    // El caso usa una fecha deliberadamente distinta de la que traería un header de recepción.
    const resultado = normalizarAviso(
      datos({ fechaTexto: '20/08/2026', horaTexto: '10:00' }),
      AHORA,
    )

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.fechaGasto.toISOString()).toBe(
      new Date('2026-08-20T13:00:00.000Z').toISOString(), // 10:00 ART = 13:00 UTC
    )
  })

  it('con montoTexto $1.000,00 y cuotasTexto 6, montoTotal es exactamente 6000.00 y cuotasTotal es 6 — no 1000.00 (Req. 8.8)', () => {
    const resultado = normalizarAviso(datos({ montoTexto: '$1.000,00', cuotasTexto: '6' }), AHORA)

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.montoTotal.equals(new Decimal('6000.00'))).toBe(true)
    expect(resultado.datos.cuotasTotal).toBe(6)
  })

  it('cuotasTexto null y cuotasTexto "1", iguales en todo lo demás, producen el mismo cuotasTotal de 1 y el mismo montoTotal (Req. 2.5)', () => {
    const resultadoSinFila = normalizarAviso(datos({ cuotasTexto: null, montoTexto: '$500,00' }), AHORA)
    const resultadoConUnaCuota = normalizarAviso(datos({ cuotasTexto: '1', montoTexto: '$500,00' }), AHORA)

    expect(resultadoSinFila.ok).toBe(true)
    expect(resultadoConUnaCuota.ok).toBe(true)
    if (!resultadoSinFila.ok || !resultadoConUnaCuota.ok) return
    expect(resultadoSinFila.datos.cuotasTotal).toBe(1)
    expect(resultadoConUnaCuota.datos.cuotasTotal).toBe(1)
    expect(resultadoSinFila.datos.montoTotal.equals(resultadoConUnaCuota.datos.montoTotal)).toBe(true)
  })

  it('ningún campo del GastoNormalizado se completa con un valor por defecto: comercio, tipoTarjeta y tarjetaUltimos4 se copian de DatosAviso, moneda es ARS (Req. 2.12)', () => {
    const resultado = normalizarAviso(
      datos({ comercio: 'FRANCESCA', tipoTarjeta: 'credito', tarjetaUltimos4: '1324' }),
      AHORA,
    )

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.datos.comercio).toBe('FRANCESCA')
    expect(resultado.datos.tipoTarjeta).toBe('credito')
    expect(resultado.datos.tarjetaUltimos4).toBe('1324')
    expect(resultado.datos.moneda).toBe('ARS')
  })
})

describe('normalizarAviso — validaciones que devuelven MotivoRevision (T9)', () => {
  it.each([
    ['0', 'cuotas_invalidas'],
    ['-3', 'cuotas_invalidas'],
    ['2,5', 'cuotas_invalidas'],
    ['2.5', 'cuotas_invalidas'],
    ['abc', 'cuotas_invalidas'],
    ['', 'cuotas_invalidas'],
  ] as const)('cuotasTexto %j devuelve { ok: false, motivo: %j }, sin campo datos (Req. 3.7)', (cuotasTexto, motivo) => {
    const resultado = normalizarAviso(datos({ cuotasTexto }), AHORA)

    expect(resultado).toEqual({ ok: false, motivo })
  })

  it('cuotasTexto null y "1" no son inválidas: siguen produciendo ok: true con cuotasTotal 1 (Req. 3.7)', () => {
    expect(normalizarAviso(datos({ cuotasTexto: null }), AHORA).ok).toBe(true)
    expect(normalizarAviso(datos({ cuotasTexto: '1' }), AHORA).ok).toBe(true)
  })

  it('montoTexto $0,00 devuelve monto_invalido — normalizarMonto lo deja en Decimal(0), no en null, y esta función lo rechaza (Req. 3.5)', () => {
    const resultado = normalizarAviso(datos({ montoTexto: '$0,00' }), AHORA)

    expect(resultado).toEqual({ ok: false, motivo: 'monto_invalido' })
  })

  it('un montoTexto sin forma de monto devuelve monto_invalido (Req. 3.5)', () => {
    const resultado = normalizarAviso(datos({ montoTexto: 'gracias por su compra' }), AHORA)

    expect(resultado).toEqual({ ok: false, motivo: 'monto_invalido' })
  })

  it('fechaTexto u horaTexto con formato inválido devuelven fecha_invalida', () => {
    expect(normalizarAviso(datos({ fechaTexto: '32/01/2026' }), AHORA)).toEqual({
      ok: false,
      motivo: 'fecha_invalida',
    })
    expect(normalizarAviso(datos({ horaTexto: '25:99' }), AHORA)).toEqual({
      ok: false,
      motivo: 'fecha_invalida',
    })
  })

  it('una fechaGasto un milisegundo después de ahora es fecha_futura; exactamente igual a ahora es ok: true (Req. 3.6)', () => {
    // 21:00 ART = 2026-08-21T00:00:00.000Z
    const ahoraExacto = new Date('2026-08-21T00:00:00.000Z')
    const unMilisegundoAntes = new Date(ahoraExacto.getTime() - 1)

    const resultadoIgual = normalizarAviso(datos({ fechaTexto: '20/08/2026', horaTexto: '21:00' }), ahoraExacto)
    const resultadoFuturo = normalizarAviso(
      datos({ fechaTexto: '20/08/2026', horaTexto: '21:00' }),
      unMilisegundoAntes,
    )

    expect(resultadoIgual.ok).toBe(true)
    expect(resultadoFuturo).toEqual({ ok: false, motivo: 'fecha_futura' })
  })

  it('la comparación de fecha futura es entre instantes, no entre horas de pared: el mismo resultado no cambia con TZ del runner en otro valor (Req. 3.6)', () => {
    const tzOriginal = process.env.TZ
    try {
      process.env.TZ = 'Pacific/Kiritimati' // UTC+14, deliberadamente distinto de ART y del sistema
      const ahoraExacto = new Date('2026-08-21T00:00:00.000Z')
      const resultadoIgual = normalizarAviso(
        datos({ fechaTexto: '20/08/2026', horaTexto: '21:00' }),
        ahoraExacto,
      )
      expect(resultadoIgual.ok).toBe(true)

      const resultadoFuturo = normalizarAviso(
        datos({ fechaTexto: '20/08/2026', horaTexto: '21:00' }),
        new Date(ahoraExacto.getTime() - 1),
      )
      expect(resultadoFuturo).toEqual({ ok: false, motivo: 'fecha_futura' })
    } finally {
      process.env.TZ = tzOriginal
    }
  })

  it('orden de las guardas: cuotas y monto inválidos a la vez devuelve cuotas_invalidas; monto y fecha inválidos a la vez devuelve monto_invalido', () => {
    const resultadoCuotasYMonto = normalizarAviso(
      datos({ cuotasTexto: '0', montoTexto: 'no es un monto' }),
      AHORA,
    )
    const resultadoMontoYFecha = normalizarAviso(
      datos({ montoTexto: '$0,00', fechaTexto: 'no es una fecha' }),
      AHORA,
    )

    expect(resultadoCuotasYMonto).toEqual({ ok: false, motivo: 'cuotas_invalidas' })
    expect(resultadoMontoYFecha).toEqual({ ok: false, motivo: 'monto_invalido' })
  })
})
