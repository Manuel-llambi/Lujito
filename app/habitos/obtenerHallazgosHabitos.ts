import type { RepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { RepositorioGastos } from '@/infra/db/repositorioGastos'
import type { Hallazgo } from '@/dominio/habitos/tiposHabitos'
import { calcularCategoriaDominante } from '@/dominio/habitos/calcularCategoriaDominante'
import { calcularVariacionCategoria } from '@/dominio/habitos/calcularVariacionCategoria'
import { calcularRitmoGasto } from '@/dominio/habitos/calcularRitmoGasto'
import { calcularComerciosRecurrentes } from '@/dominio/habitos/calcularComerciosRecurrentes'
import { rangoDeMes } from '@/dominio/habitos/rangoDeMes'
import { mesDe, type Mes } from '@/dominio/imputacion/mesDe'
import { sumarMeses } from '@/dominio/imputacion/sumarMeses'

/** Ventana fija para resolver el mes en foco y los meses anteriores disponibles (design.md, análoga a
 * `MESES_VISIBLES_EN_DASHBOARD`): acota el costo de las consultas sin que el requisito exija usar todo
 * el historial. */
export const MESES_VENTANA_HABITOS = 6

/**
 * El contenedor real de `/habitos` (Req. 2.1, mismo rol que `obtenerFilasDashboard.ts`): resuelve la
 * ventana de meses, decide el mes en foco, arma los datos de entrada de las cuatro reglas puras de
 * `dominio/habitos/` y las invoca de forma independiente (Req. 2.12) — el resultado nulo/vacío de una
 * no bloquea a las demás, porque cada llamada es una función síncrona y pura que no depende del
 * resultado de las otras.
 *
 * Devuelve `[]` sin llamar a ninguna regla si no hay ninguna imputación en la ventana (Req. 2.2).
 */
export async function obtenerHallazgosHabitos(
  repositorioImputaciones: Pick<RepositorioImputaciones, 'totalesPorMesYCategoria'>,
  repositorioGastos: Pick<RepositorioGastos, 'gastosEntreFechas'>,
  ahora: Date,
): Promise<Hallazgo[]> {
  const hasta = mesDe(ahora)
  const desde = sumarMeses(hasta, -(MESES_VENTANA_HABITOS - 1))

  const filas = await repositorioImputaciones.totalesPorMesYCategoria(desde, hasta)

  if (filas.length === 0) {
    return []
  }

  const mesesPresentes = Array.from(new Set(filas.map((fila) => fila.mes))).sort()
  const mesEnFoco = mesesPresentes[mesesPresentes.length - 1]!

  // Meses anteriores disponibles: todos los meses presentes con mes < mesEnFoco, más recientes primero
  // — usados por calcularRitmoGasto (uno por mes anterior disponible, sin exigir que sean consecutivos).
  const mesesAnterioresPresentes = mesesPresentes.filter((mes) => mes < mesEnFoco).reverse()

  const totalesMesFoco = filas
    .filter((fila) => fila.mes === mesEnFoco)
    .map((fila) => ({ categoria: fila.categoria, total: fila.total }))

  // calcularCategoriaDominante/calcularVariacionCategoria comparan siempre contra el mes calendario
  // inmediatamente anterior a mesEnFoco, no contra "el mes anterior disponible más reciente" — si ese
  // mes puntual no tiene imputaciones (hueco en la ventana), el mes anterior es `null` (Req. 2.6), aun
  // si un mes más viejo sí tiene datos.
  const mesInmediatoAnterior: Mes = sumarMeses(mesEnFoco, -1)
  const totalesMesAnterior = mesesAnterioresPresentes.includes(mesInmediatoAnterior)
    ? filas
        .filter((fila) => fila.mes === mesInmediatoAnterior)
        .map((fila) => ({ categoria: fila.categoria, total: fila.total }))
    : null

  const rangoMesFoco = rangoDeMes(mesEnFoco)
  const gastosMesFoco = await repositorioGastos.gastosEntreFechas(rangoMesFoco.desde, rangoMesFoco.hasta)

  const gastosMesesAnteriores = await Promise.all(
    mesesAnterioresPresentes.map(async (mes) => {
      const rango = rangoDeMes(mes)
      return repositorioGastos.gastosEntreFechas(rango.desde, rango.hasta)
    }),
  )

  const hallazgos: Hallazgo[] = []

  const categoriaDominante = calcularCategoriaDominante(totalesMesFoco)
  if (categoriaDominante !== null) {
    hallazgos.push(categoriaDominante)
  }

  hallazgos.push(...calcularVariacionCategoria(totalesMesFoco, totalesMesAnterior))

  const ritmoGasto = calcularRitmoGasto(gastosMesFoco, gastosMesesAnteriores, ahora)
  if (ritmoGasto !== null) {
    hallazgos.push(ritmoGasto)
  }

  hallazgos.push(...calcularComerciosRecurrentes(gastosMesFoco))

  return hallazgos
}
