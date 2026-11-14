// Backend falso, solo para preparar el viaje sin backends (npm run dev sin .env.local).
// Responde con el formato de Contrato_API.md: ruta en línea recta y métricas de ejemplo.
// La caminata no usa datos de ejemplo: el monitoreo y las métricas vienen de los backends.

import { distancia } from '../mapa/geo'

const VEL_M_S = 1.0 // velocidad de caminata con traje (ejemplo)
const O2_POR_MIN = 0.25 // % de oxígeno por minuto (ejemplo)

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

const CAPAS = [
  {
    id: 'gale_ctx',
    nombre: 'MRO CTX, Gale Crater Mosaic',
    descripcion: 'Vista general del cráter, unos 6 m por píxel.',
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    bbox: [135.18, -6.57, 139.24, -2.81],
    zMax: 12,
  },
  {
    id: 'curiosity_hirise',
    nombre: 'MRO HiRISE, Curiosity Roving Site Mosaic',
    descripcion: 'Detalle de menos de 1 m por píxel. Se ve al acercarse.',
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/curiosity_hirise_mosaic/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    bbox: [137.12, -4.93, 137.73, -4.25],
    zMin: 13,
    zMax: 16,
  },
]

export async function obtenerCapas() {
  await esperar(300)
  return CAPAS
}

export async function planificarRuta({ aterrizaje, puntos, volver = true }) {
  await esperar(700)
  const inicio = { id: 'aterrizaje', nombre: 'Aterrizaje', ...aterrizaje }
  const secuencia = [inicio, ...puntos, ...(volver ? [inicio] : [])]

  const tramos = secuencia.slice(1).map((b, i) => {
    const a = secuencia[i]
    const distanciaM = distancia(a, b)
    const duracionMin = distanciaM / VEL_M_S / 60
    return {
      desde: a.id,
      hasta: b.id,
      distanciaM: Math.round(distanciaM),
      duracionMin: Math.round(duracionMin),
      oxigenoPct: +(duracionMin * O2_POR_MIN).toFixed(1),
      pendienteMaxGrados: null,
    }
  })
  const total = tramos.reduce(
    (s, t) => ({ distanciaM: s.distanciaM + t.distanciaM, duracionMin: s.duracionMin + t.duracionMin, oxigenoPct: s.oxigenoPct + t.oxigenoPct }),
    { distanciaM: 0, duracionMin: 0, oxigenoPct: 0 },
  )

  if (total.oxigenoPct > 100) {
    const error = new Error(`No alcanza el oxígeno: la ruta necesita ${Math.round(total.oxigenoPct)} %. Quita o acerca algún punto.`)
    error.status = 422
    throw error
  }

  const idRuta = `mock-${Date.now()}`
  return {
    idRuta,
    ruta: { type: 'LineString', coordinates: secuencia.map((p) => [p.lon, p.lat]) },
    metricas: {
      distanciaM: total.distanciaM,
      duracionMin: total.duracionMin,
      oxigenoPct: Math.round(total.oxigenoPct),
      esfuerzo: total.distanciaM < 3000 ? 'bajo' : total.distanciaM < 8000 ? 'medio' : 'alto',
      pendienteMaxGrados: null,
    },
    tramos,
    estadoAnalisis: 'analyzed',
    fuente: 'mock',
    idMonitoreo: null, // una ruta de ejemplo no se puede monitorear
  }
}
