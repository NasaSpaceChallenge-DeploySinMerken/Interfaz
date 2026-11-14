// Muestra en la demo la dirección exacta que hay que abrir en el teléfono,
// con la IP de la red y el código de esta demo ya puestos.
// Las direcciones de red las entrega el servidor de Vite (vite.config.js).

import { useEffect, useState } from 'react'
import { CODIGO_SESION } from './sesion'

// la red de Docker (172.17.x.x) no sirve para el teléfono
const preferida = (urls) => urls.find((u) => !/\/\/172\.1[7-9]\./.test(u)) ?? urls[0]

export function EnlaceTelefono({ conectado }) {
  const [red, setRed] = useState(null) // null: cargando; []: sin --host

  useEffect(() => {
    // las direcciones de red solo existen con el servidor de desarrollo de Vite
    if (!import.meta.env.DEV) return setRed([])
    fetch('/__direcciones-red')
      .then((r) => (r.ok ? r.json() : { red: [] }))
      .then((d) => setRed(d.red ?? []))
      .catch(() => setRed([]))
  }, [])

  if (conectado) {
    return (
      <p className="telefono telefono--ok" role="status">
        <span className="punto-estado" aria-hidden="true" />
        Teléfono conectado · código <strong className="mono">{CODIGO_SESION}</strong>
      </p>
    )
  }

  const base = red?.length ? preferida(red) : null
  const direccion = base ? `${base.replace(/\/$/, '')}/#control=${CODIGO_SESION}` : null

  return (
    <div className="telefono">
      <p className="telefono__titulo">Controlar desde el teléfono</p>
      {direccion ? (
        <>
          <p className="telefono__ayuda">En el teléfono, con la misma Wi-Fi, abre:</p>
          <p className="telefono__direccion mono">{direccion}</p>
        </>
      ) : red && !import.meta.env.DEV ? (
        <p className="telefono__ayuda">
          El control desde el teléfono funciona con la interfaz corriendo en un computador (<code>npm run dev -- --host</code>). Aquí solo sirve otra ventana de este navegador. Código: <strong className="mono">{CODIGO_SESION}</strong>
        </p>
      ) : red ? (
        <p className="telefono__ayuda">
          Para usar el teléfono, arranca la interfaz con <code>npm run dev -- --host</code>. Código de esta demo: <strong className="mono">{CODIGO_SESION}</strong>
        </p>
      ) : null}
    </div>
  )
}

// En un teléfono, la app completa no es lo que se quiere: se ofrece usarlo como control.
export function AvisoEsTelefono() {
  const esTelefono = typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches
    && window.innerWidth < 760
  if (!esTelefono) return null

  return (
    <div className="aviso-telefono" role="note">
      <p>Estás en un teléfono. Para manejar la demo que está abierta en el computador, usa este teléfono como control.</p>
      <button type="button" className="boton boton--principal" onClick={() => { window.location.hash = 'control' }}>
        Usar como control
      </button>
    </div>
  )
}
