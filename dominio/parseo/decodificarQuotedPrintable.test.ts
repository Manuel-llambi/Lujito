import { describe, expect, it } from 'vitest'
import { decodificarQuotedPrintable } from './decodificarQuotedPrintable'

describe('decodificarQuotedPrintable', () => {
  it('une líneas terminadas en "=" seguidas de salto de línea "\\n", sin el "=" ni el salto', () => {
    const crudo = 'Monto: $2.571,3=\n0'
    expect(decodificarQuotedPrintable(crudo)).toBe('Monto: $2.571,30')
  })

  it('une líneas terminadas en "=" seguidas de salto de línea "\\r\\n", sin el "=" ni el salto', () => {
    const crudo = 'Monto: $2.571,3=\r\n0'
    expect(decodificarQuotedPrintable(crudo)).toBe('Monto: $2.571,30')
  })

  it('decodifica "=3D" como "="', () => {
    expect(decodificarQuotedPrintable('5 =3D 5')).toBe('5 = 5')
  })

  it('decodifica la secuencia multibyte "=C3=B3" como "ó"', () => {
    expect(decodificarQuotedPrintable('Comprob=C3=B3 la compra')).toBe('Comprobó la compra')
  })

  it('devuelve intacto un texto sin ninguna construcción quoted-printable, incluidos sus saltos de línea duros', () => {
    const texto = 'Primera línea\nSegunda línea\r\nTercera línea'
    expect(decodificarQuotedPrintable(texto)).toBe(texto)
  })
})
