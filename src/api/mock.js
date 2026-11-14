// Backend falso. Responde con el formato de Contrato_API.md.
//
// La ruta va en línea recta entre los puntos y las métricas son de ejemplo:
// el backend real calcula la ruta según el terreno.
// Las reglas de las alertas de aquí también son de ejemplo: las de verdad
// las define el backend.

import { distancia } from '../mapa/geo'

const VEL_M_S = 1.0 // velocidad de caminata con traje (ejemplo)
const O2_POR_MIN = 0.25 // % de oxígeno por minuto (ejemplo)

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const rutas = new Map()

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

// Para que las alertas falsas del monitoreo funcionen también con rutas
// calculadas por el backend real.
export function registrarRuta(idRuta, aterrizaje, coordenadas = []) {
  rutas.set(idRuta, { aterrizaje, camino: coordenadas.map(([lon, lat]) => ({ lon, lat })) })
}

// distancia en metros desde p a la ruta (al segmento más cercano)
function distanciaARuta(p, camino) {
  let minima = Infinity
  for (let i = 1; i < camino.length; i++) {
    const a = camino[i - 1], b = camino[i]
    // coordenadas locales en metros alrededor de a
    const k = (Math.PI / 180) * 3389500
    const c = Math.cos((a.lat * Math.PI) / 180)
    const bx = (b.lon - a.lon) * k * c, by = (b.lat - a.lat) * k
    const px = (p.lon - a.lon) * k * c, py = (p.lat - a.lat) * k
    const largo2 = bx * bx + by * by
    const f = largo2 ? Math.max(0, Math.min(1, (px * bx + py * by) / largo2)) : 0
    minima = Math.min(minima, Math.hypot(px - f * bx, py - f * by))
  }
  return minima
}

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
  registrarRuta(idRuta, aterrizaje, secuencia.map((p) => [p.lon, p.lat]))
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
  }
}

export async function enviarMonitoreo({ idRuta, posicion, sensores: s }) {
  await esperar(80)
  const alertas = []
  const nivel = (valor, aviso, critico, mayor = true) =>
    mayor ? (valor > critico ? 'critico' : valor > aviso ? 'aviso' : null) : (valor < critico ? 'critico' : valor < aviso ? 'aviso' : null)

  // Oxígeno
  const minutosRestantes = s.oxigenoPct / O2_POR_MIN
  const nO2 = nivel(s.oxigenoPct, 30, 15, false)
  if (nO2) alertas.push({ id: 'oxigeno-nivel', nivel: nO2, mensaje: `Oxígeno ${nO2 === 'critico' ? 'crítico' : 'bajo'}: ${s.oxigenoPct.toFixed(0)} %` })
  const ruta = rutas.get(idRuta)
  if (ruta) {
    const minutosParaVolver = distancia(posicion, ruta.aterrizaje) / VEL_M_S / 60
    if (minutosRestantes < minutosParaVolver) {
      alertas.push({ id: 'oxigeno-retorno', nivel: 'critico', mensaje: `El oxígeno no alcanza para volver: quedan ${Math.round(minutosRestantes)} min y la vuelta toma ${Math.round(minutosParaVolver)} min` })
    }

    // Desvío de la ruta planificada
    if (ruta.camino.length > 1) {
      const desvio = distanciaARuta(posicion, ruta.camino)
      const nDesvio = nivel(desvio, 50, 200)
      if (nDesvio) alertas.push({ id: 'ruta-desvio', nivel: nDesvio, mensaje: `Te desviaste ${Math.round(desvio)} m de la ruta planificada` })
    }
  }

  // Salud
  const nPulso = nivel(s.pulso, 120, 150)
  if (nPulso) alertas.push({ id: 'salud-pulso', nivel: nPulso, mensaje: `Pulso alto: ${s.pulso} lpm` })
  const nSpo2 = nivel(s.spo2, 94, 90, false)
  if (nSpo2) alertas.push({ id: 'salud-spo2', nivel: nSpo2, mensaje: `Saturación baja: ${s.spo2} %` })

  // Temperatura del traje
  const t = s.temperaturaTraje
  const nTemp = t < 10 || t > 35 ? 'critico' : t < 18 || t > 27 ? 'aviso' : null
  if (nTemp) alertas.push({ id: 'temperatura-traje', nivel: nTemp, mensaje: `Temperatura del traje fuera de rango: ${t.toFixed(1)} °C` })
  alertas.push({ id: 'temperatura-exterior', nivel: 'info', mensaje: `Temperatura exterior: ${Math.round(s.temperaturaExterior)} °C` })

  return { alertas }
}

// Métricas de lo que falta del viaje (sin backend 2): línea recta entre
// la posición y las paradas que quedan, con los mismos supuestos que el
// servicio de análisis (2,5 km/h, 1,43 g/min, tanque de 700 g).
export async function metricasViaje({ posicion, destinos }) {
  let anterior = posicion
  let restanteM = 0
  for (const d of destinos) {
    restanteM += distancia(anterior, d)
    anterior = d
  }
  const tiempoMin = restanteM / (2500 / 60)
  return {
    fuente: 'mock',
    restanteM: Math.round(restanteM),
    tiempoMin: Math.round(tiempoMin),
    oxigenoG: Math.round(tiempoMin * 1.43),
    tanqueG: 700,
    reservaG: 85.8,
    pendienteMaxPct: null,
    tramoActual: { hacia: destinos[0].nombre, distanciaM: Math.round(distancia(posicion, destinos[0])), pendienteMaxPct: null, desnivelM: null, peligros: [] },
    peligros: [],
  }
}
