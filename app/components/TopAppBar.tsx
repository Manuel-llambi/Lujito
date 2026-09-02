/**
 * Barra superior de `/dashboard` y `/bandeja` (trabajo ad hoc, mockup Stitch "Dashboard con
 * Notificación Refinada"). Presentación pura, sin datos propios.
 *
 * `titulo` (revisión visual/UX): "Lujito" es el nombre de la app — va siempre en la sección del
 * logo, hardcodeado acá en vez de recibido por prop, para que ninguna pantalla pueda pisarlo (antes
 * `/bandeja` pasaba `titulo="Bandeja"` y el logo desaparecía). El título de cada pantalla (ej.
 * "Bandeja") no vive acá — cada página lo dibuja como subtítulo dentro de su propio `<main>`.
 */
export function TopAppBar() {
  return (
    <header className="sticky top-0 z-40 bg-superficie border-b border-texto-muted/15 px-4 py-3">
      <h1 className="text-xl font-bold text-texto tracking-tight">Lujito</h1>
    </header>
  )
}
