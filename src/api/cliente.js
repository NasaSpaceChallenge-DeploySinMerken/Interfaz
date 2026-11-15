// Cliente de los backends.
//
// Cada parte de la app usa un backend, con su variable en .env.local
// (sin ninguna, todo es falso):
//
// - VITE_API_URL: backend 1, la API del equipo del mapa (martian-map, server/index.js).
//   CALCULA LA RUTA. Con POST /api/plan (rama feat/mapa-layers), que reenvía al
//   POST /plan del equipo 3: ruta por el terreno, orden de las visitas, oxígeno,
//   visitas inalcanzables y varias salidas. Si ese endpoint no existe o no está
//   configurado, usa el flujo anterior: POST /api/routes (valida zona y
//   elevación) y GET /api/routes/:id (espera el análisis).
// - VITE_ANALISIS_URL: backend 2, el servicio de análisis de Javier (rama
//   feat/javier/analisis). Da las MÉTRICAS DURANTE EL VIAJE: desde la posición
//   actual hasta el final, POST /gale/analyze (distancia, tiempo, oxígeno,
//   pendientes y peligros de lo que falta).
// - VITE_MONITOREO_URL: monitoreo en tiempo real (servicio de análisis, Ingrid;
//   POST /api/monitoreo). Recibe la posición cada segundo con el idRuta que
//   devolvió /plan y responde el oxígeno y las alertas. Suele ser la misma
//   dirección que VITE_ANALISIS_URL.
// Durante la caminata no hay datos de ejemplo: si un backend no está configurado
// o no responde, la interfaz lo muestra.
//
// Este archivo traduce el formato de cada backend al que usa la interfaz
// (Contrato_API.md), así el resto del front no cambia.
// Capas del mapa: por ahora siempre las teselas de Mars Trek.

import * as mock from './mock'

// Si la dirección del backend dice "localhost" pero esta página se abrió desde
// otro equipo (por ejemplo, el teléfono entrando por la IP de la red), se usa
// esa misma IP: "localhost" en el teléfono sería el propio teléfono.
function limpiar(url) {
  if (!url) return null
  const sinBarra = url.replace(/\/$/, '')
  const host = window.location.hostname
  const esLocal = (h) => h === 'localhost' || h === '127.0.0.1'
  try {
    const u = new URL(sinBarra)
    if (esLocal(u.hostname) && !esLocal(host)) {
      u.hostname = host
      return u.toString().replace(/\/$/, '')
    }
  } catch {
    // dirección no válida: se deja como está
  }
  return sinBarra
}
// Con el servidor propio de la interfaz (npm run build:servidor), todo va al mismo
// servidor que sirve la página, y él reenvía a los backends (servidor/index.js):
// /api → backend 1, /analisis → backend 2, /monitoreo → monitoreo.
export const SERVIDOR_PROPIO = import.meta.env.VITE_SERVIDOR === 'propio'

const API = SERVIDOR_PROPIO ? '' : limpiar(import.meta.env.VITE_API_URL)
const ANALISIS = SERVIDOR_PROPIO ? '/analisis' : limpiar(import.meta.env.VITE_ANALISIS_URL)
const MONITOREO = SERVIDOR_PROPIO ? '/monitoreo' : limpiar(import.meta.env.VITE_MONITOREO_URL)

// API puede ser '' (mismo servidor): se compara con null
export const usaBackendFalso = API == null
export const usaMetricasFalsas = ANALISIS == null
export const usaMonitoreoFalso = MONITOREO == null


// Más que el límite de 60 s que tiene el backend 1 para el análisis, para que
// llegue su propio mensaje de error si el análisis se demora.
const ESPERA_MAXIMA_MS = 90000

async function pedir(base, ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    })
  } catch (e) {
    if (e?.name === 'TimeoutError') {
      throw new Error(`El backend (${base}) no respondió en ${ESPERA_MAXIMA_MS / 1000} s.`)
    }
    throw new Error(`No se pudo conectar con el backend (${base}). Revisa que esté corriendo y que tu red no lo bloquee.`)
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
    // el monitoreo necesita el idRuta de /plan: estas rutas no se pueden monitorear
    idMonitoreo: null,
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

async function planificarConRoutes({ aterrizaje, puntos, volver }) {
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
    return adaptarRutaMapa(route, secuencia)
  } catch (e) {
    // los índices del error son posiciones en [inicio, ...ruta]: se traducen a nombres
    // (un error de conexión no trae índices)
    const indices = e.indices ?? []
    const nombres = [...new Set(indices.map((i) => secuencia[i]?.nombre).filter(Boolean))]
    if (nombres.length) e.message = `${e.message}: ${nombres.join(', ')}.`
    e.ids = indices.map((i) => secuencia[i]?.id).filter(Boolean)
    throw e
  }
}

// ---------------- Backend 1: POST /api/plan (análisis del equipo 3) ----------------

const MOTIVOS = {
  sin_camino_en_dem: 'no hay camino transitable en el terreno',
  oxigeno_insuficiente_para_retorno_con_reserva: 'no alcanza el oxígeno para volver con reserva',
}

