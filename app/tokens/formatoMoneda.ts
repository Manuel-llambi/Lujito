/**
 * Formatea un número ya resuelto como moneda para mostrarlo ("$ 452.300,00"): separador de miles `.`,
 * decimales `,` — la convención `es-AR`. Trabajo ad hoc de la reconstrucción visual de `/dashboard`
 * (mockup Stitch), no un cómputo del dominio: la entrada ya es el total final, esto solo decide cómo
 * se ve un string. El invariante de "nunca punto flotante" del dominio aplica al cálculo (`Decimal`,
 * `numeric`), no a este paso de presentación puramente cosmético.
 */
export function formatearMoneda(valor: number): string {
  const formateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

  return `$ ${formateado}`
}
