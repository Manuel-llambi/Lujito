import type { ReactNode } from 'react'
import { Pool } from 'pg'
import './globals.css'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { obtenerCantidadPendientes } from '@/app/obtenerCantidadPendientes'
import { IndicadorPendientes } from '@/app/components/IndicadorPendientes'

export const metadata = {
  title: 'Finanzas Cumzi',
  description: 'Pipeline de gastos desde emails del banco',
}

// Raíz de composición de este layout (mismo patrón que `app/api/inngest/route.ts` y
// `app/dashboard/page.tsx`): el único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioGastos = crearRepositorioGastos(pool)

/**
 * El indicador de pendientes (Req. 7.1) vive en el layout raíz, no en una página puntual: "visible en
 * la aplicación" (Descripción de T47 en tasks.md) es una notificación global, no algo que dependa de
 * qué ruta esté mirando el usuario — la misma razón por la que `/dashboard` (T43) no lo dibuja.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const cantidadPendientes = await obtenerCantidadPendientes(repositorioGastos)

  return (
    <html lang="es">
      <body>
        <header>
          <IndicadorPendientes cantidad={cantidadPendientes} />
        </header>
        {children}
      </body>
    </html>
  )
}
