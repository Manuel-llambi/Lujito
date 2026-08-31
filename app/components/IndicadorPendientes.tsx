/**
 * Componente de presentación pura (Req. 7.1): recibe la cantidad ya resuelta por props, sin acceso a
 * base de datos — mismo patrón contenedor/presentación que `GraficoMensual` (T42). Con `cantidad` en
 * cero no se muestra nada: "sin gastos pendientes, el indicador no se muestra" es un criterio de
 * ausencia, no de mostrar un cero.
 */
export function IndicadorPendientes({ cantidad }: { cantidad: number }) {
  if (cantidad === 0) {
    return null
  }

  return (
    <span
      data-testid="indicador-pendientes"
      className="inline-block rounded-full bg-acento text-superficie"
    >
      {cantidad}
    </span>
  )
}
