import Decimal from 'decimal.js'
import type { DatosAviso, TipoTarjeta } from '@/dominio/parseo/parsearAvisoSantander'
import { normalizarMonto } from './normalizarMonto'
import { componerFechaGasto } from './componerFechaGasto'
import { resolverMontoTotal, INTERPRETACION_MONTO } from '@/dominio/imputacion/resolverMontoTotal'

export type ResultadoNormalizacion =
  | { ok: true; datos: GastoNormalizado }
  | { ok: false; motivo: MotivoRevision }

export type MotivoRevision =
  | 'monto_invalido' // Req. 3.5
  | 'fecha_invalida'
  | 'fecha_futura' // Req. 3.6
  | 'cuotas_invalidas' // Req. 3.7
  | 'campos_faltantes' // Req. 2.11 — declarado acá, inalcanzable desde esta función (lo produce T32)
  | 'error_de_paso' // Req. 10.2 — declarado acá, lo produce el workflow (T38)

export interface GastoNormalizado {
  montoTotal: Decimal
  moneda: 'ARS'
  comercio: string
  fechaGasto: Date // instante exacto, compuesto en zona ART  (Req. 3.3)
  tipoTarjeta: TipoTarjeta
  tarjetaUltimos4: string
  cuotasTotal: number
}

/**
 * Convierte `cuotasTexto` en la cantidad de cuotas de la compra (Req. 2.5, 3.7). `null` —la fila
 * `Cuotas` no existía en el aviso— vale `1`, la misma cuota implícita de un aviso de débito. Un
 * texto presente tiene que ser un entero mayor o igual a uno: `parseInt`/`Number` son deliberadamente
 * evitados como conversión primaria porque son laxos con formas como `'2,5'` o `''` que este
 * criterio exige rechazar, no redondear ni convertir a cero.
 */
function resolverCuotas(cuotasTexto: string | null): number | null {
  if (cuotasTexto === null) return 1
  if (!/^\d+$/.test(cuotasTexto.trim())) return null
  const cuotas = Number(cuotasTexto)
  if (!Number.isInteger(cuotas) || cuotas < 1) return null
  return cuotas
}

/**
 * Convierte los textos crudos del aviso en valores tipados y los valida (Req. 3). El orden de las
 * cuatro guardas es parte del contrato, fijado en el Decision log de T9: cuotas primero —porque
 * 8.8 multiplica por ese factor, y ninguna ubicación posterior de esa multiplicación puede alcanzarse
 * con cuotas inválidas si la guarda es la primera sentencia—, monto, fecha (formato) y fecha (futuro).
 * Solo después de las cuatro se calcula `montoTotal` con `resolverMontoTotal` (Req. 8.8).
 */
export function normalizarAviso(datos: DatosAviso, ahora: Date): ResultadoNormalizacion {
  const cuotasTotal = resolverCuotas(datos.cuotasTexto)
  if (cuotasTotal === null) {
    return { ok: false, motivo: 'cuotas_invalidas' }
  }

  const montoDelAviso = normalizarMonto(datos.montoTexto)
  if (montoDelAviso === null || montoDelAviso.lessThanOrEqualTo(0)) {
    return { ok: false, motivo: 'monto_invalido' }
  }

  const fechaGasto = componerFechaGasto(datos.fechaTexto, datos.horaTexto)
  if (fechaGasto === null) {
    return { ok: false, motivo: 'fecha_invalida' }
  }

  if (fechaGasto.getTime() > ahora.getTime()) {
    return { ok: false, motivo: 'fecha_futura' }
  }

  const montoTotal = resolverMontoTotal(montoDelAviso, cuotasTotal, INTERPRETACION_MONTO) // Req. 8.8

  return {
    ok: true,
    datos: {
      montoTotal,
      moneda: 'ARS',
      comercio: datos.comercio,
      fechaGasto,
      tipoTarjeta: datos.tipoTarjeta,
      tarjetaUltimos4: datos.tarjetaUltimos4,
      cuotasTotal,
    },
  }
}
