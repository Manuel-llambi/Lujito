import { Pool } from 'pg'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearClienteRedaccionHttp } from '@/infra/ia/clienteRedaccionHttp'
import { redactarHallazgo, type HallazgoRedactado } from '@/infra/ia/redactarHallazgo'
import { PantallaHabitos } from '@/app/components/habitos/PantallaHabitos'
import { obtenerHallazgosHabitos } from '@/app/habitos/obtenerHallazgosHabitos'
import { obtenerCantidadPendientes } from '@/app/obtenerCantidadPendientes'

// Lee datos en vivo de la base en cada request — nunca prerenderizable en build (ahí no hay Postgres
// disponible, ECONNREFUSED 127.0.0.1:5432). Mismo fix en /bandeja y /dashboard.
export const dynamic = 'force-dynamic'

// Raíz de composición de esta ruta (mismo patrón que `app/dashboard/page.tsx` y
// `app/api/inngest/route.ts`): el único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioImputaciones = crearRepositorioImputaciones(pool)
const repositorioGastos = crearRepositorioGastos(pool)
const clienteRedaccion = crearClienteRedaccionHttp(process.env.ANTHROPIC_API_KEY ?? '')

/**
 * `/habitos` (Req. 1.1, 2.1, 4.2, 4.4): contenedor puro — calcula los hallazgos con
 * `obtenerHallazgosHabitos` (T11) y, si hay al menos uno, solicita su redacción con `redactarHallazgo`
 * (T7) en paralelo vía `Promise.all` por cada hallazgo (Req. 4.2, 4.4: una llamada independiente por
 * ítem, así la falla de una no impide resolver el texto de las demás — `redactarHallazgo` nunca lanza).
 * Si `obtenerHallazgosHabitos` devuelve `[]`, no llama a `redactarHallazgo` y pasa `hallazgos: []`
 * directo — `PantallaHabitos` (T10) ya resuelve el estado vacío (Req. 6.1).
 */
export default async function PaginaHabitos() {
  const ahora = new Date()
  const [hallazgosCalculados, cantidadPendientes] = await Promise.all([
    obtenerHallazgosHabitos(repositorioImputaciones, repositorioGastos, ahora),
    obtenerCantidadPendientes(repositorioGastos),
  ])

  const hallazgos: HallazgoRedactado[] =
    hallazgosCalculados.length > 0
      ? await Promise.all(hallazgosCalculados.map((hallazgo) => redactarHallazgo(hallazgo, clienteRedaccion)))
      : []

  return <PantallaHabitos hallazgos={hallazgos} cantidadPendientes={cantidadPendientes} />
}
