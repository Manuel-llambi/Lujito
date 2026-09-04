'use server'

import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'
import { ejecutarEnTransaccion } from '@/infra/db/ejecutarEnTransaccion'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import { ejecutarConfirmarGasto } from '@/app/bandeja/confirmarGasto'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'

// Raíz de composición de este Server Action (mismo patrón que `app/bandeja/confirmarGasto.ts`): el
// único lugar de este archivo que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/**
 * Corrige la categoría de un gasto y ofrece crear la regla del comercio como una única transacción de
 * base de datos (trabajo ad hoc, incidente real de atomicidad): antes, `ejecutarConfirmarGasto` y
 * `ofrecerCrearRegla` corrían como dos escrituras sueltas contra el mismo `pool`, y si la segunda
 * fallaba (por ejemplo, una categoría ausente en `categorias` que rompe el `NOT NULL`/FK de
 * `reglas_categoria.categoria_id`), la primera ya había hecho commit sola y el gasto quedaba con la
 * categoría corregida (o, peor, en `NULL`) pero sin la regla pedida. `ejecutarEnTransaccion` envuelve
 * las dos escrituras en un solo `BEGIN`/`COMMIT`: si cualquiera falla, `ROLLBACK` deshace las dos.
 *
 * Recibe el `pool` por parámetro —en vez de usar directamente el de módulo— para poder testearse
 * contra `crearBasePostgresDeTest()` sin el runtime de Next.js, mismo motivo de extracción que
 * `ejecutarConfirmarGasto`. Los repositorios se construyen DENTRO del callback, ligados al `cliente`
 * transaccional (`PoolClient`), no al `pool` compartido: son instancias nuevas en cada llamada, no las
 * `...Real` de módulo que este archivo tenía antes.
 */
export async function ejecutarCorregirGastoConRegla(
  pool: Pool,
  id: string,
  categoria: Categoria,
  comercio: string,
  crearRegla: boolean,
): Promise<void> {
  await ejecutarEnTransaccion(pool, async (cliente) => {
    const repositorioGastos = crearRepositorioGastos(cliente)
    const repositorioReglas = crearRepositorioReglas(cliente)
    await ejecutarConfirmarGasto(repositorioGastos, id, categoria)
    await ofrecerCrearRegla(repositorioReglas, crearRegla, comercio, categoria)
  })
}

/**
 * El Server Action real que consume el `<form action={corregirGasto}>` de `ListaBandeja` (T50). A
 * diferencia de `confirmarGasto` (T49), `categoria` viene de un `<select>` que el usuario elige —nunca
 * de la categoría que la fila ya mostraba (Req. 7.4)—. Delega en `ejecutarCorregirGastoConRegla`, que
 * corrige la categoría y ofrece crear la regla del comercio (Req. 7.5, 7.6, T51/T52) como una única
 * transacción sobre el `pool` de módulo (trabajo ad hoc, incidente real de atomicidad): las dos
 * escrituras quedan las dos o ninguna. `revalidatePath` corre solo si la transacción terminó bien —si
 * `ejecutarCorregirGastoConRegla` rechaza, la excepción se propaga tal cual y nunca llega acá. Revalida
 * las mismas dos superficies que `confirmarGasto` (Req. 7.9, aplica igual a la corrección: el gasto
 * también sale de la bandeja al corregir).
 */
export async function corregirGasto(formData: FormData): Promise<void> {
  const id = String(formData.get('id'))
  const categoria = String(formData.get('categoria')) as Categoria
  const comercio = String(formData.get('comercio'))
  const crearRegla = formData.get('crearRegla') === 'true'

  await ejecutarCorregirGastoConRegla(pool, id, categoria, comercio, crearRegla)

  revalidatePath('/bandeja')
  revalidatePath('/', 'layout')
}
