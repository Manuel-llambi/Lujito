import { Inngest } from 'inngest'

/**
 * Cliente de Inngest del proyecto (Decision log de T29). Un único cliente compartido por todas las
 * funciones del workflow — `procesarAviso` hoy, `ingestarAvisos` en T39 —, siguiendo la convención
 * estándar de la librería: un `id` estable de aplicación, sin lógica propia.
 */
export const inngest = new Inngest({ id: 'finanzas-cumzi' })
