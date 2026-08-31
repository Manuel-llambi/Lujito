-- Req. 9.1, 9.3, 9.5: la única lectura agregada del sistema. El dashboard nunca consulta `gastos`
-- directamente. No crea tablas ni tipos enumerados: el schema quedó completo en T19, esta es una
-- vista sobre él (Decision log de T20).
CREATE VIEW vista_gastos_mensuales AS
SELECT i.mes, c.nombre AS categoria, SUM(i.monto) AS total,
       bool_or(g.confirmado_en IS NULL) AS tiene_sin_confirmar -- Req. 9.3
FROM imputaciones i
JOIN gastos g ON g.id = i.gasto_id
LEFT JOIN categorias c ON c.id = g.categoria_id -- LEFT, no INNER: nunca descuenta plata en silencio
WHERE g.estado <> 'needs_review' -- Req. 9.5
GROUP BY i.mes, c.nombre;
