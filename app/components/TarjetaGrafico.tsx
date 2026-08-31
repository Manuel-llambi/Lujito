import type { ReactNode } from 'react'
import { CLASE_COLOR_CATEGORIA, VARIABLE_COLOR_CATEGORIA } from '@/app/tokens/colorCategoria'
import { nombreMes } from '@/app/tokens/formatoMes'
import { ORDEN_CATEGORIAS, type DesgloseMes } from '@/app/components/resolverDesgloseMes'
import type { DesgloseBucket } from '@/app/components/desgloseBucket'
import { IconoBarras, IconoChevron, IconoTorta } from '@/app/components/iconos'

export type TipoGrafico = 'barras' | 'torta'
export type Granularidad = 'semana' | 'mes'

const ETIQUETA_GRANULARIDAD: Record<Granularidad, string> = { semana: 'Semana', mes: 'Mes' }

/**
 * Card "Resumen" de `/dashboard` (trabajo ad hoc, mockup Stitch). Presentación pura — todo el estado
 * (tipo de gráfico, granularidad, mes en foco, semana en foco) vive en `PantallaDashboard` y llega por
 * props. Las dos pestañas de granularidad tienen cada una su propio período y su propia navegación
 * ‹›: "Mes" sigue paginando meses (`onNavegarPeriodo`/`mesFoco`, sin tocar), "Semana" pagina semanas
 * calendario de forma independiente (`onNavegarSemana`/`semanaEtiqueta`) — cambiar de pestaña no
 * cambia el mes ni la semana en foco del otro lado, cada uno recuerda el suyo.
 */
