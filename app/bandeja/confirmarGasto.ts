'use server'

import { revalidatePath } from 'next/cache'
import { Pool } from 'pg'
import { ejecutarEnTransaccion } from '@/infra/db/ejecutarEnTransaccion'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import type { RepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import { ofrecerCrearRegla } from '@/app/bandeja/ofrecerCrearRegla'

// Raíz de composición de este Server Action (mismo patrón que `app/api/inngest/route.ts`,
// `app/dashboard/page.tsx`, `app/layout.tsx` y `app/bandeja/page.tsx`): el único lugar de este archivo
// que lee `process.env`.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

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
 * Confirma la categoría de un gasto y ofrece crear la regla del comercio como una única transacción
 * de base de datos (trabajo ad hoc, incidente real de atomicidad): antes, `ejecutarConfirmarGasto` y
 * `ofrecerCrearRegla` corrían como dos escrituras sueltas contra el mismo `pool`, y si la segunda
 * fallaba (por ejemplo, una categoría ausente en `categorias` que rompe el `NOT NULL`/FK de
 * `reglas_categoria.categoria_id`), la primera ya había hecho commit sola y el gasto quedaba con la
 * categoría actualizada (o, peor, en `NULL`) pero sin la regla pedida. `ejecutarEnTransaccion` envuelve
 * las dos escrituras en un solo `BEGIN`/`COMMIT`: si cualquiera falla, `ROLLBACK` deshace las dos.
 *
 * Recibe el `pool` por parámetro —en vez de usar directamente el de módulo— para poder testearse
 * contra `crearBasePostgresDeTest()` sin el runtime de Next.js, mismo motivo de extracción que
 * `ejecutarConfirmarGasto` arriba. Los repositorios se construyen DENTRO del callback, ligados al
 * `cliente` transaccional (`PoolClient`), no al `pool` compartido: son instancias nuevas en cada
 * llamada, no las `...Real` de módulo que este archivo tenía antes.
 */
export async function ejecutarConfirmarGastoConRegla(
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
 * El Server Action real que consume el `<form action={confirmarGasto}>` de `ListaBandeja` (T49). Lee
 * `id` y `categoria` del `FormData` que el formulario envía —siempre la categoría que la fila ya
 * mostraba, nunca una nueva (Req. 7.3)—. Delega en `ejecutarConfirmarGastoConRegla`, que confirma la
 * categoría y ofrece crear la regla del comercio si el checkbox venía marcado (Req. 7.5, 7.6, T51 —
 * `ofrecerCrearRegla` no hace nada si no, Req. 7.7, T52) como una única transacción. `revalidatePath`
 * corre solo si la transacción terminó bien, para que las dos superficies que dependen de
 * `pendientesDeConfirmacion` reflejen el cambio en la próxima carga (Req. 7.9): la bandeja misma
 * (`/bandeja`, T48) y el indicador del layout raíz (`/`, T47).
 */
export async function confirmarGasto(formData: FormData): Promise<void> {
  const id = String(formData.get('id'))
  const categoria = String(formData.get('categoria')) as Categoria
  const comercio = String(formData.get('comercio'))
  const crearRegla = formData.get('crearRegla') === 'true'

  await ejecutarConfirmarGastoConRegla(pool, id, categoria, comercio, crearRegla)

  revalidatePath('/bandeja')
  revalidatePath('/', 'layout')
}
