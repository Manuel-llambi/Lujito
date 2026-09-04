'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { crearGastoManual, type EstadoFormularioGastoManual } from '@/app/dashboard/crearGastoManualAction'
import { CATEGORIAS_MANUAL, type Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'
import { IconoCalendario, IconoCerrar, IconoCheck, IconoMas, IconoTienda } from '@/app/components/iconos'

const formateadorFechaHoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_REFERENCIA })

/** Fecha de hoy en formato `AAAA-MM-DD`, leída en `ZONA_REFERENCIA` (Req. 2.3) — mismo espíritu de
 * conversión de zona horaria en un único punto que ya usan `mesDe`/`componerFechaGasto`, aplicado
 * acá al `defaultValue` del `<input type="date">` en vez de a un cálculo de dominio. */
function fechaDeHoyComoInputDate(): string {
  return formateadorFechaHoy.format(new Date())
}

/** Estilo de tarjeta compartido por los tres campos de texto/fecha del form (mockup Stitch): fondo
 * `superficie-muted`, borde sutil que se resalta en foco con el color de acento. `CLASE_CAMPO_BASE`
 * es el contenedor (el `focus-within` reacciona al foco del input hijo); el input en sí queda sin
 * borde ni fondo propios para que el contenedor sea el único marco visible. */
const CLASE_CAMPO_BASE =
  'flex items-center gap-2.5 rounded-2xl border border-texto-muted/20 bg-superficie-muted px-4 py-3 transition-all focus-within:border-acento focus-within:ring-2 focus-within:ring-acento/10'
const CLASE_INPUT_BASE =
  'w-full min-w-0 border-0 bg-transparent p-0 text-texto placeholder:text-texto-muted/40 focus:outline-none focus:ring-0'
const CLASE_LABEL =
  'text-[11px] font-semibold uppercase tracking-wider text-texto-muted'

/** Look "seleccionado"/"no seleccionado" de cada chip de categoría, por categoría (Req. 2.4, 2.5) —
 * clases Tailwind literales (no interpoladas en un template dinámico) para que el scanner de contenido
 * de Tailwind las detecte en el archivo; ver comentario de `globals.css` sobre no usar hex literales. */
const ESTILO_CHIP_CATEGORIA: Record<Categoria, { punto: string; borde: string; fondo: string; texto: string }> = {
  Salidas: {
    punto: 'bg-categoria-salidas',
    borde: 'border-categoria-salidas',
    fondo: 'bg-categoria-salidas/10',
    texto: 'text-categoria-salidas',
  },
  Comida: {
    punto: 'bg-categoria-comida',
    borde: 'border-categoria-comida',
    fondo: 'bg-categoria-comida/10',
    texto: 'text-categoria-comida',
  },
  Extras: {
    punto: 'bg-categoria-extras',
    borde: 'border-categoria-extras',
    fondo: 'bg-categoria-extras/10',
    texto: 'text-categoria-extras',
  },
  'Sin categorizar': { punto: '', borde: '', fondo: '', texto: '' },
  Descartar: { punto: '', borde: '', fondo: '', texto: '' },
}

/**
 * Formulario modal de alta manual (T5, Req. 1.3, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.1). Se conecta a la
 * Server Action `crearGastoManual` (T4) vía `useActionState`. Cuando `abierto` es `false`, no
 * renderiza ningún campo — este contrato de render es lo que T6 explota para verificar el wiring del
 * FAB, así que se prueba acá, en el componente dueño del contrato.
 *
 * Distinción crítica (ver `tasks.md`, T5): `useActionState(crearGastoManual, null)` devuelve
 * `estado === null` tanto en el render inicial (antes de cualquier submit) como tras un envío
 * exitoso. Confundir esos dos casos cerraría el modal apenas se monta. Se distinguen con
 * `pendienteAnteriorRef`: solo se invoca `onCerrar` cuando el flag `pendiente` de `useActionState`
 * pasa de `true` a `false` (una transición de envío que termina) Y el estado resultante es `null`
 * (sin error) — nunca por el mero hecho de que `estado` sea `null`.
 *
 * Restyle (mockup Stitch "Dashboard con Modal Agregar Gasto Manual"): bottom sheet con handle bar,
 * header con ícono + título + botón cerrar, input de Monto grande con prefijo "$", input de Comercio
 * con ícono de tienda, selector de categoría como 3 chips (en vez del `<select>` nativo original —
 * cambio de interacción real, ver `categoriaSeleccionada` abajo) y acciones primaria/secundaria. El
 * campo Fecha no está en el mockup pero es obligatorio (Req. 2.3): se le dio el mismo lenguaje visual
 * que al resto del form, con un ícono de calendario nuevo.
 */
