// Mapa por teselas de Mars Trek.
//
// Es un mapa provisional para la interfaz: el mapa definitivo lo hace el equipo
// del mapa (ver Propuesta_equipo.md, sección 4).
//
// Props:
// - capas: [{ id, url, zMin?, zMax? }] en orden de abajo hacia arriba
// - centro { lon, lat } y z, o encuadre [o, s, e, n] para ajustarse solo
// - interactivo: arrastrar, rueda y clic
// - onVista({ centro, z }), onClic({ lon, lat }), onCursor({ lon, lat })
// - children(proyectar, tamaño): elementos SVG dibujados encima

import { useEffect, useRef, useState } from 'react'
import { TESELA, aGrados, aPixel, encuadrar, urlTesela } from './geo'

const Z_MIN = 10
const Z_MAX = 17

function CapaTeselas({ capa, z, izq, arriba, ancho, alto }) {
  if (z < (capa.zMin ?? 0)) return null
  // pasado el máximo de la capa, se agrandan las teselas del último nivel
  const zTeselas = Math.min(z, capa.zMax ?? Z_MAX)
  const tam = TESELA * 2 ** (z - zTeselas)
  const c0 = Math.floor(izq / tam), c1 = Math.floor((izq + ancho) / tam)
  const f0 = Math.floor(arriba / tam), f1 = Math.floor((arriba + alto) / tam)

  const imagenes = []
  for (let f = f0; f <= f1; f++) {
    for (let c = c0; c <= c1; c++) {
      imagenes.push(
        <img
          key={`${zTeselas}/${f}/${c}`}
          src={urlTesela(capa.url, zTeselas, f, c)}
          alt=""
          draggable="false"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
          style={{ left: c * tam - izq, top: f * tam - arriba, width: tam, height: tam }}
        />,
      )
    }
  }
  return <div className="mapa-teselas__capa">{imagenes}</div>
}

export function MapaTeselas({
  capas, centro, z, encuadre, interactivo = false,
  onVista, onClic, onCursor, className = '', etiqueta, children,
}) {
  const ref = useRef(null)
  const [tam, setTam] = useState({ ancho: 0, alto: 0 })

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setTam({ ancho: e.contentRect.width, alto: e.contentRect.height }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  // antes de medir el contenedor (primer render) se usa un tamaño provisorio
  const vista = encuadre ? encuadrar(encuadre, tam.ancho || 800, tam.alto || 600) : { centro, z }

  // en un mapa interactivo, el encuadre es solo la vista inicial: se avisa al padre
  // para que desde ahí controle centro y zoom
  useEffect(() => {
    if (interactivo && encuadre && tam.ancho) onVista?.(encuadrar(encuadre, tam.ancho, tam.alto))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactivo, encuadre, tam.ancho, tam.alto])
  const [cx, cy] = aPixel(vista.centro.lon, vista.centro.lat, vista.z)
  const izq = cx - tam.ancho / 2
  const arriba = cy - tam.alto / 2
  const proyectar = (lon, lat) => {
    const [x, y] = aPixel(lon, lat, vista.z)
    return [x - izq, y - arriba]
  }
  const enPantalla = (e) => {
    const r = ref.current.getBoundingClientRect()
    return aGrados(izq + e.clientX - r.left, arriba + e.clientY - r.top, vista.z)
  }

  // ---- interacción ----
  const ultimo = useRef({})
  ultimo.current = { vista, izq, arriba, tam, onVista }
  const arrastre = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)

  useEffect(() => {
    if (!interactivo) return
    const el = ref.current
    const alRodar = (e) => {
      e.preventDefault()
      const { vista: v, izq: ix, arriba: iy, tam: t, onVista: cb } = ultimo.current
      const nz = Math.min(Z_MAX, Math.max(Z_MIN, v.z + (e.deltaY < 0 ? 1 : -1)))
      if (nz === v.z || !cb) return
      // el punto bajo el cursor queda fijo
      const r = el.getBoundingClientRect()
      const sx = e.clientX - r.left, sy = e.clientY - r.top
      const bajo = aGrados(ix + sx, iy + sy, v.z)
      const [px, py] = aPixel(bajo.lon, bajo.lat, nz)
      cb({ centro: aGrados(px - sx + t.ancho / 2, py - sy + t.alto / 2, nz), z: nz })
    }
    el.addEventListener('wheel', alRodar, { passive: false })
    return () => el.removeEventListener('wheel', alRodar)
  }, [interactivo])

  const eventos = interactivo
    ? {
        onPointerDown: (e) => {
          if (e.target.closest('button, a, input, label')) return
          arrastre.current = { x: e.clientX, y: e.clientY, movio: false, inicio: [cx, cy] }
          e.currentTarget.setPointerCapture(e.pointerId)
        },
        onPointerMove: (e) => {
          onCursor?.(enPantalla(e))
          const a = arrastre.current
          if (!a) return
          const dx = e.clientX - a.x, dy = e.clientY - a.y
          if (!a.movio && Math.hypot(dx, dy) < 5) return
          a.movio = true
          setArrastrando(true)
          onVista?.({ centro: aGrados(a.inicio[0] - dx, a.inicio[1] - dy, vista.z), z: vista.z })
        },
        onPointerUp: (e) => {
          const a = arrastre.current
          arrastre.current = null
          setArrastrando(false)
          if (a && !a.movio) onClic?.(enPantalla(e))
        },
      }
    : {}

  return (
    <div
      ref={ref}
      className={`mapa-teselas ${interactivo ? 'mapa-teselas--interactivo' : ''} ${arrastrando ? 'arrastrando' : ''} ${className}`}
      aria-label={etiqueta}
      role={etiqueta ? 'img' : undefined}
      {...eventos}
    >
      {tam.ancho > 0 && capas.map((capa) => (
        <CapaTeselas key={capa.id} capa={capa} z={vista.z} izq={izq} arriba={arriba} ancho={tam.ancho} alto={tam.alto} />
      ))}
      {tam.ancho > 0 && (
        <svg className="mapa-teselas__svg" width={tam.ancho} height={tam.alto}>
          {children?.(proyectar, tam, vista)}
        </svg>
      )}
    </div>
  )
}
