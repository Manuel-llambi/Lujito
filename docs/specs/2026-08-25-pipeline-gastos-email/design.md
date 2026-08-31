# Diseño — Pipeline de gastos desde emails del banco

**Estado:** Borrador
**Fecha:** 2026-08-25
**Requisitos:** ./requirements.md

## Resumen

El sistema es un workflow durable de cuatro pasos que convierte cada aviso de consumo del banco en filas
de gasto e imputaciones mensuales, más una aplicación web que muestra el dashboard y la bandeja de
confirmación.

Tres decisiones gobiernan todo el diseño:

1. **La extracción es un parser determinista, no una llamada a un modelo.** El aviso del banco es una
   tabla con etiquetas fijas. Un parser la lee siempre igual, en un milisegundo y sin costo (Req. 2).
   La IA se reserva para el único problema que realmente es ambiguo: qué categoría le corresponde a un
   comercio con nombre críptico (Req. 6).
2. **Toda la lógica que decide plata vive en funciones puras, sin red ni base de datos.** Parseo,
   normalización, reglas, prorrateo y cálculo de mes son funciones que reciben datos y devuelven datos.
   Los adaptadores (Gmail, Claude, Postgres) las rodean pero no las contienen. Esto es lo que hace que
   los criterios más críticos —2.12, 3.2, 8.3— se puedan testear en milisegundos.
3. **La compra y su impacto mensual son entidades distintas.** Un gasto es un hecho; sus imputaciones
   son N hechos, uno por mes. El dashboard suma imputaciones y nunca gastos, lo que elimina todo caso
   especial entre débito, crédito en una cuota y crédito en N cuotas (Req. 8.5).

## Arquitectura

Tres capas, con una regla de dependencia estricta: **el dominio no importa nada de infraestructura**.

```
┌──────────────────────────────────────────────────────────────┐
│  app/  (Next.js App Router)                                  │
│  · /dashboard        gráfico mensual por categoría   (Req. 9)│
│  · /bandeja          confirmación de inferencias     (Req. 7)│
│  · /api/inngest      endpoint del workflow                   │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│  workflow/  (Inngest — durabilidad, reintentos, backoff)     │
│                                                              │
│   ingestarAvisos (cron)                                      │
│        └─ emite evento  aviso/recibido                       │
│                                                              │
│   procesarAviso (por evento)                                 │
│        step 1  ingestar     → emails_crudos      (Req. 1)    │
│        step 2  extraer      → gastos             (Req. 2, 3) │
│        step 3  categorizar  → gastos.categoria   (Req. 5, 6) │
│        step 4  imputar      → imputaciones       (Req. 8)    │
└───────────────────────────┬──────────────────────────────────┘
                            │  usa
        ┌───────────────────┴────────────────────┐
        │                                        │
┌───────▼─────────────────┐          ┌───────────▼─────────────┐
│  dominio/  (PURO)       │          │  infra/  (ADAPTADORES)  │
│  · parseo               │          │  · gmail/               │
│  · normalizacion        │          │  · ia/                  │
│  · categorizacion       │          │  · db/  (repositorios)  │
│  · imputacion           │          │                         │
│  sin red · sin base     │          │  sin lógica de negocio  │
└─────────────────────────┘          └─────────────────────────┘
```

**Por qué Inngest y no un cron propio.** Cada `step.run` de Inngest se persiste al completarse: si el
paso 3 falla, el reintento no vuelve a ejecutar los pasos 1 y 2. Eso satisface 10.1 y 10.2 sin que
escribamos una máquina de estados a mano. La lógica sigue viviendo en el repositorio y en git, no en un
editor visual.

**Por qué el workflow no contiene lógica.** Cada `step.run` hace exactamente tres cosas: leer del
repositorio, llamar a una función pura, escribir el resultado. Si un `step.run` tiene un `if` de negocio
adentro, ese `if` está en el lugar equivocado.

## Componentes e interfaces

### `dominio/parseo/decodificarQuotedPrintable`

- **Responsabilidad:** convertir el cuerpo `quoted-printable` del email a texto UTF-8 (Req. 2.1).
- **Interfaz:**

```ts
export function decodificarQuotedPrintable(crudo: string): string
```

- **Depende de:** nada. Resuelve los saltos suaves (`=` al final de línea) y las secuencias `=XX`.

### `dominio/parseo/parsearAvisoSantander`

- **Responsabilidad:** extraer los campos del aviso buscando por etiqueta normalizada, no por posición
  en el árbol HTML (Req. 2.2, 2.6). Devuelve texto crudo: no normaliza, no convierte, no sabe de
  decimales ni de zonas horarias.
- **Interfaz:**

