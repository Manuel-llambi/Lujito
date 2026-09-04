/**
 * Íconos SVG inline para la reconstrucción visual de `/dashboard` (trabajo ad hoc, mockup Stitch). El
 * mockup usa la fuente Material Symbols vía Google Fonts, una dependencia externa que este proyecto no
 * carga hoy — se reemplaza por SVGs propios, sin red de por medio, en vez de sumar esa dependencia
 * para una sola pantalla.
 */

export function IconoBarras({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="10" width="3" height="7" fill="currentColor" />
      <rect x="8.5" y="6" width="3" height="11" fill="currentColor" />
      <rect x="14" y="2" width="3" height="15" fill="currentColor" />
    </svg>
  )
}

export function IconoTorta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.5 A7.5 7.5 0 0 1 17 11.5 L10 10 Z" fill="currentColor" />
    </svg>
  )
}

const ROTACION_CHEVRON = { derecha: 0, abajo: 90, izquierda: 180, arriba: 270 } as const

export function IconoChevron({
  direccion,
  className,
}: {
  direccion: keyof typeof ROTACION_CHEVRON
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      style={{ transform: `rotate(${ROTACION_CHEVRON[direccion]}deg)` }}
      aria-hidden="true"
    >
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoInicio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 2 2 9h2v9h5v-6h2v6h5V9h2z" />
    </svg>
  )
}

export function IconoBandeja({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M2 11l3-7h10l3 7v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" strokeLinejoin="round" />
      <path d="M2 11h4l1.5 2h5L14 11h4" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoHabitos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M2.5 16.5V3.5" strokeLinecap="round" />
      <path d="M2.5 16.5h15" strokeLinecap="round" />
      <path d="M4.5 13.5l3.5-4 2.5 2.5L16.5 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6h3.5v3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Íconos agregados para el restyle de `ModalNuevoGasto`/`BotonAgregarGastoFlotante` (mockup Stitch
 * "Dashboard con Modal Agregar Gasto Manual"), mismo patrón que los de arriba: SVG inline propio,
 * `viewBox="0 0 20 20"`, `currentColor`, `aria-hidden="true"` — nunca Material Symbols. */

export function IconoTienda({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M3 8.5V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" strokeLinejoin="round" />
      <path d="M2.5 8.5 4 3h12l1.5 5.5" strokeLinejoin="round" />
      <path d="M2.5 8.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" strokeLinejoin="round" />
      <path d="M8 17v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V17" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoCerrar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconoCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10.5l4 4 8-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoCalendario({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M3 8h14" />
      <path d="M6.5 2.5v3M13.5 2.5v3" strokeLinecap="round" />
    </svg>
  )
}

export function IconoMas({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
