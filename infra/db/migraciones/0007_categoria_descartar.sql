-- Trabajo ad hoc (feature "Descartar", fuera de tasks.md): quinta fila de `categorias` para un
-- destino que solo un humano puede elegir, nunca una regla ni la IA (`CATEGORIAS_INFERIBLES` en
-- `categorizarPorReglas.ts` sigue sin incluirla a propósito). Un gasto en "Descartar" se corrige
-- manualmente desde /bandeja y sale de los totales del dashboard (0008_vista_excluye_descartados.sql
-- hace la exclusión real) — esta migración solo siembra el dato de referencia: `categorias.color` es
-- NOT NULL y esta categoría nunca se dibuja en la UI (no entra a `colorCategoria.ts` ni a
-- `ORDEN_CATEGORIAS`), pero la columna igual exige un valor real. Color elegido para no colisionar
-- visualmente con ninguno de los cuatro ya sembrados (`#f59e0b`, `#10b981`, `#8b5cf6`, `#6b7280`) por
-- si alguna vista de administración cruda llega a listar la tabla completa.
INSERT INTO categorias (nombre, color) VALUES ('Descartar', '#ef4444');
