# Diseño — <Nombre de la Feature>

**Estado:** Borrador
**Fecha:** <YYYY-MM-DD>
**Requisitos:** ./requirements.md

## Resumen

<Resumir el approach técnico en pocas oraciones. Indicar los objetivos de
diseño y las decisiones clave a alto nivel, para que quien lea entienda la
forma general de la solución antes de entrar en el detalle.>

## Arquitectura

<Describir cómo encaja la feature en el sistema: los módulos/capas
principales, cómo fluyen el control y los datos entre ellos, y cualquier
límite nuevo que se introduzca. Un diagrama simple (Mermaid o ASCII) es
bienvenido cuando aclara el flujo.>

```
<diagrama opcional>
```

## Componentes e interfaces

<Para cada componente nuevo o significativamente modificado, describir su
responsabilidad y su interfaz pública (firmas de función/clase, exports de
módulo, o forma del API). Mantener las firmas concretas — esto es lo que
la implementación va a construir.>

### <Nombre del componente>

- **Responsabilidad:** <qué posee>
- **Interfaz:**

```ts
// firmas / tipos
```

- **Depende de:** <otros componentes, librerías>
- **Si es visual (HTML/componente/página):** fundamentar colores, tipografía y espaciado en los patrones visuales ya establecidos en el proyecto, no definirlos ad hoc.

## Modelos de datos

<Definir las estructuras de datos, tipos, y (si aplica) el schema de
persistencia. Mostrar los tipos o schemas de TypeScript que se van a
crear. Anotar reglas de validación e invariantes.>

```ts
// tipos / schema
```

## Flujo de datos

<Trazar uno o dos escenarios clave de punta a punta: input → pasos de
procesamiento → output. Acá es donde se muestra cómo los criterios de
aceptación de requirements.md quedan satisfechos por pasos concretos.>

1. <paso>
2. <paso>

## Manejo de errores

<Enumerar los modos de falla y cómo se maneja cada uno: errores de
validación, casos borde, estado inválido. Mapear esto de vuelta a los
criterios de aceptación IF/THEN de requirements.md.>

| Condición | Manejo | Requisito relacionado |
|-----------|--------|------------------------|
| <error>   | <respuesta> | <ej. 1.2> |

## Estrategia de testing

<Cómo se va a verificar la feature, consistente con el workflow TDD del
proyecto. Listar las unidades a testear, los casos borde clave, y
cualquier escenario de integración. Cada criterio de aceptación debería
poder trazarse a al menos un test.>

- **Unitario:** <qué cubrir>
- **Casos borde:** <lista>
- **Integración:** <si aplica>

## Decisiones de diseño y trade-offs

<Registrar decisiones notables y por qué se rechazó la alternativa. Esto
le da a quien lea en el futuro el razonamiento, no solo el resultado.>

- **Decisión:** <qué> — **Justificación:** <por qué> — **Alternativa considerada:** <cuál y por qué no>
