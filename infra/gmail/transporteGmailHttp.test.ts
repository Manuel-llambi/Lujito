import { describe, expect, it } from 'vitest'
import { TokenVencidoError } from '@/infra/gmail/clienteGmail'
import { traducirErrorHttpGmail } from '@/infra/gmail/transporteGmailHttp'

describe('traducirErrorHttpGmail', () => {
  it('un 401 se traduce a TokenVencidoError, con el cuerpo de la respuesta en el mensaje', () => {
    const error = traducirErrorHttpGmail(401, '{"error":"invalid_credentials"}')

    expect(error).toBeInstanceOf(TokenVencidoError)
    expect(error.message).toContain('invalid_credentials')
  })

  it.each([403, 429, 500, 503])('un status %i se traduce a un Error genérico, no TokenVencidoError', (status) => {
    const error = traducirErrorHttpGmail(status, 'cuerpo de error')

    expect(error).not.toBeInstanceOf(TokenVencidoError)
    expect(error.message).toContain(String(status))
    expect(error.message).toContain('cuerpo de error')
  })
})
