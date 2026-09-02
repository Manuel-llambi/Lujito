import Decimal from 'decimal.js'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { HallazgoVariacionCategoria } from './tiposHabitos'

/**
 * Calcula la variación porcentual por categoría entre el mes en foco y el mes calendario anterior
 * (Req. 2.5). Función pura, sin I/O — no depende de las otras reglas de `dominio/habitos/`, así que su
 * resultado no puede impedir que las demás se calculen (2.12).
 *
 * Devuelve `[]` si `totalesMesAnterior` es `null` (no hay mes anterior con imputaciones — 2.6). Cuando
 * no es `null`, arma un hallazgo por cada categoría presente en cualquiera de los dos meses (unión, no
 * intersección) — una categoría ausente en uno de los dos lados cuenta como total `0` ahí (2.5).
 */
export function calcularVariacionCategoria(
  totalesMesFoco: { categoria: Categoria; total: Decimal }[],
  totalesMesAnterior: { categoria: Categoria; total: Decimal }[] | null,
): HallazgoVariacionCategoria[] {
  if (totalesMesAnterior === null) {
    return []
  }

  const totalesPorCategoriaFoco = new Map(totalesMesFoco.map((fila) => [fila.categoria, fila.total]))
  const totalesPorCategoriaAnterior = new Map(
    totalesMesAnterior.map((fila) => [fila.categoria, fila.total]),
  )

  const categorias = new Set<Categoria>([
    ...totalesPorCategoriaFoco.keys(),
    ...totalesPorCategoriaAnterior.keys(),
  ])

  return Array.from(categorias).map((categoria) => {
    const totalMesFoco = totalesPorCategoriaFoco.get(categoria) ?? new Decimal(0)
    const totalMesAnterior = totalesPorCategoriaAnterior.get(categoria) ?? new Decimal(0)

    const variacionPct = totalMesAnterior.isZero()
      ? null
      : totalMesFoco
          .minus(totalMesAnterior)
          .dividedBy(totalMesAnterior)
          .times(100)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber()

    const montoFocoFormateado = formatearMontoSimple(totalMesFoco)
    const montoAnteriorFormateado = formatearMontoSimple(totalMesAnterior)

    return {
      tipo: 'variacionCategoria',
      categoria,
      totalMesFoco,
      totalMesAnterior,
      variacionPct,
      textoRespaldo: textoRespaldoDe(categoria, variacionPct, montoFocoFormateado, montoAnteriorFormateado),
      recomendacionRespaldo: recomendacionRespaldoDe(categoria, variacionPct),
    }
  })
}

function textoRespaldoDe(
  categoria: Categoria,
  variacionPct: number | null,
  montoFocoFormateado: string,
  montoAnteriorFormateado: string,
): string {
  if (variacionPct === null) {
    return `Estrenaste categoría: gastaste $${montoFocoFormateado} en ${categoria}, algo que el mes pasado no tenías.`
  }

  if (variacionPct > 0) {
    return `Se te fue de mambo en ${categoria} este mes: pasaste de $${montoAnteriorFormateado} a $${montoFocoFormateado}, un ${variacionPct}% más.`
  }

  if (variacionPct < 0) {
    return `Bajaste el perfil en ${categoria}: de $${montoAnteriorFormateado} pasaste a $${montoFocoFormateado}, un ${Math.abs(variacionPct)}% menos.`
  }

  return `En ${categoria} te mantuviste igualito que el mes pasado: $${montoFocoFormateado}.`
}

function recomendacionRespaldoDe(categoria: Categoria, variacionPct: number | null): string {
  if (variacionPct === null) {
    return `Prestale atención a ${categoria} el mes que viene para ver si se vuelve un gasto habitual.`
  }

  if (variacionPct > 0) {
    return `Fijate qué empujó el gasto en ${categoria} este mes, para que no se te haga costumbre.`
  }

  if (variacionPct < 0) {
    return `Dale, así seguís en ${categoria}: mantené el mismo ritmo el mes que viene.`
  }

  return `En ${categoria} veniste estable, seguí controlando que no se dispare.`
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
