// Servidor propio de la interfaz (Martian Map).
//
// Hace tres cosas, sin dependencias externas (solo Node 18 o superior):
//
// 1. Sirve la interfaz ya construida (carpeta dist/, generada con npm run build:servidor).
// 2. Reenvía los pedidos a los backends, de servidor a servidor:
//      /api/...        → BACKEND_1_URL  (API del mapa: /api/plan, /api/routes, …)
//      /analisis/...   → BACKEND_2_URL  (análisis: /gale/analyze, /health, …)
//      /monitoreo/...  → BACKEND_MONITOREO_URL (opcional)
//    Así el navegador solo habla con este servidor: da igual que los backends sean
//    http o que su IP esté bloqueada en la red de quien abre la página.
// 3. Pasa los mensajes entre la demo y el teléfono (control remoto):
//      POST /control/:sesion           publica un mensaje en la sesión (código de 4 dígitos)
//      GET  /control/:sesion/eventos   recibe los mensajes de la sesión (Server-Sent Events)
//      GET  /control/demos             demos activas, para que el teléfono elija una
//
// Configuración (variables de entorno):
//   PORT=8080  HOST=0.0.0.0
//   BACKEND_1_URL=http://52.0.36.196:3000
//   BACKEND_2_URL=http://52.6.216.161:8000
//   BACKEND_MONITOREO_URL=            (opcional)
//   ESPERA_BACKEND_MS=90000           (tiempo máximo de espera de un backend)
//   DIST_DIR=../dist                  (relativo a esta carpeta)
//
// Uso: npm run build:servidor && npm start

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))

const PUERTO = Number(process.env.PORT) || 8080
const HOST = process.env.HOST || '0.0.0.0'
const DIST = path.resolve(AQUI, process.env.DIST_DIR || '../dist')
const ESPERA_BACKEND_MS = Number(process.env.ESPERA_BACKEND_MS) || 90000
const limpiar = (url) => (url ? url.replace(/\/+$/, '') : null)

// prefijo de la ruta pública → { nombre, destino, quitarPrefijo }
const BACKENDS = {
  '/api': { nombre: 'backend 1 (API del mapa)', destino: limpiar(process.env.BACKEND_1_URL), quitarPrefijo: false },
  '/analisis': { nombre: 'backend 2 (análisis)', destino: limpiar(process.env.BACKEND_2_URL), quitarPrefijo: true },
  '/monitoreo': { nombre: 'backend de monitoreo', destino: limpiar(process.env.BACKEND_MONITOREO_URL), quitarPrefijo: true },
  '/martian-map': { nombre: 'archivos del mapa', destino: limpiar(process.env.BACKEND_1_URL), quitarPrefijo: false },
}
const AUDIENCIA_BACKEND = limpiar(process.env.BACKEND_IDENTITY_AUDIENCE)
let tokenIdentidad = null
let tokenHasta = 0

async function identidadBackend() {
  if (!AUDIENCIA_BACKEND) return null
  if (tokenIdentidad && Date.now() < tokenHasta) return tokenIdentidad
  const url = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience='
    + encodeURIComponent(AUDIENCIA_BACKEND)
  const respuesta = await fetch(url, { headers: { 'Metadata-Flavor': 'Google' } })
  if (!respuesta.ok) throw new Error(`No se pudo obtener identidad del servicio: ${respuesta.status}`)
  tokenIdentidad = await respuesta.text()
  tokenHasta = Date.now() + 30 * 60 * 1000
  return tokenIdentidad
}

const LIMITE_CUERPO = 1024 * 1024 // 1 MB para los backends
const LIMITE_MENSAJE = 64 * 1024 // 64 KB para el control
const SESION_VALIDA = /^\d{4}$/
const DEMO_ACTIVA_MS = 5000

// ---------------- utilidades ----------------

function log(...partes) {
  console.log(new Date().toISOString(), ...partes)
}

function enviarJson(res, estado, datos, extra = {}) {
  const cuerpo = JSON.stringify(datos)
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-store',
    ...extra,
  })
  res.end(cuerpo)
}

function error(res, estado, codigo, mensaje) {
  enviarJson(res, estado, { ok: false, error: mensaje, errors: [{ code: codigo, message: mensaje }] })
}

function leerCuerpo(req, limite) {
  return new Promise((resolver, rechazar) => {
    const partes = []
    let largo = 0
    req.on('data', (parte) => {
      largo += parte.length
      if (largo > limite) {
        rechazar(Object.assign(new Error('Cuerpo demasiado grande'), { estado: 413 }))
        req.destroy()
        return
      }
      partes.push(parte)
    })
    req.on('end', () => resolver(Buffer.concat(partes)))
    req.on('error', rechazar)
  })
}

