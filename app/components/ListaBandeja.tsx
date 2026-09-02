import { CATEGORIAS_INFERIBLES } from '@/dominio/categorizacion/categorizarPorReglas'
import type { Gasto } from '@/infra/db/repositorioGastos'
import { CLASE_COLOR_CATEGORIA } from '@/app/tokens/colorCategoria'

/**
 * Componente de presentación pura (Req. 7.2, 7.10): recibe la lista de gastos pendientes ya resuelta
 * por props, sin filtrar ni recalcular nada — mismo patrón contenedor/presentación que
 * `GraficoMensual` (T42). Cada fila muestra los cinco datos que exige 7.2: comercio, monto, fecha,
 * categoría propuesta y justificación.
 *
 * `onConfirmar` y `onCorregir` son opcionales (Decision log de T49/T50): un `<form action={...}>` por
 * fila y por acción, sin `'use client'` — Next.js (y React 19, que ya soporta `action` como prop de
 * función en `<form>` dentro de un Server Component) no exige convertir este componente en cliente
 * para wirear un Server Action. Mantenerlo como Server Component evita que `gasto.montoTotal` (un
 * `Decimal`) cruce la frontera server/client, donde perdería su prototipo y `.toFixed` dejaría de
 * existir del otro lado. Sin las dos props (p. ej. en los tests de T48 que no las pasan) no se
 * renderiza ningún formulario — sigue siendo el mismo componente de solo lectura que ya prueba T48.
 *
 * Estilo visual (revisión visual/UX): el componente original no tenía una sola clase de Tailwind — una
 * `<ul>` desnuda con `<form>`s de HTML por defecto. El texto de cada `data-testid` verificado por
 * `ListaBandeja.test.tsx` (comercio/monto/fecha/categoría/justificación, más los valores de los
 * `FormData`) no cambia: todo lo agregado acá es `className` y elementos decorativos nuevos alrededor,
 * nunca contenido dentro de un nodo con testid existente.
 */
export function ListaBandeja({
  gastos,
  onConfirmar,
  onCorregir,
}: {
  gastos: Gasto[]
  onConfirmar?: (formData: FormData) => void | Promise<void>
  onCorregir?: (formData: FormData) => void | Promise<void>
}) {
  if (gastos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-texto-muted/25 p-8 text-center text-sm text-texto-muted">
        No hay gastos pendientes de confirmación.
      </p>
    )
  }

  return (
    <ul data-testid="lista-bandeja" className="flex flex-col gap-3">
      {gastos.map((gasto) => {
        // Req. 7.10: un gasto con inferencia fallida queda en `Sin categorizar` con origen `ia`
        // (T35), así que también entra en `pendientesDeConfirmacion` — pero `Sin categorizar` no es
        // una categoría que el modelo haya propuesto, es la ausencia de propuesta.
        const tieneCategoriaPropuesta = gasto.categoria !== null && gasto.categoria !== 'Sin categorizar'

        return (
          <li
            key={gasto.id}
            data-testid={`gasto-${gasto.id}`}
            className="flex flex-col gap-3 rounded-2xl border border-texto-muted/15 bg-superficie p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span data-testid={`comercio-${gasto.id}`} className="truncate text-sm font-semibold text-texto">
                  {gasto.comercio}
                </span>
                <span data-testid={`fecha-${gasto.id}`} className="text-xs text-texto-muted">
                  {gasto.fechaGasto?.toISOString().slice(0, 10)}
                </span>
                {tieneCategoriaPropuesta && (
                  <span
                    data-testid={`categoria-propuesta-${gasto.id}`}
                    className="mt-0.5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-texto"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${CLASE_COLOR_CATEGORIA[gasto.categoria as keyof typeof CLASE_COLOR_CATEGORIA]}`}
                    />
                    {gasto.categoria}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-right text-sm font-bold text-texto">
                <span aria-hidden="true">$ </span>
                <span data-testid={`monto-${gasto.id}`}>{gasto.montoTotal?.toFixed(2)}</span>
              </span>
            </div>

            <p data-testid={`justificacion-${gasto.id}`} className="text-xs italic text-texto-muted">
              {gasto.categoriaJustificacion}
            </p>

            {(onConfirmar || onCorregir) && (
              <div className="flex flex-col gap-2 border-t border-texto-muted/15 pt-3">
                {/* Req. 7.3: confirmar nunca cambia la categoría propuesta — el form envía la misma
                    categoría que ya trae `gasto.categoria`, nunca una elegida por el usuario (eso es T50).
                    Req. 7.5: el checkbox es el ofrecimiento de crear la regla del comercio (T51); sin
                    marcar, es el rechazo del criterio 7.7 (T52) — no manda ningún valor en el FormData. */}
                {onConfirmar && tieneCategoriaPropuesta && (
                  <form action={onConfirmar} className="flex flex-wrap items-center justify-between gap-2">
                    <input type="hidden" name="id" value={gasto.id} />
                    <input type="hidden" name="categoria" value={gasto.categoria as string} />
                    <input type="hidden" name="comercio" value={gasto.comercio ?? ''} />
                    <label className="flex min-h-11 items-center gap-2 text-xs text-texto-muted">
                      <input
                        type="checkbox"
                        name="crearRegla"
                        value="true"
                        data-testid={`crear-regla-confirmar-${gasto.id}`}
                        className="h-4 w-4 rounded border-texto-muted/40 accent-[var(--color-acento)]"
                      />
                      Crear regla para este comercio
                    </label>
                    <button
                      type="submit"
                      data-testid={`confirmar-${gasto.id}`}
                      className="min-h-11 rounded-full bg-acento px-5 text-sm font-semibold text-superficie transition-colors hover:bg-acento/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                    >
                      Confirmar
                    </button>
                  </form>
                )}
                {/* Req. 7.4, 7.10: corregir reemplaza la categoría por la elegida — disponible para
                    cualquier gasto pendiente, tenga o no una categoría propuesta. Un gasto en `Sin
                    categorizar` no tiene forma de confirmar (arriba), así que este es su único camino a
                    salir de la bandeja. Mismo ofrecimiento de regla que confirmar (Req. 7.5). */}
                {onCorregir && (
                  <form action={onCorregir} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={gasto.id} />
                    <input type="hidden" name="comercio" value={gasto.comercio ?? ''} />
                    <select
                      name="categoria"
                      data-testid={`categoria-select-${gasto.id}`}
                      defaultValue=""
                      className="min-h-11 flex-1 rounded-lg border border-texto-muted/25 bg-superficie px-3 text-sm text-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                    >
                      <option value="" disabled>
                        Elegir categoría
                      </option>
                      {CATEGORIAS_INFERIBLES.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                    <label className="flex min-h-11 items-center gap-2 text-xs text-texto-muted">
                      <input
                        type="checkbox"
                        name="crearRegla"
                        value="true"
                        data-testid={`crear-regla-corregir-${gasto.id}`}
                        className="h-4 w-4 rounded border-texto-muted/40 accent-[var(--color-acento)]"
                      />
                      Crear regla para este comercio
                    </label>
                    <button
                      type="submit"
                      data-testid={`corregir-${gasto.id}`}
                      className="min-h-11 rounded-full border border-acento px-5 text-sm font-semibold text-acento transition-colors hover:bg-acento/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                    >
                      Corregir
                    </button>
                  </form>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