```ts
export type ResultadoParseo =
  | { tipo: 'aviso_de_consumo'; datos: DatosAviso }
  | { tipo: 'no_es_aviso' }                                  // Req. 4.1
  | { tipo: 'aviso_ilegible'; camposFaltantes: CampoAviso[] } // Req. 2.11

export interface DatosAviso {
  montoTexto: string          // "$2.571,30"
  comercio: string            // "WWWAYSACOMAR"
  fechaTexto: string          // "24/08/2026"
  horaTexto: string           // "11:14"
  cuotasTexto: string | null  // "1" | null si la fila no existe   (Req. 2.4, 2.5)
  tipoTarjeta: TipoTarjeta    // 'debito' | 'credito'              (Req. 2.7, 2.8)
  tarjetaUltimos4: string     // "9344"                            (Req. 2.9)
}

export type CampoAviso =
  | 'monto' | 'comercio' | 'fecha' | 'hora' | 'tipoTarjeta' | 'tarjetaUltimos4'

export function parsearAvisoSantander(html: string): ResultadoParseo
```

- **Depende de:** `parse5` (tolerante a HTML mal formado; el aviso de crédito tiene un `<div>` dentro de
  un `<table>`).
- **Nota de diseño:** los tres resultados posibles no son un detalle de implementación — son
  exactamente los tres caminos que exigen los requisitos. `no_es_aviso` va a `descartado` (4.1),
  `aviso_ilegible` va a `needs_review` (2.11), y solo `aviso_de_consumo` sigue. Un `null` genérico
  colapsaría dos caminos que deben permanecer distintos (4.2).
- **Detección del tipo de tarjeta:** por el texto del párrafo de la tarjeta, nunca por el asunto, que es
  idéntico en ambos avisos (Req. 2.10).

### `dominio/normalizacion/normalizarAviso`

- **Responsabilidad:** convertir los textos del aviso en valores tipados y validarlos (Req. 3).
- **Interfaz:**

```ts
export type ResultadoNormalizacion =
  | { ok: true; datos: GastoNormalizado }
  | { ok: false; motivo: MotivoRevision }

export type MotivoRevision =
  | 'monto_invalido'      // Req. 3.5
  | 'fecha_invalida'
  | 'fecha_futura'        // Req. 3.6
  | 'cuotas_invalidas'    // Req. 3.7
  | 'campos_faltantes'    // Req. 2.11
  | 'error_de_paso'       // Req. 10.2

export interface GastoNormalizado {
  montoTotal: Decimal
  moneda: 'ARS'
  comercio: string
  fechaGasto: Date          // instante exacto, compuesto en zona ART  (Req. 3.3)
  tipoTarjeta: TipoTarjeta
  tarjetaUltimos4: string
  cuotasTotal: number
}

export function normalizarAviso(
  datos: DatosAviso,
  ahora: Date,               // inyectado: la validación de fecha futura debe ser testeable (Req. 3.6)
): ResultadoNormalizacion

export function normalizarMonto(texto: string): Decimal | null      // Req. 3.1
export function componerFechaGasto(fecha: string, hora: string): Date | null  // Req. 3.3
```

- **Depende de:** `decimal.js` y `@date-fns/tz` (o `Temporal` si el runtime lo soporta).
- **`ahora` se inyecta.** Una función que llama a `new Date()` adentro no se puede testear sin viajar en
  el tiempo. El reloj es una dependencia como cualquier otra.

### `dominio/imputacion/resolverMontoTotal`

- **Responsabilidad:** aislar la interpretación del campo `Monto` en una compra en cuotas
  (Req. 8.8).
- **Interfaz:**

```ts
export type InterpretacionMonto = 'total_de_la_compra' | 'valor_de_la_cuota'

export function resolverMontoTotal(
  montoDelAviso: Decimal,
  cuotas: number,
  interpretacion: InterpretacionMonto,
): Decimal
```

- **Nota de diseño:** la pregunta quedó **resuelta**: el aviso informa el **valor de una sola cuota**.
  La constante vigente es `INTERPRETACION_MONTO = 'valor_de_la_cuota'`, y con ella
  `resolverMontoTotal` devuelve `montoDelAviso * cuotas` (Req. 8.8). El parámetro se conserva porque
  es lo que hace testeable la decisión y lo que la mantiene en un solo lugar si el banco cambia el
  formato — no porque siga habiendo duda.
- **Consecuencia sobre la exactitud:** el total es un producto exacto en `Decimal`, así que
  `dividirEnCuotas(total, n)` reparte sin resto y la invariante de 8.3 se cumple trivialmente en el
  camino de cuotas iguales. El reparto con redondeo sigue existiendo y sigue testeado, porque es la
  garantía que protege el invariante ante cualquier otro origen del total.

### `dominio/categorizacion/categorizarPorReglas`

- **Responsabilidad:** decidir la categoría por regla, de forma determinista y sin IA adentro (Req. 5).
- **Interfaz:**

```ts
export type Categoria = 'Salidas' | 'Comida' | 'Extras' | 'Sin categorizar'
export const CATEGORIAS_INFERIBLES = ['Salidas', 'Comida', 'Extras'] as const  // Req. 5.1, 6.1

export interface Regla {
  id: string
  patronComercio: string
  categoria: Categoria
  prioridad: number
  activa: boolean
}

export function categorizarPorReglas(
  comercio: string,
  reglas: readonly Regla[],
): Regla | null       // null = ninguna coincidió → derivar a inferencia (Req. 5.4)
```

