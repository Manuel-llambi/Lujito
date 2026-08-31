import { describe, expect, it } from 'vitest'
import { CATEGORIAS_INFERIBLES, categorizarPorReglas, type Regla } from './categorizarPorReglas'

function regla(parcial: Partial<Regla> & Pick<Regla, 'id' | 'patronComercio' | 'categoria'>): Regla {
  return { prioridad: 0, activa: true, ...parcial }
}

describe('CATEGORIAS_INFERIBLES', () => {
  it('es exactamente ["Salidas", "Comida", "Extras"], en ese orden', () => {
    expect(CATEGORIAS_INFERIBLES).toEqual(['Salidas', 'Comida', 'Extras'])
  })
})

describe('categorizarPorReglas', () => {
  it('devuelve la regla (no la categoría) cuyo patrón coincide con el comercio', () => {
    const reglas = [
      regla({ id: 'r1', patronComercio: 'WWWAYSACOMAR', categoria: 'Comida' }),
      regla({ id: 'r2', patronComercio: 'SUBE', categoria: 'Salidas' }),
    ]
    const resultado = categorizarPorReglas('WWWAYSACOMAR', reglas)
    expect(resultado?.id).toBe('r1')
  })

  it('coincide por contención: "COTO SUCURSAL 0142" contiene el patrón "COTO SUCURSAL"', () => {
    const reglas = [regla({ id: 'r1', patronComercio: 'COTO SUCURSAL', categoria: 'Comida' })]
    expect(categorizarPorReglas('COTO SUCURSAL 0142', reglas)?.id).toBe('r1')
  })

  it('la contención tiene dirección: el patrón va contenido en el comercio, nunca al revés', () => {
    const reglas = [regla({ id: 'r1', patronComercio: 'SUBE CARGA VIRTUAL', categoria: 'Salidas' })]
    expect(categorizarPorReglas('SUBE', reglas)).toBeNull()
  })

  it('normaliza mayúsculas en los dos lados', () => {
    const reglas = [regla({ id: 'r1', patronComercio: 'coto sucursal', categoria: 'Comida' })]
    expect(categorizarPorReglas('Coto Sucursal 0142', reglas)?.id).toBe('r1')
  })

  it('normaliza acentos en los dos lados', () => {
    const reglasSinAcentoEnPatron = [
      regla({ id: 'r1', patronComercio: 'PANADERIA Y CONFITERIA', categoria: 'Comida' }),
    ]
    expect(
      categorizarPorReglas('PANADERÍA Y CONFITERÍA LA NUEVA', reglasSinAcentoEnPatron)?.id,
    ).toBe('r1')

    const reglasConAcentoEnPatron = [
      regla({ id: 'r2', patronComercio: 'Panadería y Confitería', categoria: 'Comida' }),
    ]
    expect(
      categorizarPorReglas('PANADERIA Y CONFITERIA LA NUEVA', reglasConAcentoEnPatron)?.id,
    ).toBe('r2')
  })

  it('colapsa espacios consecutivos', () => {
    const reglas = [regla({ id: 'r1', patronComercio: 'RES SOLDADO', categoria: 'Salidas' })]
    expect(categorizarPorReglas('RES   SOLDADO', reglas)?.id).toBe('r1')
  })

  it('el patrón es texto literal, nunca una expresión regular', () => {
    const reglas = [regla({ id: 'r1', patronComercio: 'PAY*AR*UBER', categoria: 'Salidas' })]
    expect(categorizarPorReglas('PAY*AR*UBER 1234', reglas)?.id).toBe('r1')
    expect(categorizarPorReglas('PAYXARYUBER', reglas)).toBeNull()
  })

  it('una regla con patrón sintácticamente inválido como regex no lanza, y el resto del arreglo se evalúa igual', () => {
    const reglas = [
      regla({ id: 'r1', patronComercio: 'FARMACITY (', categoria: 'Extras' }),
      regla({ id: 'r2', patronComercio: 'HAVANNA', categoria: 'Salidas' }),
    ]
    expect(() => categorizarPorReglas('HAVANNA SUCURSAL CENTRO', reglas)).not.toThrow()
    expect(categorizarPorReglas('HAVANNA SUCURSAL CENTRO', reglas)?.id).toBe('r2')
  })

  it('devuelve nulo cuando ninguna regla coincide, para derivar a inferencia (no "Sin categorizar")', () => {
    const reglas = [
      regla({ id: 'r1', patronComercio: 'COTO SUCURSAL', categoria: 'Comida' }),
      regla({ id: 'r2', patronComercio: 'SUBE', categoria: 'Salidas' }),
    ]
    expect(categorizarPorReglas('SUPERMERCADO DIA 4412', reglas)).toBeNull()
  })
})

