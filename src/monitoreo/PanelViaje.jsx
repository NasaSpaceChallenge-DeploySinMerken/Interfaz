// Datos de la caminata que entregan los backends (nada simulado):
// - Oxígeno: monitoreo en tiempo real (POST /api/monitoreo): tanque, costo de volver,
//   reserva, desvío de la ruta y si el astronauta está detenido.
// - Lo que falta: análisis del backend 2 (POST /gale/analyze) desde la posición
//   actual: distancia, tiempo y pendiente del tramo hacia la próxima parada.

import { formatearDistancia } from '../mapa/geo'
import { colorSalida } from '../mapa/colores'
import { Tarjeta } from './Tarjeta'

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
  const resumen = error
    ? 'sin datos'
    : monitoreo
      ? `${gramos(monitoreo.oxigenoRestanteG)}${monitoreo.oxigenoPct != null ? ` · ${Math.round(monitoreo.oxigenoPct)} %` : ''}`
      : '…'

  return (
    <Tarjeta etiqueta="Oxígeno · monitoreo" resumen={resumen} alerta={!alcanza || Boolean(error)} className="viaje" ariaLabel="Oxígeno">
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
    </Tarjeta>
  )
}

export function PanelViaje({ metricas, error, salida, salidas }) {
  const etiqueta = (
    <>
      {salidas > 1 && <span className="tramos__punto" style={{ background: colorSalida(salida - 1) }} aria-hidden="true" />}
      Lo que falta<span className="tarjeta__extra">{salidas > 1 ? ` de la salida ${salida} de ${salidas}` : ''} · backend 2</span>
    </>
  )
  const resumen = error ? 'sin datos' : metricas ? `${formatearDistancia(metricas.restanteM)} · ${duracion(metricas.tiempoMin)}` : '…'

  return (
    <Tarjeta etiqueta={etiqueta} resumen={resumen} alerta={Boolean(error)} className="viaje" ariaLabel="Lo que falta del viaje">
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
    </Tarjeta>
  )
}
