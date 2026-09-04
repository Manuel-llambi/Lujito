-- Trabajo ad hoc (feature "Descartar", fuera de tasks.md): un gasto que el usuario corrigió
-- manualmente a "Descartar" desde /bandeja no debe sumar al total mensual del dashboard — es el
-- efecto que define la categoría (design.md, invariante nuevo). Mismo espíritu que el `LEFT JOIN`
-- original ("nunca descuenta plata en silencio") pero al revés: acá la exclusión es deliberada y
-- explícita, elegida por el usuario fila por fila, no un dato faltante del pipeline. `IS DISTINCT
-- FROM` en vez de `<>` por la misma razón que ya vale para `g.estado <> 'needs_review'` al lado: si
-- `c.nombre` llegara a ser NULL (gasto sin categoría, LEFT JOIN), `<>` lo volvería NULL y la fila se
-- descartaría de un WHERE que no la estaba filtrando — `IS DISTINCT FROM` trata NULL como "distinto
-- de 'Descartar'" y preserva esa fila para el chequeo defensivo que ya hace
-- `totalesPorMesYCategoria` (Decision log de T20).
CREATE OR REPLACE VIEW vista_gastos_mensuales AS
SELECT i.mes, c.nombre AS categoria, SUM(i.monto) AS total,
       bool_or(g.confirmado_en IS NULL) AS tiene_sin_confirmar -- Req. 9.3
FROM imputaciones i
JOIN gastos g ON g.id = i.gasto_id
LEFT JOIN categorias c ON c.id = g.categoria_id -- LEFT, no INNER: nunca descuenta plata en silencio
WHERE g.estado <> 'needs_review' -- Req. 9.5
  AND c.nombre IS DISTINCT FROM 'Descartar' -- trabajo ad hoc, feature "Descartar"
GROUP BY i.mes, c.nombre;
