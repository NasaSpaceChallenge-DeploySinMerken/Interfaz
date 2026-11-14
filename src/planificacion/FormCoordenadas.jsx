// Formulario para escribir coordenadas a mano.

import { useId, useState } from 'react'
import { TRAMO } from '../datos/gale'
import { dentroDe } from '../mapa/geo'

export function FormCoordenadas({ textoBoton, conNombre = false, deshabilitado = false, onEnviar }) {
  const id = useId()
  const [nombre, setNombre] = useState('')
  const [lon, setLon] = useState('')
  const [lat, setLat] = useState('')
  const [error, setError] = useState(null)

  function enviar(e) {
    e.preventDefault()
    const p = { lon: parseFloat(lon), lat: -Math.abs(parseFloat(lat)) }
    if (Number.isNaN(p.lon) || Number.isNaN(p.lat)) return setError('Escribe la longitud y la latitud.')
    if (!dentroDe(TRAMO, p)) return setError('Fuera del tramo: longitud 137.30–137.60 y latitud 4.50–4.75.')
    setError(null)
    onEnviar({ ...p, nombre: nombre.trim() })
    setNombre('')
    setLon('')
    setLat('')
  }

  return (
    <form className="form-coords" onSubmit={enviar} noValidate>
      {conNombre && (
        <label className="form-coords__ancho" htmlFor={`${id}-nombre`}>
          Nombre (opcional)
          <input id={`${id}-nombre`} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Darwin" disabled={deshabilitado} />
        </label>
      )}
      <label htmlFor={`${id}-lon`}>
        Longitud (° E)
        <input id={`${id}-lon`} type="number" step="0.0001" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="137.4416" disabled={deshabilitado} />
      </label>
      <label htmlFor={`${id}-lat`}>
        Latitud (° S)
        <input id={`${id}-lat`} type="number" step="0.0001" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="4.5895" disabled={deshabilitado} />
      </label>
      {error && <p className="error form-coords__ancho" role="alert">{error}</p>}
      <button type="submit" className="form-coords__ancho" disabled={deshabilitado}>{textoBoton}</button>
    </form>
  )
}
