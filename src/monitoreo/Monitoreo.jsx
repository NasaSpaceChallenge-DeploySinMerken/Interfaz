// Fase 2: monitorear la caminata (Juan).
// Referencia de diseño: mockup/gale-hud.html.

import { useMonitoreo } from './useMonitoreo'
import { useAlertas } from './useAlertas'
import { BarraSuperior } from './BarraSuperior'
import { Alertas } from './Alertas'

export function Monitoreo({ ruta }) {
  const { estado, alertas: delBackend, acciones } = useMonitoreo(ruta)
  const { alertas, cerrar } = useAlertas(delBackend)

  return (
    <section className="monitoreo" aria-label="Caminata en curso">
      <BarraSuperior estado={estado} acciones={acciones} />

      {/* El mapa lo monta el equipo del mapa. */}
      <div id="map" className="mapa">
        <p>Aquí va el mapa</p>
      </div>

      <Alertas alertas={alertas} onCerrar={cerrar} />
    </section>
  )
}
