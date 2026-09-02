import { TopAppBar } from '@/app/components/TopAppBar'
import { BottomNavBar } from '@/app/components/BottomNavBar'
import { SeccionHallazgos } from '@/app/components/habitos/SeccionHallazgos'
import { SeccionRecomendaciones } from '@/app/components/habitos/SeccionRecomendaciones'
import type { HallazgoRedactado } from '@/infra/ia/redactarHallazgo'

/**
 * Pantalla completa de `/habitos` (T10). A diferencia de `PantallaDashboard`, no hay selector de mes,
 * de semana, de tipo de gráfico ni de categoría expandida — cero estado de interacción que gestionar,
 * así que se mantiene como Server Component, sin `'use client'` (design.md, "Decisiones de diseño").
 * Recibe `hallazgos` y `cantidadPendientes` ya resueltos por el contenedor (`obtenerHallazgosHabitos` +
 * `redactarHallazgo`, T11) y arma el layout: `TopAppBar`, las dos secciones o el estado vacío (Req.
 * 6.1), y `BottomNavBar` con la pestaña "Hábitos" activa en ambos casos (Req. 1.2, 6.2).
 */
export function PantallaHabitos({
  hallazgos,
  cantidadPendientes,
}: {
  hallazgos: HallazgoRedactado[]
  cantidadPendientes: number
}) {
  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-superficie-muted pb-24">
      <TopAppBar />

      <main className="flex flex-col gap-8 p-4">
        {hallazgos.length > 0 ? (
          <>
            <SeccionHallazgos hallazgos={hallazgos} />
            <SeccionRecomendaciones hallazgos={hallazgos} />
          </>
        ) : (
          <p className="px-1 text-sm text-texto-muted">Todavía no hay datos suficientes para mostrar hábitos</p>
        )}
      </main>

      <BottomNavBar activa="habitos" cantidadPendientes={cantidadPendientes} />
    </div>
  )
}