- **Nota de diseño:** devuelve la **regla**, no la categoría. El paso que la invoca necesita saber cuál
  coincidió para registrar la trazabilidad. Filtra las inactivas y ordena por prioridad descendente
  (Req. 5.6); ante empate de prioridad, desempata por `id` para que 5.5 se cumpla sin ambigüedad.
- **Coincidencia por contención sobre texto normalizado** (Req. 5.7). Normalizar es pasar a mayúsculas,
  quitar acentos y colapsar espacios consecutivos; una regla coincide cuando su patrón normalizado
  está **contenido** en el comercio normalizado. No es igualdad: el aviso trae `COTO SUCURSAL 0142` y
  el patrón es `COTO SUCURSAL`. No es expresión regular: un patrón lo escribe el usuario desde la
  bandeja (Req. 7.6), y una regex mal formada rompería la categorización de todos los gastos
  siguientes, no solo la del comercio que la originó.
- **La IA no aparece en esta firma.** Es intencional: esta función es determinista y barata, y el
  orquestador decide llamar al modelo solo cuando devuelve `null` (Req. 6.2).

### Reglas semilla — comercios conocidos

Conjunto inicial que se carga en la migración de `reglas_categoria` con `creada_por = 'usuario'`,
`activa = true` y `prioridad = 0` (Req. 5.8). Los patrones se guardan ya normalizados y se evalúan por
contención (Req. 5.7), así que cubren las variantes con número de sucursal o sufijo que agrega el banco.

| Patrón de comercio | Categoría |
|---|---|
| `MERPAGO*LAFRUTAALEGRE` | Comida |
| `SUPER CORAZON` | Comida |
| `COTO SUCURSAL` | Comida |
| `RES SOLDADO` | Comida |
| `PANADERIA Y CONFITERIA` | Comida |
| `SUBE` | Salidas |
| `PAY*AR*UBER` | Salidas |
| `MISTER PEDRO` | Salidas |
| `HAVANNA` | Salidas |
| `FARMACITY` | Extras |

- **Por qué son reglas y no una constante en el código.** Una regla es una fila que el usuario puede
  desactivar o corregir desde la bandeja sin un deploy. La semilla es solo el estado inicial de una
  tabla que el sistema sigue llenando solo (Req. 7.6).
- **`SUBE` es el patrón más corto y el de mayor riesgo de falso positivo** por contención. Se acepta
  porque ningún otro comercio de la lista lo contiene; si aparece uno, la corrección es una regla más
  específica con `prioridad` mayor, no un cambio de código.
- La semilla no incluye la categoría `Sin categorizar`: no es una categoría que una regla pueda
  asignar, es el destino de una inferencia que no llegó a una respuesta.

### `dominio/imputacion/dividirEnCuotas`

- **Responsabilidad:** repartir el monto total entre N cuotas conservando el total exacto (Req. 8.3).
- **Interfaz:**

```ts
export function dividirEnCuotas(montoTotal: Decimal, cuotas: number): Decimal[]
```

- **Invariante:** `dividirEnCuotas(m, n).reduce(suma) === m`, siempre, para todo `m` y todo `n ≥ 1`.
  El resto del redondeo a dos decimales se acumula en la última cuota. `$10.000,00` en 3 devuelve
  `[3333.33, 3333.33, 3333.34]`.

### `dominio/imputacion/calcularMesesDeImputacion`

- **Responsabilidad:** determinar en qué mes cae cada cuota (Req. 8.2, 8.4).
- **Interfaz:**

```ts
export type Mes = string  // 'AAAA-MM'

export function mesDe(fecha: Date): Mes                      // en zona ART
export function sumarMeses(mes: Mes, cantidad: number): Mes
export function calcularMesesDeImputacion(fechaGasto: Date, cuotas: number): Mes[]
```

- **Nota de diseño:** la aritmética de meses opera sobre la cadena `AAAA-MM`, no sobre objetos `Date`.
  Sumar un mes a un `Date` del 31 de enero devuelve el 2 o 3 de marzo según el año; sumar un mes a
  `'2026-01'` devuelve `'2026-02'` y no hay caso borde posible. La única conversión de zona horaria
  ocurre en `mesDe`, una sola vez.

### `infra/gmail/ClienteGmail`

- **Responsabilidad:** listar y traer mensajes del remitente configurado; renovar el token (Req. 1.4, 1.5).
- **Interfaz:**

```ts
export interface ClienteGmail {
  listarMensajesDe(remitente: string, desde: Date): Promise<string[]>  // ids
  traerMensajeCrudo(id: string): Promise<MensajeCrudo>
}

export class AccesoRevocadoError extends Error {}   // Req. 1.5 — no se reintenta
```

### `infra/ia/inferirCategoria`

- **Responsabilidad:** proponer una categoría para un comercio desconocido (Req. 6).
- **Interfaz:**

