import Link from 'next/link'
import { IndicadorPendientes } from '@/app/components/IndicadorPendientes'
import { IconoBandeja, IconoHabitos, IconoInicio } from '@/app/components/iconos'

type Pestana = 'inicio' | 'bandeja' | 'habitos'

/**
 * Navegación inferior de `/dashboard` y `/bandeja` (trabajo ad hoc, mockup Stitch). El badge sobre
 * "Bandeja" reusa `IndicadorPendientes` (Req. 7.1) tal cual, sin redibujar su propio conteo — mismo
 * componente ya testeado que el layout global usa hoy.
 *
 * `activa` (revisión visual/UX): antes el estado activo estaba hardcodeado a "Inicio" sin importar la
 * ruta real, así que en `/bandeja` la barra mentía mostrando "Inicio" resaltado. Se resuelve con una
 * prop explícita en vez de `usePathname` para no forzar a este componente ni a sus consumidores
 * (`PantallaDashboard`, ya `'use client'` pero probado sin router de Next) a depender de un contexto de
 * navegación en los tests — mismo patrón "todo por props" que ya sigue el resto del árbol.
 */
export function BottomNavBar({
  cantidadPendientes,
  activa,
}: {
  cantidadPendientes: number
  activa: Pestana
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-stretch justify-around border-t border-texto-muted/15 bg-superficie px-4">
      <Link
        href="/dashboard"
        data-testid="nav-inicio"
        aria-current={activa === 'inicio' ? 'page' : undefined}
        className={`flex h-full w-20 flex-col items-center justify-center gap-0.5 font-bold transition-colors ${
          activa === 'inicio' ? 'text-acento' : 'text-texto-muted hover:text-texto'
        }`}
      >
        <IconoInicio className="h-5 w-5" />
        <span className="text-[10px] uppercase tracking-wide">Inicio</span>
      </Link>
      <Link
        href="/bandeja"
        data-testid="nav-bandeja"
        aria-current={activa === 'bandeja' ? 'page' : undefined}
        className={`flex h-full w-20 flex-col items-center justify-center gap-0.5 font-bold transition-colors ${
          activa === 'bandeja' ? 'text-acento' : 'text-texto-muted hover:text-texto'
        }`}
      >
        <div className="relative">
          <IconoBandeja className="h-5 w-5" />
          {cantidadPendientes > 0 && (
            <span className="absolute -top-2 -right-2 origin-top-right scale-75">
              <IndicadorPendientes cantidad={cantidadPendientes} />
            </span>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wide">Bandeja</span>
      </Link>
      <Link
        href="/habitos"
        data-testid="nav-habitos"
        aria-current={activa === 'habitos' ? 'page' : undefined}
        className={`flex h-full w-20 flex-col items-center justify-center gap-0.5 font-bold transition-colors ${
          activa === 'habitos' ? 'text-acento' : 'text-texto-muted hover:text-texto'
        }`}
      >
        <IconoHabitos className="h-5 w-5" />
        <span className="text-[10px] uppercase tracking-wide">Hábitos</span>
      </Link>
    </nav>
  )
}
