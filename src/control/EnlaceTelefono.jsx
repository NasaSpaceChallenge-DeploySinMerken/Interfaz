import { idiomaActual, tr } from '../idioma'
// Muestra en la demo la dirección exacta que hay que abrir en el teléfono,
// con la IP de la red y el código de esta demo ya puestos.
// Las direcciones de red las entrega el servidor de Vite (vite.config.js).
// Incluye un QR con esa dirección: al leerlo con la cámara se abre el control.
// Si lo leen varias personas, una controla y las demás miran (ver piloto.js).

import { useEffect, useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { CODIGO_SESION } from './sesion'

// la red de Docker (172.17.x.x) no sirve para el teléfono
const preferida = (urls) => urls.find((u) => !/\/\/172\.1[7-9]\./.test(u)) ?? urls[0]

// QR como SVG: un cuadrado por módulo oscuro, en un solo trazado
function CodigoQR({ texto }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(texto)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (qr.isDark(f, c)) d += `M${c} ${f}h1v1h-1z`
    return { n, d }
  }, [texto])
  return (
    <svg viewBox={`0 0 ${n} ${n}`} role="img" aria-label={`Código QR: ${texto}`} shapeRendering="crispEdges">
      <path d={d} fill="#0d0f12" />
    </svg>
  )
}

export function EnlaceTelefono({ conectado }) {
  const [red, setRed] = useState(null) // null: cargando; []: sin --host

  useEffect(() => {
    // con el servidor propio, el teléfono abre esta misma dirección pública
    if (import.meta.env.VITE_SERVIDOR === 'propio') {
      return setRed([`${window.location.origin}${import.meta.env.BASE_URL}`])
    }
    // las direcciones de red solo existen con el servidor de desarrollo de Vite
    if (!import.meta.env.DEV) return setRed([])
    fetch('/__direcciones-red')
      .then((r) => (r.ok ? r.json() : { red: [] }))
      .then((d) => setRed(d.red ?? []))
      .catch(() => setRed([]))
  }, [])

  const base = red?.length ? preferida(red) : null
  const direccion = base ? (() => {
    const url = new URL(`${base.replace(/\/$/, '')}/`)
    if (idiomaActual() === 'en') url.searchParams.set('lang', 'en')
    url.hash = `control=${CODIGO_SESION}`
    return url.toString()
  })() : null

  if (conectado) {
    return (
      <p className="telefono telefono--ok" role="status">
        <span className="punto-estado" aria-hidden="true" />
        {tr("Teléfono conectado · código")} <strong className="mono">{CODIGO_SESION}</strong>
      </p>
    )
  }

  return (
    <div className="telefono">
      <p className="telefono__titulo">{tr("Controlar desde el teléfono")}</p>
      {direccion ? (
        <>
          <div className="telefono__qr-fila">
            <div className="telefono__qr"><CodigoQR texto={direccion} /></div>
            <div>
              <p className="telefono__ayuda">
                {import.meta.env.VITE_SERVIDOR === 'propio'
                  ? tr('Lee el QR con la cámara del teléfono, o abre:')
                  : tr('Lee el QR con la cámara del teléfono (en la misma Wi-Fi), o abre:')}
              </p>
              <p className="telefono__direccion mono">{direccion}</p>
            </div>
          </div>
        </>
      ) : red && !import.meta.env.DEV ? (
        <p className="telefono__ayuda">
          {tr("El control desde el teléfono funciona con la interfaz corriendo en un computador (")}<code>{tr("npm run dev -- --host")}</code>{tr("). Aquí solo sirve otra ventana de este navegador. Código:")} <strong className="mono">{CODIGO_SESION}</strong>
        </p>
      ) : red ? (
        <p className="telefono__ayuda">
          {tr("Para usar el teléfono, arranca la interfaz con")} <code>{tr("npm run dev -- --host")}</code>{tr(". Código de esta demo:")} <strong className="mono">{CODIGO_SESION}</strong>
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
      <p>{tr("Estás en un teléfono. Para manejar la demo que está abierta en el computador, usa este teléfono como control.")}</p>
      <button type="button" className="boton boton--principal" onClick={() => { window.location.hash = 'control' }}>
        {tr("Usar como control")}
      </button>
    </div>
  )
}
