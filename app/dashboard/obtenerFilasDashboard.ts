import type { RepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { FilaDashboard } from '@/app/components/GraficoMensual'
import { mesDe } from '@/dominio/imputacion/mesDe'
import { sumarMeses } from '@/dominio/imputacion/sumarMeses'

/** Ventana fija del dashboard: los últimos 12 meses calendario, terminando en el mes actual (en la
 * zona horaria de referencia, vía `mesDe`). `requirements.md` no fija una ventana explícita — es una
 * decisión de esta tarea, aislada en esta constante para poder cambiarla sin tocar la lógica. */
export const MESES_VISIBLES_EN_DASHBOARD = 12

/**
 * El contenedor real del dashboard (Req. 9.1, 9.2): calcula la ventana de meses a pedir y traduce las
 * filas de `RepositorioImputaciones.totalesPorMesYCategoria` (con `total: Decimal`, T20) al tipo que
 * espera el componente de presentación `GraficoMensual` (con `total: number`, T42). La conversión de
 * `Decimal` a `number` es puramente de presentación —el ancho de una barra y el texto que se muestra—,
 * nunca una entrada a un cálculo monetario posterior; el total exacto ya quedó sumado por la vista SQL
 * de T20 antes de llegar acá. Esta función no suma nada: reenvía cada fila tal como la devuelve el
 * repositorio (Decision log de T20: "decidir dónde convertir Decimal... es de T43").
 *
 * Extraída de `page.tsx` para poder testearse sin un Server Component de Next.js ni una base real de
 * por medio — mismo motivo que T36/T37/T38 extrajeron `ejecutarPasoImputar`/`manejarFalloDePaso` fuera
 * de `step.run`.
 */
export async function obtenerFilasDashboard(
  repositorioImputaciones: Pick<RepositorioImputaciones, 'totalesPorMesYCategoria'>,
  ahora: Date,
): Promise<FilaDashboard[]> {
  const hasta = mesDe(ahora)
  const desde = sumarMeses(hasta, -(MESES_VISIBLES_EN_DASHBOARD - 1))

  const filas = await repositorioImputaciones.totalesPorMesYCategoria(desde, hasta)

  return filas.map((fila) => ({
    mes: fila.mes,
    categoria: fila.categoria,
    total: Number(fila.total),
    tieneSinConfirmar: fila.tieneSinConfirmar,
  }))
}
