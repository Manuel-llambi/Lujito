'use server'

import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import { ejecutarConfirmarGasto } from '@/app/bandeja/confirmarGasto'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'

// Raíz de composición de este Server Action (mismo patrón que `app/bandeja/confirmarGasto.ts`): el
// único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioGastosReal = crearRepositorioGastos(pool)
const repositorioReglasReal = crearRepositorioReglas(pool)

/**
 * El Server Action real que consume el `<form action={corregirGasto}>` de `ListaBandeja` (T50). A
 * diferencia de `confirmarGasto` (T49), `categoria` viene de un `<select>` que el usuario elige —nunca
 * de la categoría que la fila ya mostraba (Req. 7.4)—. Reutiliza `ejecutarConfirmarGasto` (T49) sin
 * reimplementar nada: `confirmar` y `corregir` son el mismo `UPDATE` de `RepositorioGastos.confirmar`
 * (T23), con la categoría viniendo de un origen distinto en cada caso. Ofrece crear la regla igual que
 * `confirmarGasto` (Req. 7.5, 7.6, T51/T52) y revalida las mismas dos superficies (Req. 7.9, aplica
 * igual a la corrección: el gasto también sale de la bandeja al corregir).
 */
export async function corregirGasto(formData: FormData): Promise<void> {
  const id = String(formData.get('id'))
  const categoria = String(formData.get('categoria')) as Categoria
  const comercio = String(formData.get('comercio'))
  const crearRegla = formData.get('crearRegla') === 'true'

  await ejecutarConfirmarGasto(repositorioGastosReal, id, categoria)
  await ofrecerCrearRegla(repositorioReglasReal, crearRegla, comercio, categoria)

  revalidatePath('/bandeja')
  revalidatePath('/', 'layout')
}
