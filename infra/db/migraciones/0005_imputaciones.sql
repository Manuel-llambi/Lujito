-- Req. 8: el impacto mensual, N filas por gasto. No crea ningún tipo enumerado — la primera
-- migración del schema que no lo hace: ninguna columna es de dominio cerrado (Decision log de T19).
CREATE TABLE imputaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id      uuid NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
  numero_cuota  int NOT NULL CHECK (numero_cuota >= 1),
  monto         numeric(14,2) NOT NULL CHECK (monto >= 0),
  mes           char(7) NOT NULL,                   -- 'AAAA-MM' (Req. 8.4)
  UNIQUE (gasto_id, numero_cuota)                    -- Req. 8.6
);

CREATE INDEX ON imputaciones (mes);
