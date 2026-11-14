// Métricas de la ruta calculada por el backend.

import { usaBackendFalso } from '../api/cliente'

const ESFUERZO = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }

const km = (m) => `${(m / 1000).toFixed(2)} km`
const duracion = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`

export function Metricas({ resultado, nombres }) {
  const { metricas, tramos } = resultado
  const pendiente = metricas.pendienteMaxGrados

  return (
    <>
      <div className="metricas">
        <div className="metrica"><span className="metrica__nombre">Distancia</span><span className="metrica__valor">{km(metricas.distanciaM)}</span></div>
        <div className="metrica"><span className="metrica__nombre">Duración</span><span className="metrica__valor">{duracion(metricas.duracionMin)}</span></div>
        <div className="metrica"><span className="metrica__nombre">Oxígeno necesario</span><span className="metrica__valor">{metricas.oxigenoPct} %</span></div>
        <div className="metrica"><span className="metrica__nombre">Esfuerzo</span><span className="metrica__valor">{ESFUERZO[metricas.esfuerzo] ?? metricas.esfuerzo}</span></div>
        <div className="metrica metrica--ancha">
          <span className="metrica__nombre">Pendiente máxima</span>
          {pendiente == null
            ? <span className="metrica__valor metrica__valor--pendiente">La calcula el backend</span>
            : <span className="metrica__valor">{pendiente}°</span>}
        </div>
      </div>

      <table className="tramos">
        <caption>Por tramo</caption>
        <thead>
          <tr><th scope="col">Tramo</th><th scope="col" className="num">Distancia</th><th scope="col" className="num">Tiempo</th><th scope="col" className="num">O₂</th></tr>
        </thead>
        <tbody>
          {tramos.map((t, i) => (
            <tr key={i}>
              <td>{i + 1}. {nombres[t.desde] ?? t.desde} → {nombres[t.hasta] ?? t.hasta}</td>
              <td className="num">{km(t.distanciaM)}</td>
              <td className="num">{t.duracionMin} min</td>
              <td className="num">{t.oxigenoPct} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      {usaBackendFalso && (
        <p className="nota">Backend falso: tramos en línea recta y valores de ejemplo. El backend real calcula la ruta según el terreno.</p>
      )}
    </>
  )
}
