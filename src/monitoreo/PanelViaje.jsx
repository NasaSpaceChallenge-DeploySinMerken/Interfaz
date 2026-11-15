// Datos de la caminata que entregan los backends (nada simulado):
// - Oxígeno: monitoreo en tiempo real (POST /api/monitoreo): tanque, costo de volver,
//   reserva, desvío de la ruta y si el astronauta está detenido.
// - Lo que falta: análisis del backend 2 (POST /gale/analyze) desde la posición
//   actual: distancia, tiempo y pendiente del tramo hacia la próxima parada.

import { formatearDistancia } from '../mapa/geo'
import { colorSalida } from '../mapa/colores'
import { Tarjeta } from './Tarjeta'
import { UMBRALES } from './signosVitales'
import { nivelOxigeno } from './nivelOxigeno'

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
  // blanco: todo bien; amarillo: queda poco; rojizo: volver ya usa la reserva
  const nivel = nivelOxigeno(monitoreo)
  const color = nivel === 'normal' ? '' : `vital--${nivel}`
  const resumen = error
    ? 'sin datos'
    : monitoreo
      ? `${gramos(monitoreo.oxigenoRestanteG)}${monitoreo.oxigenoPct != null ? ` · ${Math.round(monitoreo.oxigenoPct)} %` : ''}`
      : '…'

  return (
    <Tarjeta etiqueta="Oxígeno" resumen={resumen} nivel={error || nivel === 'normal' ? null : nivel} alerta={Boolean(error)} className="viaje" ariaLabel="Oxígeno">
      {error && <p className="viaje__error">{error}</p>}
      {!monitoreo && !error && <p className="viaje__ayuda">Esperando datos…</p>}
      {monitoreo && (
        <>
          <Fila nombre="En el tanque" valor={`${gramos(monitoreo.oxigenoRestanteG)}${monitoreo.oxigenoPct != null ? ` · ${Math.round(monitoreo.oxigenoPct)} %` : ''}`} clase={color} />
          <Fila nombre="Para volver al aterrizaje" valor={gramos(monitoreo.costoRegresoG)} clase={nivel === 'critico' ? color : ''} />
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
      Lo que falta<span className="tarjeta__extra">{salidas > 1 ? ` de la salida ${salida} de ${salidas}` : ''}</span>
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

// Signos vitales SIMULADOS (signosVitales.js): siempre con la etiqueta "Simulado".
// Cada valor en verde (normal), amarillo (aviso) o rojo (crítico).
export function PanelVitales({ signos }) {
  const u = UMBRALES
  const nivelPulso = signos.pulso > u.pulso.critico ? 'critico' : signos.pulso > u.pulso.aviso ? 'aviso' : ''
  const nivelTemp = signos.temperatura >= u.temperaturaAlta.critico || signos.temperatura <= u.temperaturaBaja.critico
    ? 'critico'
    : signos.temperatura >= u.temperaturaAlta.aviso || signos.temperatura <= u.temperaturaBaja.aviso ? 'aviso' : ''
  const nivelSat = signos.saturacion < u.saturacion.critico ? 'critico' : signos.saturacion < u.saturacion.aviso ? 'aviso' : ''
  const clase = (nivel) => `vital--${nivel || 'normal'}`
  const peor = [nivelPulso, nivelTemp, nivelSat].includes('critico') ? 'critico' : [nivelPulso, nivelTemp, nivelSat].includes('aviso') ? 'aviso' : 'normal'
  const etiqueta = <><span className="solo-grande">Signos vitales</span><span className="solo-telefono">Vitales</span><span className="simulado">Simulado</span></>
  // en teléfono, el resumen cerrado deja fuera la saturación para que quepa la etiqueta
  const resumen = <>{signos.pulso} lpm · {signos.temperatura.toFixed(1)} °C<span className="tarjeta__extra"> · {signos.saturacion.toFixed(0)} %</span></>

  return (
    <Tarjeta etiqueta={etiqueta} resumen={resumen} nivel={peor} className="viaje" ariaLabel="Signos vitales (simulados)">
      <Fila nombre="Pulso" valor={`${signos.pulso} lpm`} clase={clase(nivelPulso)} />
      <Fila nombre="Temperatura" valor={`${signos.temperatura.toFixed(1)} °C`} clase={clase(nivelTemp)} />
      <Fila nombre="Saturación de O₂" valor={`${signos.saturacion.toFixed(1)} %`} clase={clase(nivelSat)} />
    </Tarjeta>
  )
}
