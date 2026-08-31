import { mesDe, type Mes } from '@/dominio/imputacion/mesDe'
import { sumarMeses } from '@/dominio/imputacion/sumarMeses'

/**
 * Devuelve el arreglo de meses de las N imputaciones de una compra, en orden de cuota: la posición
 * N-1 corresponde a la imputación número N (Req. 8.2, 8.4, 8.5). Única lectura del `Date` de entrada:
 * delega en `mesDe`, sin una segunda conversión de zona horaria.
 */
export function calcularMesesDeImputacion(fechaGasto: Date, cuotas: number): Mes[] {
  const mesInicial = mesDe(fechaGasto)

  const meses: Mes[] = []
  for (let i = 0; i < cuotas; i++) {
    meses.push(sumarMeses(mesInicial, i))
  }

  return meses
}