```ts
export const RESPUESTAS_IA = [...CATEGORIAS_INFERIBLES, 'no_estoy_seguro'] as const  // Req. 6.1

export interface InferenciaCategoria {
  categoria: (typeof CATEGORIAS_INFERIBLES)[number]
  justificacion: string
}

export function inferirCategoria(
  comercio: string,
  cliente: ClienteIA,
): Promise<InferenciaCategoria | null>
// null = el modelo se abstuvo, respondió fuera del enum, o la llamada falló (Req. 6.4, 6.5, 6.7)
```

- **Depende de:** SDK de Anthropic, modelo `claude-sonnet-5`, con salida estructurada restringida a
  `RESPUESTAS_IA`. La validación del enum se hace igual en el borde: la restricción del schema es una
  ayuda, no una garantía (Req. 6.4).
- **Nota de diseño — la abstención es un valor del enum, no un `null` implícito.** El prompt instruye
  explícitamente a responder `no_estoy_seguro` cuando el comercio no permite inferir la categoría con
  confianza, y a **no** adivinar. Sin esa opción declarada, un enum de tres valores fuerza al modelo a
  elegir siempre, y su justificación sonará igual de convincente esté acertando o inventando.
- **Los tres caminos convergen en el mismo estado** — `Sin categorizar`, origen `ia`, sin confirmar —
  porque para el usuario son el mismo hecho: hay que elegir a mano. Lo que los distingue es la
  justificación persistida, que en la abstención es la del modelo y en la falla es la traza del error
  (Req. 6.6, 10.4).

### `infra/db/` — repositorios

- **Responsabilidad:** persistencia. Un repositorio por agregado, sin lógica de negocio.
- **Interfaz:**

```ts
export interface RepositorioEmails {
  guardarSiEsNuevo(mensaje: MensajeCrudo): Promise<{ id: string; yaExistia: boolean }>  // Req. 1.2, 1.3
  marcarDescartado(id: string): Promise<void>                                          // Req. 4.1
  traerCrudo(id: string): Promise<MensajeCrudo>                                        // Req. 10.3
}

export interface RepositorioGastos {
  crear(datos: GastoNormalizado, emailId: string): Promise<Gasto>
  crearParaRevision(emailId: string, motivo: MotivoRevision,
                    camposParciales: Partial<GastoNormalizado>): Promise<Gasto>        // Req. 2.11, 2.12, 3.5, 3.6, 3.7
  actualizarDatos(id: string, datos: GastoNormalizado): Promise<void>                  // Req. 10.3
  asignarCategoria(id: string, categoria: Categoria, origen: OrigenCategoria,
                   justificacion: string | null): Promise<void>
  confirmar(id: string, categoria: Categoria): Promise<void>                           // Req. 7.3, 7.4
  marcarParaRevision(id: string, motivo: MotivoRevision,
                     ultimoError: string | null): Promise<void>                        // Req. 10.2, 10.4
  pendientesDeConfirmacion(): Promise<Gasto[]>                                         // Req. 7.1, 7.2
}
```

- **`crearParaRevision` y `actualizarDatos` — decisión de diseño del 2026-08-29, escalada por T32 y T40 y
  resuelta por el usuario.** `crear` exige un `GastoNormalizado` completo (los siete campos no nulos) y
  es de solo inserción, así que no cubre dos casos reales: un aviso ilegible o una normalización fallida
  que necesita persistir una fila `needs_review` con los campos que sí se pudieron leer y el resto en
  `NULL` (T32), y el reprocesamiento de un email cuyo gasto **ya existe** en `needs_review`, que necesita
  sobreescribir sus siete campos de datos sin violar la unicidad de `email_id` (T40, Req. 10.3).
  `crearParaRevision` inserta con `motivo_revision` fijo y cualquier campo ausente en `Partial` como
  `NULL` — nunca con un valor por defecto (Req. 2.12). `actualizarDatos` hace un `UPDATE` de los siete
  campos de datos sobre una fila existente; no toca `categoria`, `confirmado` ni `motivo_revision` — esos
  siguen siendo responsabilidad de `asignarCategoria`, `confirmar` y `marcarParaRevision`.

```ts

export interface RepositorioImputaciones {
  reemplazarPara(gastoId: string, imputaciones: NuevaImputacion[]): Promise<void>       // Req. 8.6
  totalesPorMesYCategoria(desde: Mes, hasta: Mes): Promise<FilaDashboard[]>             // Req. 9.1
}
```

### Superficie visual — `app/dashboard`, `app/bandeja`

- **Responsabilidad:** presentación. Sin lógica de cálculo: los totales llegan resueltos desde el
  repositorio (Req. 9.1).
- **Dos pantallas, no tres** (decisión de alcance del 2026-08-26). `/revision` quedó fuera de esta
  versión: la lista de gastos en `needs_review`, el acceso al email crudo desde la interfaz, la sección
  "Errores del sistema" y el formulario de carga manual no se construyen acá.
