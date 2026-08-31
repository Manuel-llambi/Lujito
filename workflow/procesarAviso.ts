import { inngest } from '@/workflow/clienteInngest'
import type { RepositorioEmails } from '@/infra/db/repositorioEmails'
import type { RepositorioGastos } from '@/infra/db/repositorioGastos'
import type { RepositorioReglas } from '@/infra/db/repositorioReglas'
import type { RepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import type { ClienteGmail } from '@/infra/gmail/clienteGmail'
import type { ClienteIA } from '@/infra/ia/inferirCategoria'
import { decodificarQuotedPrintable } from '@/dominio/parseo/decodificarQuotedPrintable'
import { parsearAvisoSantander } from '@/dominio/parseo/parsearAvisoSantander'
import { normalizarAviso } from '@/dominio/normalizacion/normalizarAviso'
import { categorizarPorReglas } from '@/dominio/categorizacion/categorizarPorReglas'
import { inferirCategoria } from '@/infra/ia/inferirCategoria'
import { dividirEnCuotas } from '@/dominio/imputacion/dividirEnCuotas'
import { calcularMesesDeImputacion } from '@/dominio/imputacion/calcularMesesDeImputacion'
import { esUltimoIntento } from '@/workflow/esUltimoIntento'

/** Mismo tipo literal que exige `createFunction({ retries })` — 0 a 20, nunca un `number` genérico. */
type Reintentos = NonNullable<Parameters<typeof inngest.createFunction>[0]['retries']>

/** Total de intentos que Inngest le da a esta función antes de dejar de reintentar (1 inicial + 3
 * reintentos), con la espera creciente que es la política por defecto de la plataforma (Req. 10.1). */
const REINTENTOS: Reintentos = 3

export interface DependenciasProcesarAviso {
  repositorioEmails: RepositorioEmails
  clienteGmail: ClienteGmail
  repositorioGastos: RepositorioGastos
  repositorioReglas: RepositorioReglas
  repositorioImputaciones: RepositorioImputaciones
  clienteIA: ClienteIA
  /** Sobrescribe `REINTENTOS` (Decision log de T38): existe para que el test de wiring pueda forzar
   * `maxAttempts: 1` y ejercitar la rama de "último intento" sin simular reintentos reales de
   * Inngest contra el harness. Nadie más lo pasa — la raíz de composición usa el default. */
  reintentos?: Reintentos
}

/**
 * El cuerpo del step categorizar (T33-T35), extraído a una función invocable directamente — mismo
 * motivo que `ejecutarPasoImputar` (T37): T40 necesita re-ejecutar categorizar sobre el gasto que
 * `extraer` acaba de crear o actualizar al reprocesar un email, sin duplicar esta lógica inline en un
 * segundo `step.run`. `categorizarPorReglas` (T14) decide sin IA; si ninguna regla coincide,
 * `inferirCategoria` (T27, T28) resuelve categoría, abstención o falla en una sola rama de destino
 * (Req. 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.7).
 */
export async function ejecutarPasoCategorizar(
  gastoId: string,
  comercio: string,
  {
    repositorioReglas,
    repositorioGastos,
    clienteIA,
  }: Pick<DependenciasProcesarAviso, 'repositorioReglas' | 'repositorioGastos' | 'clienteIA'>,
): Promise<void> {
  const reglas = await repositorioReglas.listar()
  const regla = categorizarPorReglas(comercio, reglas) // Req. 5.4

  if (regla) {
    // Req. 5.3, 6.2: el modelo no se invoca cuando una regla coincide.
    await repositorioGastos.asignarCategoria(gastoId, regla.categoria, 'regla', null)
    return
  }

  const inferencia = await inferirCategoria(comercio, clienteIA)
  if (inferencia) {
    // Req. 6.3, 6.6: origen ia, sin confirmar, justificación persistida.
    await repositorioGastos.asignarCategoria(gastoId, inferencia.categoria, 'ia', inferencia.justificacion)
    return
  }

  // Req. 6.4, 6.5, 6.7: fuera de enum, reintentos agotados o abstención — misma rama, sin categoría
  // propuesta, y el pipeline no se frena.
  await repositorioGastos.asignarCategoria(gastoId, 'Sin categorizar', 'ia', null)
}

/**
 * El cuerpo del step imputar (T36), extraído a una función invocable directamente — no solo desde
 * adentro de `step.run` — porque T37 necesita invocarlo una **segunda vez** sobre un gasto que ya
 * tiene imputaciones de una corrida previa, para verificar que `reemplazarPara` (T19) no las duplica
 * y que el resultado es idéntico (Req. 8.6, 8.7). El segundo camino de re-ejecución del pipeline —el
 * evento `aviso/recibido` repetido— nunca llega hasta acá dos veces (Req. 1.3: `ingestar` corta antes),
 * así que esta ruta directa es la única forma de ejercitar la idempotencia del step imputar en sí.
 */
export async function ejecutarPasoImputar(
  gastoId: string,
  {
    repositorioGastos,
    repositorioImputaciones,
  }: Pick<DependenciasProcesarAviso, 'repositorioGastos' | 'repositorioImputaciones'>,
): Promise<void> {
  const gasto = await repositorioGastos.traerPorId(gastoId)
  if (gasto.montoTotal === null || gasto.fechaGasto === null || gasto.cuotasTotal === null) {
    // Inalcanzable en este ciclo: `crear` exige un GastoNormalizado completo (T18), así que un gasto
    // que llegó hasta acá siempre tiene los tres campos. Guarda defensiva, no un camino ejercitado
    // por ningún test.
    throw new Error(`imputar: gasto ${gastoId} no tiene los datos que crear() garantiza`)
  }

  const montos = dividirEnCuotas(gasto.montoTotal, gasto.cuotasTotal) // Req. 8.3
  const meses = calcularMesesDeImputacion(gasto.fechaGasto, gasto.cuotasTotal) // Req. 8.2, 8.4

  await repositorioImputaciones.reemplazarPara(
    gastoId,
    montos.map((monto, indice) => ({
      numeroCuota: indice + 1,
      monto,
      mes: meses[indice] as string,
    })),
  )

  await repositorioGastos.marcarImputado(gastoId) // Req. 10.5
}

/**
 * Reacciona a una falla en categorizar o imputar (Req. 10.1, 10.2, 1.6): si todavía quedan reintentos
 * (`esUltimoIntento` en `false`), relanza el error tal cual para que Inngest lo reintente con su propia
 * espera creciente. Si es el último intento, degrada el gasto a `needs_review` con la traza del error
 * en vez de dejar que la función termine en un estado de fallo sin dueño.
 *
 * Extraída del `catch` del step, fuera de `step.run`, por el mismo motivo que T36/T37 extrajeron
 * `ejecutarPasoImputar`: verificado empíricamente (Decision log de T38) que `@inngest/test` nunca deja
 * que el rechazo de un `step.run` llegue al `try/catch` del código de usuario al ejecutar la función
 * completa contra `InngestTestEngine` —el error termina siempre en `ejecucion.error`, tanto con
 * `retries: 0` como con `retries: 3`, sin pasar por acá— así que probar esta decisión de punta a punta
 * contra el harness es una guerra perdida (la librería trae un `attempt: 0 // TODO retries?` sin
 * terminar). Esta función se testea invocándola directamente, sin `step.run` ni `InngestTestEngine` de
 * por medio; la decisión "es el último intento" en sí ya está testeada exhaustivamente en
 * `esUltimoIntento.test.ts`.
 */
export async function manejarFalloDePaso(
  error: unknown,
  gastoId: string,
  attempt: number,
  maxAttempts: number,
  { repositorioGastos }: Pick<DependenciasProcesarAviso, 'repositorioGastos'>,
): Promise<void> {
  if (!esUltimoIntento(attempt, maxAttempts)) {
    throw error // deja que Inngest reintente con su propia espera creciente (Req. 10.1)
  }
  const ultimoError = error instanceof Error ? error.message : String(error)
  await repositorioGastos.marcarParaRevision(gastoId, 'error_de_paso', ultimoError) // Req. 10.2, 10.4
}

/**
 * Workflow durable que convierte cada aviso de consumo en un gasto (Req. 1.1, 1.3). El step no
 * contiene lógica de negocio: lee, llama a una función pura o a un repositorio, y escribe.
 *
 * - **ingestar** (T29): trae el mensaje crudo con `ClienteGmail.traerMensajeCrudo` y lo persiste con
 *   `guardarSiEsNuevo` antes de cualquier paso posterior. Si el email ya existía (`yaExistia: true`),
 *   la función termina sin efectos adicionales — ningún paso posterior se ejecuta de más (Req. 1.3).
 * - **extraer** (T30, T31, T32): `decodificarQuotedPrintable` (T1) → `parsearAvisoSantander` (T2–T5).
 *   Un `no_es_aviso` marca el email `descartado` sin crear gasto y sin marcar error (Req. 4.1, 4.2). Un
 *   `aviso_de_consumo` pasa por `normalizarAviso` (T8, T9); el camino válido (`ok: true`) crea el
 *   gasto con `RepositorioGastos.crear`, que lo deja en `extraido` (Req. 2.3, 3.4, 10.5). El camino
 *   `aviso_ilegible` del parser y la rama `ok: false` de `normalizarAviso` (Req. 2.11, 2.12, 3.5, 3.6,
 *   3.7) usan `RepositorioGastos.crearParaRevision` (T32, `design.md` — decisión de diseño del
 *   2026-08-29) para persistir un gasto en `needs_review` directamente, sin pasar por `crear`. Ninguno
 *   de los dos caminos tiene datos parciales que pasarle a `crearParaRevision` — `ResultadoParseo` con
 *   `aviso_ilegible` solo trae `camposFaltantes`, y `ResultadoNormalizacion` con `ok: false` solo trae
 *   `motivo` (T9 corta en la primera guarda que falla) — así que los siete campos de datos quedan en
 *   NULL. El step devuelve `{ gastoId, comercio }` —datos simples, serializables— o `null` si no se
 *   creó gasto extraído para categorizar (descartado o needs_review), para que categorizar sepa si
 *   tiene algo que hacer sin volver a leer `emails_crudos`.
 * - **categorizar** (T33, T34, T35): `categorizarPorReglas` (T14) contra `RepositorioReglas.listar()`.
 *   Si coincide, asigna esa categoría con origen `regla` (confirma en el acto, Req. 5.3) sin invocar
 *   el modelo (Req. 6.2). Si no coincide, `inferirCategoria` (T27, T28): una categoría del conjunto
 *   cerrado se asigna con origen `ia` y sin confirmar (Req. 6.3); `null` —fuera de enum, reintentos
 *   agotados o abstención, Req. 6.4/6.5/6.7— asigna `Sin categorizar` con origen `ia`, sin categoría
 *   propuesta, y el pipeline sigue. Una sola rama de código para las tres causas del `null`.
 * - **imputar** (T36): recalcula desde cero con `RepositorioGastos.traerPorId` en vez de arrastrar
 *   `montoTotal`/`fechaGasto` desde `extraer` — mismo motivo que extraer no le pasa el `Gasto` entero
 *   a categorizar: los resultados de step en Inngest real viajan serializados, y releer de la base es
 *   más simple que reconstruir un `Decimal`/`Date` a mano en cada paso. `dividirEnCuotas` (T11) +
 *   `calcularMesesDeImputacion` (T13) + `reemplazarPara` (T19) + `marcarImputado` (T36): un solo
 *   camino de código para débito, crédito en una cuota y crédito en N cuotas (Req. 8.1, 8.3, 8.5,
 *   10.5).
 */
export function crearFuncionProcesarAviso({
  repositorioEmails,
  clienteGmail,
  repositorioGastos,
  repositorioReglas,
  repositorioImputaciones,
  clienteIA,
  reintentos = REINTENTOS,
}: DependenciasProcesarAviso) {
  // `maxAttempts` se deriva de `reintentos` acá, no de `ctx.maxAttempts` (Decision log de T38):
  // verificado empíricamente que `@inngest/test` no lo puebla de forma confiable —quedó `undefined`
  // tanto con `retries: 0` como con `retries: 3`—, así que depender de ese campo del contexto habría
  // dejado `esUltimoIntento` siempre en `false` bajo el harness, sin ningún aviso. El valor real ya
  // está en este closure: `reintentos` es la misma cifra que configura `createFunction`.
  const maxAttempts = reintentos + 1

  return inngest.createFunction(
    { id: 'procesar-aviso', triggers: [{ event: 'aviso/recibido' }], retries: reintentos },
    async ({ event, step, attempt }) => {
      const gmailMessageId = event.data.gmailMessageId as string

      const ingestado = await step.run('ingestar', async () => {
        const mensaje = await clienteGmail.traerMensajeCrudo(gmailMessageId)
        return repositorioEmails.guardarSiEsNuevo(mensaje)
      })

      if (ingestado.yaExistia) {
        return ingestado
      }

      const extraido = await step.run('extraer', async () => {
        const email = await repositorioEmails.traerCrudo(ingestado.id)
        const html = decodificarQuotedPrintable(email.cuerpo)
        const parseo = parsearAvisoSantander(html)

        if (parseo.tipo === 'no_es_aviso') {
          await repositorioEmails.marcarDescartado(ingestado.id) // Req. 4.1, 4.2
          return null
        }

        if (parseo.tipo === 'aviso_ilegible') {
          // Req. 2.11, 2.12: ninguna etiqueta del aviso quedó parcialmente extraída en este resultado
          // (`ResultadoParseo` solo trae `camposFaltantes`, no valores parciales) — así que
          // `crearParaRevision` no tiene ningún campo que pasar y los siete quedan en NULL.
          await repositorioGastos.crearParaRevision(ingestado.id, 'campos_faltantes', {})
          return null
        }

        const normalizado = normalizarAviso(parseo.datos, new Date())
        if (!normalizado.ok) {
          // Req. 3.5, 3.6, 3.7: mismo motivo — `ResultadoNormalizacion` en `ok: false` no expone
          // ningún dato parcial (T9 corta en la primera guarda que falla), así que tampoco hay campos
          // que pasar acá.
          await repositorioGastos.crearParaRevision(ingestado.id, normalizado.motivo, {})
          return null
        }

        const gasto = await repositorioGastos.crear(normalizado.datos, ingestado.id)
        return { gastoId: gasto.id, comercio: normalizado.datos.comercio }
      })

      if (extraido === null) {
        return ingestado
      }

      // Req. 10.1, 10.2: una falla transitoria en categorizar o imputar reintenta con la espera
      // creciente que Inngest aplica por default a los `retries` de la función (no algo que este
      // código calcule). Si el intento actual es el último (`esUltimoIntento`, T38), el gasto —que ya
      // existe desde extraer— se manda a `needs_review` con la traza del error en vez de dejar que la
      // función termine en un estado de fallo sin dueño; el email crudo queda intacto porque ningún
      // paso de acá en adelante lo toca (Req. 1.6).
      try {
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
      } catch (error) {
        await manejarFalloDePaso(error, extraido.gastoId, attempt, maxAttempts, { repositorioGastos })
      }

      return ingestado
    },
  )
}
