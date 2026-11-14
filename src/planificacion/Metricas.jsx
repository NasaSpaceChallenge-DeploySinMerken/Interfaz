// Métricas de la ruta calculada por el backend.
//
// Con la API real, la validación devuelve distancia y elevación; el resto
// (tiempo, oxígeno, esfuerzo, pendiente) llega después con el análisis del
// equipo 3. Lo que todavía no llegó se muestra como pendiente.

import { usaBackendFalso } from '../api/cliente'

const ESFUERZO = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }
const ESTADO = {
  validated: 'Ruta validada. Esperando el análisis del equipo 3…',
  forwarded: 'Ruta enviada al equipo 3. Esperando el análisis…',
  analyzed: null,
}

const km = (m) => `${(m / 1000).toFixed(2)} km`
const duracion = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`

function Metrica({ nombre, valor, ancha = false }) {
  return (
    <div className={`metrica ${ancha ? 'metrica--ancha' : ''}`}>
      <span className="metrica__nombre">{nombre}</span>
      {valor == null
        ? <span className="metrica__valor metrica__valor--pendiente">Pendiente del análisis</span>
        : <span className="metrica__valor">{valor}</span>}
    </div>
  )
}

export function Metricas({ resultado, nombres }) {
  const { metricas: m, tramos, estadoAnalisis } = resultado
  const estado = ESTADO[estadoAnalisis]
  const hayElevacion = m.elevacionMinM != null
  const hayDesnivel = tramos.some((t) => t.desnivelM != null)

  return (
    <>
      {estado && <p className="estado-analisis" role="status">{estado}</p>}

      <div className="metricas">
        <Metrica nombre="Distancia" valor={km(m.distanciaM)} />
        <Metrica nombre="Duración" valor={m.duracionMin != null ? duracion(m.duracionMin) : null} />
        <Metrica nombre="Oxígeno necesario" valor={m.oxigenoPct != null ? `${m.oxigenoPct} %` : null} />
        <Metrica nombre="Esfuerzo" valor={m.esfuerzo != null ? (ESFUERZO[m.esfuerzo] ?? m.esfuerzo) : null} />
        <Metrica nombre="Pendiente máxima" valor={m.pendienteMaxGrados != null ? `${m.pendienteMaxGrados}°` : null} ancha={!hayElevacion} />
        {hayElevacion && <Metrica nombre="Elevación" valor={`${m.elevacionMinM} a ${m.elevacionMaxM} m`} />}
      </div>

      <table className="tramos">
        <caption>Por tramo</caption>
        <thead>
          <tr>
            <th scope="col">Tramo</th>
            <th scope="col" className="num">Distancia</th>
            {hayDesnivel
              ? <th scope="col" className="num">Desnivel</th>
              : <><th scope="col" className="num">Tiempo</th><th scope="col" className="num">O₂</th></>}
          </tr>
        </thead>
        <tbody>
          {tramos.map((t, i) => (
            <tr key={i}>
              <td>{i + 1}. {nombres[t.desde] ?? t.desde} → {nombres[t.hasta] ?? t.hasta}</td>
              <td className="num">{km(t.distanciaM)}</td>
              {hayDesnivel
                ? <td className="num">{t.desnivelM > 0 ? '+' : ''}{t.desnivelM} m</td>
                : <><td className="num">{t.duracionMin ?? '—'} min</td><td className="num">{t.oxigenoPct ?? '—'} %</td></>}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="nota">
        {usaBackendFalso
          ? 'Backend falso: tramos en línea recta y valores de ejemplo. El backend real calcula la ruta según el terreno.'
          : 'Ruta validada por la API del equipo del mapa. Tramos en línea recta entre tus puntos.'}
      </p>
    </>
  )
}
