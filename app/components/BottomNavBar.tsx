import Link from 'next/link'
import { IndicadorPendientes } from '@/app/components/IndicadorPendientes'
import { IconoBandeja, IconoInicio } from '@/app/components/iconos'

/**
 * Navegación inferior de `/dashboard` (trabajo ad hoc, mockup Stitch). El badge sobre "Bandeja" reusa
 * `IndicadorPendientes` (Req. 7.1) tal cual, sin redibujar su propio conteo — mismo componente ya
 * testeado que el layout global usa hoy.
 */
export function BottomNavBar({ cantidadPendientes }: { cantidadPendientes: number }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-center justify-around border-t border-texto-muted/15 bg-superficie px-4">
      <Link
        href="/dashboard"
        className="flex w-20 flex-col items-center justify-center gap-0.5 font-bold text-acento"
      >
        <IconoInicio className="h-5 w-5" />
        <span className="text-[10px] uppercase tracking-wide">Inicio</span>
      </Link>
      <Link href="/bandeja" className="flex w-20 flex-col items-center justify-center gap-0.5 text-texto-muted">
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
    </nav>
  )
}
