# Requisitos — <Nombre de la Feature>

**Estado:** Borrador
**Fecha:** <YYYY-MM-DD>
**Autor:** <nombre / equipo>

## Introducción

<Uno o dos párrafos describiendo la feature: qué problema resuelve, para
quién es, y qué valor aporta. Mantenerlo enfocado en el negocio — el "qué"
y el "por qué", no el "cómo". El "cómo" técnico va en design.md.>

## Glosario

<Opcional. Definir términos de dominio que aparezcan en los requisitos para
que cada criterio de aceptación se lea sin ambigüedad. Eliminar esta
sección si no hace falta.>

- **<Término>** — <definición>

## Requisitos

<Cada requisito es una historia de usuario más un conjunto de criterios de
aceptación escritos en notación EARS. Numerar los requisitos (1, 2, 3…) y
sus criterios (1.1, 1.2…) para que design.md pueda trazar de vuelta hasta
ellos.>

### Requisito 1 — <título corto>

**Historia de usuario:** Como <rol>, quiero <capacidad>, para <beneficio>.

**Criterios de aceptación:**

1.1. WHEN <evento disparador> THE SYSTEM SHALL <comportamiento observable>.
1.2. IF <precondición / condición de error> THEN THE SYSTEM SHALL <respuesta>.
1.3. WHILE <estado en curso> THE SYSTEM SHALL <comportamiento sostenido durante ese estado>.
1.4. WHERE <feature/configuración opcional presente> THE SYSTEM SHALL <comportamiento>.
1.5. THE SYSTEM SHALL <invariante que siempre se cumple>.

### Requisito 2 — <título corto>

**Historia de usuario:** Como <rol>, quiero <capacidad>, para <beneficio>.

**Criterios de aceptación:**

2.1. WHEN <disparador> THE SYSTEM SHALL <comportamiento>.
2.2. IF <condición> THEN THE SYSTEM SHALL <comportamiento>.

<Agregar tantos requisitos como necesite la feature. Preferir varios
criterios chicos y testeables antes que una sola oración amplia.>

## Fuera de alcance

<Lista de cosas explícitamente NO incluidas en esta feature, para que
quien revise sepa dónde está el límite. Esto evita scope creep y aclara
qué va a cubrir un spec posterior.>

- <ítem excluido>

## Preguntas abiertas

<Cualquier cosa sin resolver que necesite una decisión antes o durante el
diseño. Eliminar si está vacío.>

- <pregunta>
