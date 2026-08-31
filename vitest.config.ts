import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Convención fijada en T1 (ver Decision log): los tests unitarios y de integración
// viven colocados junto al módulo que ejercitan, como `*.test.ts`. Los fixtures de
// avisos reales anonimizados viven en `test/fixtures/`.
export default defineConfig({
  // `react()` (T42, Decision log): `tsconfig.json` usa `jsx: "preserve"` porque así lo exige Next.js
  // —el propio compilador de Next transforma el JSX en `next dev`/`next build`—, pero Vitest no pasa
  // por ese compilador. Sin este plugin, Vite intenta el runtime clásico de React
  // (`React.createElement` implícito) y los tests de componentes fallan con `React is not defined`.
  // `@vitejs/plugin-react` le da a Vitest su propio transform con el runtime automático, sin tocar
  // `tsconfig.json` ni el build real de Next.
  plugins: [react(), tsconfigPaths()],
  test: {
    // `.tsx` se suma en T42 (Decision log): primeros tests de componentes de presentación.
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', 'e2e', '.next'],
    environment: 'node',
    // Matchers de jest-dom para los tests de componentes (T42 en adelante); no afecta a los tests
    // que no los usan.
    setupFiles: ['./test/setupVitest.ts'],
    // `pool: 'threads'` (Decision log de T29, reemplaza la elección de T15). El pool por defecto de
    // esta versión de Vitest es `forks` (child_process.fork vía tinypool/ProcessWorker), que ya
    // había fallado de forma intermitente en este entorno Windows con `spawn UNKNOWN` (T15, resuelto
    // entonces forzando `singleFork: true`). Al incorporar `@inngest/test` (T29), la combinación
    // `pool: 'forks'` + `@inngest/test` + PGlite (WASM) provoca un crash reproducible y determinista
    // — no intermitente — de V8 por agotamiento de memoria de Zone ("Fatal process out of memory:
    // Zone") apenas se importa `InngestTestEngine` en el mismo proceso que instancia PGlite,
    // incluso sin ejecutar ningún test. Diagnosticado aislando el problema en un script Node plano
    // (sin Vitest): ahí las mismas dos librerías conviven sin problema, así que el conflicto es del
    // pool de procesos de Vitest/esbuild, no de las librerías en sí. Cambiar a `pool: 'threads'`
    // (worker_threads en vez de procesos hijos) resuelve las dos fallas a la vez: se verificó
    // corriendo la suite completa tres veces seguidas sin errores.
    pool: 'threads',
    // `hookTimeout` (hallazgo de infraestructura, T22): con siete archivos de test que levantan su
    // propia base PGlite en `beforeAll` (T16, T17, T18, T21, T22, T29 y el runner de migraciones),
    // Vitest los corre en paralelo por default y cada uno instancia su propio Postgres WASM más un
    // `PGLiteSocketServer` — bajo contención de CPU eso empuja a algunos por encima del default de
    // 10000ms, con un `beforeAll` distinto fallando por timeout en cada corrida (no siempre el mismo
    // archivo, señal de contención de recursos y no de un bug determinista). Confirmado corriendo la
    // suite completa dos veces seguidas: falló un archivo distinto cada vez, siempre con "Hook timed
    // out in 10000ms" en `crearBasePostgresDeTest`. Subir el límite a 30000ms le da margen a los siete
    // arranques concurrentes sin serializarlos.
    hookTimeout: 30000,
    // `poolOptions.threads.maxThreads` (hallazgo de infraestructura, T23): con la suite ya en 188
    // tests y siete archivos que instancian su propia base PGlite (WASM) en paralelo, `vitest run`
    // sin límite de threads empezó a crashear el proceso entero de forma determinista con "Fatal
    // process out of memory: Zone" — el mismo error de V8 que el Decision log de T29 documentó para
    // el conflicto `@inngest/test` + PGlite bajo `pool: 'forks'`, reaparecido acá por presión de
    // memoria: cada worker thread trae su propio isolate de V8 más su propia instancia de PGlite, y
    // con siete a la vez el conjunto agota el espacio de Zone. `--no-file-parallelism` lo confirma:
    // corriendo todo en serie no crashea, pero seria todo el contrato de verificación (`npm test`)
    // sin necesidad, y ya no detecta correctamente una mutación dirigida por diseño. La solución es
    // acotar los workers en paralelo, no eliminarlos: `maxThreads: 4` deja margen de memoria y se
    // verificó corriendo la suite completa tres veces seguidas sin ningún crash y en un tiempo
    // comparable al de antes del hallazgo.
    //
    // Bajado a `maxThreads: 2` y después a `maxThreads: 1` (hallazgo de infraestructura, T51/T52): la
    // suite creció a 35 archivos, 11 de los cuales instancian al menos una base PGlite propia (T48-T52
    // agregaron `correccionDeCategoria.test.ts`, `rechazoDeRegla.test.ts` y una segunda base en
    // `repositorioReglas.test.ts`, entre otros). Con `maxThreads: 4` volvió el mismo "Fatal process out
    // of memory: Zone" que T23 ya había resuelto una vez, ahora determinista. `maxThreads: 2` alcanzó
    // para tres corridas limpias inmediatamente después de bajarlo, pero volvió a crashear en cuanto se
    // sumó un archivo más con base propia (T52) — el margen era justo, no real. `maxThreads: 1` serializa
    // los archivos de test entre sí (sin volver a `pool: 'forks'` ni a `--no-file-parallelism`, que
    // T29 y T23 ya habían descartado por otros motivos) y se verificó con tres corridas completas
    // seguidas sin ningún crash. El costo es tiempo de suite más largo; se acepta porque una corrida
    // lenta y confiable es preferible a una rápida que no siempre termina. Si la suite sigue creciendo,
    // el próximo paso no es seguir bajando este número sino reducir cuántos archivos instancian su
    // propia base PGlite (compartir una base entre describes relacionados donde el aislamiento no lo
    // exija).
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
      },
    },
  },
})
