export type NombreCategoria = 'Salidas' | 'Comida' | 'Extras' | 'Sin categorizar'

/**
 * Un color estable por categoría, en todo el sistema (Req. 9.2, design.md — "una categoría, un color
 * estable en todo el sistema: el color de `Comida` es el mismo en el gráfico, en la bandeja y en el
 * indicador de pendientes"). Los componentes usan estas clases de utilidad —generadas por Tailwind a
 * partir de las variables `--color-categoria-*` que declara `app/globals.css`— y nunca un color
 * literal embebido. Este módulo es la única fuente de verdad; las pantallas futuras (bandeja,
 * indicador de pendientes) lo importan sin redeclararlo.
 */
export const CLASE_COLOR_CATEGORIA: Record<NombreCategoria, string> = {
  Salidas: 'bg-categoria-salidas',
  Comida: 'bg-categoria-comida',
  Extras: 'bg-categoria-extras',
  'Sin categorizar': 'bg-categoria-sin-categorizar',
}

/**
 * La misma variable CSS que declara `app/globals.css`, para los pocos casos donde una clase de
 * utilidad no alcanza (Decision log de la reconstrucción visual de `/dashboard`, trabajo ad hoc: el
 * gráfico de torta arma un `conic-gradient` en `style`, que no puede consumir una clase Tailwind).
 * Sigue siendo este módulo el único lugar que conoce la categoría→color — nunca un hex literal.
 */
export const VARIABLE_COLOR_CATEGORIA: Record<NombreCategoria, string> = {
  Salidas: '--color-categoria-salidas',
  Comida: '--color-categoria-comida',
  Extras: '--color-categoria-extras',
  'Sin categorizar': '--color-categoria-sin-categorizar',
}
