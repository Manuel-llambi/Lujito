import { createServer } from 'node:net'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { Pool } from 'pg'
import { aplicarMigraciones } from '@/infra/db/migrar'

export interface BasePostgresDeTest {
  pool: Pool
  destruir(): Promise<void>
}

/**
 * Reserva un puerto TCP libre en loopback. `PGLiteSocketServer` no expone públicamente el puerto
 * que le asignó el sistema operativo cuando se le pide el puerto `0` (su campo `server` es privado
 * a nivel de tipos, no en tiempo de ejecución, pero apoyarse en eso es frágil); reservarlo antes con
 * un socket de sondeo y pasarlo explícito es el camino sin dependencias internas.
 */
function obtenerPuertoLibre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const sondeo = createServer()
    sondeo.unref()
    sondeo.on('error', reject)
    sondeo.listen(0, '127.0.0.1', () => {
      const direccion = sondeo.address()
      if (direccion === null || typeof direccion === 'string') {
        reject(new Error('No se pudo obtener un puerto libre para la base de test'))
        return
      }
      sondeo.close(() => resolve(direccion.port))
    })
  })
}

/**
 * Base de test descartable (Decision log de T16): levanta una instancia de Postgres real —el motor
 * de PGlite, Postgres compilado a WASM, no una emulación— expuesta por el protocolo de wire de
 * Postgres sobre un socket TCP local efímero. `pool` es un `pg.Pool` idéntico al que usa la
 * aplicación contra Supabase en producción: el código de los repositorios no sabe ni le importa que
 * del otro lado hay PGlite en vez de una red. Corre las migraciones antes de devolver el pool.
 */
export async function crearBasePostgresDeTest(): Promise<BasePostgresDeTest> {
  const puerto = await obtenerPuertoLibre()

  const db = new PGlite()
  // `maxConnections` de `PGLiteSocketServer` fija `net.Server.maxConnections`: Node destruye —no
  // encola— cualquier socket entrante que exceda ese número, lo que el cliente ve como
  // `ECONNRESET`. El valor por defecto es 1, y un `pg.Pool` puede abrir una conexión de reemplazo
  // antes de que la anterior termine de liberarse (rotación normal del pool), así que dejarlo en 1
  // lo deja sin margen. Se sube a 5 para absorber esa rotación; PGlite sigue siendo de un solo
  // escritor y `pool.max` abajo sigue en 1, así que las queries se siguen serializando igual.
  const servidor = new PGLiteSocketServer({ db, port: puerto, host: '127.0.0.1', maxConnections: 5 })
  await servidor.start()

  const pool = new Pool({
    host: '127.0.0.1',
    port: puerto,
    database: 'postgres',
    user: 'postgres',
    // PGlite es de un solo escritor: un único cliente lógico es correcto para esta base de test,
    // más allá del margen que se le da al `net.Server` de arriba para su propia rotación interna.
    max: 1,
  })

  await aplicarMigraciones(pool)

  return {
    pool,
    async destruir() {
      await pool.end()
      await servidor.stop()
      await db.close()
    },
  }
}
