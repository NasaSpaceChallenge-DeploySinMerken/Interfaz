// Cliente de los backends.
//
// Tres fuentes, cada una con su variable en .env.local (sin ninguna, todo es falso):
//
// - VITE_ANALISIS_URL: servicio de análisis de Javier (rama feat/javier/analisis,
//   POST /plan). EN DESARROLLO. Si está, calcula la ruta: sigue el terreno, elige el
//   orden de las visitas y estima tiempo y oxígeno.
// - VITE_API_URL: API del equipo del mapa (rama mapa-nacho-marti, server/index.js).
//   Si no hay servicio de análisis, valida la ruta (zona y elevación) con
//   POST /api/routes y espera el análisis con GET /api/routes/:id.
// - VITE_MONITOREO_URL: backend de monitoreo (todavía no existe). POST /api/monitoreo.
//
// Este archivo traduce el formato de cada backend al que usa la interfaz
// (Contrato_API.md), así el resto del front no cambia.
// Capas del mapa: por ahora siempre las teselas de Mars Trek.

import * as mock from './mock'

const limpiar = (url) => url?.replace(/\/$/, '') || null
const API = limpiar(import.meta.env.VITE_API_URL)
const ANALISIS = limpiar(import.meta.env.VITE_ANALISIS_URL)
const MONITOREO = limpiar(import.meta.env.VITE_MONITOREO_URL)

export const usaBackendFalso = !API && !ANALISIS
export const usaMonitoreoFalso = !MONITOREO

async function pedir(base, ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    })
  } catch {
    throw new Error(`No se pudo conectar con el backend (${base}).`)
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

const aPar = (p) => [p.lon, p.lat]

// ---------------- API del equipo del mapa ----------------

// `secuencia` es la lista que mandamos: aterrizaje, puntos y, si vuelve, aterrizaje.
function adaptarRutaMapa(ruta, secuencia) {
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
    fuente: 'mapa',
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

async function planificarConMapa({ aterrizaje, puntos, volver }) {
  const inicio = { id: 'aterrizaje', nombre: 'Aterrizaje', ...aterrizaje }
  const secuencia = [inicio, ...puntos, ...(volver ? [inicio] : [])]
  try {
    const { route } = await pedir(API, '/api/routes', {
      method: 'POST',
      body: JSON.stringify({
        name: puntos.map((p) => p.nombre).join(' → '),
        requestedBy: 'interfaz',
        start: aPar(aterrizaje),
        route: secuencia.slice(1).map(aPar),
      }),
    })
    mock.registrarRuta(route.id, aterrizaje, route.path) // para las alertas falsas del monitoreo
    return adaptarRutaMapa(route, secuencia)
  } catch (e) {
    // los índices del error son posiciones en [inicio, ...ruta]: se traducen a nombres
    const nombres = [...new Set(e.indices.map((i) => secuencia[i]?.nombre).filter(Boolean))]
    if (nombres.length) e.message = `${e.message}: ${nombres.join(', ')}.`
    e.ids = e.indices.map((i) => secuencia[i]?.id).filter(Boolean)
    throw e
  }
}

// ---------------- Servicio de análisis (Javier, en desarrollo) ----------------

const MOTIVOS = {
  sin_camino_en_dem: 'no hay camino transitable en el terreno',
  oxigeno_insuficiente_para_retorno_con_reserva: 'no alcanza el oxígeno para volver con reserva',
}

function adaptarPlan(plan, puntos) {
  const idDe = (indice) => (indice == null ? 'aterrizaje' : puntos[indice]?.id ?? `p?${indice}`)
  const ox = plan.summary.oxygen ?? {}
  const tanque = ox.tank_g || null
  const pct = (g) => (tanque && g != null ? +((g / tanque) * 100).toFixed(1) : null)

  return {
    fuente: 'analisis',
    idRuta: `plan-${Date.now()}`,
    ruta: { type: 'LineString', coordinates: plan.route },
    metricas: {
      distanciaM: Math.round(plan.summary.distance_m),
      duracionMin: Math.round(plan.summary.total_time_min),
      oxigenoPct: pct(ox.used_g) != null ? Math.round(pct(ox.used_g)) : null,
      oxigenoDetalle: ox.used_g != null && tanque ? `${Math.round(ox.used_g)} g de ${tanque} g` : null,
      oxigenoAlcanza: ox.enough_with_reserve ?? null,
      salidas: plan.trip_count ?? 1,
      esfuerzo: null,
      pendienteMaxGrados: null,
      limitePendienteGrados: plan.grade_limit_degrees ?? null,
    },
    tramos: plan.legs.map((l) => ({
      desde: idDe(l.from_index),
      hasta: idDe(l.to_index),
      distanciaM: Math.round(l.distance_m),
      duracionMin: Math.round(l.time_min),
      oxigenoPct: pct(l.oxygen_g),
      pendienteMaxGrados: null,
      desnivelM: null,
    })),
    // el servicio elige el orden: ids de los puntos en el orden de la ruta
    ordenIds: plan.ordered_visits.map((v) => idDe(v.input_index)),
    inalcanzables: (plan.unreachable_visits ?? []).map((v) => ({
      id: idDe(v.input_index),
      motivo: MOTIVOS[v.reason] ?? v.reason,
    })),
    advertencia: plan.warning ?? null,
    estadoAnalisis: 'analyzed',
  }
}

async function planificarConAnalisis({ aterrizaje, puntos, volver }) {
  const plan = await pedir(ANALISIS, '/plan', {
    method: 'POST',
    body: JSON.stringify({
      map: 'gale',
      arrival: aPar(aterrizaje),
      visits: puntos.map(aPar),
      return_to_arrival: volver,
      settings: { speed_kmh: 2.5, stop_minutes_per_visit: 5 },
    }),
  })
  if (!plan.route || plan.route.length < 2) {
    throw new Error('El servicio de análisis no encontró ninguna ruta viable para estos puntos.')
  }
  const resultado = adaptarPlan(plan, puntos)
  mock.registrarRuta(resultado.idRuta, aterrizaje, plan.route) // para las alertas falsas del monitoreo
  return resultado
}

// ---------------- Llamadas que usa la interfaz ----------------

// Fase 1: capas para el mapa (por ahora, siempre las teselas de Mars Trek).
export function obtenerCapas() {
  return mock.obtenerCapas()
}

// Fase 1: manda el aterrizaje y los puntos a visitar, devuelve la ruta y sus métricas.
export function planificarRuta(viaje) {
  if (ANALISIS) return planificarConAnalisis(viaje)
  if (API) return planificarConMapa(viaje)
  return mock.planificarRuta(viaje)
}

// Fase 1: consulta el estado de una ruta de la API del mapa (para esperar el análisis).
export async function obtenerRuta(idRuta, secuencia) {
  if (!API || ANALISIS) return null
  const { route } = await pedir(API, `/api/routes/${encodeURIComponent(idRuta)}`)
  return adaptarRutaMapa(route, secuencia)
}

// Fase 2: manda posición y sensores al backend de monitoreo, devuelve las alertas activas.
// Sin VITE_MONITOREO_URL, datos falsos.
export async function enviarMonitoreo({ idRuta, t, posicion, sensores }) {
  if (!MONITOREO) return mock.enviarMonitoreo({ idRuta, t, posicion, sensores })
  const respuesta = await fetch(`${MONITOREO}/api/monitoreo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idRuta, t, posicion, sensores }),
  })
  if (!respuesta.ok) throw new Error(`El backend de monitoreo respondió ${respuesta.status}`)
  const cuerpo = await respuesta.json()
  return { alertas: cuerpo.alertas ?? [] }
}
