import type { Pool } from 'pg'
import type { Categoria, Regla } from '@/dominio/categorizacion/categorizarPorReglas'

/**
 * `design.md` no declara ningún repositorio para leer `reglas_categoria` — T33 es la primera tarea
 * que necesita traer las reglas de la base para pasárselas a `categorizarPorReglas` (T14) desde el
 * step categorizar. `listar()` devuelve **todas** las filas, activas e inactivas: el filtrado por
 * `activa` es responsabilidad de `categorizarPorReglas`, no de este repositorio (Req. 5.2).
 */
export interface RepositorioReglas {
  listar(): Promise<Regla[]>
  /**
   * Crea una regla activa desde la bandeja (Req. 7.6, T51), con `creada_por = 'usuario'` — igual que
   * las diez reglas semilla de T17, que también llevan `creada_por = 'usuario'` por ser literales del
   * diseño. `prioridad` queda en el `DEFAULT 0` de la migración de T17: la misma que las reglas
   * semilla, sin ninguna preferencia sobre ellas ni entre sí.
   */
  crear(patronComercio: string, categoria: Categoria): Promise<void>
}

interface FilaRegla {
  id: string
  patron_comercio: string
  nombre: string
  prioridad: number
  activa: boolean
}

// `Pick<Pool, 'query'>` en vez de `Pool` completo: permite construir este repositorio tanto con el
// `Pool` compartido de la aplicación como con un `PoolClient` de una transacción (`ejecutarEnTransaccion`,
// trabajo ad hoc del incidente de atomicidad en `confirmarGasto`/`corregirGasto`) — `PoolClient.query`
// tiene la misma forma que `Pool.query`, así que ninguna otra parte de este archivo necesita cambiar.
export function crearRepositorioReglas(pool: Pick<Pool, 'query'>): RepositorioReglas {
  return {
    async listar() {
      const resultado = await pool.query<FilaRegla>(
        `SELECT r.id, r.patron_comercio, c.nombre, r.prioridad, r.activa
         FROM reglas_categoria r JOIN categorias c ON c.id = r.categoria_id
         ORDER BY r.id`,
      )
      return resultado.rows.map((fila) => ({
        id: fila.id,
        patronComercio: fila.patron_comercio,
        categoria: fila.nombre as Categoria,
        prioridad: fila.prioridad,
        activa: fila.activa,
      }))
    },

    async crear(patronComercio, categoria) {
      await pool.query(
        `
        INSERT INTO reglas_categoria (patron_comercio, categoria_id, creada_por, activa)
        VALUES ($1, (SELECT id FROM categorias WHERE nombre = $2), 'usuario', true)
        `,
        [patronComercio, categoria],
      )
    },
  }
}
