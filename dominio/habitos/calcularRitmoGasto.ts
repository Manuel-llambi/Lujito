import Decimal from 'decimal.js'
import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'
import type { HallazgoRitmoGasto } from './tiposHabitos'

/** Margen, en puntos porcentuales, dentro del cual el ritmo se considera "normal" (ni por encima ni por debajo). */
const MARGEN_RITMO_NORMAL_PCT = 10

const formateadorDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_REFERENCIA,
  day: 'numeric',
})

/** Número de día calendario (1–31) de `fecha` en la zona de referencia — nunca `Date.getDate()`, que usa la zona local del proceso. */
function diaCalendario(fecha: Date): number {
  return Number(formateadorDia.format(fecha))
}

function sumarHastaDia(gastos: { fechaGasto: Date; montoTotal: Decimal }[], diaLimite: number): Decimal {
  return gastos
    .filter((gasto) => diaCalendario(gasto.fechaGasto) <= diaLimite)
    .reduce((acumulado, gasto) => acumulado.plus(gasto.montoTotal), new Decimal(0))
}

/**
 * Calcula el hallazgo de ritmo de gasto proyectado (Req. 2.7): compara el total gastado en el mes en
 * foco hasta el día calendario de `hoy` (zona de referencia) contra el promedio del total gastado
 * hasta ese mismo día en los meses anteriores disponibles. Función pura, sin I/O — no depende de las
 * otras reglas de `dominio/habitos/`, así que su resultado (incluido `null`) no puede impedir que las
 * demás se calculen (2.12).
 *
 * Devuelve `null` si `gastosMesesAnteriores.length < 2` (2.8) — no hay suficiente historial para un
 * promedio confiable, y no existe recomendación para un hallazgo que no se calculó (3.2).
 */
export function calcularRitmoGasto(
  gastosMesFoco: { fechaGasto: Date; montoTotal: Decimal }[],
  gastosMesesAnteriores: { fechaGasto: Date; montoTotal: Decimal }[][],
  hoy: Date,
): HallazgoRitmoGasto | null {
  if (gastosMesesAnteriores.length < 2) {
    return null
  }

  const diaHoy = diaCalendario(hoy)

  const totalHastaHoyMesFoco = sumarHastaDia(gastosMesFoco, diaHoy)

  const totalesMesesAnteriores = gastosMesesAnteriores.map((gastosDelMes) => sumarHastaDia(gastosDelMes, diaHoy))
  const sumaMesesAnteriores = totalesMesesAnteriores.reduce(
    (acumulado, total) => acumulado.plus(total),
    new Decimal(0),
  )
  const promedioHastaMismoDiaMesesAnteriores = sumaMesesAnteriores.dividedBy(totalesMesesAnteriores.length)

  // División por cero evitada explícitamente: nunca Infinity ni NaN.
  const variacionPct = promedioHastaMismoDiaMesesAnteriores.isZero()
    ? null
    : totalHastaHoyMesFoco
        .minus(promedioHastaMismoDiaMesesAnteriores)
        .dividedBy(promedioHastaMismoDiaMesesAnteriores)
        .times(100)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber()

  const { textoRespaldo, recomendacionRespaldo } = redactarRespaldo(
    totalHastaHoyMesFoco,
    promedioHastaMismoDiaMesesAnteriores,
    variacionPct,
  )

  return {
    tipo: 'ritmoGasto',
    totalHastaHoyMesFoco,
    promedioHastaMismoDiaMesesAnteriores,
    variacionPct,
    mesesConsiderados: gastosMesesAnteriores.length,
    textoRespaldo,
    recomendacionRespaldo,
  }
}

/**
 * Arma `textoRespaldo`/`recomendacionRespaldo` en el mismo cómputo que produce el hallazgo (4.1),
 * en tono informal con modismos rioplatenses (4.6), con distinta redacción según el ritmo esté por
 * encima, por debajo, o dentro de un margen razonable del promedio (±`MARGEN_RITMO_NORMAL_PCT`%, 3.1).
 */
function redactarRespaldo(
  totalHastaHoy: Decimal,
  promedio: Decimal,
  variacionPct: number | null,
): { textoRespaldo: string; recomendacionRespaldo: string } {
  const montoHoyFormateado = formatearMontoSimple(totalHastaHoy)
  const montoPromedioFormateado = formatearMontoSimple(promedio)

  if (variacionPct === null) {
    return {
      textoRespaldo: `Hasta hoy ya llevás gastados $${montoHoyFormateado} este mes, pero en los meses anteriores no habías gastado nada para esta altura, así que no hay con qué comparar el ritmo todavía.`,
      recomendacionRespaldo:
        'Prestale atención al ritmo de acá en adelante, todavía no tenemos un promedio con el que compararte.',
    }
  }

  if (variacionPct > MARGEN_RITMO_NORMAL_PCT) {
    return {
      textoRespaldo: `Vas más rápido que de costumbre: llevás gastados $${montoHoyFormateado} hasta hoy, contra un promedio de $${montoPromedioFormateado} a esta altura en los meses anteriores (${Math.round(variacionPct)}% más).`,
      recomendacionRespaldo:
        'Frená un poco el gasto discrecional lo que queda del mes, vas más rápido que tu ritmo habitual.',
    }
  }

  if (variacionPct < -MARGEN_RITMO_NORMAL_PCT) {
    return {
      textoRespaldo: `Vas más tranquilo que de costumbre: llevás gastados $${montoHoyFormateado} hasta hoy, contra un promedio de $${montoPromedioFormateado} a esta altura en los meses anteriores (${Math.round(Math.abs(variacionPct))}% menos).`,
      recomendacionRespaldo: 'Vas bien, seguí así con el ritmo de gasto que llevás este mes.',
    }
  }

  return {
    textoRespaldo: `Vas más o menos como siempre: llevás gastados $${montoHoyFormateado} hasta hoy, contra un promedio de $${montoPromedioFormateado} a esta altura en los meses anteriores.`,
    recomendacionRespaldo: 'Tu ritmo de gasto viene en línea con lo habitual, no hace falta que cambies nada.',
  }
}

/**
 * Formato mínimo para los textos de respaldo de esta regla — no reemplaza `formatearMoneda` de
 * `app/tokens/`, que es responsabilidad de la capa de presentación y que `dominio/` no puede
 * importar (evita la dependencia cruzada dominio → app).
 */
function formatearMontoSimple(monto: Decimal): string {
  const redondeado = monto.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(redondeado)
}
