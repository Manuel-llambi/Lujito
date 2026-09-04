import type { RepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'
import { mesDe } from '@/dominio/imputacion/mesDe'
import { sumarMeses } from '@/dominio/imputacion/sumarMeses'
import { MESES_VISIBLES_EN_DASHBOARD } from '@/app/dashboard/obtenerFilasDashboard'

/**
 * Detalle fila-por-imputación para el bucketing por semana/día de la card "Resumen" (trabajo ad hoc,
 * fuera de tasks.md). Misma ventana de doce meses que `obtenerFilasDashboard` —`MESES_VISIBLES_EN_DASHBOARD`
 * reutilizada, no redeclarada— para que cambiar de pestaña, de mes o de semana en el cliente nunca
 * dispare un fetch nuevo: el mismo invariante que ya documenta `PantallaDashboard`. Igual que
 * `obtenerFilasDashboard`, la conversión de `Decimal` a `number` es puramente de presentación — el
 * repositorio ya entregó el monto exacto de cada imputación, esta función no suma ni redondea nada.
 * `comercio` viaja igual que `fechaGasto` y `categoria`: una copia sin transformar, `monto` es el único
 * campo que cruza de `Decimal` a `number` acá.
 */
export async function obtenerFilasDetalladas(
  repositorioImputaciones: Pick<RepositorioImputaciones, 'imputacionesDetalladasEntre'>,
  ahora: Date,
): Promise<FilaImputacionDetallada[]> {
  const hasta = mesDe(ahora)
  const desde = sumarMeses(hasta, -(MESES_VISIBLES_EN_DASHBOARD - 1))

  const filas = await repositorioImputaciones.imputacionesDetalladasEntre(desde, hasta)

  return filas.map((fila) => {
    // Mismo criterio defensivo que `obtenerFilasDashboard` (trabajo ad hoc, feature "Descartar"): la
    // consulta ya excluye "Descartar", así que verla acá es un estado imposible del pipeline.
    if (fila.categoria === 'Descartar') {
      throw new Error(
        'obtenerFilasDetalladas: fila con categoría Descartar — la consulta ya la excluye, así que ' +
          'llegar hasta acá es un estado imposible del pipeline',
      )
    }
    return {
      mes: fila.mes,
      categoria: fila.categoria,
      monto: Number(fila.monto),
      fechaGasto: fila.fechaGasto,
      comercio: fila.comercio,
      tieneSinConfirmar: fila.tieneSinConfirmar,
    }
  })
}
