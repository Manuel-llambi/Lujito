import { describe, expect, it } from 'vitest'
import { decodificarQuotedPrintable } from './decodificarQuotedPrintable'
import { parsearAvisoSantander } from './parsearAvisoSantander'
import { leerCuerpoHtmlDeAviso } from '../../test/fixtures/avisos-santander/leerAvisoEml'

describe('parsearAvisoSantander — campos base por etiqueta normalizada (T2)', () => {
  it('sobre el fixture del aviso de débito, devuelve los cuatro campos base con sus valores textuales exactos (Req. 2.3)', () => {
    const html = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('debito.eml'))

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos.montoTexto).toBe('$20.500,00')
    expect(resultado.datos.comercio).toBe('FRANCESCA')
    expect(resultado.datos.fechaTexto).toBe('28/08/2026')
    expect(resultado.datos.horaTexto).toBe('11:45')
  })

  it('un HTML sintético con etiquetas en otra capitalización, rodeadas de saltos de línea y espacios, y en otra posición del documento, devuelve los mismos cuatro valores (Req. 2.2)', () => {
    const html = `
      <html><body>
        <table><tbody><tr><td>
          <div>
            <div>
              <div>   HoRa   \n\n  </div>
              <div><span>11:14</span></div>
            </div>
            <div>
              <div> \n comercio\t</div>
              <div><b>WWWAYSACOMAR</b></div>
            </div>
          </div>
        </td></tr></tbody></table>
        <div>
          <div>
            <div>fEcHa</div>
            <div>24/08/2026</div>
          </div>
          <div>
            <div>
              \n   monto   \n
            </div>
            <div>$2.571,30</div>
          </div>
        </div>
        <p>Consumo con la Tarjeta Santander Visa Débito terminada en 9344.</p>
      </body></html>
    `

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos.montoTexto).toBe('$2.571,30')
    expect(resultado.datos.comercio).toBe('WWWAYSACOMAR')
    expect(resultado.datos.fechaTexto).toBe('24/08/2026')
    expect(resultado.datos.horaTexto).toBe('11:14')
  })
})

describe('parsearAvisoSantander — cuotas presentes y ausentes (T3)', () => {
  it('sobre el fixture del aviso de crédito, devuelve cuotasTexto con el valor textual exacto de la fila Cuotas (Req. 2.4)', () => {
    const html = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('credito.eml'))

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos.cuotasTexto).toBe('1')
  })

  it('sobre el fixture del aviso de débito, que no tiene fila Cuotas, cuotasTexto es null y los cuatro campos de T2 quedan idénticos (Req. 2.5)', () => {
    const html = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('debito.eml'))

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos.cuotasTexto).toBeNull()
    expect(resultado.datos.montoTexto).toBe('$20.500,00')
    expect(resultado.datos.comercio).toBe('FRANCESCA')
    expect(resultado.datos.fechaTexto).toBe('28/08/2026')
    expect(resultado.datos.horaTexto).toBe('11:45')
  })
})