// Genera todas las permutaciones de un arreglo (usado para verificar independencia del orden, Req. 5.5).
function permutaciones<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  const resultado: T[][] = []
  for (let i = 0; i < items.length; i++) {
    const resto = [...items.slice(0, i), ...items.slice(i + 1)]
    for (const permutacionResto of permutaciones(resto)) {
      resultado.push([items[i]!, ...permutacionResto])
    }
  }
  return resultado
}

describe('categorizarPorReglas: prioridad, reglas inactivas y determinismo (T15)', () => {
  it('entre dos reglas coincidentes, gana la de mayor prioridad, en cualquier orden de entrada', () => {
    const mayor = regla({ id: 'r1', patronComercio: 'COTO', categoria: 'Comida', prioridad: 10 })
    const menor = regla({ id: 'r2', patronComercio: 'COTO', categoria: 'Comida', prioridad: 0 })

    expect(categorizarPorReglas('COTO SUCURSAL', [mayor, menor])?.id).toBe('r1')
    expect(categorizarPorReglas('COTO SUCURSAL', [menor, mayor])?.id).toBe('r1')
  })

  it('la prioridad solo ordena entre las que coinciden: una de prioridad alta que no coincide no gana', () => {
    const noCoincide = regla({
      id: 'r1',
      patronComercio: 'FARMACITY',
      categoria: 'Extras',
      prioridad: 99,
    })
    const coincide = regla({ id: 'r2', patronComercio: 'COTO', categoria: 'Comida', prioridad: 0 })

    expect(categorizarPorReglas('COTO SUCURSAL', [noCoincide, coincide])?.id).toBe('r2')
  })

  it('una regla inactiva cuyo patrón coincide, sola en el arreglo, devuelve nulo', () => {
    const inactiva = regla({ id: 'r1', patronComercio: 'COTO', categoria: 'Comida', activa: false })
    expect(categorizarPorReglas('COTO SUCURSAL', [inactiva])).toBeNull()
  })

  it('filtrar precede a ordenar: una inactiva de mayor prioridad pierde contra una activa de menor', () => {
    const inactivaAltaPrioridad = regla({
      id: 'r1',
      patronComercio: 'COTO',
      categoria: 'Comida',
      prioridad: 10,
      activa: false,
    })
    const activaBajaPrioridad = regla({
      id: 'r2',
      patronComercio: 'COTO',
      categoria: 'Comida',
      prioridad: 0,
      activa: true,
    })

    expect(
      categorizarPorReglas('COTO SUCURSAL', [inactivaAltaPrioridad, activaBajaPrioridad])?.id,
    ).toBe('r2')
  })

  it('ante empate de prioridad, desempata por el id menor, en cualquier orden de entrada', () => {
    const idMenor = regla({ id: 'a-menor', patronComercio: 'COTO', categoria: 'Comida', prioridad: 5 })
    const idMayor = regla({ id: 'z-mayor', patronComercio: 'COTO', categoria: 'Comida', prioridad: 5 })

    expect(categorizarPorReglas('COTO SUCURSAL', [idMenor, idMayor])?.id).toBe('a-menor')
    expect(categorizarPorReglas('COTO SUCURSAL', [idMayor, idMenor])?.id).toBe('a-menor')
  })

  it('el resultado es independiente del orden de entrada, en las seis permutaciones de tres reglas', () => {
    const r1 = regla({ id: 'r1', patronComercio: 'COTO', categoria: 'Comida', prioridad: 5 })
    const r2 = regla({ id: 'r2', patronComercio: 'COTO', categoria: 'Comida', prioridad: 10 })
    const r3 = regla({ id: 'r3', patronComercio: 'COTO', categoria: 'Comida', prioridad: 2 })

    for (const permutacion of permutaciones([r1, r2, r3])) {
      expect(categorizarPorReglas('COTO SUCURSAL', permutacion)?.id).toBe('r2')
    }
  })

  it('no muta el arreglo de entrada: conserva su orden original después de invocar', () => {
    const reglas = [
      regla({ id: 'r1', patronComercio: 'COTO', categoria: 'Comida', prioridad: 5 }),
      regla({ id: 'r2', patronComercio: 'COTO', categoria: 'Comida', prioridad: 10 }),
      regla({ id: 'r3', patronComercio: 'COTO', categoria: 'Comida', prioridad: 2 }),
    ]
    const ordenOriginal = reglas.map((r) => r.id)

    categorizarPorReglas('COTO SUCURSAL', reglas)

    expect(reglas.map((r) => r.id)).toEqual(ordenOriginal)
  })
})