- **El estado `needs_review` sigue siendo parte del diseño.** Es el destino de todo camino de error
  (Req. 10.2), garantiza que ningún fallo produzca un monto inventado, y excluye al gasto de los
  totales (Req. 9.5). Lo que falta es la pantalla que lo muestra, no el dato: `motivo_revision`,
  `ultimo_error` y `estado` se siguen escribiendo (Req. 10.4), y el email crudo se conserva
  intacto. Un spec posterior dibuja la superficie sobre datos que ya van a estar ahí.
- **Consecuencia asumida:** dentro de la aplicación, un gasto en `needs_review` es invisible, y el
  total del mes lo subestima sin señal alguna. La única recuperación es de operador — reprocesar el
  email crudo ya almacenado (Req. 10.3), invocable desde el panel de Inngest, no desde la app.
- **Nota de diseño:** el proyecto **no tiene todavía patrones visuales establecidos** — esta feature es
  la primera superficie que se construye. Por lo tanto este documento los establece, y los specs
  posteriores deben heredarlos en lugar de definir estilos propios:
  - Tailwind CSS con tokens semánticos (`--color-superficie`, `--color-texto`, `--color-acento`),
    nunca colores literales en los componentes.
  - Una categoría, un color estable en todo el sistema: el color de `Comida` es el mismo en el gráfico,
    en la bandeja y en el indicador de pendientes.
  - El indicador "sin confirmar" (Req. 9.3) se comunica con **patrón visual y etiqueta de texto**, no
    solo con color, para que sea legible sin depender de la percepción cromática.
  - Componentes divididos en contenedor (obtiene datos) y presentación (recibe props). Los de
    presentación se testean sin base de datos.

## Modelos de datos

```sql
CREATE TYPE estado_email    AS ENUM ('pendiente', 'procesado', 'descartado', 'error');
CREATE TYPE estado_gasto    AS ENUM ('pendiente','extraido','categorizado','imputado','needs_review');
CREATE TYPE tipo_tarjeta    AS ENUM ('debito', 'credito');
CREATE TYPE origen_categoria AS ENUM ('regla', 'ia', 'usuario');

-- Req. 1: el email crudo es la fuente de verdad y se guarda antes que nada
CREATE TABLE emails_crudos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id   text NOT NULL UNIQUE,          -- Req. 1.2, 1.3 · idempotencia
  remitente          text NOT NULL,
  asunto             text NOT NULL,
  headers_crudos     text NOT NULL,                 -- Req. 1.1 · bloque de headers crudo, completo
  cuerpo             text NOT NULL,
  recibido_en        timestamptz NOT NULL,
  estado             estado_email NOT NULL DEFAULT 'pendiente',
  procesado_en       timestamptz
);

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

-- Req. 2, 3, 5, 6: la compra como hecho único
CREATE TABLE gastos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id            uuid NOT NULL UNIQUE REFERENCES emails_crudos(id),
  monto_total         numeric(14,2),                -- Req. 3.2 · NUNCA float
  moneda              text NOT NULL DEFAULT 'ARS',
  comercio            text,
  fecha_gasto         timestamptz,                  -- Req. 3.3 · de la tabla, no del header
  tipo_tarjeta        tipo_tarjeta,
  tarjeta_ultimos4    text,
  cuotas_total        int,
  categoria_id        smallint REFERENCES categorias(id),
  categoria_origen    origen_categoria,
  categoria_justificacion text,                     -- Req. 6.6
  confirmado_en       timestamptz,                  -- NULL = pendiente de confirmar (Req. 7.1)
  estado              estado_gasto NOT NULL DEFAULT 'pendiente',
  motivo_revision     text,                         -- Req. 10.4
  ultimo_error        text,                         -- Req. 10.4
  creado_en           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT monto_positivo CHECK (monto_total IS NULL OR monto_total > 0),   -- Req. 3.5
  CONSTRAINT cuotas_validas CHECK (cuotas_total IS NULL OR cuotas_total >= 1) -- Req. 3.7
);

-- Req. 8: el impacto mensual, N filas por gasto
CREATE TABLE imputaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id      uuid NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
  numero_cuota  int NOT NULL CHECK (numero_cuota >= 1),
  monto         numeric(14,2) NOT NULL CHECK (monto >= 0),
  mes           char(7) NOT NULL,                   -- 'AAAA-MM' (Req. 8.4)
  UNIQUE (gasto_id, numero_cuota)                   -- Req. 8.6
);

CREATE INDEX ON imputaciones (mes);
CREATE INDEX ON gastos (estado) WHERE estado = 'needs_review';
CREATE INDEX ON gastos (confirmado_en) WHERE confirmado_en IS NULL;
```

**Invariantes que el schema no puede expresar y el dominio sí:**

- `SUM(imputaciones.monto WHERE gasto_id = G) = gastos.monto_total` (Req. 8.3). Se garantiza en
  `dividirEnCuotas` y se verifica con un test de integración sobre datos reales.
