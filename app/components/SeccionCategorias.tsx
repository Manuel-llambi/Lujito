import { CLASE_COLOR_CATEGORIA, type NombreCategoria } from '@/app/tokens/colorCategoria'
import { formatearMoneda } from '@/app/tokens/formatoMoneda'
import { formatearFechaCorta } from '@/app/tokens/formatoMes'
import { IconoChevron } from '@/app/components/iconos'
import type { DesgloseCategoria } from '@/app/components/resolverDesgloseMes'

/**
 * Sección "Categorías" de `/dashboard` (trabajo ad hoc, mockup Stitch): un acordeón por categoría del
 * mes en foco. El panel expandido muestra el total de la categoría, la señal "sin confirmar" (Req.
 * 9.3, el mismo patrón visual + etiqueta de texto que ya usa `GraficoMensual`) y, debajo, la lista de
 * gastos individuales (comercio, fecha, monto) que ya trae `item.gastos` — resuelta por
 * `resolverDesgloseMes` a partir de `filasDetalladas` (`RepositorioImputaciones.imputacionesDetalladasEntre`),
 * no de los agregados de `obtenerFilasDashboard` (Req. 9.1, que sigue siendo solo totales). Sin badge
 * "Inferido" del mockup: esta reconstrucción no tiene ese dato por gasto, solo el flag agregado de
 * "sin confirmar" de la categoría completa.
 */
export function SeccionCategorias({
  categorias,
  expandida,
  onToggle,
}: {
  categorias: DesgloseCategoria[]
  expandida: NombreCategoria | null
  onToggle: (categoria: NombreCategoria) => void
}) {
  if (categorias.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="px-1 text-sm font-semibold text-texto">Categorías</h3>
      <div className="flex flex-col gap-2">
        {categorias.map((item) => {
          const abierta = expandida === item.categoria

          return (
            <div key={item.categoria} className="overflow-hidden rounded-3xl border border-texto-muted/15 bg-superficie">
              <button
                type="button"
                data-testid={`categoria-toggle-${item.categoria}`}
                aria-expanded={abierta}
                onClick={() => onToggle(item.categoria)}
                className={`flex w-full items-center justify-between p-4 transition-colors ${
                  abierta ? 'bg-superficie-muted' : 'hover:bg-superficie-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${CLASE_COLOR_CATEGORIA[item.categoria]}`} />
                  <span className="text-sm font-semibold text-texto">
                    {item.categoria}
                    <span className="ml-1 font-normal text-texto-muted">({item.pct}%)</span>
                  </span>
                </div>
                <IconoChevron direccion={abierta ? 'arriba' : 'abajo'} className="h-4 w-4 text-texto-muted" />
              </button>

              {abierta && (
                <div
                  data-testid={`categoria-detalle-${item.categoria}`}
                  className="flex flex-col gap-2 border-t border-texto-muted/15 p-4 pt-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-texto-muted">Total del mes</span>
                    <span className="text-sm font-bold text-texto">{formatearMoneda(item.total)}</span>
                  </div>
                  {item.tieneSinConfirmar && (
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="inline-block h-3 w-3 border-2 border-dashed border-acento" />
                      <span className="text-xs font-semibold text-acento">⏳ incluye gastos sin confirmar</span>
                    </div>
                  )}
                  {item.gastos.length > 0 && (
                    <ul data-testid={`categoria-gastos-${item.categoria}`} className="flex flex-col gap-1.5 pt-1">
                      {item.gastos.map((gasto, indice) => (
                        <li
                          key={`${gasto.comercio ?? 'sin-comercio'}-${gasto.fecha}-${indice}`}
                          className="flex items-center justify-between text-xs text-texto-muted"
                        >
                          <span className="truncate text-texto">{gasto.comercio ?? 'Comercio sin identificar'}</span>
                          <span className="shrink-0 pl-2">
                            {formatearFechaCorta(gasto.fecha)} · {formatearMoneda(gasto.monto)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
