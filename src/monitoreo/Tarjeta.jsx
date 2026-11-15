// Tarjeta del HUD.
// - En computador: siempre abierta, con su título y todo el detalle.
// - En teléfono: cerrada muestra una línea con lo importante (`resumen`);
//   al tocarla se despliega el detalle. Así el mapa del viaje queda a la vista.

import { useEffect, useId, useState } from 'react'

const CONSULTA_TELEFONO = '(max-width: 860px)'

export function useEsTelefono() {
  const [es, setEs] = useState(() => typeof window !== 'undefined' && window.matchMedia(CONSULTA_TELEFONO).matches)
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_TELEFONO)
    const alCambiar = () => setEs(consulta.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])
  return es
}

export function Tarjeta({ etiqueta, resumen, alerta = false, className = '', ariaLabel, children }) {
  const esTelefono = useEsTelefono()
  const [abierta, setAbierta] = useState(false)
  const idDetalle = useId()

  if (!esTelefono) {
    return (
      <section className={`panel tarjeta ${className}`} aria-label={ariaLabel}>
        <span className="etiqueta">{etiqueta}</span>
        {children}
      </section>
    )
  }

  return (
    <section className={`panel tarjeta tarjeta--plegable ${abierta ? 'tarjeta--abierta' : ''} ${className}`} aria-label={ariaLabel}>
      <button
        type="button"
        className="tarjeta__cabecera"
        aria-expanded={abierta}
        aria-controls={idDetalle}
        onClick={() => setAbierta((a) => !a)}
      >
        <span className="etiqueta">{etiqueta}</span>
        <span className={`tarjeta__resumen mono ${alerta ? 'tarjeta__resumen--alerta' : ''}`}>{resumen}</span>
        <svg className="tarjeta__flecha" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 9 L7 5 L11 9" />
        </svg>
      </button>
      {abierta && <div className="tarjeta__detalle" id={idDetalle}>{children}</div>}
    </section>
  )
}
