/**
 * Barra superior de `/dashboard` (trabajo ad hoc, mockup Stitch "Dashboard con Notificación
 * Refinada"). Presentación pura: recibe el título por props, sin datos propios.
 */
export function TopAppBar({ titulo }: { titulo: string }) {
  return (
    <header className="sticky top-0 z-40 bg-superficie border-b border-texto-muted/15 px-4 py-3">
      <h1 className="text-xl font-bold text-texto tracking-tight">{titulo}</h1>
    </header>
  )
}
