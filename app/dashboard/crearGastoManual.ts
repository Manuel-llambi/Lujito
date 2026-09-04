import { Pool } from 'pg'
import { ejecutarEnTransaccion } from '@/infra/db/ejecutarEnTransaccion'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import type { Gasto } from '@/infra/db/repositorioGastos'
import { dividirEnCuotas } from '@/dominio/imputacion/dividirEnCuotas'
import { mesDe } from '@/dominio/imputacion/mesDe'
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
