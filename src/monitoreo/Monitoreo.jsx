// Fase 2: monitorear la caminata.
// Mapa grande que sigue al astronauta, minimapa del recorrido y alertas del backend.
// En modo manual el astronauta se controla con teclado, cruceta o joystick.

import { useState } from 'react'
import { MapaTeselas } from '../mapa/MapaTeselas'
import { escala, formatearDistancia } from '../mapa/geo'
import { useMonitoreo } from './useMonitoreo'
import { useAlertas } from './useAlertas'
import { BarraSuperior } from './BarraSuperior'
import { Brujula } from './Brujula'
import { Alertas } from './Alertas'
import { Minimapa } from './Minimapa'
import { Cruceta } from './Cruceta'
import { PanelOxigeno, PanelViaje } from './PanelViaje'
import { colorSalida } from '../mapa/colores'
import { LeyendaSalidas } from '../planificacion/MapaPlanificacion'


export function Monitoreo({ viaje, onSalir }) {
  const {
    lectura, sensores, alertas: delBackend, monitoreo, errorMonitoreo, rutaPerdida, metricasViaje, errorMetricas,
    enMarcha, velocidad, modo, controlRemoto, codigoSesion, acciones,
  } = useMonitoreo(viaje, onSalir)
  // solo las alertas del monitoreo (backend)
  const { alertas, cerrar } = useAlertas(delBackend)
  // avisos de la demo (no son alertas del backend)
  const avisos = [
    ...(rutaPerdida ? [{
      id: 'ruta-perdida',
      etiqueta: 'Monitoreo',
      titulo: 'El backend ya no tiene esta ruta',
      detalle: 'Se reinició el servicio de monitoreo. Para seguir, hay que volver a planificar el viaje.',
      accion: { texto: 'Volver a planificar', onClick: onSalir },
    }] : []),
    ...(lectura.fueraDeZona ? [{
      id: 'borde-tramo',
      etiqueta: 'Demo',
      titulo: 'Borde del tramo de la demo',
      detalle: 'No se puede seguir en esa dirección.',
    }] : []),
  ]
  const [z, setZ] = useState(15)

  const { camino, paradas } = sensores
  const rutasSalidas = viaje.respuesta.rutasSalidas ?? null
  const e = escala(z, 90)
  const destino = paradas[paradas.length - 1]

  return (
    <div className="monitoreo">
      <MapaTeselas className="monitoreo__mapa" capas={viaje.capas} centro={lectura.posicion} z={z}>
        {(proyectar, tam) => {
          const pts = (lista) => lista.map((p) => proyectar(p.lon, p.lat).map((n) => n.toFixed(1)).join(',')).join(' ')
          const [bx, by] = proyectar(viaje.aterrizaje.lon, viaje.aterrizaje.lat)
          return (
            <>
              {rutasSalidas
                // varias salidas: cada una con su color
                ? rutasSalidas.map((r, i) => (
                    <polyline key={i} points={pts(r.map(([lon, lat]) => ({ lon, lat })))} className="hud-pendiente" style={{ stroke: colorSalida(i) }} />
                  ))
                : <polyline points={pts(camino)} className="hud-pendiente" />}
              <polyline points={pts(lectura.rastro)} className="hud-recorrido" />
              {viaje.puntos.map((p, i) => {
                const [x, y] = proyectar(p.lon, p.lat)
                return (
                  <g key={p.id} transform={`translate(${x} ${y})`}>
                    <circle r="11" className="hud-parada" />
                    <text y="4" className="hud-parada__num">{i + 1}</text>
                    <text x="18" y="5" className="etiqueta-mapa">{p.nombre}</text>
                  </g>
                )
              })}
              <g transform={`translate(${bx} ${by})`}>
                <rect x="-12" y="-12" width="24" height="24" rx="5" className="hud-base" />
                <text x="18" y="5" className="etiqueta-mapa">Aterrizaje</text>
              </g>
              <g transform={`translate(${tam.ancho / 2} ${tam.alto / 2})`}>
                <circle r="34" className="hud-astronauta__halo" />
                <path d="M0 -24 L16 16 L0 8 L-16 16 Z" transform={`rotate(${lectura.rumbo})`} className="hud-astronauta" />
              </g>
            </>
          )
        }}
      </MapaTeselas>

      <div className="hud">
        <BarraSuperior t={lectura.t} enMarcha={enMarcha} velocidad={velocidad} modo={modo} controlRemoto={controlRemoto} codigoSesion={codigoSesion} acciones={acciones} onSalir={onSalir} />
        <Brujula rumbo={lectura.rumbo} />
        <Alertas alertas={alertas} onCerrar={cerrar} avisos={avisos} />

        <div className="lateral">
          <Minimapa capas={viaje.capas} camino={camino} rutasSalidas={rutasSalidas} paradas={paradas} aterrizaje={viaje.aterrizaje} lectura={lectura} />
          <section className="panel objetivo" aria-label="Recorrido">
            <span className="etiqueta">Destino</span>
            <span className="objetivo__nombre">{destino?.nombre ?? '—'}</span>
            <div className="objetivo__fila"><span>Distancia restante</span><span className="mono objetivo__dato">{formatearDistancia(lectura.restante)}</span></div>
            <div className="objetivo__fila"><span>Recorrido</span><span className="mono objetivo__dato">{formatearDistancia(lectura.recorrido)}</span></div>
          </section>
          <PanelOxigeno monitoreo={monitoreo} error={errorMonitoreo} />
          <PanelViaje metricas={metricasViaje} error={errorMetricas} salida={lectura.salida} salidas={lectura.salidas} />
          {rutasSalidas && <LeyendaSalidas cantidad={rutasSalidas.length} className="leyenda-salidas--hud" />}
        </div>

        {/* con control remoto conectado, la cruceta no se muestra para no tapar la demo */}
        {modo === 'manual' && !controlRemoto && <Cruceta onMover={acciones.moverPad} />}

        <div className="panel escala-hud">
          <div className="escala">
            <div className="escala__barra" style={{ width: e.px }} />
            <span className="mono">{e.texto}</span>
          </div>
          <div className="zoom-hud">
            <button type="button" onClick={() => setZ((v) => Math.max(12, v - 1))} aria-label="Alejar">−</button>
            <button type="button" onClick={() => setZ((v) => Math.min(17, v + 1))} aria-label="Acercar">+</button>
          </div>
        </div>

        <p className="panel creditos-hud">
          Imágenes: NASA Mars Trek (CTX: NASA/JPL-Caltech/MSSS · HiRISE: NASA/JPL-Caltech/Univ. of Arizona), coloreadas para el diseño.
        </p>

        <section className="panel proxima" aria-label="Próxima parada" aria-live="polite">
          <span className="etiqueta">Próxima parada</span>
          <span className="objetivo__nombre">{lectura.proxima ? lectura.proxima.nombre : 'Llegaste al destino'}</span>
          <div className="objetivo__fila">
            <span>Falta</span>
            <span className="mono objetivo__dato">{lectura.proxima ? formatearDistancia(lectura.proxima.faltaM) : '—'}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
