// Botón para poner la demo en pantalla completa (para la presentación).
// Si el navegador no lo permite (por ejemplo, Safari en iPhone), no se muestra.

import { useEffect, useState } from 'react'

const soportado = () => typeof document !== 'undefined' && document.fullscreenEnabled

export function BotonPantallaCompleta({ className = '' }) {
  const [activa, setActiva] = useState(() => soportado() && Boolean(document.fullscreenElement))

  useEffect(() => {
    if (!soportado()) return
    const alCambiar = () => setActiva(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  if (!soportado()) return null

  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen().catch(() => {})
  }
  const texto = activa ? 'Salir de pantalla completa' : 'Pantalla completa'

  return (
    <button type="button" className={`boton-pantalla ${className}`} onClick={alternar} aria-label={texto} title={texto} aria-pressed={activa}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        {activa
          ? <path d="M6 1 V6 H1 M12 1 V6 H17 M6 17 V12 H1 M12 17 V12 H17" />
          : <path d="M1 6 V1 H6 M12 1 H17 V6 M1 12 V17 H6 M17 12 V17 H12" />}
      </svg>
    </button>
  )
}
