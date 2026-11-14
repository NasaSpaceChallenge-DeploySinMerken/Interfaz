// Panel de la misión: tiempo y controles de la simulación.

const VELOCIDADES = [1, 10, 60]

function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function BarraSuperior({ t, enMarcha, velocidad, acciones, onSalir }) {
  return (
    <section className="panel mision" aria-label="Misión">
      <div>
        <h1 className="mision__titulo">MARTIAN MAP</h1>
        <p className="mision__lugar">Cráter Gale · Caminata en curso</p>
      </div>
      <div>
        <div className="etiqueta">Tiempo de misión</div>
        <div className="mision__reloj mono">{formatearTiempo(t)}</div>
      </div>
      <div className="controles">
        {enMarcha
          ? <button type="button" onClick={acciones.pausar}>Pausar</button>
          : <button type="button" onClick={acciones.iniciar}>Iniciar</button>}
        <button type="button" onClick={acciones.reiniciar}>Reiniciar</button>
        <div className="velocidades" role="group" aria-label="Velocidad">
          {VELOCIDADES.map((v) => (
            <button key={v} type="button" aria-pressed={velocidad === v} onClick={() => acciones.cambiarVelocidad(v)}>x{v}</button>
          ))}
        </div>
      </div>
      <button type="button" className="boton--texto mision__salir" onClick={onSalir}>← Planificar otro viaje</button>
    </section>
  )
}
