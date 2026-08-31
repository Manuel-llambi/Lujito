import type { Gasto, RepositorioGastos } from '@/infra/db/repositorioGastos'

/**
 * El contenedor real de `/bandeja` (Req. 7.2): reenvía exactamente lo que devuelve
 * `pendientesDeConfirmacion` (T23), sin filtrar ni recalcular nada acá — la identidad de esta función
 * es en sí misma la aserción de "el contenedor no filtra ni recalcula nada por su cuenta" que exige el
 * criterio de aceptación. Extraída de `page.tsx` para poder testearse sin un Server Component de
 * Next.js de por medio, mismo motivo que `obtenerFilasDashboard` (T43) y `obtenerCantidadPendientes`
 * (T47).
 */
export async function obtenerGastosPendientes(
  repositorioGastos: Pick<RepositorioGastos, 'pendientesDeConfirmacion'>,
): Promise<Gasto[]> {
  return repositorioGastos.pendientesDeConfirmacion()
}
