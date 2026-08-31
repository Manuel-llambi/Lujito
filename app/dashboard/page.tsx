import { Pool } from 'pg'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { PantallaDashboard } from '@/app/components/PantallaDashboard'
import { obtenerFilasDashboard } from '@/app/dashboard/obtenerFilasDashboard'
import { obtenerFilasDetalladas } from '@/app/dashboard/obtenerFilasDetalladas'
import { obtenerCantidadPendientes } from '@/app/obtenerCantidadPendientes'

// Raíz de composición de esta ruta (Decision log de T29, mismo patrón en `app/api/inngest/route.ts`):
// el único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioImputaciones = crearRepositorioImputaciones(pool)
const repositorioGastos = crearRepositorioGastos(pool)

/**
 * `/dashboard` (Req. 9.1, 9.2): contenedor puro — obtiene las filas ya resueltas con
 * `obtenerFilasDashboard`, el detalle fila-por-imputación con `obtenerFilasDetalladas` (trabajo ad
 * hoc: alimenta el bucketing por semana/día de la card "Resumen", misma ventana de doce meses que
 * `obtenerFilasDashboard`) y la cantidad de pendientes con `obtenerCantidadPendientes` (Req. 7.1,
 * mismo dato que ya usa `IndicadorPendientes` en el layout), y se las pasa a `PantallaDashboard` sin
 * sumar ni transformar nada más acá. `PantallaDashboard` es la reconstrucción visual de esta pantalla
 * (trabajo ad hoc, mockup Stitch "Dashboard con Notificación Refinada" — no tracked en tasks.md).
 */
export default async function PaginaDashboard() {
  const ahora = new Date()
  const [filas, filasDetalladas, cantidadPendientes] = await Promise.all([
    obtenerFilasDashboard(repositorioImputaciones, ahora),
    obtenerFilasDetalladas(repositorioImputaciones, ahora),
    obtenerCantidadPendientes(repositorioGastos),
  ])

  return (
    <PantallaDashboard filas={filas} filasDetalladas={filasDetalladas} cantidadPendientes={cantidadPendientes} />
  )
}
