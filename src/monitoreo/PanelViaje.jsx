// Métricas de lo que falta del viaje, calculadas por el backend 2 (servicio de
// análisis) desde la posición actual y pasando por las paradas que quedan.

import { usaMetricasFalsas } from '../api/cliente'
import { formatearDistancia } from '../mapa/geo'

const duracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`)

// Oxígeno que queda en el tanque según el sensor, en gramos.
export const oxigenoDisponibleG = (metricas, sensores) =>
  metricas ? Math.round(((sensores?.oxigenoPct ?? 0) / 100) * metricas.tanqueG) : null

// Alertas que salen de las métricas del backend 2 (se suman a las del monitoreo).
export function alertasDeMetricas(metricas, sensores) {
  if (!metricas) return []
  const alertas = []
  const disponible = oxigenoDisponibleG(metricas, sensores)
  const reserva = metricas.reservaG ?? 0
  if (disponible - metricas.oxigenoG < reserva) {
    alertas.push({
      id: 'viaje-oxigeno',
      nivel: 'critico',
      mensaje: `El oxígeno no alcanza para terminar con reserva: faltan ${metricas.oxigenoG} g y quedan ${disponible} g`,
    })
  }
  const tramo = metricas.tramoActual
  if (tramo?.peligros?.length) {
    alertas.push({
      id: 'viaje-tramo',
      nivel: 'aviso',
      mensaje: `Tramo hacia ${tramo.hacia}: ${tramo.peligros.join(', ')}${tramo.pendienteMaxPct != null ? ` (máx. ${Math.round(tramo.pendienteMaxPct)} %)` : ''}`,
    })
  }
  return alertas
}

export function PanelViaje({ metricas, error, sensores, salida, salidas }) {
  const disponible = oxigenoDisponibleG(metricas, sensores)
  const alcanza = metricas && disponible - metricas.oxigenoG >= (metricas.reservaG ?? 0)

  return (
    <section className="panel viaje" aria-label="Lo que falta del viaje">
      <span className="etiqueta">
        Lo que falta{salidas > 1 ? ` de la salida ${salida} de ${salidas}` : ''} {usaMetricasFalsas ? '· estimación local' : '· backend 2'}
      </span>
      {error && <p className="viaje__error">No hay métricas del backend 2: {error}</p>}
      {!metricas && !error && <p className="viaje__ayuda">Calculando…</p>}
      {metricas && (
        <>
          <div className="objetivo__fila"><span>Distancia</span><span className="mono objetivo__dato">{formatearDistancia(metricas.restanteM)}</span></div>
          <div className="objetivo__fila"><span>Tiempo</span><span className="mono objetivo__dato">{duracion(metricas.tiempoMin)}</span></div>
          <div className="objetivo__fila">
            <span>Oxígeno necesario</span>
            <span className={`mono objetivo__dato ${alcanza ? '' : 'viaje__falta'}`}>{metricas.oxigenoG} g</span>
          </div>
          <div className="objetivo__fila"><span>Oxígeno en el tanque</span><span className="mono objetivo__dato">{disponible} g</span></div>
          {metricas.tramoActual?.pendienteMaxPct != null && (
            <div className="objetivo__fila">
              <span>Pendiente hacia {metricas.tramoActual.hacia}</span>
              <span className="mono objetivo__dato">{Math.round(metricas.tramoActual.pendienteMaxPct)} %</span>
            </div>
          )}
        </>
      )}
    </section>
  )
}
