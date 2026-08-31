import { describe, expect, it } from 'vitest'
import { PermisoRevocadoError } from '@/infra/gmail/clienteGmail'
import { interpretarRespuestaRenovacion } from '@/infra/gmail/renovarTokenGmail'

describe('interpretarRespuestaRenovacion', () => {
  it('un 200 con access_token devuelve el token nuevo', () => {
    const token = interpretarRespuestaRenovacion(200, { access_token: 'token-nuevo' })

    expect(token).toBe('token-nuevo')
  })

  it('un 400 con error invalid_grant se traduce a PermisoRevocadoError con la descripción de Google', () => {
    expect(() =>
      interpretarRespuestaRenovacion(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }),
    ).toThrow(PermisoRevocadoError)

    try {
      interpretarRespuestaRenovacion(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' })
    } catch (error) {
      expect((error as Error).message).toBe('Token has been expired or revoked.')
    }
  })

  it('un invalid_grant sin error_description igual dispara PermisoRevocadoError', () => {
    expect(() => interpretarRespuestaRenovacion(400, { error: 'invalid_grant' })).toThrow(PermisoRevocadoError)
  })

  it('un error distinto de invalid_grant NO dispara PermisoRevocadoError — es un Error genérico', () => {
    let capturado: unknown
    try {
      interpretarRespuestaRenovacion(400, { error: 'invalid_client' })
    } catch (error) {
      capturado = error
    }

    expect(capturado).toBeInstanceOf(Error)
    expect(capturado).not.toBeInstanceOf(PermisoRevocadoError)
  })

  it('un 500 sin cuerpo interpretable es un Error genérico, no PermisoRevocadoError', () => {
    let capturado: unknown
    try {
      interpretarRespuestaRenovacion(500, {})
    } catch (error) {
      capturado = error
    }

    expect(capturado).toBeInstanceOf(Error)
    expect(capturado).not.toBeInstanceOf(PermisoRevocadoError)
  })

  it('un 200 sin access_token es un Error genérico, no un token vacío silencioso', () => {
    expect(() => interpretarRespuestaRenovacion(200, {})).toThrow(Error)
  })
})
