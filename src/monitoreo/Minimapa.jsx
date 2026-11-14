// Minimapa con el recorrido completo, las paradas y la posición actual.

import { useMemo } from 'react'
import { MapaTeselas } from '../mapa/MapaTeselas'
import { bboxDe, formatearCoords } from '../mapa/geo'
import { colorSalida } from '../mapa/colores'

export function Minimapa({ capas, camino, rutasSalidas, paradas, aterrizaje, lectura }) {
  const encuadre = useMemo(() => bboxDe(camino, 0.004), [camino])

  return (
    <section className="panel minimapa" aria-label="Minimapa del recorrido">
      <div className="minimapa__marco">
        <MapaTeselas capas={capas} encuadre={encuadre} etiqueta="Minimapa con el recorrido completo y la posición del astronauta">
          {(proyectar) => {
            const pts = (lista) => lista.map((p) => proyectar(p.lon, p.lat).map((n) => n.toFixed(1)).join(',')).join(' ')
            const hecho = lectura.rastro
            const [ax, ay] = proyectar(lectura.posicion.lon, lectura.posicion.lat)
            const [bx, by] = proyectar(aterrizaje.lon, aterrizaje.lat)
            return (
              <>
                {rutasSalidas
                  ? rutasSalidas.map((r, i) => (
                      <polyline key={i} points={pts(r.map(([lon, lat]) => ({ lon, lat })))} className="mini-ruta" style={{ stroke: colorSalida(i) }} />
                    ))
                  : <polyline points={pts(camino)} className="mini-ruta" />}
                <polyline points={pts(hecho)} className="mini-recorrido" />
                {paradas.filter((p) => p.id !== 'aterrizaje').map((p) => {
                  const [x, y] = proyectar(p.lon, p.lat)
                  return <circle key={p.id} cx={x} cy={y} r="4" className="mini-parada" />
                })}
                <rect x={bx - 5} y={by - 5} width="10" height="10" rx="2" className="mini-base" />
                <circle cx={ax} cy={ay} r="6" className="mini-astronauta" />
              </>
            )
          }}
        </MapaTeselas>
        <span className="minimapa__norte" aria-hidden="true">N ↑</span>
      </div>
      <div className="minimapa__pie">
        <span className="etiqueta">Posición</span>
        <span className="mono">{formatearCoords(lectura.posicion)}</span>
      </div>
    </section>
  )
}