- `COUNT(imputaciones WHERE gasto_id = G) = gastos.cuotas_total` (Req. 8.1).
- Un gasto en `needs_review` puede tener campos en `NULL`; por eso las columnas de datos son nullables.
  Es deliberado: preferimos una fila incompleta y visible antes que un valor inventado (Req. 2.12).

**Vista del dashboard** (Req. 9.1, 9.5) — el dashboard nunca consulta `gastos` directamente:

```sql
CREATE VIEW vista_gastos_mensuales AS
SELECT i.mes, c.nombre AS categoria, SUM(i.monto) AS total,
       bool_or(g.confirmado_en IS NULL) AS tiene_sin_confirmar   -- Req. 9.3
FROM imputaciones i
JOIN gastos g ON g.id = i.gasto_id
LEFT JOIN categorias c ON c.id = g.categoria_id
WHERE g.estado <> 'needs_review'                                 -- Req. 9.5
GROUP BY i.mes, c.nombre;
```

## Flujo de datos

### Escenario A — Débito, comercio conocido (camino feliz, sin intervención)

1. `ingestarAvisos` consulta Gmail por mensajes del remitente configurado (Req. 1.1, 1.7) y emite un
   evento `aviso/recibido` por cada id.
2. **step ingestar** — `guardarSiEsNuevo`. El `UNIQUE` sobre `gmail_message_id` decide: si ya existía,
   el paso termina sin efectos (Req. 1.3). El cuerpo queda persistido antes de cualquier otra cosa
   (Req. 1.6).
3. **step extraer** — `decodificarQuotedPrintable` → `parsearAvisoSantander` devuelve
   `aviso_de_consumo` con `montoTexto: "$2.571,30"`, `comercio: "WWWAYSACOMAR"`, `fechaTexto:
   "24/08/2026"`, `horaTexto: "11:14"`, `cuotasTexto: null`, `tipoTarjeta: 'debito'`. `normalizarAviso`
   produce `montoTotal: 2571.30`, `fechaGasto: 2026-08-24T11:14:00-03:00`, `cuotasTotal: 1` (Req. 2.5,
   3.1, 3.3). Se crea el gasto en estado `extraido`.
4. **step categorizar** — `categorizarPorReglas('WWWAYSACOMAR', reglas)` encuentra la regla del comercio.
   Se asigna la categoría con origen `regla` y `confirmado_en = now()` (Req. 5.3). El modelo **no se
   invoca** (Req. 6.2).
5. **step imputar** — `calcularMesesDeImputacion(fechaGasto, 1)` devuelve `['2026-08']` y
   `dividirEnCuotas(2571.30, 1)` devuelve `[2571.30]`. Se escribe una imputación. Gasto en `imputado`.
6. El dashboard, en su próxima lectura, suma esa imputación en `2026-08`. Nunca hubo un paso que
   "actualice el dashboard": el dato es la fuente, el gráfico es la vista.

### Escenario B — Crédito en 6 cuotas, comercio desconocido

1. Pasos 1 a 3 idénticos. El parser encuentra la fila `Cuotas` y devuelve `cuotasTexto: "6"` (Req. 2.4);
   `tipoTarjeta: 'credito'` sale del párrafo de la tarjeta, no del asunto (Req. 2.10).
2. `resolverMontoTotal(montoDelAviso, 6, 'valor_de_la_cuota')` multiplica el monto del aviso por 6 y
   fija el monto total de la compra (Req. 8.8).
3. **step categorizar** — `categorizarPorReglas('PAYU*AR*UBER', reglas)` devuelve `null` (Req. 5.4).
   Se invoca `inferirCategoria`, que devuelve `{ categoria: 'Extras', justificacion: '...' }`. Se
   asigna con origen `ia` y `confirmado_en = NULL` (Req. 6.3).
4. **step imputar** — `dividirEnCuotas` devuelve 6 montos cuya suma es exactamente el total (Req. 8.3);
   `calcularMesesDeImputacion` devuelve `['2026-08' … '2027-01']` (Req. 8.2). Se escriben 6
   imputaciones.
5. El dashboard **ya suma las 6**, cada una marcada como "sin confirmar" (Req. 9.3). El total del mes
   no miente hacia abajo mientras el gasto espera confirmación.
6. La bandeja muestra el gasto con su justificación (Req. 7.2). El usuario corrige a `Salidas`: se
   registra `confirmado_en`, el origen pasa a `usuario` (Req. 7.4) y se le ofrece crear la regla
   (Req. 7.5). Las 6 imputaciones cambian de categoría por el join, sin recalcular montos ni meses
   (Req. 9.4).
7. La próxima compra en `PAYU*AR*UBER` se resuelve por regla y no vuelve a la bandeja (Req. 7.6).

## Manejo de errores

