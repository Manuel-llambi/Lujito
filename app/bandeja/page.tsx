import { Pool } from 'pg'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { ListaBandeja } from '@/app/components/ListaBandeja'
import { obtenerGastosPendientes } from '@/app/bandeja/obtenerGastosPendientes'
import { confirmarGasto } from '@/app/bandeja/confirmarGasto'
import { corregirGasto } from '@/app/bandeja/corregirGasto'

// Raíz de composición de esta ruta (mismo patrón que `app/api/inngest/route.ts`, `app/dashboard/page.tsx`
// y `app/layout.tsx`): el único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioGastos = crearRepositorioGastos(pool)

/**
 * `/bandeja` (Req. 7.2, 7.3, 7.4, 7.9, 7.10): contenedor puro — obtiene los gastos pendientes con
 * `obtenerGastosPendientes` y se los pasa a `ListaBandeja` sin filtrar ni recalcular nada acá. Los
 * Server Actions `confirmarGasto` (T49) y `corregirGasto` (T50) se pasan tal cual, sin envolverlos.
 */
export default async function PaginaBandeja() {
  const gastos = await obtenerGastosPendientes(repositorioGastos)

  return <ListaBandeja gastos={gastos} onConfirmar={confirmarGasto} onCorregir={corregirGasto} />
}
