import { tr } from '../idioma'
// Capas que entrega el backend.

export function SelectorCapas({ capas, activas, error, onCambiar }) {
  if (error) return <p className="error">{tr("No se pudieron cargar las capas:")} {tr(error)}</p>
  if (!capas.length) return <p className="paso__ayuda">{tr("Cargando capas…")}</p>

  return (
    <div className="selector-capas">
      {capas.map((capa) => (
        <label key={capa.id} className="check">
          <input type="checkbox" checked={activas.has(capa.id)} onChange={() => onCambiar(capa.id)} />
          <span>
            {tr(capa.nombre)}
            {capa.descripcion && <small>{tr(capa.descripcion)}</small>}
            {capa.kind === 'thermal' && <span className="termica-leyenda" aria-label={tr("Escala relativa de infrarrojo: menor a mayor intensidad")} />}
          </span>
        </label>
      ))}
    </div>
  )
}
