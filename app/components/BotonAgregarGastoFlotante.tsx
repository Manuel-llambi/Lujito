import { IconoMas } from '@/app/components/iconos'

/**
 * FAB de `/dashboard` que dispara la apertura de `ModalNuevoGasto` (T5) — Req. 1.1, 1.2.
 * Componente puramente visual: no conoce `crearGastoManual` ni `NuevoGastoManual`, ni tiene estado
 * propio. `PantallaDashboard` (T6) es dueña del estado `abierto`/`setAbierto` y le pasa `onAbrir` para
 * que el `onClick` haga `setAbierto(true)` — sin `<Link>` ni `router.push`, todo el cambio de UI es
 * estado de React dentro del mismo árbol de `/dashboard` (Req. 1.2). Posicionado `fixed` justo por
 * encima de `BottomNavBar` (`h-16` = 64px), dentro del mismo ancho `max-w-md` que ya usa esa barra,
 * para no quedar pegado al borde del viewport en pantallas anchas ni tapar la navegación inferior.
 *
 * Restyle (mockup Stitch "Dashboard con Modal Agregar Gasto Manual"): círculo `bg-acento` con un
 * `ring-4 ring-superficie` que lo separa del contenido de atrás cuando flota sobre el gráfico o una
 * fila de la lista, sombra elevada, y `active:scale-95` como único feedback de toque — sin animación
 * de foco adicional, para no competir con el `focus-visible:outline` que ya trae. El ícono "+" pasa de
 * texto a `IconoMas` (SVG propio) para no depender de la fuente del sistema en el trazo del signo.
 */
export function BotonAgregarGastoFlotante({ onAbrir }: { onAbrir: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-md justify-end px-4">
      <button
        type="button"
        onClick={onAbrir}
        aria-label="Agregar gasto"
        data-testid="fab-nuevo-gasto"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-acento text-superficie shadow-xl ring-4 ring-superficie transition-all duration-150 hover:bg-acento/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      >
        <IconoMas className="h-7 w-7" />
      </button>
    </div>
  )
}