// Convierte la respuesta de /plan (formato del equipo 3) al de la interfaz.
function adaptarPlan(plan, puntos) {
  const idDe = (indice) => (indice == null ? 'aterrizaje' : puntos[indice]?.id ?? `p?${indice}`)
  const ox = plan.summary?.oxygen ?? {}
  const tanque = ox.tank_g || null
  const pct = (g) => (tanque && g != null ? +((g / tanque) * 100).toFixed(1) : null)
  const salidas = plan.trip_count ?? 1

  return {
    fuente: 'plan',
    idRuta: plan.idRuta ?? null,
    // idRuta para POST /api/monitoreo; null si el análisis no la puede monitorear
    idMonitoreo: plan.idRuta ?? null,
    ruta: { type: 'LineString', coordinates: plan.route },
    // con varias salidas, la geometría de cada una (para dibujarlas con colores distintos)
    rutasSalidas: salidas > 1 && plan.trips?.length > 1 ? plan.trips.map((t) => t.route) : null,
    metricas: {
      distanciaM: Math.round(plan.summary.distance_m),
      duracionMin: Math.round(plan.summary.total_time_min),
      oxigenoPct: pct(ox.used_g) != null ? Math.round(pct(ox.used_g)) : null,
      // con varias salidas el tanque se recarga: el total puede pasar de 100 %
      oxigenoDetalle: ox.used_g != null && tanque
        ? `${Math.round(ox.used_g)} g${salidas > 1 ? ` en ${salidas} salidas, tanque de ${tanque} g` : ` de ${tanque} g`}`
        : null,
      oxigenoAlcanza: ox.enough_with_reserve ?? null,
      salidas,
      recargas: ox.tank_refills ?? 0,
      esfuerzo: null,
      pendienteMaxGrados: null,
      limitePendienteGrados: plan.grade_limit_degrees ?? null,
    },
    tramos: (plan.legs ?? []).map((l) => ({
      desde: idDe(l.from_index),
      hasta: idDe(l.to_index),
      salida: l.trip_index ?? null,
      distanciaM: Math.round(l.distance_m),
      duracionMin: Math.round(l.time_min),
      oxigenoPct: pct(l.oxygen_g),
      pendienteMaxGrados: null,
      desnivelM: null,
    })),
    // el análisis elige el orden: ids de los puntos en el orden de la ruta
    ordenIds: (plan.ordered_visits ?? []).map((v) => idDe(v.input_index)),
    inalcanzables: (plan.unreachable_visits ?? []).map((v) => ({
      id: idDe(v.input_index),
      motivo: MOTIVOS[v.reason] ?? v.reason,
    })),
    advertencia: plan.warning ?? null,
    estadoAnalisis: 'analyzed',
  }
}

async function planificarConPlan({ aterrizaje, puntos, volver }) {
  const plan = await pedir(API, '/api/plan', {
    method: 'POST',
    body: JSON.stringify({
      map: 'gale',
      arrival: aPar(aterrizaje),
      visits: puntos.map(aPar),
      return_to_arrival: volver,
      settings: { speed_kmh: 2.5, stop_minutes_per_visit: 5 },
    }),
  })
  const resultado = adaptarPlan(plan, puntos)

  // ninguna visita viable: no hay caminata posible
  if (!plan.trip_count || !plan.route || plan.route.length < 2) {
    const nombres = new Map(puntos.map((p) => [p.id, p.nombre]))
    const detalle = resultado.inalcanzables.map((v) => `${nombres.get(v.id) ?? v.id} (${v.motivo})`).join(', ')
    const error = new Error(`Ninguna visita es alcanzable${detalle ? `: ${detalle}` : ''}.`)
    error.ids = resultado.inalcanzables.map((v) => v.id)
    throw error
  }

  return resultado
}

// Backend 1: primero /api/plan; si no existe (404) o no tiene el análisis
// configurado (503 NO_ANALYSIS_TARGET), el flujo anterior con /api/routes.
async function planificarConMapa(viaje) {
  try {
    return await planificarConPlan(viaje)
  } catch (e) {
    if (e.status === 404 || e.codigo === 'NO_ANALYSIS_TARGET') return planificarConRoutes(viaje)
    throw e
  }
}

// ---------------- Backend 2: métricas durante el viaje (Javier) ----------------

// Junta los segmentos de ida (posición actual → paradas que faltan) en métricas.
function adaptarMetricas(r, destinos) {
  const ida = r.segments.filter((t) => t.direction === 'ida')
  const suma = (campo) => ida.reduce((total, t) => total + (t[campo] ?? 0), 0)
  const ox = r.summary.oxygen ?? {}
  const primero = ida[0]
  return {
    fuente: 'analisis',
    restanteM: Math.round(suma('distance_m')),
    tiempoMin: Math.round(suma('time_min')),
    oxigenoG: Math.round(suma('oxygen_g')),
    tanqueG: ox.tank_g ?? 700,
    reservaG: ox.reserve_g ?? null,
    pendienteMaxPct: ida.length ? Math.max(...ida.map((t) => t.max_grade_percent ?? 0)) : null,
    tramoActual: primero && {
      hacia: destinos[0]?.nombre ?? '—',
      distanciaM: Math.round(primero.distance_m),
      pendienteMaxPct: primero.max_grade_percent ?? null,
      desnivelM: primero.rise_m ?? null,
      peligros: primero.hazards ?? [],
    },
    peligros: ida.flatMap((t, i) => (t.hazards ?? []).map((h) => `${h} hacia ${destinos[i]?.nombre ?? '—'}`)),
  }
}

