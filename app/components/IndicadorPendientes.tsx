/**
 * Componente de presentación pura (Req. 7.1): recibe la cantidad ya resuelta por props, sin acceso a
 * base de datos — mismo patrón contenedor/presentación que `GraficoMensual` (T42). Con `cantidad` en
 * cero no se muestra nada: "sin gastos pendientes, el indicador no se muestra" es un criterio de
 * ausencia, no de mostrar un cero.
 *
 * Tamaño y `aria-label` (revisión visual/UX): la versión original no fijaba alto/ancho mínimo ni
 * padding, así que el círculo colapsaba al tamaño del glifo y perdía forma de badge con números de dos
 * dígitos. Tampoco tenía nombre accesible propio — un lector de pantalla solo anunciaba el número
 * suelto, sin contexto, sobre todo en el header raíz donde no hay una etiqueta visible al lado.
 */
export function IndicadorPendientes({ cantidad }: { cantidad: number }) {
  if (cantidad === 0) {
    return null
  }

  return (
    <span
      data-testid="indicador-pendientes"
      aria-label={`${cantidad} ${cantidad === 1 ? 'gasto pendiente' : 'gastos pendientes'} de confirmación`}
      className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-acento px-1.5 text-[11px] font-bold leading-none text-superficie"
    >
      {cantidad}
    </span>
  )
}
