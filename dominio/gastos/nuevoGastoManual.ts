import type Decimal from 'decimal.js'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'

/**
 * La forma real de un alta manual (Req. 4.1, T2, `design.md` — "Componentes e interfaces"): monto,
 * comercio, fecha y categoría, nada más. A diferencia de `GastoNormalizado` (la forma que produce el
 * parser de emails), no lleva `tipoTarjeta` ni `cuotasTotal` — un alta manual no tiene tarjeta ni
 * cuotas, y forzarla a esa forma exigiría inventar datos de tarjeta inexistentes.
 */
export interface NuevoGastoManual {
  montoTotal: Decimal // > 0, validado por normalizarMonto antes de llegar acá (Req. 2.1, 3.1)
  comercio: string // no vacío, validado en el Server Action (Req. 2.2, 3.2)
  fechaGasto: Date // default hoy en el form; mesDe aplica la zona horaria (Req. 2.3)
  categoria: Categoria // uno de CATEGORIAS_MANUAL (Req. 2.4, 2.5)
}
