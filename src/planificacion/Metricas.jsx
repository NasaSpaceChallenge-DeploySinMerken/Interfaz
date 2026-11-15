// Métricas de la ruta calculada.
//
// Según la fuente (resultado.fuente):
// - 'plan': backend 1 con /api/plan (análisis del equipo 3): ruta por el terreno,
//   orden de visitas, tiempo, oxígeno, visitas inalcanzables y varias salidas.
// - 'mapa': backend 1 con /api/routes: distancia y elevación; el resto llega con el análisis.
// - 'mock': backend falso, valores de ejemplo.

import { colorSalida } from '../mapa/colores'

const ESFUERZO = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }
const ESTADO = {
  validated: 'Ruta validada. Analizando el terreno…',
  forwarded: 'Analizando el terreno…',
  analyzed: null,
}
const NOTA = {
  plan: 'Ruta calculada según el terreno: sigue el relieve y elige el mejor orden para las visitas. El consumo de oxígeno es una estimación.',
  mapa: 'Ruta validada. Tramos en línea recta entre tus puntos.',
  mock: 'Datos de ejemplo, sin conexión al servidor: tramos en línea recta y valores aproximados.',
}

const km = (m) => `${(m / 1000).toFixed(2)} km`
const duracion = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`

function Metrica({ nombre, valor, detalle, vacio, ancha = false }) {
  return (
    <div className={`metrica ${ancha ? 'metrica--ancha' : ''}`}>
      <span className="metrica__nombre">{nombre}</span>
      {valor == null
        ? <span className="metrica__valor metrica__valor--pendiente">{vacio}</span>
        : <span className="metrica__valor">{valor}</span>}
      {detalle && <span className="metrica__detalle">{detalle}</span>}
    </div>
  )
}

export function Metricas({ resultado, nombres }) {
  const { metricas: m, tramos, estadoAnalisis, fuente, inalcanzables = [], advertencia } = resultado
  const estado = ESTADO[estadoAnalisis]
  // si el análisis ya llegó y un dato falta, es que ese backend no lo entrega
  const vacio = estadoAnalisis === 'analyzed' ? 'No disponible' : 'Pendiente del análisis'
  const hayElevacion = m.elevacionMinM != null
  const hayDesnivel = tramos.some((t) => t.desnivelM != null)
  const pendiente = m.pendienteMaxGrados != null
    ? `${m.pendienteMaxGrados}°`
    : m.limitePendienteGrados != null ? `menos de ${m.limitePendienteGrados}°` : null

  return (
    <>
      {estado && <p className="estado-analisis" role="status">{estado}</p>}

      {inalcanzables.length > 0 && (
        <div className="aviso-ruta" role="alert">
          <strong>No se puede llegar a:</strong>
          <ul>
            {inalcanzables.map((v) => <li key={v.id}>{nombres[v.id] ?? v.id}: {v.motivo}</li>)}
          </ul>
        </div>
      )}

      <div className="metricas">
        <Metrica nombre="Distancia" valor={km(m.distanciaM)} vacio={vacio} />
        <Metrica nombre="Duración" valor={m.duracionMin != null ? duracion(m.duracionMin) : null} vacio={vacio} />
        <Metrica
          nombre="Oxígeno necesario"
          valor={m.oxigenoPct != null ? `${m.oxigenoPct} %` : null}
          detalle={[m.oxigenoDetalle, m.oxigenoAlcanza === false ? 'sin reserva suficiente' : null].filter(Boolean).join(' · ') || null}
          vacio={vacio}
        />
        {m.salidas != null
          ? <Metrica nombre="Salidas" valor={`${m.salidas}`} detalle={m.salidas > 1 ? `vuelve al aterrizaje a recargar oxígeno${m.recargas ? ` (${m.recargas} ${m.recargas === 1 ? 'recarga' : 'recargas'})` : ''}` : 'una sola caminata'} vacio={vacio} />
          : <Metrica nombre="Esfuerzo" valor={m.esfuerzo != null ? (ESFUERZO[m.esfuerzo] ?? m.esfuerzo) : null} vacio={vacio} />}
        <Metrica nombre="Pendiente máxima" valor={pendiente} vacio={vacio} ancha={!hayElevacion} />
        {hayElevacion && <Metrica nombre="Elevación" valor={`${m.elevacionMinM} a ${m.elevacionMaxM} m`} vacio={vacio} />}
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
              <td>
                {m.salidas > 1 && t.salida != null && (
                  <span className="tramos__salida" style={{ color: colorSalida(t.salida) }}>
                    <span className="tramos__punto" style={{ background: colorSalida(t.salida) }} aria-hidden="true" />
                    Salida {t.salida + 1}
                  </span>
                )}
                {i + 1}. {nombres[t.desde] ?? t.desde} → {nombres[t.hasta] ?? t.hasta}
              </td>
              <td className="num">{km(t.distanciaM)}</td>
              {hayDesnivel
                ? <td className="num">{t.desnivelM > 0 ? '+' : ''}{t.desnivelM} m</td>
                : <><td className="num">{t.duracionMin ?? '—'} min</td><td className="num">{t.oxigenoPct ?? '—'} %</td></>}
            </tr>
          ))}
        </tbody>
      </table>

      {advertencia && <p className="nota nota--aviso">{advertencia}</p>}
      <p className="nota">{NOTA[fuente] ?? NOTA.mock}</p>
    </>
  )
}
