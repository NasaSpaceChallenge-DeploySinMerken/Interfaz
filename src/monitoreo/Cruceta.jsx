// Cruceta en pantalla para mover al astronauta en modo manual.
// Se mantiene apretada para caminar; al soltar se detiene.

const BOTONES = [
  { x: -1, y: 1, etiqueta: 'noroeste', icono: '↖' },
  { x: 0, y: 1, etiqueta: 'norte', icono: '↑' },
  { x: 1, y: 1, etiqueta: 'noreste', icono: '↗' },
  { x: -1, y: 0, etiqueta: 'oeste', icono: '←' },
  null,
  { x: 1, y: 0, etiqueta: 'este', icono: '→' },
  { x: -1, y: -1, etiqueta: 'suroeste', icono: '↙' },
  { x: 0, y: -1, etiqueta: 'sur', icono: '↓' },
  { x: 1, y: -1, etiqueta: 'sureste', icono: '↘' },
]

export function Cruceta({ onMover }) {
  const soltar = () => onMover(null)

  return (
    <section className="panel cruceta" aria-label="Control manual">
      <div className="cruceta__botones">
        {BOTONES.map((b, i) =>
          b ? (
            <button
              key={i}
              type="button"
              aria-label={`Caminar al ${b.etiqueta}`}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onMover({ x: b.x, y: b.y }) }}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              onLostPointerCapture={soltar}
            >
              {b.icono}
            </button>
          ) : (
            <span key={i} className="cruceta__centro" aria-hidden="true" />
          ),
        )}
      </div>
      <p className="cruceta__ayuda">Mantén apretado, o usa WASD, las flechas o un joystick.</p>
    </section>
  )
}
