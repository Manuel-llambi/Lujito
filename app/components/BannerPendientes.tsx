import Link from 'next/link'

/**
 * Banner de alerta de `/dashboard` (trabajo ad hoc, mockup Stitch). Reusa exactamente el mismo dato
 * que `IndicadorPendientes` (Req. 7.1, `pendientesDeConfirmacion`): gastos ya categorizados que
 * esperan la confirmación del usuario — no el estado `needs_review` del dominio (Req. 10.2), cuya
 * pantalla queda fuera de alcance (design.md, "Superficie visual"). Mismo criterio de ausencia que
 * `IndicadorPendientes`: con `cantidad` en cero, no se muestra nada.
 */
export function BannerPendientes({ cantidad, hrefRevisar }: { cantidad: number; hrefRevisar: string }) {
  if (cantidad === 0) {
    return null
  }

  return (
    <section
      data-testid="banner-pendientes"
      className="flex items-center justify-between gap-3 rounded-full border border-texto-muted/15 bg-superficie-muted px-4 py-2"
    >
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-alerta" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-alerta">
            {cantidad} {cantidad === 1 ? 'gasto pendiente' : 'gastos pendientes'} de confirmación
          </span>
          <span className="text-xs text-texto-muted">Esperan tu revisión</span>
        </div>
      </div>
      <Link
        href={hrefRevisar}
        className="rounded-full border border-texto-muted/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-acento hover:bg-superficie"
      >
        Revisar
      </Link>
    </section>
  )
}
