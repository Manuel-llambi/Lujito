import Decimal from 'decimal.js'
import type { HallazgoComercioRecurrente } from './tiposHabitos'

// Rango Unicode de las marcas diacríticas combinantes (acentos) que deja `normalize('NFD')` al
// descomponer una letra acentuada en letra base + marca. Reimplementado localmente: los mismos
// cuatro pasos que `dominio/categorizacion/categorizarPorReglas.ts`, que no exporta su `normalizar`
// interna y no se importa entre features (design.md, T4) — duplicar cuatro líneas puras es más
// barato que crear una dependencia cruzada no prevista por el diseño.
const MARCAS_DIACRITICAS = /[̀-ͯ]/g

/**
 * Normaliza texto para agrupar comercios (glosario de requirements.md, criterio 5.7 del spec de
 * pipeline): mayúsculas, sin acentos, espacios consecutivos colapsados.
 */
function normalizar(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calcula el hallazgo de comercios recurrentes del mes en foco (Req. 2.9, 2.10, 2.11): agrupa los
 * gastos por comercio normalizado y devuelve un `HallazgoComercioRecurrente` por cada comercio con
 * dos o más gastos. Función pura, sin I/O — no depende de las otras reglas de `dominio/habitos/`, así
 * que su resultado no puede impedir que las demás se calculen (2.12).
 *
 * Excluye los gastos sin comercio antes de agrupar (2.11): nunca cuentan como "comercio repetido"
 * entre sí. Devuelve `[]` si ningún comercio se repite, incluyendo la entrada vacía (2.10).
 */
export function calcularComerciosRecurrentes(
  gastosMesFoco: { comercio: string | null; montoTotal: Decimal }[],
): HallazgoComercioRecurrente[] {
  const gruposPorClave = new Map<string, { comercioOriginal: string; gastos: Decimal[] }>()

  for (const gasto of gastosMesFoco) {
    if (gasto.comercio === null) {
      continue
    }

    const clave = normalizar(gasto.comercio)
    const grupoExistente = gruposPorClave.get(clave)

    if (grupoExistente) {
      grupoExistente.gastos.push(gasto.montoTotal)
    } else {
      gruposPorClave.set(clave, { comercioOriginal: gasto.comercio, gastos: [gasto.montoTotal] })
    }
  }

  const hallazgos: HallazgoComercioRecurrente[] = []

  for (const { comercioOriginal, gastos } of gruposPorClave.values()) {
    if (gastos.length < 2) {
      continue
    }

    const totalComercio = gastos.reduce((acumulado, monto) => acumulado.plus(monto), new Decimal(0))
    const cantidadGastos = gastos.length
    const montoFormateado = formatearMontoSimple(totalComercio)

    hallazgos.push({
      tipo: 'comercioRecurrente',
      comercio: comercioOriginal,
      cantidadGastos,
      totalComercio,
      textoRespaldo: `Este mes volviste a ${comercioOriginal} ${cantidadGastos} veces y ya gastaste $${montoFormateado} ahí.`,
      recomendacionRespaldo: `Fijate si en ${comercioOriginal} podés espaciar un poco las compras, te repetiste ${cantidadGastos} veces este mes.`,
    })
  }

  // Estable (Array.prototype.sort desde ES2019): un empate en el total preserva el orden de
  // primera aparición, que a su vez respeta `fecha_gasto` ascendente (design.md, T4).
  hallazgos.sort((a, b) => b.totalComercio.comparedTo(a.totalComercio))

  return hallazgos
}

/**
 * Formato mínimo para los textos de respaldo de esta regla — mismo patrón que
 * `calcularCategoriaDominante.ts`: no reemplaza `formatearMoneda` de `app/tokens/`, que es
 * responsabilidad de la capa de presentación y que `dominio/` no puede importar.
 */
function formatearMontoSimple(monto: Decimal): string {
  const redondeado = monto.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(redondeado)
}
