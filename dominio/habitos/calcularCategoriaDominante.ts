import Decimal from 'decimal.js'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { HallazgoCategoriaDominante } from './tiposHabitos'

/**
 * Calcula el hallazgo de categoría dominante del mes en foco (Req. 2.3): la categoría cuyo total
 * imputado es el más alto. Función pura, sin I/O — no depende de las otras reglas de
 * `dominio/habitos/`, así que su resultado (incluido `null`) no puede impedir que las demás se
 * calculen (2.12).
 *
 * Devuelve `null` si `totalesMesFoco` está vacío o si dos o más categorías empatan en el total más
 * alto (2.4) — un empate no tiene un ganador legítimo que reportar, y no existe recomendación para un
 * hallazgo que no se calculó (3.2).
 */
export function calcularCategoriaDominante(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
): HallazgoCategoriaDominante | null {
  if (totalesMesFoco.length === 0) {
    return null
  }

  const totalMes = totalesMesFoco.reduce((acumulado, fila) => acumulado.plus(fila.total), new Decimal(0))

  const totalMasAlto = totalesMesFoco.reduce(
    (maximo, fila) => (fila.total.greaterThan(maximo) ? fila.total : maximo),
    totalesMesFoco[0]!.total,
  )

  const ganadoras = totalesMesFoco.filter((fila) => fila.total.equals(totalMasAlto))

  if (ganadoras.length !== 1) {
    return null
  }

  const ganadora = ganadoras[0]!

  // Redondeo estándar (mitad para arriba), no truncamiento: 0–100.
  const porcentaje = totalMes.isZero()
    ? 0
    : ganadora.total.dividedBy(totalMes).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()

  const montoFormateado = formatearMontoSimple(ganadora.total)

  return {
    tipo: 'categoriaDominante',
    categoria: ganadora.categoria,
    totalCategoria: ganadora.total,
    totalMes,
    porcentaje,
    textoRespaldo: `Este mes te fuiste con todo en ${ganadora.categoria}: gastaste $${montoFormateado}, el ${porcentaje}% de tu plata del mes.`,
    recomendacionRespaldo: `Fijate si podés recortar un poco en ${ganadora.categoria} el mes que viene, es la categoría que más te está pesando.`,
  }
}

/**
 * Formato mínimo para los textos de respaldo de esta regla — no reemplaza `formatearMoneda` de
 * `app/tokens/`, que es responsabilidad de la capa de presentación y que `dominio/` no puede
 * importar (evita la dependencia cruzada dominio → app). Mismo separador de miles `es-AR` que ya usa
 * el resto de la app, sin decimales porque el texto de respaldo es una oración, no una cifra exacta
 * en pantalla.
 */
function formatearMontoSimple(monto: Decimal): string {
  const redondeado = monto.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(redondeado)
}
