'use client'

import { useState } from 'react'
import type { FilaDashboard } from '@/app/components/GraficoMensual'
import type { FilaImputacionDetallada } from '@/app/components/desgloseBucket'
import { TopAppBar } from '@/app/components/TopAppBar'
import { BottomNavBar } from '@/app/components/BottomNavBar'
import { BannerPendientes } from '@/app/components/BannerPendientes'
import { TarjetaGrafico, type Granularidad, type TipoGrafico } from '@/app/components/TarjetaGrafico'
import { SeccionCategorias } from '@/app/components/SeccionCategorias'
import { resolverDesgloseMes } from '@/app/components/resolverDesgloseMes'
import { resolverSemanasDelMes } from '@/app/components/resolverSemanasDelMes'
import { resolverDiasDeSemana, resolverLimitesSemana, resolverSemanaFocoInicial } from '@/app/components/resolverDiasDeSemana'
import { domingoDeSemana, sumarDias } from '@/app/components/semanaCalendario'
import { formatearRangoSemana } from '@/app/tokens/formatoSemana'
import { formatearMoneda } from '@/app/tokens/formatoMoneda'
import { nombreMes } from '@/app/tokens/formatoMes'
import type { NombreCategoria } from '@/app/tokens/colorCategoria'

/**
 * Pantalla completa de `/dashboard` (trabajo ad hoc, reconstrucción visual del mockup Stitch
 * "Dashboard con Notificación Refinada" — fuera del tracking de tasks.md). Recibe por props los tres
 * datos que ya resuelve el contenedor (`filas` vía `obtenerFilasDashboard`, `filasDetalladas` vía
 * `obtenerFilasDetalladas`, `cantidadPendientes` vía `obtenerCantidadPendientes`) y es dueña únicamente
 * del estado de interacción visual: qué mes está en foco, qué semana está en foco, qué tipo de gráfico
 * se ve, qué granularidad está seleccionada y qué categoría está expandida. Ninguno de esos cinco
 * estados dispara un fetch nuevo — navegar de período pagina sobre los mismos doce meses que ya
 * llegaron por props (Req. 9.1/9.3: el total de arriba y `SeccionCategorias` siguen atados SIEMPRE al
 * mes en foco, sin importar la pestaña de granularidad — cambiar a "Semana" solo cambia lo que dibuja
 * la card "Resumen").
 */
export function PantallaDashboard({
  filas,
  filasDetalladas,
  cantidadPendientes,
}: {
  filas: FilaDashboard[]
  filasDetalladas: FilaImputacionDetallada[]
  cantidadPendientes: number
}) {
  const mesesOrdenados = [...new Set(filas.map((f) => f.mes))].sort()

  const [focoIndex, setFocoIndex] = useState(Math.max(0, mesesOrdenados.length - 1))
  const [semanaFocoLunes, setSemanaFocoLunes] = useState<string | null>(() =>
    resolverSemanaFocoInicial(filasDetalladas, new Date()),
  )
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('barras')
  const [granularidad, setGranularidad] = useState<Granularidad>('mes')
  const [categoriaExpandida, setCategoriaExpandida] = useState<NombreCategoria | null>(null)

  const mesFoco = mesesOrdenados[focoIndex] ?? null
  const desgloseFoco = mesFoco ? resolverDesgloseMes(filas, mesFoco) : null
  const semanasDelMes = mesFoco ? resolverSemanasDelMes(filasDetalladas, mesFoco) : []
  const diasDeSemana = semanaFocoLunes ? resolverDiasDeSemana(filasDetalladas, semanaFocoLunes) : []
  const semanaEtiqueta = semanaFocoLunes
    ? formatearRangoSemana(semanaFocoLunes, domingoDeSemana(semanaFocoLunes))
    : null

  const limitesSemana = resolverLimitesSemana(filasDetalladas)
  const puedeIrSemanaAnterior = !!(semanaFocoLunes && limitesSemana && semanaFocoLunes > limitesSemana.minLunes)
  const puedeIrSemanaSiguiente = !!(semanaFocoLunes && limitesSemana && semanaFocoLunes < limitesSemana.maxLunes)

  const totalTexto = formatearMoneda(desgloseFoco?.totalMes ?? 0)
  const [parteEntera, parteDecimal] = totalTexto.split(',')

  function navegarPeriodo(direccion: -1 | 1) {
    setFocoIndex((indice) => Math.min(mesesOrdenados.length - 1, Math.max(0, indice + direccion)))
  }

  function navegarSemana(direccion: -1 | 1) {
    setSemanaFocoLunes((actual) => {
      if (!actual || !limitesSemana) {
        return actual
      }
      const siguiente = sumarDias(actual, direccion * 7)
      if (siguiente < limitesSemana.minLunes || siguiente > limitesSemana.maxLunes) {
        return actual
      }
      return siguiente
    })
  }

  function alternarCategoria(categoria: NombreCategoria) {
    setCategoriaExpandida((actual) => (actual === categoria ? null : categoria))
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-superficie-muted pb-24">
      <TopAppBar />

      <main className="flex flex-col gap-8 p-4">
        <BannerPendientes cantidad={cantidadPendientes} hrefRevisar="/bandeja" />

        <section className="flex flex-col items-center justify-center gap-1 pt-2 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-texto-muted">
            Gasto Acumulado {mesFoco ? nombreMes(mesFoco) : ''}
          </h2>
          <div data-testid="total-acumulado" className="text-3xl font-bold tracking-tight text-texto">
            {parteEntera ?? totalTexto}
            {parteDecimal && <span className="text-base font-normal text-texto-muted">,{parteDecimal}</span>}
          </div>
        </section>

        <TarjetaGrafico
          semanasDelMes={semanasDelMes}
          diasDeSemana={diasDeSemana}
          mesFoco={mesFoco}
          semanaEtiqueta={semanaEtiqueta}
          desgloseFoco={desgloseFoco}
          tipoGrafico={tipoGrafico}
          granularidad={granularidad}
          onCambiarTipoGrafico={setTipoGrafico}
          onCambiarGranularidad={setGranularidad}
          onNavegarPeriodo={navegarPeriodo}
          puedeIrAnterior={focoIndex > 0}
          puedeIrSiguiente={focoIndex < mesesOrdenados.length - 1}
          onNavegarSemana={navegarSemana}
          puedeIrSemanaAnterior={puedeIrSemanaAnterior}
          puedeIrSemanaSiguiente={puedeIrSemanaSiguiente}
        />

        {desgloseFoco && (
          <SeccionCategorias
            categorias={desgloseFoco.categorias.filter((c) => c.total > 0)}
            expandida={categoriaExpandida}
            onToggle={alternarCategoria}
          />
        )}
      </main>

      <BottomNavBar cantidadPendientes={cantidadPendientes} activa="inicio" />
    </div>
  )
}
