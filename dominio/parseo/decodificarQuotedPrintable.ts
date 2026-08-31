/**
 * Convierte el cuerpo `quoted-printable` de un email a texto UTF-8 (Req. 2.1).
 * No depende de nada.
 */
export function decodificarQuotedPrintable(crudo: string): string {
  // Saltos suaves: "=" al final de línea, seguido de \r\n o \n, se elimina junto con el salto.
  const sinSaltosSuaves = crudo.replace(/=\r\n/g, '').replace(/=\n/g, '')

  // Secuencias "=XX" (hex) se decodifican byte a byte y se agrupan como UTF-8,
  // para resolver correctamente secuencias multibyte como "=C3=B3" -> "ó".
  const bytes: number[] = []
  let resultado = ''

  const volcarBytes = () => {
    if (bytes.length > 0) {
      resultado += Buffer.from(bytes).toString('utf-8')
      bytes.length = 0
    }
  }

  const patron = /=([0-9A-Fa-f]{2})/g
  let ultimoIndice = 0
  let coincidencia: RegExpExecArray | null

  while ((coincidencia = patron.exec(sinSaltosSuaves)) !== null) {
    const textoPrevio = sinSaltosSuaves.slice(ultimoIndice, coincidencia.index)
    if (textoPrevio) {
      volcarBytes()
      resultado += textoPrevio
    }
    const hex = coincidencia[1]
    if (hex) {
      bytes.push(parseInt(hex, 16))
    }
    ultimoIndice = patron.lastIndex
  }

  volcarBytes()
  resultado += sinSaltosSuaves.slice(ultimoIndice)

  return resultado
}
