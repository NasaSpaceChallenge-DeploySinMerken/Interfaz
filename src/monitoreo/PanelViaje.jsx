// Datos de la caminata que entregan los backends (nada simulado):
// - Oxígeno: monitoreo en tiempo real (POST /api/monitoreo): tanque, costo de volver,
//   reserva, desvío de la ruta y si el astronauta está detenido.
// - Lo que falta: análisis del backend 2 (POST /gale/analyze) desde la posición
//   actual: distancia, tiempo y pendiente del tramo hacia la próxima parada.

import { formatearDistancia } from '../mapa/geo'

const duracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`)
const gramos = (g) => (g == null ? '—' : `${Math.round(g)} g`)

function Fila({ nombre, valor, clase = '' }) {
  return (
    <div className="objetivo__fila">
      <span>{nombre}</span>
      <span className={`mono objetivo__dato ${clase}`}>{valor}</span>
    </div>
  )
}

export function PanelOxigeno({ monitoreo, error }) {
  const alcanza = monitoreo && monitoreo.oxigenoRestanteG != null && monitoreo.costoRegresoG != null
    ? monitoreo.oxigenoRestanteG >= monitoreo.costoRegresoG + (monitoreo.reservaG ?? 0)
    : true

  return (
    <section className="panel viaje" aria-label="Oxígeno">
      <span className="etiqueta">Oxígeno · monitoreo</span>
      {error && <p className="viaje__error">{error}</p>}
      {!monitoreo && !error && <p className="viaje__ayuda">Esperando el monitoreo…</p>}
      {monitoreo && (
        <>
          <Fila nombre="En el tanque" valor={`${gramos(monitoreo.oxigenoRestanteG)}${monitoreo.oxigenoPct != null ? ` · ${Math.round(monitoreo.oxigenoPct)} %` : ''}`} />
          <Fila nombre="Para volver al aterrizaje" valor={gramos(monitoreo.costoRegresoG)} clase={alcanza ? '' : 'viaje__falta'} />
          <Fila nombre="Reserva" valor={gramos(monitoreo.reservaG)} />
          {monitoreo.distanciaARutaM != null && monitoreo.distanciaARutaM >= 1 && (
            <Fila nombre="Fuera de la ruta" valor={formatearDistancia(monitoreo.distanciaARutaM)} />
          )}
          {monitoreo.parado && <p className="viaje__ayuda">Astronauta detenido.</p>}
        </>
      )}
    </section>
  )
}

export function PanelViaje({ metricas, error, salida, salidas }) {
  return (
    <section className="panel viaje" aria-label="Lo que falta del viaje">
      <span className="etiqueta">
        Lo que falta{salidas > 1 ? ` de la salida ${salida} de ${salidas}` : ''} · backend 2
      </span>
      {error && <p className="viaje__error">{error}</p>}
      {!metricas && !error && <p className="viaje__ayuda">Calculando…</p>}
      {metricas && (
        <>
          <Fila nombre="Distancia" valor={formatearDistancia(metricas.restanteM)} />
          <Fila nombre="Tiempo" valor={duracion(metricas.tiempoMin)} />
          {metricas.tramoActual?.pendienteMaxPct != null && (
            <Fila nombre={`Pendiente hacia ${metricas.tramoActual.hacia}`} valor={`${Math.round(metricas.tramoActual.pendienteMaxPct)} %`} />
          )}
          {metricas.tramoActual?.peligros?.length > 0 && (
            <p className="viaje__ayuda">Tramo actual: {metricas.tramoActual.peligros.join(', ')}.</p>
          )}
        </>
      )}
    </section>
  )
}
