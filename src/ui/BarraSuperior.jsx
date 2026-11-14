// Barra superior (J3 — Juan): tiempo de misión y controles de la simulación.

export function BarraSuperior({ estado, acciones }) {
  // TODO (Juan): tiempo de misión en HH:MM:SS, iniciar/pausar, reiniciar
  // y velocidad (x1, x10, x60) usando `acciones`.
  void acciones

  return (
    <header className="barra">
      <h1>Martian Map</h1>
      <span>t = {estado.t} s</span>
    </header>
  )
}
