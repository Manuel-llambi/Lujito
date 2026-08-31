import type { RepositorioGastos } from '@/infra/db/repositorioGastos'

/**
 * Cuenta los gastos pendientes de confirmación para el indicador in-app (Req. 7.1). Reutiliza
 * `pendientesDeConfirmacion` (T23) sin redefinir su filtro —origen `ia`, sin confirmar, fuera de
 * `needs_review`—: la cantidad es exactamente el tamaño de esa lista, nunca una consulta propia.
 *
 * Extraída para poder testearse con un repositorio simulado, sin `layout.tsx` (Server Component de
 * Next.js) ni Postgres de por medio — mismo motivo que `obtenerFilasDashboard` (T43).
 */
export async function obtenerCantidadPendientes(
  repositorioGastos: Pick<RepositorioGastos, 'pendientesDeConfirmacion'>,
): Promise<number> {
  const pendientes = await repositorioGastos.pendientesDeConfirmacion()
  return pendientes.length
}
