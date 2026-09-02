import type { HallazgoRedactado } from '@/infra/ia/redactarHallazgo'

/**
 * Sección "Recomendaciones" de `/habitos` (T10). Una tarjeta por `HallazgoRedactado`, mostrando
 * `recomendacionTexto` — la misma card `rounded-3xl border border-texto-muted/15 bg-superficie` que ya
 * usa `SeccionCategorias` en `/dashboard`, nunca un estilo nuevo (Req. 5.3).
 */
export function SeccionRecomendaciones({ hallazgos }: { hallazgos: HallazgoRedactado[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="px-1 text-sm font-semibold text-texto">Recomendaciones</h3>
      <div className="flex flex-col gap-2">
        {hallazgos.map((item, indice) => (
          <div key={indice} className="rounded-3xl border border-texto-muted/15 bg-superficie p-4">
            <p className="text-sm text-texto">{item.recomendacionTexto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