export function TarjetaGrafico({
  semanasDelMes,
  diasDeSemana,
  mesFoco,
  semanaEtiqueta,
  desgloseFoco,
  tipoGrafico,
  granularidad,
  onCambiarTipoGrafico,
  onCambiarGranularidad,
  onNavegarPeriodo,
  puedeIrAnterior,
  puedeIrSiguiente,
  onNavegarSemana,
  puedeIrSemanaAnterior,
  puedeIrSemanaSiguiente,
}: {
  semanasDelMes: DesgloseBucket[]
  diasDeSemana: DesgloseBucket[]
  mesFoco: string | null
  semanaEtiqueta: string | null
  desgloseFoco: DesgloseMes | null
  tipoGrafico: TipoGrafico
  granularidad: Granularidad
  onCambiarTipoGrafico: (tipo: TipoGrafico) => void
  onCambiarGranularidad: (granularidad: Granularidad) => void
  onNavegarPeriodo: (direccion: -1 | 1) => void
  puedeIrAnterior: boolean
  puedeIrSiguiente: boolean
  onNavegarSemana: (direccion: -1 | 1) => void
  puedeIrSemanaAnterior: boolean
  puedeIrSemanaSiguiente: boolean
}) {
  const esMes = granularidad === 'mes'
  const etiquetaPeriodo = esMes ? (mesFoco ? nombreMes(mesFoco) : 'Sin datos') : (semanaEtiqueta ?? 'Sin datos')
  const puedeIrAnteriorActivo = esMes ? puedeIrAnterior : puedeIrSemanaAnterior
  const puedeIrSiguienteActivo = esMes ? puedeIrSiguiente : puedeIrSemanaSiguiente

  function navegar(direccion: -1 | 1) {
    if (esMes) {
      onNavegarPeriodo(direccion)
    } else {
      onNavegarSemana(direccion)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-texto-muted/15 bg-superficie p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-texto">Resumen</h3>
        <div className="flex gap-1 rounded-lg bg-superficie-muted p-1">
          <BotonIcono activo={tipoGrafico === 'barras'} onClick={() => onCambiarTipoGrafico('barras')} etiqueta="Ver como barras">
            <IconoBarras className="h-4.5 w-4.5" />
          </BotonIcono>
          <BotonIcono activo={tipoGrafico === 'torta'} onClick={() => onCambiarTipoGrafico('torta')} etiqueta="Ver como torta">
            <IconoTorta className="h-4.5 w-4.5" />
          </BotonIcono>
        </div>
      </div>

      <div className="flex justify-between rounded-xl bg-superficie-muted p-1">
        {(Object.keys(ETIQUETA_GRANULARIDAD) as Granularidad[]).map((g) => (
          <button
            key={g}
            type="button"
            data-testid={`granularidad-${g}`}
            onClick={() => onCambiarGranularidad(g)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              granularidad === g ? 'bg-superficie text-acento shadow-sm' : 'text-texto-muted'
            }`}
          >
            {ETIQUETA_GRANULARIDAD[g]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          aria-label="Período anterior"
          disabled={!puedeIrAnteriorActivo}
          onClick={() => navegar(-1)}
          className="text-texto-muted hover:text-texto disabled:opacity-30"
        >
          <IconoChevron direccion="izquierda" className="h-5 w-5" />
        </button>
        <span data-testid="periodo-foco" className="text-sm font-semibold text-texto">
          {etiquetaPeriodo}
        </span>
        <button
          type="button"
          aria-label="Período siguiente"
          disabled={!puedeIrSiguienteActivo}
          onClick={() => navegar(1)}
          className="text-texto-muted hover:text-texto disabled:opacity-30"
        >
          <IconoChevron direccion="derecha" className="h-5 w-5" />
        </button>
      </div>

      {tipoGrafico === 'barras' ? (
        <GraficoBarras buckets={esMes ? semanasDelMes : diasDeSemana} />
      ) : (
        <GraficoTorta desglose={desgloseFoco} />
      )}

      <Leyenda />
    </section>
  )
}

function BotonIcono({
  activo,
  onClick,
  etiqueta,
  children,
}: {
  activo: boolean
  onClick: () => void
  etiqueta: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      aria-pressed={activo}
      onClick={onClick}
      className={`flex items-center justify-center rounded px-2 py-1 transition-colors ${
        activo ? 'bg-superficie text-acento shadow-sm' : 'text-texto-muted'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Barras apiladas por categoría, una columna por bucket (Decision log de esta reconstrucción): un
 * bucket es una semana del mes enfocado (pestaña "Mes", 4 columnas) o un día de la semana enfocada
 * (pestaña "Semana", 7 columnas) — misma forma `DesgloseBucket` en los dos casos, así que un solo
 * componente dibuja las dos pestañas sin un condicional por granularidad.
 */
function GraficoBarras({ buckets }: { buckets: DesgloseBucket[] }) {
  if (buckets.length === 0) {
    return <p className="py-10 text-center text-sm text-texto-muted">Todavía no hay gastos para mostrar.</p>
  }

  return (
    <div data-testid="grafico-barras" className="flex h-56 items-end justify-between gap-3 pt-4 pb-6">
      {buckets.map((bucket) => (
        <div key={bucket.etiqueta} className="relative flex h-full w-full flex-col-reverse items-center gap-px">
          {ORDEN_CATEGORIAS.map((categoria) => {
            const dato = bucket.categorias.find((c) => c.categoria === categoria)
            const pct = dato?.pct ?? 0
            if (pct === 0) {
              return null
            }
            return (
              <div
                key={categoria}
                className={`flex w-full max-w-[32px] items-center justify-center ${CLASE_COLOR_CATEGORIA[categoria]}`}
                style={{ height: `${pct}%` }}
              >
                {pct >= 12 && <span className="text-[8px] font-bold text-superficie">{pct}%</span>}
              </div>
            )
          })}
          <span className="absolute -bottom-6 text-[10px] font-semibold text-texto-muted">{bucket.etiqueta}</span>
        </div>
      ))}
    </div>
  )
}

function GraficoTorta({ desglose }: { desglose: DesgloseMes | null }) {
  if (!desglose || desglose.totalMes === 0) {
    return <p className="py-10 text-center text-sm text-texto-muted">Todavía no hay gastos para mostrar.</p>
  }

  let acumulado = 0
  const segmentos = ORDEN_CATEGORIAS.map((categoria) => {
    const dato = desglose.categorias.find((c) => c.categoria === categoria)
    const pct = dato?.pct ?? 0
    const inicio = acumulado
    acumulado += pct
    return `var(${VARIABLE_COLOR_CATEGORIA[categoria]}) ${inicio}% ${acumulado}%`
  }).join(', ')

  return (
    <div className="flex items-center justify-center py-6">
      <div
        data-testid="grafico-torta"
        role="img"
        aria-label="Distribución de gastos por categoría"
        className="h-36 w-36 rounded-full"
        style={{ background: `conic-gradient(${segmentos})` }}
      />
    </div>
  )
}

function Leyenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-texto-muted">
      {ORDEN_CATEGORIAS.map((categoria) => (
        <div key={categoria} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-sm ${CLASE_COLOR_CATEGORIA[categoria]}`} />
          {categoria}
        </div>
      ))}
    </div>
  )
}
