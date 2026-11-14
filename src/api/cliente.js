// Cliente del backend.
//
// Con VITE_API_URL usa la API del equipo del mapa (martian-map, server/index.js;
// contrato en su docs/API.md). Sin VITE_API_URL usa el backend falso de mock.js.
//
// Este archivo traduce entre el formato de su API y el que usa la interfaz
// (Contrato_API.md), así el resto del front no cambia.
//
// - Capas: por ahora siempre las teselas de Mars Trek (mock). Las capas de su API
//   son GeoTIFF que se dibujan con OpenLayers; se usarán al integrar su mapa.
// - Rutas: POST /api/routes y GET /api/routes/:id de su API.
// - Monitoreo: siempre datos falsos, hasta que el otro equipo exponga su endpoint.

import * as mock from './mock'

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export const usaBackendFalso = !API

async function pedir(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    })
  } catch {
    throw new Error(`No se pudo conectar con el backend (${API}).`)
  }
  let cuerpo = null
  try {
    cuerpo = await respuesta.json()
  } catch {
    // la respuesta no era JSON
  }
  if (!respuesta.ok || cuerpo?.ok === false) {
    const primero = cuerpo?.errors?.[0]
    const error = new Error(primero?.message ?? cuerpo?.error ?? `El backend respondió ${respuesta.status}`)
    error.status = respuesta.status
    error.codigo = primero?.code
    error.indices = primero?.points ?? []
    throw error
  }
  return cuerpo
}

// ---------------- Adaptación de formatos ----------------

const aPar = (p) => [p.lon, p.lat]

// Convierte la ruta de su API al formato de la interfaz.
// `secuencia` es la lista de puntos que mandamos (aterrizaje, puntos y, si vuelve, aterrizaje).
function adaptarRuta(ruta, secuencia) {
  const elevaciones = ruta.waypoints?.map((w) => w.elevation) ?? []
  const tramos = secuencia.slice(1).map((b, i) => {
    const a = secuencia[i]
    return {
      desde: a.id,
      hasta: b.id,
      distanciaM: Math.round(distanciaKm(aPar(a), aPar(b)) * 1000),
      duracionMin: null,
      oxigenoPct: null,
      pendienteMaxGrados: null,
      desnivelM: elevaciones[i + 1] != null && elevaciones[i] != null ? elevaciones[i + 1] - elevaciones[i] : null,
    }
  })
  const analisis = ruta.analysis
  return {
    idRuta: ruta.id,
    ruta: { type: 'LineString', coordinates: ruta.path },
    metricas: {
      distanciaM: Math.round(ruta.stats.distanceKm * 1000),
      duracionMin: null,
      oxigenoPct: null,
      esfuerzo: analisis?.risk ?? null,
      pendienteMaxGrados: analisis?.metrics?.maxSlopeDeg ?? null,
      elevacionMinM: ruta.stats.minElevation,
      elevacionMaxM: ruta.stats.maxElevation,
    },
    tramos,
    // validated → forwarded → analyzed
    estadoAnalisis: ruta.status,
    analisis,
  }
}

// misma fórmula y radio que su servidor (esfera Mars 2000)
function distanciaKm(a, b) {
  const rad = Math.PI / 180
  const dLat = (b[1] - a[1]) * rad
  const dLon = (b[0] - a[0]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 3396.19 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// ---------------- Llamadas ----------------

// Fase 1: capas para el mapa (por ahora, siempre las teselas de Mars Trek).
export function obtenerCapas() {
  return mock.obtenerCapas()
}

// Fase 1: manda el aterrizaje y los puntos a visitar, devuelve la ruta y sus métricas.
export async function planificarRuta({ aterrizaje, puntos, volver }) {
  if (!API) return mock.planificarRuta({ aterrizaje, puntos, volver })

  const inicio = { id: 'aterrizaje', nombre: 'Aterrizaje', ...aterrizaje }
  const secuencia = [inicio, ...puntos, ...(volver ? [inicio] : [])]
  try {
    const { route } = await pedir('/api/routes', {
      method: 'POST',
      body: JSON.stringify({
        name: puntos.map((p) => p.nombre).join(' → '),
        requestedBy: 'interfaz',
        start: aPar(aterrizaje),
        route: secuencia.slice(1).map(aPar),
      }),
    })
    mock.registrarRuta(route.id, aterrizaje) // para las alertas falsas del monitoreo
    return adaptarRuta(route, secuencia)
  } catch (e) {
    // los índices del error son posiciones en [inicio, ...ruta]: se traducen a nombres
    const nombres = [...new Set(e.indices.map((i) => secuencia[i]?.nombre).filter(Boolean))]
    if (nombres.length) e.message = `${e.message}: ${nombres.join(', ')}.`
    e.ids = e.indices.map((i) => secuencia[i]?.id).filter(Boolean)
    throw e
  }
}

// Fase 1: consulta el estado de una ruta (para esperar el análisis del equipo 3).
export async function obtenerRuta(idRuta, secuencia) {
  if (!API) return null
  const { route } = await pedir(`/api/routes/${encodeURIComponent(idRuta)}`)
  return adaptarRuta(route, secuencia)
}

// Fase 2: manda posición y sensores, devuelve las alertas activas.
// Siempre con datos falsos hasta que el otro equipo exponga su endpoint de monitoreo.
export function enviarMonitoreo({ idRuta, t, posicion, sensores }) {
  return mock.enviarMonitoreo({ idRuta, t, posicion, sensores })
}
