import { TZDate } from '@date-fns/tz'
import { Pool } from 'pg'
import { ejecutarEnTransaccion } from '@/infra/db/ejecutarEnTransaccion'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import type { Gasto } from '@/infra/db/repositorioGastos'
import { dividirEnCuotas } from '@/dominio/imputacion/dividirEnCuotas'
import { mesDe } from '@/dominio/imputacion/mesDe'
import { ZONA_REFERENCIA } from '@/dominio/normalizacion/componerFechaGasto'
import { normalizarMonto } from '@/dominio/normalizacion/normalizarMonto'
import { CATEGORIAS_MANUAL, type Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { NuevoGastoManual } from '@/dominio/gastos/nuevoGastoManual'

/**
 * Orquesta crear + imputar + marcar imputado dentro de una única transacción (Req. 4.1–4.4, T3),
 * testeable contra `crearBasePostgresDeTest()` sin `FormData` ni el runtime de Next.js, mismo patrón
 * que `ejecutarConfirmarGastoConRegla` (`app/bandeja/confirmarGasto.ts`). `RepositorioGastos` se
 * construye DENTRO del callback, ligado al `cliente` transaccional (`PoolClient`), nunca al `pool`
 * compartido.
 *
 * La imputación se inserta con una query directa contra el `cliente` transaccional, no vía
 * `RepositorioImputaciones.reemplazarPara` (ver Decision log de esta tarea en `tasks.md` y la
 * decisión de diseño equivalente en `design.md`): `reemplazarPara` abre su propia conexión/
 * transacción interna (`pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`/`release()`) y
 * `crearRepositorioImputaciones` está tipado contra un `pg.Pool` completo, no contra
 * `Pick<Pool, 'query'>` como `crearRepositorioGastos` — no es componible dentro de esta transacción
 * externa (el `PoolClient` ni siquiera tipa como `Pool`, y forzado con un cast falla en runtime:
 * `Client.prototype.connect()` sobre un cliente ya conectado lanza
 * `'Client has already been connected. You cannot reuse a client.'`). Un gasto recién creado nunca
 * tiene imputaciones previas, así que el `DELETE` que hace `reemplazarPara` antes de insertar sería
 * un no-op de todos modos.
 */
export async function ejecutarCrearGastoManual(pool: Pool, datos: NuevoGastoManual): Promise<Gasto> {
  return ejecutarEnTransaccion(pool, async (cliente) => {
    const repositorioGastos = crearRepositorioGastos(cliente)

    const gasto = await repositorioGastos.crearManual(datos)
    const [monto] = dividirEnCuotas(datos.montoTotal, 1) // siempre una sola cuota (fuera de alcance: cuotas)
    await cliente.query(
      'INSERT INTO imputaciones (gasto_id, numero_cuota, monto, mes) VALUES ($1, $2, $3, $4)',
      [gasto.id, 1, monto!.toString(), mesDe(datos.fechaGasto)],
    )
    await repositorioGastos.marcarImputado(gasto.id)

    // `design.md` retorna `gasto` tal cual, pero ese objeto quedó capturado ANTES de
    // `marcarImputado` — su `estado` seguiría en `'categorizado'` en memoria aunque la fila ya esté
    // en `'imputado'` en la base (hallazgo real de este ciclo TDD, no una suposición: el test rojo de
    // 4.3 lo detectó). Corregido acá, sin una segunda consulta: se conoce exactamente qué cambió.
    return { ...gasto, estado: 'imputado' }
  })
}

const PATRON_FECHA_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parsea el valor de un `<input type="date">` (`AAAA-MM-DD`, Req. 2.3) como una hora de pared en
 * `ZONA_REFERENCIA` — mismo espíritu que `componerFechaGasto` (Req. 3.3 del spec de pipeline por
 * email): construirla con `TZDate` en vez de `new Date('AAAA-MM-DD')` evita que `mesDe` (que SÍ lee
 * la hora en `ZONA_REFERENCIA`) calcule el mes anterior para el día 1 de un mes — `new Date` sobre un
 * string de solo fecha se interpreta como medianoche UTC, que son las 21:00 del día anterior en
 * Buenos Aires (UTC-3). Devuelve `null` si el texto no tiene forma `AAAA-MM-DD`.
 */
function parsearFechaInput(texto: string): Date | null {
  const coincidencia = PATRON_FECHA_INPUT.exec(texto)
  if (!coincidencia) {
    return null
  }
  const [, anioTexto, mesTexto, diaTexto] = coincidencia
  const instante = new TZDate(Number(anioTexto), Number(mesTexto) - 1, Number(diaTexto), 12, 0, 0, ZONA_REFERENCIA)
  return new Date(instante.getTime())
}

function esCategoriaManual(valor: string): valor is (typeof CATEGORIAS_MANUAL)[number] {
  return (CATEGORIAS_MANUAL as readonly string[]).includes(valor)
}

/**
 * Valida el `FormData` del alta manual y arma el `NuevoGastoManual` listo para
 * `ejecutarCrearGastoManual` (Req. 2.1, 2.2, 2.4, 3.1, 3.2, 3.3; T4). Función pura: no recibe ni toca
 * ningún repositorio ni `Pool`, así que la garantía de "ningún dato queda escrito" ante un error de
 * validación (Req. 3.4, mitad de validación) queda probada por construcción — la mitad de rollback
 * transaccional ante una falla a mitad de la transacción ya iniciada la cubre `ejecutarCrearGastoManual`
 * (T3). Ante el primer campo inválido devuelve `{ error }` sin seguir validando los siguientes, en el
 * orden monto → comercio → categoría que fija `tasks.md` (T4).
 */
export function validarDatosGastoManual(formData: FormData): { datos: NuevoGastoManual } | { error: string } {
  const montoTexto = String(formData.get('monto') ?? '')
  const monto = normalizarMonto(montoTexto)
  if (monto === null || !monto.greaterThan(0)) {
    return { error: 'Ingresá un monto válido y mayor a cero, en formato ARS (ej. $1.234,56).' }
  }

  const comercio = String(formData.get('comercio') ?? '').trim()
  if (comercio === '') {
    return { error: 'Ingresá el nombre del comercio.' }
  }

  const categoriaTexto = String(formData.get('categoria') ?? '')
  if (!esCategoriaManual(categoriaTexto)) {
    return { error: 'Elegí una categoría (Salidas, Comida o Extras).' }
  }
  const categoria = categoriaTexto as Categoria

  const fechaTexto = String(formData.get('fecha') ?? '')
  const fechaGasto = parsearFechaInput(fechaTexto) ?? new Date()

  return { datos: { montoTotal: monto, comercio, fechaGasto, categoria } }
}

/**
 * `useActionState(crearGastoManual, null)` en `ModalNuevoGasto` (T5) usa esta forma: `null` es "sin
 * error" (éxito o estado inicial), `{ error }` es el mensaje a mostrar inline sin cerrar el modal.
 */
export type EstadoFormularioGastoManual = { error: string } | null