// ---------------- Llamadas que usa la interfaz ----------------

// Las teselas de NASA dan contexto; THEMIS IR llega del catálogo del backend.
export async function obtenerCapas() {
  const base = await mock.obtenerCapas()
  if (API == null) return base
  const catalogo = await pedir(API, '/api/layers')
  const termica = catalogo.layers?.find((c) => c.id === 'themis_ir')
  if (!termica?.previewUrl) return base
  return [...base, {
    id: termica.id,
    nombre: 'Mapa de calor · THEMIS IR',
    descripcion: 'Infrarrojo diurno en falso color; intensidad relativa, no temperatura en °C.',
    kind: 'thermal',
    url: `${API}${termica.previewUrl}`,
    bbox: termica.bounds,
    opacity: termica.opacity ?? 0.65,
    visible: false,
  }]
}

// Fase 1: manda el aterrizaje y los puntos a visitar, devuelve la ruta y sus métricas.
// La ruta la calcula el backend 1 (API del mapa).
export async function planificarRuta(viaje) {
  if (API == null) return mock.planificarRuta(viaje)
  try {
    return await planificarConMapa(viaje)
  } catch (e) {
    // sin backend 1 configurado en el servidor propio: ruta de ejemplo
    if (SERVIDOR_PROPIO && e?.codigo === 'BACKEND_NO_CONFIGURADO') return mock.planificarRuta(viaje)
    throw e
  }
}

// Fase 1: consulta el estado de una ruta de la API del mapa (para esperar el análisis).
export async function obtenerRuta(idRuta, secuencia) {
  if (API == null) return null
  const { route } = await pedir(API, `/api/routes/${encodeURIComponent(idRuta)}`)
  return adaptarRutaMapa(route, secuencia)
}

// Fase 2: métricas de lo que falta del viaje, desde la posición actual y pasando por
// las paradas que quedan, en orden (backend 2). Sin VITE_ANALISIS_URL, estimación local.
export async function obtenerMetricasViaje({ posicion, pendientes }) {
  // el servicio pide más de 1 m entre puntos seguidos: se quitan las paradas
  // que están encima de la posición actual
  const destinos = pendientes.filter((p, i, lista) => {
    const anterior = i === 0 ? posicion : lista[i - 1]
    return distanciaKm(aPar(anterior), aPar(p)) * 1000 > 2
  })
  if (!destinos.length) return null
  if (ANALISIS == null) throw new Error('El backend 2 (análisis) no está configurado.')
  const r = await pedir(ANALISIS, '/gale/analyze', {
    method: 'POST',
    body: JSON.stringify({
      points: [aPar(posicion), ...destinos.map(aPar)],
      settings: { speed_kmh: 2.5, stop_minutes: 0 },
    }),
  })
  return adaptarMetricas(r, destinos)
}

// Fase 2: monitoreo en tiempo real (POST /api/monitoreo). Se llama cada segundo con
// el idRuta de /plan, el tiempo de misión y la posición. El backend calcula el
// oxígeno y las alertas: la interfaz no simula ningún sensor.
// Errores: error.codigo = 'RUTA_DESCONOCIDA' si el backend ya no tiene la ruta
// (se reinició: hay que volver a planificar).
export async function enviarMonitoreo({ idRuta, t, posicion, reiniciar = false }) {
  if (MONITOREO == null) throw new Error('El monitoreo no está configurado.')
  let r
  try {
    r = await pedir(MONITOREO, '/api/monitoreo', {
      method: 'POST',
      body: JSON.stringify({ idRuta, t: Math.round(t), posicion, sensores: {}, reiniciar }),
    })
  } catch (e) {
    if (e.status === 404 && /idruta/i.test(e.message)) e.codigo = 'RUTA_DESCONOCIDA'
    else if (e.status === 404) e.message = 'El backend no tiene el monitoreo (POST /api/monitoreo).'
    throw e
  }
  return {
    alertas: r.alertas ?? [],
    oxigenoPct: r.oxigenoPct ?? null,
    oxigenoRestanteG: r.oxigenoRestanteG ?? null,
    oxigenoGastadoG: r.oxigenoGastadoG ?? null,
    costoRegresoG: r.costoRegresoG ?? null,
    costoDesvioG: r.costoDesvioG ?? null,
    reservaG: r.reservaG ?? null,
    parado: r.parado ?? false,
    distanciaARutaM: r.distanciaARutaM ?? null,
  }
}
