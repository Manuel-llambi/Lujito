import { CLASE_COLOR_CATEGORIA, type NombreCategoria } from '@/app/tokens/colorCategoria'

/**
 * Una fila del dashboard: total de una categoría en un mes (Req. 9.1, la vista `vista_gastos_mensuales`
 * de T20 la produce). Se declara acá porque T42 es la primera tarea que la necesita —T20 está
 * bloqueada en esta corrida por la migración de `gastos`— y la importa sin redeclararla cuando se
 * desbloquee, siguiendo la convención que fijó T16 con `MensajeCrudo`.
 */
export interface FilaDashboard {
  mes: string // 'AAAA-MM'
  categoria: NombreCategoria
  total: number
  /**
   * Req. 9.3: en verdadero cuando el grupo incluye al menos una imputación de un gasto con categoría
   * de origen `ia` sin confirmar (`vista_gastos_mensuales.tiene_sin_confirmar`, design.md). El monto
   * sigue sumando al total igual que cualquier otra fila — este campo es una marca adicional, nunca
   * una exclusión.
   */
  tieneSinConfirmar: boolean
}

/**
 * Componente de presentación pura (Req. 9.2): recibe las filas del dashboard por props, sin lógica
 * de cálculo — los totales llegan resueltos desde el repositorio (design.md). Se testea sin base de
 * datos. Una sección por mes, una serie por categoría dentro de cada mes.
 */
export function GraficoMensual({ filas }: { filas: FilaDashboard[] }) {
  const meses = [...new Set(filas.map((f) => f.mes))].sort()
  const categorias = [...new Set(filas.map((f) => f.categoria))]
  const totalMaximo = Math.max(1, ...filas.map((f) => f.total))

  return (
    <div data-testid="grafico-mensual" className="bg-superficie text-texto">
      {meses.map((mes) => (
        <div key={mes} data-testid={`mes-${mes}`}>
          <h3>{mes}</h3>
          <ul>
            {categorias.map((categoria) => {
              const fila = filas.find((f) => f.mes === mes && f.categoria === categoria)
              const total = fila?.total ?? 0
              const anchoPorcentual = (total / totalMaximo) * 100
              const sinConfirmar = fila?.tieneSinConfirmar ?? false

              return (
                <li key={categoria} data-testid={`serie-${mes}-${categoria}`}>
                  <span
                    data-testid={`color-${mes}-${categoria}`}
                    className={CLASE_COLOR_CATEGORIA[categoria]}
                    style={{ width: `${anchoPorcentual}%`, display: 'inline-block' }}
                  />
                  <span>{categoria}</span>
                  <span>{total}</span>
                  {sinConfirmar && (
                    <>
                      {/* Req. 9.3: patrón visual propio (borde punteado + ícono), no solo un cambio de
                          tono — legible sin depender de la percepción cromática. */}
                      <span
                        data-testid={`patron-sin-confirmar-${mes}-${categoria}`}
                        aria-hidden="true"
                        className="inline-block border-2 border-dashed border-acento"
                      />
                      <span
                        data-testid={`indicador-sin-confirmar-${mes}-${categoria}`}
                        className="text-acento"
                      >
                        ⏳ sin confirmar
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