describe('parsearAvisoSantander — tipo de tarjeta y últimos cuatro dígitos sobre HTML mal formado (T4)', () => {
  it('sobre el fixture de débito, tipoTarjeta es debito y tarjetaUltimos4 son los cuatro dígitos exactos (Req. 2.7, 2.9)', () => {
    const html = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('debito.eml'))

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos.tipoTarjeta).toBe('debito')
    expect(resultado.datos.tarjetaUltimos4).toBe('9344')
  })

  it('sobre el fixture de crédito, cuyo HTML tiene un <div> directamente dentro de un <table>, devuelve los siete campos completos de DatosAviso sin que ninguno quede vacío por la estructura rota (Req. 2.6, 2.8, 2.9)', () => {
    const html = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('credito.eml'))

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_de_consumo')
    if (resultado.tipo !== 'aviso_de_consumo') return
    expect(resultado.datos).toEqual({
      montoTexto: '$4.663,00',
      comercio: 'PAYU*AR*UBER',
      fechaTexto: '22/08/2026',
      horaTexto: '01:34',
      cuotasTexto: '1',
      tipoTarjeta: 'credito',
      tarjetaUltimos4: '1324',
    })
  })

  it('dos HTML sintéticos idénticos salvo por el párrafo de la tarjeta, ambos sin fila Cuotas, devuelven tipoTarjeta distinto — el discriminador es el párrafo, no la fila Cuotas (Req. 2.10)', () => {
    const cuerpoSinFilaCuotas = (parrafoTarjeta: string) => `
      <html><body>
        <div>
          <div><div>Monto</div><div>$1.000,00</div></div>
          <div><div>Comercio</div><div>ALMACEN</div></div>
          <div><div>Fecha</div><div>01/08/2026</div></div>
          <div><div>Hora</div><div>10:00</div></div>
        </div>
        <p>${parrafoTarjeta}</p>
      </body></html>
    `

    const resultadoDebito = parsearAvisoSantander(
      cuerpoSinFilaCuotas('Consumo con la Tarjeta Santander Visa Débito terminada en 1111.'),
    )
    const resultadoCredito = parsearAvisoSantander(
      cuerpoSinFilaCuotas('Consumo con la Tarjeta Santander Visa Crédito terminada en 2222.'),
    )

    expect(resultadoDebito.tipo).toBe('aviso_de_consumo')
    expect(resultadoCredito.tipo).toBe('aviso_de_consumo')
    if (resultadoDebito.tipo !== 'aviso_de_consumo' || resultadoCredito.tipo !== 'aviso_de_consumo') {
      return
    }
    expect(resultadoDebito.datos.tipoTarjeta).toBe('debito')
    expect(resultadoDebito.datos.cuotasTexto).toBeNull()
    expect(resultadoCredito.datos.tipoTarjeta).toBe('credito')
    expect(resultadoCredito.datos.cuotasTexto).toBeNull()
  })
})

describe('parsearAvisoSantander — resultados no_es_aviso y aviso_ilegible (T5)', () => {
  it('un HTML sintético que no expone ninguna de las etiquetas del aviso devuelve tipo: no_es_aviso (Req. 4.1)', () => {
    const html = `
      <html><body>
        <p>Conocé los nuevos beneficios de tu tarjeta con SuperClub+.</p>
        <p>Sumá puntos en cada compra y canjealos cuando quieras.</p>
      </body></html>
    `

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('no_es_aviso')
    expect('datos' in resultado).toBe(false)
  })

  it('el fixture de débito sin su fila Monto devuelve aviso_ilegible con camposFaltantes igual a [monto] (Req. 2.11)', () => {
    const original = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('debito.eml'))
    const filaMonto =
      /<div[^>]*>\s*Monto\s*<\/div><div[^>]*><strong[^>]*>\$20\.500,00<\/strong><\/div>/
    expect(filaMonto.test(original)).toBe(true) // guarda: si el fixture cambia, este test debe notarlo
    const html = original.replace(filaMonto, '')

    const resultado = parsearAvisoSantander(html)

    expect(resultado).toEqual({ tipo: 'aviso_ilegible', camposFaltantes: ['monto'] })
  })

  it('el fixture de débito sin su fila Monto y sin el párrafo de la tarjeta acumula los tres campos faltantes, sin cortar en el primero (Req. 2.11)', () => {
    const original = decodificarQuotedPrintable(leerCuerpoHtmlDeAviso('debito.eml'))
    const filaMonto =
      /<div[^>]*>\s*Monto\s*<\/div><div[^>]*><strong[^>]*>\$20\.500,00<\/strong><\/div>/
    const parrafoTarjeta = /<p[^>]*>Te acercamos[\s\S]*?<\/p>/
    expect(filaMonto.test(original)).toBe(true)
    expect(parrafoTarjeta.test(original)).toBe(true)
    const html = original.replace(filaMonto, '').replace(parrafoTarjeta, '')

    const resultado = parsearAvisoSantander(html)

    expect(resultado.tipo).toBe('aviso_ilegible')
    if (resultado.tipo !== 'aviso_ilegible') return
    expect(resultado.camposFaltantes).toHaveLength(3)
    expect(resultado.camposFaltantes).toEqual(
      expect.arrayContaining(['monto', 'tipoTarjeta', 'tarjetaUltimos4']),
    )
  })
})
