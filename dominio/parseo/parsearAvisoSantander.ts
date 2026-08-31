import { parse, type DefaultTreeAdapterTypes as P5 } from 'parse5'

export type TipoTarjeta = 'debito' | 'credito'

export type ResultadoParseo =
  | { tipo: 'aviso_de_consumo'; datos: DatosAviso }
  | { tipo: 'no_es_aviso' } // Req. 4.1
  | { tipo: 'aviso_ilegible'; camposFaltantes: CampoAviso[] } // Req. 2.11

export interface DatosAviso {
  montoTexto: string // "$2.571,30"
  comercio: string // "WWWAYSACOMAR"
  fechaTexto: string // "24/08/2026"
  horaTexto: string // "11:14"
  cuotasTexto: string | null // "1" | null si la fila no existe   (Req. 2.4, 2.5)
  tipoTarjeta: TipoTarjeta // 'debito' | 'credito'              (Req. 2.7, 2.8)
  tarjetaUltimos4: string // "9344"                            (Req. 2.9)
}

export type CampoAviso = 'monto' | 'comercio' | 'fecha' | 'hora' | 'tipoTarjeta' | 'tarjetaUltimos4'

// El párrafo de la tarjeta es prosa, no una fila etiquetada: "Tarjeta Santander Visa Débito
// terminada en 9344." El discriminador es este texto, nunca la fila `Cuotas` ni el asunto del
// email (Req. 2.10) — la firma de esta función no recibe el asunto, así que esa mitad la sostiene
// el `typecheck`.
const PATRON_PARRAFO_TARJETA = /(d[eé]bito|cr[eé]dito).*terminada en\D*(\d{4})/i

function esTexto(nodo: P5.Node): nodo is P5.TextNode {
  return nodo.nodeName === '#text'
}

function esElemento(nodo: P5.Node): nodo is P5.Element {
  return 'tagName' in nodo
}

function tieneHijos(nodo: P5.Node): nodo is P5.Document | P5.DocumentFragment | P5.Element {
  return 'childNodes' in nodo
}

function normalizarTexto(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

function recolectarTexto(nodo: P5.Node): string {
  if (esTexto(nodo)) return nodo.value
  if (tieneHijos(nodo)) return nodo.childNodes.map(recolectarTexto).join(' ')
  return ''
}

function textoPlano(nodo: P5.Node): string {
  return normalizarTexto(recolectarTexto(nodo))
}

/**
 * Busca por etiqueta normalizada, nunca por posición en el árbol (Req. 2.2, 2.6): recorre el árbol
 * en post-orden (hijos antes que el padre) y devuelve el primer elemento cuyo texto completo —
 * normalizado, sin distinguir mayúsculas— satisface el predicado. El post-orden es lo que prefiere
 * el nodo más específico (la celda de la etiqueta) sobre cualquier ancestro que también "contenga"
 * ese texto entre mucho más contenido.
 */
function buscarElementoPostOrden(
  nodo: P5.Node,
  predicado: (texto: string) => boolean,
): P5.Element | null {
  if (tieneHijos(nodo)) {
    for (const hijo of nodo.childNodes) {
      const encontrado = buscarElementoPostOrden(hijo, predicado)
      if (encontrado) return encontrado
    }
  }
  if (esElemento(nodo) && predicado(textoPlano(nodo))) {
    return nodo
  }
  return null
}

function buscarValorPorEtiqueta(raiz: P5.Node, etiqueta: string): string | null {
  const etiquetaNormalizada = etiqueta.toLowerCase()
  const nodoEtiqueta = buscarElementoPostOrden(
    raiz,
    (texto) => texto.toLowerCase() === etiquetaNormalizada,
  )
  if (!nodoEtiqueta || !nodoEtiqueta.parentNode) return null

  const hermanos = nodoEtiqueta.parentNode.childNodes
  const indice = hermanos.indexOf(nodoEtiqueta)
  for (let i = indice + 1; i < hermanos.length; i++) {
    const candidato = hermanos[i]
    if (candidato && esElemento(candidato)) {
      return textoPlano(candidato)
    }
  }
  return null
}

function buscarParrafoTarjeta(
  raiz: P5.Node,
): { tipoTarjeta: TipoTarjeta; tarjetaUltimos4: string } | null {
  const nodo = buscarElementoPostOrden(raiz, (texto) => PATRON_PARRAFO_TARJETA.test(texto))
  if (!nodo) return null

  const coincidencia = PATRON_PARRAFO_TARJETA.exec(textoPlano(nodo))
  if (!coincidencia || coincidencia[1] === undefined || coincidencia[2] === undefined) return null

  const tipoTarjeta: TipoTarjeta = /cr[eé]dito/i.test(coincidencia[1]) ? 'credito' : 'debito'
  return { tipoTarjeta, tarjetaUltimos4: coincidencia[2] }
}

/**
 * Extrae los campos del aviso buscando por etiqueta normalizada, no por posición en el árbol HTML
 * (Req. 2.2, 2.6). Devuelve texto crudo: no normaliza, no convierte, no sabe de decimales ni de
 * zonas horarias — eso es `normalizarAviso` (dominio/normalizacion).
 */
export function parsearAvisoSantander(html: string): ResultadoParseo {
  const documento = parse(html)

  const montoTexto = buscarValorPorEtiqueta(documento, 'monto')
  const comercio = buscarValorPorEtiqueta(documento, 'comercio')
  const fechaTexto = buscarValorPorEtiqueta(documento, 'fecha')
  const horaTexto = buscarValorPorEtiqueta(documento, 'hora')
  const cuotasTexto = buscarValorPorEtiqueta(documento, 'cuotas') // Req. 2.4, 2.5
  const tarjeta = buscarParrafoTarjeta(documento)

  // El discriminador entre `no_es_aviso` y `aviso_ilegible` (Decision log de T5): si NINGUNA de
  // las etiquetas del aviso aparece, no hay estructura de aviso de consumo. El párrafo de la
  // tarjeta no es una "etiqueta" —es prosa— así que no participa de este chequeo.
  const ningunaEtiquetaPresente =
    montoTexto === null && comercio === null && fechaTexto === null && horaTexto === null

  if (ningunaEtiquetaPresente) {
    return { tipo: 'no_es_aviso' }
  }

  const camposFaltantes: CampoAviso[] = []
  if (montoTexto === null) camposFaltantes.push('monto')
  if (comercio === null) camposFaltantes.push('comercio')
  if (fechaTexto === null) camposFaltantes.push('fecha')
  if (horaTexto === null) camposFaltantes.push('hora')
  if (tarjeta === null) camposFaltantes.push('tipoTarjeta', 'tarjetaUltimos4')

  if (camposFaltantes.length > 0) {
    return { tipo: 'aviso_ilegible', camposFaltantes }
  }

  return {
    tipo: 'aviso_de_consumo',
    datos: {
      montoTexto: montoTexto as string,
      comercio: comercio as string,
      fechaTexto: fechaTexto as string,
      horaTexto: horaTexto as string,
      cuotasTexto,
      tipoTarjeta: (tarjeta as { tipoTarjeta: TipoTarjeta; tarjetaUltimos4: string }).tipoTarjeta,
      tarjetaUltimos4: (tarjeta as { tipoTarjeta: TipoTarjeta; tarjetaUltimos4: string })
        .tarjetaUltimos4,
    },
  }
}
