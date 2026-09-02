import type Decimal from 'decimal.js'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'

/**
 * Campos que toda regla de hallazgo resuelve en el mismo cómputo que produce el hallazgo (Req. 4.1),
 * antes de solicitar cualquier redacción al modelo. Sirven de respaldo cuando la redacción con IA
 * falla o no llega a tiempo (Req. 4.3).
 */
export interface CampoRedactable {
  textoRespaldo: string
  recomendacionRespaldo: string
}

export interface HallazgoCategoriaDominante extends CampoRedactable {
  tipo: 'categoriaDominante'
  categoria: Categoria
  totalCategoria: Decimal
  totalMes: Decimal
  porcentaje: number // 0–100, redondeado
}

export interface HallazgoVariacionCategoria extends CampoRedactable {
  tipo: 'variacionCategoria'
  categoria: Categoria
  totalMesFoco: Decimal
  totalMesAnterior: Decimal
  variacionPct: number | null // null cuando totalMesAnterior es 0 (categoría nueva este mes)
}

export interface HallazgoRitmoGasto extends CampoRedactable {
  tipo: 'ritmoGasto'
  totalHastaHoyMesFoco: Decimal
  promedioHastaMismoDiaMesesAnteriores: Decimal
  variacionPct: number | null
  mesesConsiderados: number
}

export interface HallazgoComercioRecurrente extends CampoRedactable {
  tipo: 'comercioRecurrente'
  comercio: string
  cantidadGastos: number
  totalComercio: Decimal
}

export type Hallazgo =
  | HallazgoCategoriaDominante
  | HallazgoVariacionCategoria
  | HallazgoRitmoGasto
  | HallazgoComercioRecurrente
