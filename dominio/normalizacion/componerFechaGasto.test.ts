import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { componerFechaGasto } from './componerFechaGasto'

const ZONA_REFERENCIA = 'America/Argentina/Buenos_Aires'

function releerComoDiaEnZonaDeReferencia(instante: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_REFERENCIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
}

describe('componerFechaGasto', () => {
  // El test corre con TZ distinta de la de referencia a propósito (Req. 3.3): una composición
  // ingenua en hora local del proceso pasaría en una máquina en horario argentino y fallaría en CI.
  const tzOriginal = process.env.TZ

  beforeEach(() => {
    process.env.TZ = 'UTC'
  })

  afterEach(() => {
    process.env.TZ = tzOriginal
  })

  it('compone 24/08/2026 11:14 como el instante 2026-08-24T14:14:00.000Z', () => {
    const resultado = componerFechaGasto('24/08/2026', '11:14')
    expect(resultado?.toISOString()).toBe('2026-08-24T14:14:00.000Z')
  })

  it('caso borde: 31/01/2026 23:50 cae en su propio mes (2026-01-31)', () => {
    const resultado = componerFechaGasto('31/01/2026', '23:50')
    expect(resultado?.toISOString()).toBe('2026-02-01T02:50:00.000Z')
    expect(releerComoDiaEnZonaDeReferencia(resultado!)).toBe('2026-01-31')
  })

  it('caso borde: 01/02/2026 00:10 cae en su propio mes (2026-02-01)', () => {
    const resultado = componerFechaGasto('01/02/2026', '00:10')
    expect(resultado?.toISOString()).toBe('2026-02-01T03:10:00.000Z')
    expect(releerComoDiaEnZonaDeReferencia(resultado!)).toBe('2026-02-01')
  })

  it('devuelve nulo para una fecha con formato inválido', () => {
    expect(componerFechaGasto('32/01/2026', '11:14')).toBeNull()
  })

  it('devuelve nulo para una hora con formato inválido', () => {
    expect(componerFechaGasto('24/08/2026', '25:99')).toBeNull()
  })

  it('devuelve nulo para texto sin forma de fecha', () => {
    expect(componerFechaGasto('no es una fecha', '11:14')).toBeNull()
  })
})
