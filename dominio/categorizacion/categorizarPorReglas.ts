export type Categoria = 'Salidas' | 'Comida' | 'Extras' | 'Sin categorizar' | 'Descartar'

// Categorías que la regla o la IA pueden asignar de verdad. "Sin categorizar" es el destino de
// falla de la inferencia (Req. 6.1) — nunca algo que una regla asigne (Req. 5.1). "Descartar" queda
// afuera a propósito: es un destino exclusivamente manual (trabajo ad hoc, feature "Descartar"), así
// que ni una regla ni la IA pueden proponerlo — solo un humano lo elige al corregir en /bandeja.
export const CATEGORIAS_INFERIBLES = ['Salidas', 'Comida', 'Extras'] as const

// Categorías que un humano puede elegir manualmente al corregir un gasto en /bandeja (trabajo ad
// hoc, feature "Descartar"). Superset de `CATEGORIAS_INFERIBLES` más "Descartar": a diferencia de
// esa lista, esta SÍ incluye el destino manual-only, porque el selector de corrección ofrece una
// opción que una regla o la IA nunca podrían haber propuesto solas. "Sin categorizar" sigue sin
// aparecer en ninguna de las dos: no es algo que se elija, es la ausencia de propuesta.
export const CATEGORIAS_CORREGIBLES = [...CATEGORIAS_INFERIBLES, 'Descartar'] as const

export interface Regla {
  id: string
  patronComercio: string
  categoria: Categoria
  prioridad: number
  activa: boolean
}

// Rango Unicode de las marcas diacríticas combinantes (acentos) que deja `normalize('NFD')` al
// descomponer una letra acentuada en letra base + marca.
const MARCAS_DIACRITICAS = /[̀-ͯ]/g

/**
 * Normaliza texto para la comparación por contención (Req. 5.7): mayúsculas, sin acentos,
 * espacios consecutivos colapsados.
 */
function normalizar(texto: string): string {
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Decide la categoría por regla, de forma determinista y sin IA (Req. 5). Devuelve la regla que
 * coincide —no la categoría, para que el llamador registre la trazabilidad— o `null` cuando ninguna
 * coincide, señal de derivar a inferencia (Req. 5.4). El patrón se compara como texto literal, nunca
 * como expresión regular: nunca lanza, aunque el patrón tenga metacaracteres.
 */
export function categorizarPorReglas(comercio: string, reglas: readonly Regla[]): Regla | null {
  const comercioNormalizado = normalizar(comercio)

  // Filtrar precede a ordenar (Req. 5.2): una regla inactiva no compite aunque su patrón coincida
  // y aunque tenga mayor prioridad que una activa. Se opera sobre una copia: esta función no muta
  // el arreglo que recibe el llamador (T33 reutiliza las reglas leídas del repositorio).
  const coincidentes = reglas.filter(
    (regla) => regla.activa && comercioNormalizado.includes(normalizar(regla.patronComercio)),
  )

  if (coincidentes.length === 0) {
    return null
  }

  // Prioridad descendente (Req. 5.6, el número mayor gana); ante empate, desempata por `id` menor
  // (Req. 5.5), para que el resultado sea independiente del orden de entrada.
  const [ganadora] = [...coincidentes].sort((a, b) => {
    if (a.prioridad !== b.prioridad) {
      return b.prioridad - a.prioridad
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })

  return ganadora ?? null
}
