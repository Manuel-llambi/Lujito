-- Req. 2, 3, 5, 6, 10.5: la compra como hecho único. Declara `estado_gasto` y `tipo_tarjeta` —su
-- primer y único uso en todo el schema (Decision log de T16/T18)— porque T18 es la primera tarea que
-- los necesita: declararlos antes dejaba un tipo que ningún test podía ejercitar.
CREATE TYPE estado_gasto AS ENUM ('pendiente', 'extraido', 'categorizado', 'imputado', 'needs_review');
CREATE TYPE tipo_tarjeta AS ENUM ('debito', 'credito');

CREATE TABLE gastos (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id                 uuid NOT NULL UNIQUE REFERENCES emails_crudos(id),
  monto_total              numeric(14,2),                -- Req. 3.2 · NUNCA float
  moneda                   text NOT NULL DEFAULT 'ARS',
  comercio                 text,
  fecha_gasto              timestamptz,                  -- Req. 3.3 · del cuerpo del aviso, no del header
  tipo_tarjeta             tipo_tarjeta,
  tarjeta_ultimos4         text,
  cuotas_total             int,
  categoria_id             smallint REFERENCES categorias(id),
  categoria_origen         origen_categoria,
  categoria_justificacion  text,                         -- Req. 6.6
  confirmado_en            timestamptz,                  -- NULL = pendiente de confirmar (Req. 7.1)
  estado                   estado_gasto NOT NULL DEFAULT 'pendiente',
  motivo_revision          text,                         -- Req. 10.4
  ultimo_error             text,                         -- Req. 10.4
  creado_en                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT monto_positivo CHECK (monto_total IS NULL OR monto_total > 0),   -- Req. 3.5
  CONSTRAINT cuotas_validas CHECK (cuotas_total IS NULL OR cuotas_total >= 1) -- Req. 3.7
);

CREATE INDEX ON gastos (estado) WHERE estado = 'needs_review';
CREATE INDEX ON gastos (confirmado_en) WHERE confirmado_en IS NULL;
