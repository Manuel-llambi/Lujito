import { serve } from 'inngest/next'
import { Pool } from 'pg'
import { inngest } from '@/workflow/clienteInngest'
import { crearFuncionProcesarAviso } from '@/workflow/procesarAviso'
import { crearFuncionReprocesarAviso } from '@/workflow/reprocesarAviso'
import { crearFuncionIngestarAvisos } from '@/workflow/ingestarAvisos'
import { crearRepositorioEmails } from '@/infra/db/repositorioEmails'
import { crearRepositorioAccesoGmail } from '@/infra/db/repositorioAccesoGmail'
import { crearRepositorioGastos } from '@/infra/db/repositorioGastos'
import { crearRepositorioReglas } from '@/infra/db/repositorioReglas'
import { crearRepositorioImputaciones } from '@/infra/db/repositorioImputaciones'
import { crearClienteGmail } from '@/infra/gmail/clienteGmail'
import { crearTransporteGmailHttp } from '@/infra/gmail/transporteGmailHttp'
import { crearRenovarTokenGmail } from '@/infra/gmail/renovarTokenGmail'
import { crearClienteClaudeHttp } from '@/infra/ia/clienteClaudeHttp'

// Raíz de composición (Decision log de T29): el único lugar del proyecto que lee `process.env` y
// arma las dependencias reales que el workflow recibe inyectadas. `dominio/` e `infra/` no conocen
// esta variable de entorno ni ninguna otra.
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const repositorioEmails = crearRepositorioEmails(pool)
const repositorioAccesoGmail = crearRepositorioAccesoGmail(pool)
const repositorioGastos = crearRepositorioGastos(pool) // T30
const repositorioReglas = crearRepositorioReglas(pool) // T33
const repositorioImputaciones = crearRepositorioImputaciones(pool) // T36

// Remitente real de los avisos de consumo (Req. 1.7) — el mismo dominio que los fixtures anonimizados
// de `test/fixtures/avisos-santander/`.
const REMITENTE_SANTANDER = 'mensajesyavisos@mails.santander.com.ar'

// Ventana de la primera corrida (Decision log de T-wiring-real): con `emails_crudos` vacía —
// instalación nueva o base recién migrada— no hay `recibido_en` del cual partir. Traer todo el
// historial de la cuenta en esa corrida sería tanto lento como fuera del alcance del pipeline
// (Req. 1.1 es sobre avisos nuevos, no una migración histórica), así que se acota a las últimas 24h.
const VENTANA_PRIMERA_CORRIDA_MS = 24 * 60 * 60 * 1000

const clienteGmail = crearClienteGmail(
  crearTransporteGmailHttp(),
  {
    tokenAcceso: process.env.GMAIL_TOKEN_ACCESO ?? '',
    tokenRefresco: process.env.GMAIL_TOKEN_REFRESCO ?? '',
  },
  crearRenovarTokenGmail(process.env.GMAIL_CLIENT_ID ?? '', process.env.GMAIL_CLIENT_SECRET ?? ''),
  repositorioAccesoGmail,
)

const clienteIA = crearClienteClaudeHttp(process.env.ANTHROPIC_API_KEY ?? '')

const procesarAviso = crearFuncionProcesarAviso({
  repositorioEmails,
  clienteGmail,
  repositorioGastos,
  repositorioReglas,
  repositorioImputaciones,
  clienteIA,
})

// Sin `clienteGmail` (Decision log de T40): a diferencia de `procesarAviso`, este reprocesamiento no
// depende del transporte de Gmail — es invocable desde el panel de Inngest sin tocar la red
// (Req. 10.3).
const reprocesarAviso = crearFuncionReprocesarAviso({
  repositorioEmails,
  repositorioGastos,
  repositorioReglas,
  repositorioImputaciones,
  clienteIA,
})

const ingestarAvisos = crearFuncionIngestarAvisos({
  clienteGmail,
  remitenteConfigurado: REMITENTE_SANTANDER,
  async obtenerDesde() {
    const ultimaRecepcion = await repositorioEmails.obtenerUltimaRecepcion()
    return ultimaRecepcion ?? new Date(Date.now() - VENTANA_PRIMERA_CORRIDA_MS)
  },
})

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [procesarAviso, reprocesarAviso, ingestarAvisos],
})
