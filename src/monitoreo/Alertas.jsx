// Lista de alertas (J4 — Juan).

export function Alertas({ alertas, onCerrar }) {
  return (
    <section className="alertas" aria-label="Alertas" aria-live="polite">
      <h2>Alertas</h2>

      {/* TODO (Juan): estilo por nivel, mensaje cuando no hay alertas. */}
      <ul>
        {alertas.map((alerta) => (
          <li key={alerta.id}>
            {alerta.mensaje}
            <button type="button" onClick={() => onCerrar(alerta)}>Cerrar</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
