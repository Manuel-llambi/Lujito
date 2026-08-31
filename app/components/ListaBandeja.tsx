import { CATEGORIAS_INFERIBLES } from '@/dominio/categorizacion/categorizarPorReglas'
import type { Gasto } from '@/infra/db/repositorioGastos'

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
  return (
    <ul data-testid="lista-bandeja">
      {gastos.map((gasto) => {
        // Req. 7.10: un gasto con inferencia fallida queda en `Sin categorizar` con origen `ia`
        // (T35), así que también entra en `pendientesDeConfirmacion` — pero `Sin categorizar` no es
        // una categoría que el modelo haya propuesto, es la ausencia de propuesta.
        const tieneCategoriaPropuesta = gasto.categoria !== null && gasto.categoria !== 'Sin categorizar'

        return (
          <li key={gasto.id} data-testid={`gasto-${gasto.id}`}>
            <span data-testid={`comercio-${gasto.id}`}>{gasto.comercio}</span>
            <span data-testid={`monto-${gasto.id}`}>{gasto.montoTotal?.toFixed(2)}</span>
            <span data-testid={`fecha-${gasto.id}`}>{gasto.fechaGasto?.toISOString().slice(0, 10)}</span>
            {tieneCategoriaPropuesta && (
              <span data-testid={`categoria-propuesta-${gasto.id}`}>{gasto.categoria}</span>
            )}
            <span data-testid={`justificacion-${gasto.id}`}>{gasto.categoriaJustificacion}</span>
            {/* Req. 7.3: confirmar nunca cambia la categoría propuesta — el form envía la misma
                categoría que ya trae `gasto.categoria`, nunca una elegida por el usuario (eso es T50).
                Req. 7.5: el checkbox es el ofrecimiento de crear la regla del comercio (T51); sin
                marcar, es el rechazo del criterio 7.7 (T52) — no manda ningún valor en el FormData. */}
            {onConfirmar && tieneCategoriaPropuesta && (
              <form action={onConfirmar}>
                <input type="hidden" name="id" value={gasto.id} />
                <input type="hidden" name="categoria" value={gasto.categoria as string} />
                <input type="hidden" name="comercio" value={gasto.comercio ?? ''} />
                <label>
                  <input type="checkbox" name="crearRegla" value="true" data-testid={`crear-regla-confirmar-${gasto.id}`} />
                  Crear regla para este comercio
                </label>
                <button type="submit" data-testid={`confirmar-${gasto.id}`}>
                  Confirmar
                </button>
              </form>
            )}
            {/* Req. 7.4, 7.10: corregir reemplaza la categoría por la elegida — disponible para
                cualquier gasto pendiente, tenga o no una categoría propuesta. Un gasto en `Sin
                categorizar` no tiene forma de confirmar (arriba), así que este es su único camino a
                salir de la bandeja. Mismo ofrecimiento de regla que confirmar (Req. 7.5). */}
            {onCorregir && (
              <form action={onCorregir}>
                <input type="hidden" name="id" value={gasto.id} />
                <input type="hidden" name="comercio" value={gasto.comercio ?? ''} />
                <select name="categoria" data-testid={`categoria-select-${gasto.id}`} defaultValue="">
                  <option value="" disabled>
                    Elegir categoría
                  </option>
                  {CATEGORIAS_INFERIBLES.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
                <label>
                  <input type="checkbox" name="crearRegla" value="true" data-testid={`crear-regla-corregir-${gasto.id}`} />
                  Crear regla para este comercio
                </label>
                <button type="submit" data-testid={`corregir-${gasto.id}`}>
                  Corregir
                </button>
              </form>
            )}
          </li>
        )
      })}
    </ul>
  )
}
