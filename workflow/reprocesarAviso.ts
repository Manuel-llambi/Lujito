import { inngest } from '@/workflow/clienteInngest'
import type { DependenciasProcesarAviso } from '@/workflow/procesarAviso'
import { ejecutarPasoCategorizar, ejecutarPasoImputar } from '@/workflow/procesarAviso'
import { decodificarQuotedPrintable } from '@/dominio/parseo/decodificarQuotedPrintable'
import { parsearAvisoSantander } from '@/dominio/parseo/parsearAvisoSantander'
import { normalizarAviso } from '@/dominio/normalizacion/normalizarAviso'

/**
 * Subconjunto de `DependenciasProcesarAviso` sin `clienteGmail` ni `reintentos` (Req. 10.3): Gmail es
 * estructuralmente inalcanzable desde este módulo, igual que `RepositorioEmails.traerCrudo` (T21) —
 * ningún objeto que se le pase puede tener un campo `clienteGmail` porque el tipo no lo declara, así
 * que "sin volver a Gmail" es una garantía de compilación, no un chequeo en tiempo de ejecución.
 */
export type DependenciasReprocesarAviso = Omit<DependenciasProcesarAviso, 'clienteGmail' | 'reintentos'>

/**
 * Evento que dispara el reprocesamiento (Req. 10.3). `emailId` es el `id` de `emails_crudos` — el
 * mismo que recibe `RepositorioEmails.traerCrudo` (T21) —, no el `gmail_message_id` del evento
 * `aviso/recibido`. `gastoExistenteId` es el `id` del gasto en `needs_review` que dejó una corrida
 * anterior (T32); se lo pasa el operador que invoca esta función desde el panel de Inngest, porque
 * `design.md` no expone ningún método de `RepositorioGastos` para buscar un gasto por `emailId` — la
 * decisión de diseño del 2026-08-29 que desbloqueó T40 agregó `actualizarDatos(id, datos)`, no un
 * método de búsqueda. Sin `gastoExistenteId`, el reprocesamiento trata el email como si nunca hubiera
 * producido un gasto (Req. 10.3, escenario "sin gasto previo").
 */
export interface EventoReprocesarAviso {
  emailId: string
  gastoExistenteId?: string
}

/**
 * Workflow durable que reprocesa un email crudo ya almacenado, sin volver a Gmail (Req. 10.3): toma
 * el cuerpo con `RepositorioEmails.traerCrudo` (T21) y vuelve a correr el pipeline desde la
 * extracción. Invocable a mano desde el panel de Inngest (`design.md`, sección "Superficie visual"),
 * no desde la app — no hay ninguna pantalla que dispare este evento.
 *
 * - **extraer**: mismo parseo/normalización que el step homónimo de `procesarAviso` (T30-T32), pero
 *   la rama de persistencia se bifurca según `gastoExistenteId`. Sin él, se comporta exactamente
 *   igual que la primera corrida: `crear` en el camino válido, `crearParaRevision` en `aviso_ilegible`
 *   o `normalizarAviso` inválido (Req. 10.3, "sin gasto previo"). Con él, nunca inserta: el camino
 *   válido llama a `actualizarDatos` (T40) y los caminos de error llaman a `marcarParaRevision` —
 *   ambos son `UPDATE` sobre la fila que ya existe, así que `email_id` nunca ve un segundo `INSERT`
 *   (Req. 10.3, "gasto ya existe", sin violar la unicidad de T18).
 * - **categorizar** e **imputar**: mismas funciones puras de step que `procesarAviso` (`ejecutarPasoCategorizar`,
 *   T33-T35; `ejecutarPasoImputar`, T36), reutilizadas sin duplicar su lógica. `ejecutarPasoImputar`
 *   llama a `RepositorioImputaciones.reemplazarPara` (T19, `DELETE` + `INSERT` transaccional), que ya
 *   es idempotente (T37) — así que invocarlo de nuevo sobre el mismo gasto nunca duplica imputaciones,
 *   sin importar cuántas veces se reprocese el mismo email (Req. 10.3, tercer criterio).
 */
export function crearFuncionReprocesarAviso({
  repositorioEmails,
  repositorioGastos,
  repositorioReglas,
  repositorioImputaciones,
  clienteIA,
}: DependenciasReprocesarAviso) {
  return inngest.createFunction(
    { id: 'reprocesar-aviso', triggers: [{ event: 'aviso/reprocesar' }] },
    async ({ event, step }) => {
      const { emailId, gastoExistenteId } = event.data as EventoReprocesarAviso

      const extraido = await step.run('extraer', async () => {
        const email = await repositorioEmails.traerCrudo(emailId) // sin ClienteGmail: Gmail es inalcanzable
        const html = decodificarQuotedPrintable(email.cuerpo)
        const parseo = parsearAvisoSantander(html)

        if (parseo.tipo === 'no_es_aviso') {
          await repositorioEmails.marcarDescartado(emailId) // Req. 4.1, 4.2 — idempotente (T21)
          return null
        }

        if (parseo.tipo === 'aviso_ilegible') {
          if (gastoExistenteId) {
            await repositorioGastos.marcarParaRevision(gastoExistenteId, 'campos_faltantes', null)
          } else {
            await repositorioGastos.crearParaRevision(emailId, 'campos_faltantes', {})
          }
          return null
        }

        const normalizado = normalizarAviso(parseo.datos, new Date())
        if (!normalizado.ok) {
          if (gastoExistenteId) {
            await repositorioGastos.marcarParaRevision(gastoExistenteId, normalizado.motivo, null)
          } else {
            await repositorioGastos.crearParaRevision(emailId, normalizado.motivo, {})
          }
          return null
        }

        if (gastoExistenteId) {
          // Req. 10.3: UPDATE sobre la fila que ya existe — nunca un segundo `crear` que violaría la
          // unicidad de `email_id` (T18).
          await repositorioGastos.actualizarDatos(gastoExistenteId, normalizado.datos)
          return { gastoId: gastoExistenteId, comercio: normalizado.datos.comercio }
        }

        const gasto = await repositorioGastos.crear(normalizado.datos, emailId)
        return { gastoId: gasto.id, comercio: normalizado.datos.comercio }
      })

      if (extraido === null) {
        return { emailId }
      }

      await step.run('categorizar', () =>
        ejecutarPasoCategorizar(extraido.gastoId, extraido.comercio, {
          repositorioReglas,
          repositorioGastos,
          clienteIA,
        }),
      )

      await step.run('imputar', () =>
        ejecutarPasoImputar(extraido.gastoId, { repositorioGastos, repositorioImputaciones }),
      )

      return { emailId, gastoId: extraido.gastoId }
    },
  )
}
