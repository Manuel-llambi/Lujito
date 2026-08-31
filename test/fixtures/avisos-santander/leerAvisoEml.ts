import { readFileSync } from 'node:fs'
import path from 'node:path'

const DIRECTORIO_FIXTURES = import.meta.dirname

/**
 * Lee un fixture `.eml` de este directorio y devuelve el cuerpo `quoted-printable` de su única
 * parte `text/html`, tal como queda en `emails_crudos.cuerpo` según el Decision log de T24: Gmail
 * decodifica el transporte (base64url), pero el `quoted-printable` del contenido no se toca ahí —
 * lo decodifica el step extraer con `decodificarQuotedPrintable` (T1). Los tests de parseo replican
 * ese mismo orden: primero esta función, después `decodificarQuotedPrintable`, y solo entonces
 * `parsearAvisoSantander`.
 *
 * La extracción busca la cabecera `Content-Type: text/html` del `.eml`, salta la línea en blanco
 * que separa esa cabecera de MIME de su contenido, y captura todo hasta el próximo delimitador de
 * `boundary` (una línea que empieza con dos o más guiones), que es donde MIME cierra esa parte.
 */
export function leerCuerpoHtmlDeAviso(nombreArchivo: string): string {
  const ruta = path.join(DIRECTORIO_FIXTURES, nombreArchivo)
  const crudo = readFileSync(ruta, 'utf-8')

  const coincidencia = /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)\r?\n-{2,}/.exec(crudo)
  if (!coincidencia || coincidencia[1] === undefined) {
    throw new Error(`No se encontró una parte text/html en el fixture "${nombreArchivo}"`)
  }

  return coincidencia[1]
}
