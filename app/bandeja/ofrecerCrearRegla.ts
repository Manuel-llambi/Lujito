import type { Categoria } from '@/dominio/categorizacion/categorizarPorReglas'
import type { RepositorioReglas } from '@/infra/db/repositorioReglas'

/**
 * Ejecuta el ofrecimiento de crear la regla del comercio (Req. 7.5, 7.6, T51): si el usuario lo
 * aceptó, persiste la regla con `RepositorioReglas.crear` (T51); si lo rechazó, no hace nada — ninguna
 * fila nueva en `reglas_categoria` (Req. 7.7, T52). El "sí"/"no" ya viene decidido por el llamador
 * (el checkbox del formulario, T51); esta función solo actúa sobre esa decisión, sin conocer FormData
 * ni Next.js — mismo motivo de extracción que `ejecutarConfirmarGasto` (T49).
 */
export async function ofrecerCrearRegla(
  repositorioReglas: Pick<RepositorioReglas, 'crear'>,
  aceptado: boolean,
  patronComercio: string,
  categoria: Categoria,
): Promise<void> {
  if (!aceptado) {
    return
  }
  await repositorioReglas.crear(patronComercio, categoria)
}
