-- Req. 5: datos de referencia de la categorización — el estado inicial de la base recién instalada,
-- antes de que entre el primer email.
CREATE TYPE origen_categoria AS ENUM ('regla', 'ia', 'usuario');

CREATE TABLE categorias (
  id      smallserial PRIMARY KEY,
  nombre  text NOT NULL UNIQUE,                     -- Salidas · Comida · Extras · Sin categorizar
  color   text NOT NULL
);

CREATE TABLE reglas_categoria (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_comercio  text NOT NULL,
  categoria_id     smallint NOT NULL REFERENCES categorias(id),
  prioridad        int NOT NULL DEFAULT 0,          -- Req. 5.6
  creada_por       origen_categoria NOT NULL,
  activa           boolean NOT NULL DEFAULT true,
  creada_en        timestamptz NOT NULL DEFAULT now()
);

-- Cuatro categorías fijas con un color estable (Req. 5.1). "Sin categorizar" no es una categoría
-- que una regla pueda asignar (es el destino de una inferencia sin respuesta), pero sí existe como
-- fila porque `gastos.categoria_id` la referencia.
INSERT INTO categorias (nombre, color) VALUES
  ('Salidas', '#f59e0b'),
  ('Comida', '#10b981'),
  ('Extras', '#8b5cf6'),
  ('Sin categorizar', '#6b7280');

-- Reglas semilla de comercios conocidos (Req. 5.8, design.md "Reglas semilla — comercios
-- conocidos"), literal. Patrones ya normalizados (mayúsculas, sin acentos, sin espacios dobles):
-- categorizarPorReglas (T14) normaliza los dos lados igual, pero se guardan así porque es lo que
-- prescribe el diseño para las filas de la migración. `prioridad = 0` en las diez: es el piso sobre
-- el que una regla más específica gana después con un número mayor (T15), no un default perezoso.
INSERT INTO reglas_categoria (patron_comercio, categoria_id, prioridad, creada_por, activa)
SELECT semilla.patron, categorias.id, 0, 'usuario', true
FROM (VALUES
  ('MERPAGO*LAFRUTAALEGRE', 'Comida'),
  ('SUPER CORAZON', 'Comida'),
  ('COTO SUCURSAL', 'Comida'),
  ('RES SOLDADO', 'Comida'),
  ('PANADERIA Y CONFITERIA', 'Comida'),
  ('SUBE', 'Salidas'),
  ('PAY*AR*UBER', 'Salidas'),
  ('MISTER PEDRO', 'Salidas'),
  ('HAVANNA', 'Salidas'),
  ('FARMACITY', 'Extras')
) AS semilla(patron, nombre_categoria)
JOIN categorias ON categorias.nombre = semilla.nombre_categoria;