| Condición | Manejo | Requisito |
|---|---|---|
| Email ya ingerido (mismo `gmail_message_id`) | El `UNIQUE` lo detecta; el paso termina sin crear nada | 1.3 |
| Token de Gmail vencido | Renovar con el token de refresco y reintentar | 1.4 |
| Acceso a Gmail revocado | `AccesoRevocadoError`: no se reintenta; el error queda registrado de forma persistente y consultable por el operador, no en una superficie in-app (`/revision` está fuera de alcance) | 1.5 |
| Falla en cualquier paso posterior a la ingesta | El email crudo ya está persistido y queda intacto | 1.6, 10.2 |
| El email no tiene estructura de aviso | `no_es_aviso` → email en `descartado`, sin crear gasto | 4.1, 4.2 |
| Falta un campo obligatorio del aviso | `aviso_ilegible` → gasto en `needs_review` con los campos faltantes; sin valores por defecto | 2.11, 2.12 |
| HTML mal formado | `parse5` lo tolera; la búsqueda es por etiqueta, no por estructura | 2.6 |
| Monto no parseable, cero o negativo | `monto_invalido` → `needs_review` (más `CHECK` en la base) | 3.5 |
| Fecha del gasto posterior a la ingesta | `fecha_futura` → `needs_review` | 3.6 |
| Cuotas no entero o menor a 1 | `cuotas_invalidas` → `needs_review` | 3.7 |
| El modelo devuelve una categoría fuera del enum | Se descarta la respuesta y se asigna `Sin categorizar` con origen `ia`, sin confirmar | 6.4 |
| El modelo responde `no_estoy_seguro` | `Sin categorizar` con origen `ia` y sin confirmar; llega a la bandeja sin categoría propuesta | 6.7, 7.10 |
| La llamada al modelo falla tras reintentar | `Sin categorizar` con origen `ia` y **el pipeline continúa**: el gasto se imputa igual | 6.5 |
| Falla transitoria en un paso | Reintento con espera creciente; los pasos previos no se re-ejecutan | 10.1 |
| Reintentos agotados | `needs_review` + `ultimo_error` registrado | 10.2, 10.4 |
| Reprocesar un email ya guardado | `traerCrudo` desde la base, sin volver a Gmail | 10.3 |
| Gasto en `needs_review` | Excluido de los totales; sin superficie propia en esta versión | 9.5 |

**Principio rector:** ningún camino de error produce un monto. Un gasto que no se pudo leer queda
visible e incompleto; nunca se completa con un cero ni con una estimación (Req. 2.12).

## Estrategia de testing

**Unitario — dominio puro, sin base ni red.** Es donde va el grueso de los tests:

- `decodificarQuotedPrintable`: saltos suaves, `=3D`, `=C3=B3`.
- `parsearAvisoSantander`: los tres resultados posibles. Etiqueta rodeada de saltos y espacios (el aviso
  de débito) y etiqueta pegada (el de crédito) deben dar el mismo resultado.
- `normalizarMonto`: `"$2.571,30" → 2571.30`; `"$4.663,00" → 4663.00`; texto basura → `null`.
- `componerFechaGasto`: `24/08/2026` + `11:14` en ART; y el caso del 31 a las 23:50, que debe caer en su
  propio mes.
- `categorizarPorReglas`: coincide, no coincide (`null`), respeta prioridad, ignora reglas inactivas.
- `dividirEnCuotas`: **la suma siempre da el total exacto**. Con un test basado en propiedades sobre
  montos y cantidades de cuotas variados, además del caso `10000 / 3`.
- `calcularMesesDeImputacion`: 1 cuota, 6 cuotas, y el cruce de año (`2026-08` + 5 = `2027-01`).

**Casos borde de cobertura obligatoria:**

- Compra del último día del mes a las 23:50 y del primero a las 00:10.
- Aviso sin fila `Cuotas` (débito) contra aviso con `Cuotas: 1` (crédito): mismo resultado.
- Comercio que coincide con dos reglas de distinta prioridad.
- Respuesta del modelo fuera del enum.
- Monto de un centavo repartido en cuotas.

**Integración — con Postgres real, con Gmail y Claude simulados.** Los fixtures son los **avisos reales
del banco**, anonimizados, guardados como archivos: uno de débito, uno de crédito, y uno que no es un
aviso de consumo. Cada email raro que aparezca en producción se incorpora como fixture nuevo.

- Reprocesar el mismo `gmail_message_id` no duplica gasto ni imputaciones.
- Un modelo simulado que devuelve basura deja `Sin categorizar` y **no** frena la imputación.
- Confirmar desde la bandeja crea la regla y retira el gasto de los pendientes.
- La suma de la vista mensual coincide con la suma de los montos totales de los gastos imputados.

**E2E (Playwright), tres casos** — se definen en la fase de `plan-test-cases`, derivados del spec:
el dashboard suma correctamente el mes; confirmar desde la bandeja crea la regla; corregir la categoría
reacomoda el gráfico.

**Regla de verificación del proyecto:** un test que pasa en su primera corrida no está verificado. Se
muta lo que debería detectar, se confirma que falla **solo ese test**, y se restaura con edición directa.

## Decisiones de diseño y trade-offs