// ---------------- 1. archivos de la interfaz ----------------

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function servirArchivo(req, res, ruta) {
  let relativa
  try {
    relativa = decodeURIComponent(ruta)
  } catch {
    return error(res, 400, 'RUTA_INVALIDA', 'Ruta inválida')
  }
  // evita salir de dist/ con "../"
  const archivo = path.resolve(DIST, '.' + path.posix.normalize('/' + relativa))
  if (!archivo.startsWith(DIST)) return error(res, 403, 'PROHIBIDO', 'Ruta no permitida')

  fs.stat(archivo, (err, info) => {
    // rutas que no son archivos (por ejemplo /#control): la app
    if (err || !info.isFile()) {
      if (path.extname(relativa)) return error(res, 404, 'NO_ENCONTRADO', 'Archivo no encontrado')
      return enviarIndex(res)
    }
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream'
    // los archivos de assets/ llevan un hash en el nombre: se pueden guardar mucho tiempo
    const cache = relativa.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': info.size, 'Cache-Control': cache })
    if (req.method === 'HEAD') return res.end()
    fs.createReadStream(archivo).pipe(res)
  })
}

function enviarIndex(res) {
  const index = path.join(DIST, 'index.html')
  fs.readFile(index, (err, contenido) => {
    if (err) {
      return error(res, 503, 'SIN_INTERFAZ', 'La interfaz no está construida: corre "npm run build:servidor" antes de "npm start".')
    }
    res.writeHead(200, { 'Content-Type': TIPOS['.html'], 'Content-Length': contenido.length, 'Cache-Control': 'no-cache' })
    res.end(contenido)
  })
}

// ---------------- 2. reenvío a los backends ----------------

async function reenviar(req, res, prefijo, resto) {
  const backend = BACKENDS[prefijo]
  if (!backend.destino) {
    return error(res, 503, 'BACKEND_NO_CONFIGURADO', `El ${backend.nombre} no está configurado en el servidor de la interfaz.`)
  }

  const ruta = backend.quitarPrefijo ? resto || '/' : prefijo + resto
  const url = backend.destino + ruta
  let cuerpo
  try {
    cuerpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await leerCuerpo(req, LIMITE_CUERPO)
  } catch (e) {
    return error(res, e.estado || 400, 'CUERPO_INVALIDO', e.message)
  }

  try {
    const identidad = await identidadBackend()
    const respuesta = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Accept: req.headers.accept || '*/*',
        ...(req.headers.range ? { Range: req.headers.range } : {}),
        ...(identidad ? { Authorization: `Bearer ${identidad}` } : {}),
      },
      body: cuerpo,
      signal: AbortSignal.timeout(ESPERA_BACKEND_MS),
    })
    const datos = Buffer.from(await respuesta.arrayBuffer())
    res.writeHead(respuesta.status, {
      'Content-Type': respuesta.headers.get('content-type') || 'application/json; charset=utf-8',
      'Content-Length': datos.length,
      ...(respuesta.headers.get('content-range') ? { 'Content-Range': respuesta.headers.get('content-range') } : {}),
      ...(respuesta.headers.get('accept-ranges') ? { 'Accept-Ranges': respuesta.headers.get('accept-ranges') } : {}),
      'Cache-Control': 'no-store',
    })
    res.end(datos)
  } catch (e) {
    const tiempo = e?.name === 'TimeoutError'
    log(`✗ ${req.method} ${url}: ${tiempo ? 'sin respuesta a tiempo' : e.message}`)
    error(
      res,
      tiempo ? 504 : 502,
      tiempo ? 'BACKEND_SIN_RESPUESTA' : 'BACKEND_NO_DISPONIBLE',
      tiempo
        ? `El ${backend.nombre} no respondió en ${ESPERA_BACKEND_MS / 1000} s.`
        : `No se pudo conectar con el ${backend.nombre}.`,
    )
  }
}

// ---------------- 3. control desde el teléfono ----------------

const sesiones = new Map() // sesión → Set de respuestas SSE abiertas
const ultimoEstado = new Map() // sesión → { estado, momento } (último estado enviado por la demo)

function suscribir(req, res, sesion) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // que nginx (si lo hay) no acumule los mensajes
  })
  res.write('retry: 2000\n\n')
  if (!sesiones.has(sesion)) sesiones.set(sesion, new Set())
  sesiones.get(sesion).add(res)
  req.on('close', () => {
    const conectados = sesiones.get(sesion)
    conectados?.delete(res)
    if (conectados && !conectados.size) sesiones.delete(sesion)
  })
}

