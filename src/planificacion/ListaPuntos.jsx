// Puntos a visitar: agregar, quitar, reordenar y renombrar. Máximo MAX_PUNTOS.

import { MAX_PUNTOS } from '../datos/gale'
import { formatearCoords } from '../mapa/geo'
import { FormCoordenadas } from './FormCoordenadas'

export function ListaPuntos({ puntos, hayAterrizaje, onAgregar, onQuitar, onMover, onRenombrar }) {
  const lleno = puntos.length >= MAX_PUNTOS

  return (
    <>
      <ol className="lista" aria-label="Puntos a visitar, en orden">
        {!puntos.length && (
          <li className="lista__vacia">
            {hayAterrizaje ? 'Haz clic en el mapa para agregar puntos.' : 'Primero marca el punto de aterrizaje.'}
          </li>
        )}
        {puntos.map((p, i) => (
          <li key={p.id} className="punto">
            <span className="punto__num" aria-hidden="true">{i + 1}</span>
            <div className="punto__datos">
              <input
                type="text"
                className="punto__nombre"
                aria-label={`Nombre del punto ${i + 1}`}
                defaultValue={p.nombre}
                onBlur={(e) => onRenombrar(p.id, e.target.value.trim() || p.nombre)}
              />
              <span className="punto__coords mono">{formatearCoords(p)}</span>
            </div>
            <div className="punto__botones">
              <button type="button" className="boton--icono boton--texto" onClick={() => onMover(i, -1)} disabled={i === 0} aria-label={`Subir ${p.nombre}`}>↑</button>
              <button type="button" className="boton--icono boton--texto" onClick={() => onMover(i, 1)} disabled={i === puntos.length - 1} aria-label={`Bajar ${p.nombre}`}>↓</button>
              <button type="button" className="boton--icono boton--texto" onClick={() => onQuitar(p.id)} aria-label={`Quitar ${p.nombre}`}>✕</button>
            </div>
          </li>
        ))}
        {lleno && <li className="lista__vacia">Llegaste al máximo de {MAX_PUNTOS} puntos.</li>}
      </ol>
      <FormCoordenadas conNombre textoBoton="Agregar punto" deshabilitado={lleno || !hayAterrizaje} onEnviar={onAgregar} />
    </>
  )
}
