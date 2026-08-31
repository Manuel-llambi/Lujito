import type { Mes } from '@/dominio/imputacion/mesDe'

/**
 * Suma `cantidad` meses a un mes `AAAA-MM`, operando sobre la cadena y no sobre `Date` (Req. 8.2, 8.4).
 * Sin caso borde posible de desborde de día ni de horario de verano.
 */
export function sumarMeses(mes: Mes, cantidad: number): Mes {
  const [anioTexto, mesTexto] = mes.split('-')
  const anio = Number(anioTexto)
  const mesIndice = Number(mesTexto) - 1 // 0-based

  const indiceAbsoluto = anio * 12 + mesIndice + cantidad
  const anioResultado = Math.floor(indiceAbsoluto / 12)
  const mesResultado = (indiceAbsoluto % 12) + 1

  return `${anioResultado}-${String(mesResultado).padStart(2, '0')}`
}
