// Mapa de la fase 1: marcar aterrizaje y puntos con un clic.

import { useState } from 'react'
import { MapaTeselas } from '../mapa/MapaTeselas'
import { escala, formatearCoords } from '../mapa/geo'
import { TRAMO } from '../datos/gale'

function Pin({ x, y, color, borde, children, etiqueta }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L-9 -14 A12 12 0 1 1 9 -14 Z" style={{ fill: color, stroke: borde, strokeWidth: 2 }} />
      {children}
      <text x="16" y="-16" className="etiqueta-mapa">{etiqueta}</text>
    </g>
  )
}

export function MapaPlanificacion({ capas, aterrizaje, puntos, volver, ruta, modo, onModo, onMarcar, aviso }) {
  const [vista, setVista] = useState(null) // null: encuadra el tramo
  const [cursor, setCursor] = useState(null)

  const secuencia = [
    ...(aterrizaje ? [aterrizaje] : []),
    ...puntos,
    ...(aterrizaje && puntos.length && volver ? [aterrizaje] : []),
  ]

  const zoomBoton = (paso) => {
    if (!vista) return
    setVista({ ...vista, z: Math.min(17, Math.max(10, vista.z + paso)) })
  }

  const e = vista ? escala(vista.z) : null

  return (
    <main className="mapa-planificacion" aria-label="Mapa del cráter Gale. Haz clic para marcar puntos.">
      <MapaTeselas
        capas={capas}
        interactivo
        {...(vista ? { centro: vista.centro, z: vista.z } : { encuadre: TRAMO })}
        onVista={setVista}
        onClic={onMarcar}
        onCursor={setCursor}
      >
        {(proyectar, tam) => {
          const [x0, y0] = proyectar(TRAMO[0], TRAMO[3])
          const [x1, y1] = proyectar(TRAMO[2], TRAMO[1])
          const puntosSvg = (lista) => lista.map((p) => proyectar(p.lon, p.lat).map((n) => n.toFixed(1)).join(',')).join(' ')
          const lineaRuta = ruta ? ruta.coordinates.map(([lon, lat]) => ({ lon, lat })) : null
          return (
            <>
              <path d={`M0 0 H${tam.ancho} V${tam.alto} H0 Z M${x0} ${y0} H${x1} V${y1} H${x0} Z`} className="fuera-tramo" />
              <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className="borde-tramo" />
              {lineaRuta
                ? <polyline points={puntosSvg(lineaRuta)} className="linea-ruta" />
                : <polyline points={puntosSvg(secuencia)} className="linea-borrador" />}
              {puntos.map((p, i) => {
                const [x, y] = proyectar(p.lon, p.lat)
                return (
                  <Pin key={p.id} x={x} y={y} color="var(--punto)" borde="#2a1d0a" etiqueta={p.nombre}>
                    <text x="0" y="-17" className="pin__num">{i + 1}</text>
                  </Pin>
                )
              })}
              {aterrizaje && (() => {
                const [x, y] = proyectar(aterrizaje.lon, aterrizaje.lat)
                return (
                  <Pin x={x} y={y} color="var(--base)" borde="#0d1b2a" etiqueta="Aterrizaje">
                    <rect x="-5" y="-27" width="10" height="10" rx="2" style={{ fill: '#0d1b2a' }} />
                  </Pin>
                )
              })()}
            </>
          )
        }}
      </MapaTeselas>

      <div className="flotante modo" role="group" aria-label="Qué marcar al hacer clic">
        <span className="modo__etiqueta">Al hacer clic marcar:</span>
        <button type="button" aria-pressed={modo === 'aterrizaje'} onClick={() => onModo('aterrizaje')}>
          <span className="icono-modo icono-modo--base" aria-hidden="true" />Aterrizaje
        </button>
        <button type="button" aria-pressed={modo === 'punto'} onClick={() => onModo('punto')}>
          <span className="icono-modo icono-modo--punto" aria-hidden="true" />Punto a visitar
        </button>
      </div>

      <div className={`flotante aviso ${aviso ? 'visible' : ''}`} role="status">{aviso}</div>

      <div className="flotante barra-mapa">
        {e && (
          <div className="escala">
            <div className="escala__barra" style={{ width: e.px }} />
            <span className="mono">{e.texto}</span>
          </div>
        )}
        <span className="mono">{cursor ? formatearCoords(cursor) : 'Mueve el cursor sobre el mapa'}</span>
      </div>

      <p className="flotante creditos">
        Imágenes: CTX (NASA/JPL-Caltech/MSSS) y HiRISE (NASA/JPL-Caltech/Univ. of Arizona), vía NASA Mars Trek. Coloreadas para el diseño.
      </p>

      <div className="flotante zoom">
        <button type="button" onClick={() => zoomBoton(1)} aria-label="Acercar" disabled={!vista}>+</button>
        <button type="button" onClick={() => zoomBoton(-1)} aria-label="Alejar" disabled={!vista}>−</button>
      </div>
    </main>
  )
}