- **Decisión:** extracción con parser determinista; la IA queda solo para categorizar.
  **Justificación:** el aviso es una tabla con etiquetas fijas. Un parser da el mismo resultado siempre,
  sin costo ni latencia, y cuando el banco cambie el template **falla de forma visible** en vez de
  improvisar un número plausible (Req. 2.11, 2.12).
  **Alternativa considerada:** extracción con LLM y salida estructurada — rechazada por introducir
  no-determinismo en el dato más sensible del sistema, que es la plata.

- **Decisión:** separar `gastos` de `imputaciones`.
  **Justificación:** una compra es un hecho y su impacto mensual son N hechos. Con esta separación,
  débito, crédito en una cuota y crédito en N cuotas recorren el mismo código sin un solo condicional
  (Req. 8.5), y el dashboard suma una sola tabla.
  **Alternativa considerada:** una columna `mes` en `gastos` — rechazada porque obliga a duplicar filas
  de compra para representar cuotas, o a calcular el prorrateo en cada consulta.

- **Decisión:** aritmética de meses sobre cadenas `AAAA-MM` en vez de sobre `Date`.
  **Justificación:** sumar meses a un `Date` tiene casos borde de desborde de día y de horario de
  verano. Sobre `'2026-01'` no existe caso borde posible. La conversión de zona horaria ocurre una sola
  vez, en `mesDe`.
  **Alternativa considerada:** `date-fns/addMonths` sobre el timestamp — rechazada por multiplicar los
  puntos donde un bug de zona horaria puede entrar.

- **Decisión:** el `Monto` de un aviso en cuotas es el **valor de una cuota**; el total se deriva
  multiplicando por la cantidad de cuotas, y la interpretación sigue aislada en `resolverMontoTotal`.
  **Justificación:** lo confirmó el usuario sobre sus propios avisos (2026-08-26). Mantener el
  parámetro `InterpretacionMonto` cuesta una línea y deja la decisión en un punto único, testeable y
  reversible si el banco cambia el formato del aviso.
  **Alternativa considerada:** hardcodear `montoDelAviso * cuotas` dentro del paso de imputación —
  rechazada porque entierra una regla de negocio dentro de un orquestador y la vuelve intesteable sin
  base de datos.

- **Decisión:** `/revision` sale del alcance; esta versión construye `/dashboard` y `/bandeja`.
  **Justificación:** las dos pantallas que quedan cubren el flujo que se ejecuta todos los días — ver
  en qué se va la plata y confirmar lo que la IA propuso. `/revision` cubre el camino excepcional, y
  construirla antes de tener un solo aviso real fallando es diseñar contra una falla imaginada.
  **Alternativa considerada:** achicar `/revision` a una lista de solo lectura, sin formulario de
  carga manual — rechazada porque una lista que muestra el problema y no deja arreglarlo es una
  pantalla que informa impotencia. O se arregla desde ahí, o no vale la superficie.
  **Costo asumido:** un gasto en `needs_review` no aparece en ningún lado de la app y el total del mes
  lo subestima en silencio. Se acepta a sabiendas: `needs_review` es preferible a un monto inventado
  (criterio 2.12), y el dato queda persistido esperando la pantalla.

- **Decisión:** el modelo puede abstenerse (`no_estoy_seguro`) en vez de ser forzado al enum de tres.
  **Justificación:** un enum cerrado de tres valores obliga al modelo a elegir aun cuando no tiene
  señal, y una categoría inventada con justificación convincente es peor que una celda vacía: entra al
  dashboard como un dato falso y el usuario no tiene motivo para revisarla. La abstención convierte la
  incertidumbre del modelo en una decisión explícita del usuario (Req. 6.1, 6.7, 7.10).
  **Alternativa considerada:** pedir un puntaje de confianza numérico y aplicar un umbral —
  rechazada porque la confianza autorreportada de un LLM no está calibrada, y el umbral sería un
  número inventado que habría que justificar sin datos.

- **Decisión:** los gastos con categoría inferida entran a los totales antes de ser confirmados.
  **Justificación:** el total de un mes no debe subestimar el gasto real por una confirmación pendiente.
  La plata ya salió de la cuenta, la tenga o no etiquetada (Req. 9.3).
  **Alternativa considerada:** ocultarlos hasta confirmar — rechazada porque convierte el descuido en
  un dato falso.

- **Decisión:** el reloj y el conjunto de reglas se inyectan en las funciones puras.
  **Justificación:** son las dos dependencias que, escondidas adentro, vuelven no testeable a la lógica
  que decide plata.
  **Alternativa considerada:** leer el reloj y las reglas dentro de cada función — rechazada por
  obligar a montar base de datos y a manipular el tiempo del sistema para testear una división.

- **Decisión:** el fallback de extracción con IA queda fuera de alcance.
  **Justificación:** dos caminos posibles para el mismo monto es una fuente de errores silenciosos.
  Que el parser falle de forma ruidosa es una característica, no una carencia.
  **Alternativa considerada:** delegar al modelo cuando el parser no entiende — postergada a un spec
  futuro, si la frecuencia de cambios de template lo justifica.