async function publicar(req, res, sesion) {
  let mensaje
  try {
    mensaje = JSON.parse((await leerCuerpo(req, LIMITE_MENSAJE)).toString('utf8'))
  } catch (e) {
    return error(res, e.estado || 400, 'MENSAJE_INVALIDO', 'El mensaje debe ser JSON')
  }
  if (!mensaje || typeof mensaje !== 'object') return error(res, 400, 'MENSAJE_INVALIDO', 'El mensaje debe ser un objeto')
  mensaje.sesion = sesion
  if (mensaje.origen === 'demo' && mensaje.tipo === 'estado') ultimoEstado.set(sesion, { estado: mensaje, momento: Date.now() })

  const linea = `data: ${JSON.stringify(mensaje)}\n\n`
  for (const conectado of sesiones.get(sesion) ?? []) conectado.write(linea)
  res.writeHead(204, { 'Cache-Control': 'no-store' })
  res.end()
}

function listarDemos(res) {
  const ahora = Date.now()
  const demos = []
  for (const [sesion, { estado, momento }] of ultimoEstado) {
    if (ahora - momento > DEMO_ACTIVA_MS) ultimoEstado.delete(sesion)
    else demos.push({ sesion, fase: estado.fase, estado })
  }
  enviarJson(res, 200, { demos })
}

// mantiene vivas las conexiones SSE (los túneles y proxies cortan las que están quietas)
const latido = setInterval(() => {
  for (const conectados of sesiones.values()) for (const conectado of conectados) conectado.write(': latido\n\n')
}, 15000)

// ---------------- servidor ----------------

const servidor = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')

  try {
    if (pathname === '/salud') {
      return enviarJson(res, 200, {
        ok: true,
        interfaz: fs.existsSync(path.join(DIST, 'index.html')),
        backends: Object.fromEntries(Object.entries(BACKENDS).map(([p, b]) => [p, Boolean(b.destino)])),
        sesiones: sesiones.size,
      })
    }

    // control desde el teléfono
    if (pathname === '/control/demos' && req.method === 'GET') return listarDemos(res)
    const control = pathname.match(/^\/control\/([^/]+)(\/eventos)?\/?$/)
    if (control) {
      const [, sesion, eventos] = control
      if (!SESION_VALIDA.test(sesion)) return error(res, 400, 'SESION_INVALIDA', 'La sesión es un código de 4 dígitos')
      if (eventos && req.method === 'GET') return suscribir(req, res, sesion)
      if (!eventos && req.method === 'POST') return publicar(req, res, sesion)
      return error(res, 405, 'METODO_NO_PERMITIDO', 'Método no permitido')
    }

    // backends
    for (const prefijo of Object.keys(BACKENDS)) {
      if (pathname === prefijo || pathname.startsWith(prefijo + '/')) {
        return reenviar(req, res, prefijo, req.url.slice(prefijo.length))
      }
    }

    // interfaz
    if (req.method !== 'GET' && req.method !== 'HEAD') return error(res, 405, 'METODO_NO_PERMITIDO', 'Método no permitido')
    return servirArchivo(req, res, pathname)
  } catch (e) {
    log('✗ error inesperado:', e)
    if (!res.headersSent) error(res, 500, 'ERROR_INTERNO', 'Error interno del servidor de la interfaz')
    else res.end()
  }
})

// las conexiones SSE son largas: sin límite de tiempo por pedido
servidor.requestTimeout = 0
servidor.headersTimeout = 65000
servidor.keepAliveTimeout = 61000

servidor.listen(PUERTO, HOST, () => {
  log(`Servidor de la interfaz en http://${HOST}:${PUERTO}`)
  log(`  interfaz:   ${fs.existsSync(path.join(DIST, 'index.html')) ? DIST : `(falta ${DIST}: corre npm run build:servidor)`}`)
  for (const [prefijo, b] of Object.entries(BACKENDS)) log(`  ${prefijo.padEnd(11)} → ${b.destino ?? '(sin configurar)'}`)
})

function cerrar(senal) {
  log(`${senal}: cerrando…`)
  clearInterval(latido)
  for (const conectados of sesiones.values()) for (const conectado of conectados) conectado.end()
  servidor.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 5000).unref()
}
process.on('SIGTERM', () => cerrar('SIGTERM'))
process.on('SIGINT', () => cerrar('SIGINT'))
