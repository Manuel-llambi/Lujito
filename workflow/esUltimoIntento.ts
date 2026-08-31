/**
 * Decide si el intento actual es el último que Inngest va a hacer antes de dejar de reintentar
 * (Req. 10.1, 10.2). Función pura, sin nada de Inngest ni de la base — es la lógica que decide
 * "needs_review" que `CLAUDE.md` manda sacar de los `step.run` ("los step.run del workflow no tienen
 * lógica: leen, llaman a una función pura, escriben"). El backoff creciente entre intentos (Req. 10.1)
 * es responsabilidad de la plataforma Inngest —el `retries: N` de la función y su política de espera
 * exponencial por defecto—, no algo que esta función calcule ni que el código tenga que demostrar.
 *
 * `attempt` es cero-indexado (el primer intento es `0`), tal como lo expone el contexto de Inngest.
 * `maxAttempts` es el total de intentos permitidos; `undefined` cuando el dato no está disponible en
 * el contexto —nunca se considera el último intento en ese caso, para no marcar `needs_review` de más
 * por falta de información.
 */
export function esUltimoIntento(attempt: number, maxAttempts: number | undefined): boolean {
  if (maxAttempts === undefined) {
    return false
  }
  return attempt >= maxAttempts - 1
}
