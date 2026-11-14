// Geometría de las teselas de Mars Trek (proyección equirectangular).
// En el nivel z, Marte mide 2^(z+1) × 2^z teselas de 256 px y cada una cubre 180/2^z grados.

export const TESELA = 256
export const RADIO_MARTE = 3389500 // m

export const grados = (z) => 180 / 2 ** z
export const rad = (g) => (g * Math.PI) / 180

// [lon, lat] → píxel global en el nivel z
export const aPixel = (lon, lat, z) => [((lon + 180) / grados(z)) * TESELA, ((90 - lat) / grados(z)) * TESELA]

// píxel global → { lon, lat }
export const aGrados = (x, y, z) => ({ lon: (x / TESELA) * grados(z) - 180, lat: 90 - (y / TESELA) * grados(z) })

export const urlTesela = (plantilla, z, fila, col) =>
  plantilla.replace('{z}', z).replace('{y}', fila).replace('{x}', col)

// distancia en metros entre dos { lon, lat }
export function distancia(a, b) {
  const dx = rad(b.lon - a.lon) * RADIO_MARTE * Math.cos(rad(a.lat))
  const dy = rad(b.lat - a.lat) * RADIO_MARTE
  return Math.hypot(dx, dy)
}

// rumbo en grados desde el norte, en sentido horario
export function rumbo(a, b) {
  const dx = (b.lon - a.lon) * Math.cos(rad(a.lat))
  const dy = b.lat - a.lat
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360
}

export const metrosPorPixel = (z) => rad(grados(z) / TESELA) * RADIO_MARTE

// barra de escala con un largo "redondo"
export function escala(z, minPx = 80) {
  const mpp = metrosPorPixel(z)
  const metros = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].find((m) => m / mpp >= minPx) ?? 10000
  return { px: metros / mpp, texto: metros >= 1000 ? `${metros / 1000} km` : `${metros} m` }
}

// bbox = [oeste, sur, este, norte]
export const dentroDe = ([o, s, e, n], { lon, lat }) => lon >= o && lon <= e && lat >= s && lat <= n

// centro y zoom para que el bbox quepa en ancho × alto
export function encuadrar([o, s, e, n], ancho, alto, margen = 0.9) {
  const centro = { lon: (o + e) / 2, lat: (s + n) / 2 }
  for (let z = 17; z >= 1; z--) {
    const [x0, y0] = aPixel(o, n, z)
    const [x1, y1] = aPixel(e, s, z)
    if (x1 - x0 <= ancho * margen && y1 - y0 <= alto * margen) return { centro, z }
  }
  return { centro, z: 1 }
}

// bbox de una lista de { lon, lat }, con margen en grados
export function bboxDe(puntos, margen = 0) {
  const lons = puntos.map((p) => p.lon)
  const lats = puntos.map((p) => p.lat)
  return [Math.min(...lons) - margen, Math.min(...lats) - margen, Math.max(...lons) + margen, Math.max(...lats) + margen]
}

export const formatearCoords = ({ lon, lat }, dec = 4) =>
  `${Math.abs(lat).toFixed(dec)}° ${lat < 0 ? 'S' : 'N'}  ${lon.toFixed(dec)}° E`

export const formatearDistancia = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`)