export function ModalNuevoGasto({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [estado, formAction, pendiente] = useActionState<EstadoFormularioGastoManual, FormData>(crearGastoManual, null)
  const pendienteAnteriorRef = useRef(false)

  // Estado local del chip de categoría seleccionado (Req. 2.4: arranca vacío, sin preselección que
  // permita un envío válido sin elegir). Al desmontarse el modal (`if (!abierto) return null`, más
  // abajo) este `useState` se resetea solo al volver a montar — no hay estado persistido afuera que
  // lo sobreviva entre una cancelación/cierre y la reapertura siguiente.
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('')

  useEffect(() => {
    const huboEnvioQueTermino = pendienteAnteriorRef.current && !pendiente
    pendienteAnteriorRef.current = pendiente
    if (huboEnvioQueTermino && estado === null) {
      onCerrar()
    }
  }, [pendiente, estado, onCerrar])

  if (!abierto) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-texto-muted/40 sm:items-center">
      <form
        action={formAction}
        data-testid="modal-nuevo-gasto"
        className="flex w-full max-w-md flex-col gap-5 rounded-t-[32px] bg-superficie p-6 shadow-2xl sm:rounded-[32px]"
      >
        {/* Handle bar */}
        <div className="-mt-2 mb-1 h-1 w-12 self-center rounded-full bg-texto-muted/25" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconoMas className="h-6 w-6 text-acento" />
            <h2 className="text-xl font-bold text-texto">Nuevo gasto</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            data-testid="cerrar-nuevo-gasto"
            className="flex h-8 w-8 items-center justify-center rounded-full text-texto-muted transition-colors hover:bg-superficie-muted"
          >
            <IconoCerrar className="h-4 w-4" />
          </button>
        </div>

        {/* Monto */}
        <label className="flex flex-col gap-1.5">
          <span className={CLASE_LABEL}>Monto</span>
          <span className={CLASE_CAMPO_BASE}>
            <span className="text-2xl font-bold text-texto">$</span>
            <input
              type="text"
              name="monto"
              placeholder="0,00"
              data-testid="monto-nuevo-gasto"
              className={`${CLASE_INPUT_BASE} text-2xl font-bold`}
            />
          </span>
        </label>

        {/* Comercio */}
        <label className="flex flex-col gap-1.5">
          <span className={CLASE_LABEL}>Comercio / Detalle</span>
          <span className={CLASE_CAMPO_BASE}>
            <IconoTienda className="h-5 w-5 shrink-0 text-texto-muted" />
            <input
              type="text"
              name="comercio"
              placeholder="Ej. Supermercado, Café, Uber..."
              data-testid="comercio-nuevo-gasto"
              className={`${CLASE_INPUT_BASE} text-sm`}
            />
          </span>
        </label>

        {/* Fecha — sin equivalente en el mockup, pero obligatoria (Req. 2.3): mismo lenguaje visual. */}
        <label className="flex flex-col gap-1.5">
          <span className={CLASE_LABEL}>Fecha</span>
          <span className={CLASE_CAMPO_BASE}>
            <IconoCalendario className="h-5 w-5 shrink-0 text-texto-muted" />
            <input
              type="date"
              name="fecha"
              defaultValue={fechaDeHoyComoInputDate()}
              data-testid="fecha-nuevo-gasto"
              className={`${CLASE_INPUT_BASE} text-sm`}
            />
          </span>
        </label>

        {/* Categoría — 3 chips en vez de un <select> nativo (cambio de interacción real, Req. 2.4, 2.5) */}
        <div className="flex flex-col gap-2">
          <span className={CLASE_LABEL}>Categoría</span>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS_MANUAL.map((categoria) => {
              const seleccionada = categoriaSeleccionada === categoria
              const estilo = ESTILO_CHIP_CATEGORIA[categoria]
              return (
                <button
                  key={categoria}
                  type="button"
                  aria-pressed={seleccionada}
                  data-testid={`categoria-chip-${categoria}`}
                  onClick={() => setCategoriaSeleccionada(categoria)}
                  className={
                    seleccionada
                      ? `flex flex-col items-center gap-1.5 rounded-xl border-2 ${estilo.borde} ${estilo.fondo} px-2 py-2.5 transition-all`
                      : 'flex flex-col items-center gap-1.5 rounded-xl border border-texto-muted/20 bg-superficie-muted px-2 py-2.5 transition-all hover:bg-texto-muted/10'
                  }
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${estilo.punto}`} />
                  <span className={seleccionada ? `text-xs font-semibold ${estilo.texto}` : 'text-xs font-medium text-texto-muted'}>
                    {categoria}
                  </span>
                </button>
              )
            })}
          </div>
          <input type="hidden" name="categoria" value={categoriaSeleccionada} data-testid="categoria-nuevo-gasto" />
        </div>

        {estado?.error && (
          <p data-testid="error-nuevo-gasto" className="rounded-lg bg-alerta/10 px-3 py-2 text-xs text-alerta">
            {estado.error}
          </p>
        )}

        {/* Acciones */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            disabled={pendiente}
            data-testid="guardar-nuevo-gasto"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-acento px-4 py-3.5 text-sm font-bold tracking-wide text-superficie shadow-md transition-all hover:bg-acento/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:opacity-60"
          >
            <IconoCheck className="h-4 w-4" />
            Agregar gasto
          </button>
          <button
            type="button"
            onClick={onCerrar}
            data-testid="cancelar-nuevo-gasto"
            className="w-full rounded-full py-2.5 text-xs font-semibold text-texto-muted transition-colors hover:text-texto"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
