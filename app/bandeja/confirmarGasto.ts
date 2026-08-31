'use server'

import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import type { RepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'

// Raíz de composición de este Server Action (mismo patrón que `app/api/inngest/route.ts`,
// `app/dashboard/page.tsx`, `app/layout.tsx` y `app/bandeja/page.tsx`): el único lugar de este archivo
// que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioGastosReal = crearRepositorioGastos(pool)
const repositorioReglasReal = crearRepositorioReglas(pool)

/**
 * Confirma un gasto con la MISMA categoría que ya tenía propuesta — nunca una elegida por el usuario,
 * eso es `corregir` (T50) (Req. 7.3). Reutiliza `RepositorioGastos.confirmar` (T23) sin reimplementar
 * el `UPDATE`: es el mismo método que corregir, con la categoría que ya trae el gasto en vez de una
 * nueva.
 *
 * Extraída fuera del Server Action real (`confirmarGasto`, abajo) para poder testearse con un
 * repositorio simulado, sin `FormData` ni el runtime de Next.js de por medio — mismo motivo que
 * `ejecutarPasoImputar` (T36) y `obtenerGastosPendientes` (T48).
 */
export async function ejecutarConfirmarGasto(
  repositorioGastos: Pick<RepositorioGastos, 'confirmar'>,
  id: string,
  categoria: Categoria,
): Promise<void> {
  await repositorioGastos.confirmar(id, categoria)
}

/**
 * El Server Action real que consume el `<form action={confirmarGasto}>` de `ListaBandeja` (T49). Lee
 * `id` y `categoria` del `FormData` que el formulario envía —siempre la categoría que la fila ya
 * mostraba, nunca una nueva (Req. 7.3)—, ofrece crear la regla del comercio si el checkbox venía
 * marcado (Req. 7.5, 7.6, T51 — `ofrecerCrearRegla` no hace nada si no, Req. 7.7, T52), y revalida las
 * dos superficies que dependen de `pendientesDeConfirmacion` para que reflejen el cambio en la próxima
 * carga (Req. 7.9): la bandeja misma (`/bandeja`, T48) y el indicador del layout raíz (`/`, T47).
 */
export async function confirmarGasto(formData: FormData): Promise<void> {
  const id = String(formData.get('id'))
  const categoria = String(formData.get('categoria')) as Categoria
  const comercio = String(formData.get('comercio'))
  const crearRegla = formData.get('crearRegla') === 'true'

  await ejecutarConfirmarGasto(repositorioGastosReal, id, categoria)
  await ofrecerCrearRegla(repositorioReglasReal, crearRegla, comercio, categoria)

  revalidatePath('/bandeja')
  revalidatePath('/', 'layout')
}
