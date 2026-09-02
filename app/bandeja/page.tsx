import { Pool } from 'pg'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { ListaBandeja } from '@/app/components/ListaBandeja'
import { obtenerGastosPendientes } from '@/app/bandeja/obtenerGastosPendientes'
import { confirmarGasto } from '@/app/bandeja/confirmarGasto'
import { corregirGasto } from '@/app/bandeja/corregirGasto'
import { TopAppBar } from '@/app/components/TopAppBar'
import { BottomNavBar } from '@/app/components/BottomNavBar'

// Lee datos en vivo de la base en cada request — nunca prerenderizable en build (ahí no hay Postgres
// disponible, ECONNREFUSED 127.0.0.1:5432). Mismo fix en /dashboard y /habitos.
export const dynamic = 'force-dynamic'

// Raíz de composición de esta ruta (mismo patrón que `app/api/inngest/route.ts`, `app/dashboard/page.tsx`
// y `app/layout.tsx`): el único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioGastos = crearRepositorioGastos(pool)

/**
 * `/bandeja` (Req. 7.2, 7.3, 7.4, 7.9, 7.10): contenedor puro — obtiene los gastos pendientes con
 * `obtenerGastosPendientes` y se los pasa a `ListaBandeja` sin filtrar ni recalcular nada acá. Los
 * Server Actions `confirmarGasto` (T49) y `corregirGasto` (T50) se pasan tal cual, sin envolverlos.
 *
 * Shell de navegación (revisión visual/UX): antes esta ruta renderizaba únicamente `ListaBandeja`, sin
 * `TopAppBar` ni `BottomNavBar` — no había forma de volver a `/dashboard` desde acá salvo el botón
 * "atrás" del navegador, y la barra inferior de `/dashboard` no existía en esta pantalla. Se agrega el
 * mismo shell mobile (`max-w-md`, `TopAppBar`, `BottomNavBar`) que ya usa `PantallaDashboard`, con
 * `activa="bandeja"` para que la pestaña resaltada sea la real. `cantidadPendientes` es
 * `gastos.length` sin una consulta aparte: `obtenerGastosPendientes` y `obtenerCantidadPendientes`
 * envuelven el mismo `pendientesDeConfirmacion()` (T47/T48), así que ya es el mismo número. `TopAppBar`
 * ya no recibe el título de la pantalla — siempre muestra el logo "Lujito" — así que "Bandeja" se
 * dibuja acá como subtítulo dentro del `<main>`, arriba del conteo de pendientes.
 */
export default async function PaginaBandeja() {
  const gastos = await obtenerGastosPendientes(repositorioGastos)

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-superficie-muted pb-24">
      <TopAppBar />

      <main className="flex flex-col gap-4 p-4">
        <h2 className="px-1 text-2xl font-bold tracking-tight text-texto">Bandeja</h2>

        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-texto-muted">
          {gastos.length} {gastos.length === 1 ? 'gasto pendiente' : 'gastos pendientes'}
        </h3>

        <ListaBandeja gastos={gastos} onConfirmar={confirmarGasto} onCorregir={corregirGasto} />
      </main>

      <BottomNavBar cantidadPendientes={gastos.length} activa="bandeja" />
    </div>
  )
}
