'use server'

import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'
import { ejecutarCrearGastoManual, validarDatosGastoManual } from '@/app/dashboard/crearGastoManual'
import type { EstadoFormularioGastoManual } from '@/app/dashboard/crearGastoManual'

export type { EstadoFormularioGastoManual }

// Raíz de composición del Server Action de este archivo (mismo patrón que
// `app/bandeja/confirmarGasto.ts`): el único lugar de este archivo que lee `process.env`.
//
// Archivo separado de `crearGastoManual.ts` (a diferencia de `confirmarGasto.ts`/`corregirGasto.ts`,
// que tienen el Server Action y su lógica en el mismo archivo): un archivo con `'use server'` a nivel
// de archivo solo puede exportar Server Functions (funciones async) — ver
// `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md`, sección "Using
// Server Functions in a Client Component". `validarDatosGastoManual` (`crearGastoManual.ts`) es
// deliberadamente síncrona y pura (Req. 3.4: probada por construcción, sin `Pool` de por medio) — no
// puede convivir en un archivo `'use server'`. La directiva `'use server'` INLINE al tope del cuerpo
// de la función (como tenía antes esta acción) tampoco alcanza acá: esa forma solo aplica a una
// función definida DENTRO de un Server Component y pasada como prop a un Client Component (ver
// ejemplo `updatePostAction` de esa misma guía) — no a una función exportada e importada directo por
// un Client Component, que es exactamente lo que hace `ModalNuevoGasto` (`'use client'`) con
// `crearGastoManual`. De ahí el error real en `next dev`: "Using Server Functions in a Client
// Component" exige la directiva al tope del archivo dedicado, no inline.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/**
 * El Server Action real que consume `<form action={crearGastoManual}>` vía `useActionState` en
 * `ModalNuevoGasto` (T5, Req. 5.1). Valida con `validarDatosGastoManual`; si falla, retorna
 * `{ error }` sin invocar `ejecutarCrearGastoManual` (Req. 3.4). Si valida, delega la creación
 * transaccional en `ejecutarCrearGastoManual` (T3) y, solo si esa llamada resuelve, revalida
 * `/dashboard` (donde se ve el gasto nuevo) y `/` en modo `layout` (mismo alcance de revalidación que
 * `confirmarGasto`, por si algún indicador del layout raíz depende de datos de gastos) y retorna
 * `null` para que `ModalNuevoGasto` cierre el modal.
 *
 * Sin test unitario dedicado a esta función en sí (mismo criterio que `confirmarGasto`/`corregirGasto`,
 * documentado en el Decision log de T49 del spec `2026-08-25-pipeline-gastos-email`: revalidar rutas es
 * responsabilidad del framework, no lógica de este proyecto) — su comportamiento de negocio observable
 * queda cubierto por los tests de `validarDatosGastoManual` y `ejecutarCrearGastoManual`
 * (T3/T4, `crearGastoManual.test.ts`).
 */
export async function crearGastoManual(
  _estadoPrevio: EstadoFormularioGastoManual,
  formData: FormData,
): Promise<EstadoFormularioGastoManual> {
  const resultado = validarDatosGastoManual(formData)
  if ('error' in resultado) {
    return resultado
  }

  await ejecutarCrearGastoManual(pool, resultado.datos)

  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  return null
}
