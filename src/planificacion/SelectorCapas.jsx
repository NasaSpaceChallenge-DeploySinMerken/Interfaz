// Capas que entrega el backend.

export function SelectorCapas({ capas, activas, error, onCambiar }) {
  if (error) return <p className="error">No se pudieron cargar las capas: {error}</p>
  if (!capas.length) return <p className="paso__ayuda">Cargando capas…</p>

  return (
    <div className="selector-capas">
      {capas.map((capa) => (
        <label key={capa.id} className="check">
          <input type="checkbox" checked={activas.has(capa.id)} onChange={() => onCambiar(capa.id)} />
          <span>
            {capa.nombre}
            {capa.descripcion && <small>{capa.descripcion}</small>}
          </span>
        </label>
      ))}
    </div>
  )
}
