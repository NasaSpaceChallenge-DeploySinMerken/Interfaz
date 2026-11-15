// Alertas del monitoreo (backend) y de los signos vitales (simuladas, con la
// etiqueta "Simulado"), estilo notificación de juego.
// Arriba van los avisos de la propia demo (no son alertas del backend):
// el backend perdió la ruta, o el astronauta llegó al borde del tramo.

const ETIQUETAS = { critico: 'Crítico', aviso: 'Aviso', info: 'Info' }

export function Alertas({ alertas, onCerrar, avisos = [] }) {
  return (
    <ul className="alertas" aria-label="Alertas" aria-live="polite">
      {avisos.map((a) => (
        <li key={a.id} className="alerta alerta--sistema" role="status">
          <div className="alerta__cuerpo">
            <span className="alerta__nivel">{a.etiqueta}</span>
            <span className="alerta__titulo">{a.titulo}</span>
            {a.detalle && <span className="alerta__detalle">{a.detalle}</span>}
            {a.accion && (
              <button type="button" className="boton boton--principal alerta__accion" onClick={a.accion.onClick}>{a.accion.texto}</button>
            )}
          </div>
        </li>
      ))}
      {alertas.map((a) => (
        <li key={a.id} className={`alerta alerta--${a.nivel}`} role={a.nivel === 'critico' ? 'alert' : undefined}>
          <div className="alerta__cuerpo">
            <span className="alerta__nivel">{ETIQUETAS[a.nivel] ?? a.nivel}{a.simulado && <span className="simulado">Simulado</span>}</span>
            <span className="alerta__titulo">{a.mensaje}</span>
          </div>
          <button type="button" className="alerta__cerrar" onClick={() => onCerrar(a)} aria-label={`Cerrar alerta: ${a.mensaje}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" /></svg>
          </button>
        </li>
      ))}
    </ul>
  )
}
