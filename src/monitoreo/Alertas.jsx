// Alertas que manda el backend, estilo notificación de juego.

const ETIQUETAS = { critico: 'Crítico', aviso: 'Aviso', info: 'Info' }

export function Alertas({ alertas, onCerrar, sinConexion }) {
  return (
    <ul className="alertas" aria-label="Alertas" aria-live="polite">
      {sinConexion && (
        <li className="alerta alerta--aviso" role="status">
          <div className="alerta__cuerpo">
            <span className="alerta__nivel">Conexión</span>
            <span className="alerta__titulo">Sin respuesta del backend</span>
            <span className="alerta__detalle">La caminata sigue; las alertas pueden estar desactualizadas.</span>
          </div>
        </li>
      )}
      {alertas.map((a) => (
        <li key={a.id} className={`alerta alerta--${a.nivel}`} role={a.nivel === 'critico' ? 'alert' : undefined}>
          <div className="alerta__cuerpo">
            <span className="alerta__nivel">{ETIQUETAS[a.nivel] ?? a.nivel}</span>
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
