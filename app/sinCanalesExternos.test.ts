import { describe, expect, it } from 'vitest'
import packageJson from '../package.json'

/**
 * Req. 7.8 — "confirmar o dejar pendiente un gasto no dispara ningún envío fuera de la aplicación" se
 * verifica como la ausencia deliberada de ese canal (Descripción de T47 en tasks.md), no como el
 * comportamiento de una función: no hay ningún adaptador de email, push ni mensajería en el proyecto
 * que una acción de confirmar pudiera invocar. La forma observable de esa ausencia es que ninguna
 * dependencia de ese tipo está instalada — sin ella, no existe ningún código posible que dispare un
 * envío externo, con o sin bug.
 *
 * Control positivo (mismo motivo que T21 con la cola de errores): la lista de paquetes bloqueados no
 * está vacía, así que un cambio que la vacíe por accidente haría fallar esta aserción por sí sola en
 * vez de dejar el test decorativo.
 */
describe('ausencia de canales de notificación externos — Req. 7.8', () => {
  const PAQUETES_DE_NOTIFICACION_BLOQUEADOS = [
    'nodemailer',
    'resend',
    'sendgrid',
    '@sendgrid/mail',
    'mailgun',
    'mailgun.js',
    'twilio',
    'web-push',
    'firebase-admin',
    'expo-server-sdk',
    'onesignal-node',
    '@aws-sdk/client-ses',
    '@aws-sdk/client-sns',
  ]

  it('el proyecto no incorpora ninguna dependencia conocida de email, push ni mensajería', () => {
    const dependenciasDeclaradas = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ])

    expect(PAQUETES_DE_NOTIFICACION_BLOQUEADOS.length).toBeGreaterThan(0) // control positivo

    const encontrados = PAQUETES_DE_NOTIFICACION_BLOQUEADOS.filter((paquete) =>
      dependenciasDeclaradas.has(paquete),
    )
    expect(encontrados).toEqual([])
  })
})
