// Brújula: cinta con el rumbo hacia donde camina el astronauta.

const PX_POR_GRADO = 4
const CARDINALES = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' }
const MARCAS = []
for (let g = -360; g <= 720; g += 15) MARCAS.push(g)

export function Brujula({ rumbo }) {
  return (
    <div className="panel brujula" aria-label={`Rumbo ${Math.round(rumbo)} grados`}>
      <div className="brujula__ventana" aria-hidden="true">
        <div className="brujula__cinta" style={{ transform: `translateX(${-rumbo * PX_POR_GRADO}px)` }}>
          {MARCAS.map((g) => {
            const n = ((g % 360) + 360) % 360
            const cardinal = CARDINALES[n]
            return (
              <span
                key={g}
                className={`brujula__marca ${cardinal ? 'brujula__marca--cardinal' : ''} ${n === 0 ? 'norte' : ''}`}
                style={{ left: g * PX_POR_GRADO }}
              >
                {cardinal ?? n}
              </span>
            )
          })}
        </div>
      </div>
      <div className="brujula__indice" aria-hidden="true" />
      <span className="brujula__grados mono">{String(Math.round(rumbo) % 360).padStart(3, '0')}°</span>
    </div>
  )
}
