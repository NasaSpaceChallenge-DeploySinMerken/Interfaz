// Signos vitales SIMULADOS del astronauta: pulso, temperatura del cuerpo y
// saturación de oxígeno.
//
// Es la única parte simulada del monitoreo (el oxígeno del tanque, el costo de
// volver y sus alertas vienen del backend). Existe para mostrar en la demo cómo
// se verían las alertas fisiológicas mientras el backend no recibe sensores
// (fase 2). Todo lo que sale de aquí va marcado como simulado en la pantalla.
//
// Base (estudio de la NASA de 132 EVA de Shuttle e ISS, no de un traje para Marte):
// - Metabolismo promedio de una EVA: 863 BTU/h (unos 253 W).
// - Relación metabolismo/pulso: 0,142 BTU por latido → pulso = BTU/h ÷ (0,142 × 60).
//   Con 253 W da unos 101 latidos/min (el estudio: 103 ± 17).
// - La relación viene de caminatas en la ISS: a metabolismos altos deja de servir,
//   por eso el pulso tiene un tope.
// Supuestos del proyecto (la NASA no los define):
// - El metabolismo sube con la pendiente del tramo (3 W por cada 1 %) y baja en reposo.
// - Umbrales de alerta (tabla UMBRALES), de criterio clínico general.
//
// Escenarios (pensados para la demo):
// - 'emergencia': los tres signos empeoran de forma pareja (en línea recta) en
//   DURACION_S, desde donde estaban hasta nivel crítico, pasando por aviso
//   (con valores normales de partida: aviso a los ~4-7 s, crítico a los ~9-10 s).
// - 'normal': al volver de una emergencia, bajan de forma pareja en DURACION_S
//   hasta los valores normales; después siguen al esfuerzo.
// Corren en tiempo real, no en el de la simulación: la velocidad x60 no los acelera.

const W_A_BTU_H = 3.412
const BTU_POR_LATIDO = 0.142
const METABOLISMO_CAMINANDO_W = 253
const METABOLISMO_REPOSO_W = 160
const W_POR_PENDIENTE_PCT = 3
const METABOLISMO_MAX_W = 530 // pico de diseño del proyecto
const PULSO_MAX = 185

const NORMAL = { temperatura: 36.8, saturacion: 97.5 }

// a dónde llega la emergencia: los tres signos en nivel crítico
const EMERGENCIA = { pulso: 172, temperatura: 39.4, saturacion: 87.5 }
const DURACION_S = 12 // de normal a crítico, y de vuelta a normal
const ESCENARIOS = ['normal', 'emergencia']
const SIGNOS = ['pulso', 'temperatura', 'saturacion']

// sin emergencia: segundos que tarda cada signo en recorrer ~63 % del camino hacia
// el valor que corresponde al esfuerzo (cambios suaves al caminar o detenerse)
const TAU = { pulso: 5, temperatura: 6, saturacion: 5 }

export const UMBRALES = {
  pulso: { aviso: 140, critico: 160 }, // latidos/min, por arriba
  temperaturaAlta: { aviso: 38, critico: 39 }, // °C, por arriba
  temperaturaBaja: { aviso: 35.5, critico: 35 }, // °C, por abajo
  saturacion: { aviso: 94, critico: 90 }, // %, por abajo
}

const pulsoDesdeMetabolismo = (w) => Math.min(PULSO_MAX, (w * W_A_BTU_H) / (BTU_POR_LATIDO * 60))

export function crearSignosVitales() {
  let escenario = 'normal'
  let v = { pulso: pulsoDesdeMetabolismo(METABOLISMO_REPOSO_W), ...NORMAL }
  let inicio = null // valores al empezar la emergencia o la vuelta a la normalidad
  let progreso = 1 // 0 → 1 durante la emergencia o la vuelta (1: sin transición)

  return {
    leer: () => ({
      pulso: Math.round(v.pulso),
      temperatura: Math.round(v.temperatura * 10) / 10,
      saturacion: Math.round(v.saturacion * 10) / 10,
      escenario,
    }),
    get escenario() { return escenario },
    cambiarEscenario(nuevo) {
      if (!ESCENARIOS.includes(nuevo) || nuevo === escenario) return
      escenario = nuevo
      inicio = { ...v }
      progreso = 0
    },
    // dt en segundos reales; caminando: si el astronauta se está moviendo;
    // pendientePct: pendiente del tramo actual (del análisis del terreno)
    avanzar(dt, { caminando, pendientePct = 0 }) {
      const metabolismo = caminando
        ? Math.min(METABOLISMO_MAX_W, METABOLISMO_CAMINANDO_W + W_POR_PENDIENTE_PCT * Math.max(0, pendientePct))
        : METABOLISMO_REPOSO_W
      const normal = { pulso: pulsoDesdeMetabolismo(metabolismo), ...NORMAL }
      const siguiente = {}
      if (escenario === 'emergencia' || progreso < 1) {
        // transición pareja: hacia el nivel crítico (emergencia) o de vuelta a lo normal
        progreso = Math.min(1, progreso + dt / DURACION_S)
        const destino = escenario === 'emergencia' ? EMERGENCIA : normal
        for (const k of SIGNOS) siguiente[k] = inicio[k] + (destino[k] - inicio[k]) * progreso
      } else {
        for (const k of SIGNOS) siguiente[k] = v[k] + (normal[k] - v[k]) * (1 - Math.exp(-dt / TAU[k]))
      }
      siguiente.pulso += (Math.random() - 0.5) * 1.5 // variación natural, latido a latido
      v = siguiente
    },
    reiniciar() {
      escenario = 'normal'
      inicio = null
      progreso = 1
      v = { pulso: pulsoDesdeMetabolismo(METABOLISMO_REPOSO_W), ...NORMAL }
    },
  }
}

// Alertas de los signos vitales, con id fijo por sensor (como las del backend)
// y marcadas como simuladas.
export function alertasVitales(s) {
  if (!s) return []
  const alertas = []
  const agregar = (id, nivel, mensaje) => alertas.push({ id, nivel, mensaje, simulado: true })
  const u = UMBRALES
  if (s.pulso > u.pulso.critico) agregar('vital-pulso', 'critico', `Pulso muy alto: ${s.pulso} latidos/min`)
  else if (s.pulso > u.pulso.aviso) agregar('vital-pulso', 'aviso', `Sobreesfuerzo: pulso de ${s.pulso} latidos/min`)
  if (s.temperatura >= u.temperaturaAlta.critico) agregar('vital-temperatura', 'critico', `Temperatura corporal muy alta: ${s.temperatura.toFixed(1)} °C`)
  else if (s.temperatura >= u.temperaturaAlta.aviso) agregar('vital-temperatura', 'aviso', `Temperatura corporal alta: ${s.temperatura.toFixed(1)} °C`)
  else if (s.temperatura <= u.temperaturaBaja.critico) agregar('vital-temperatura', 'critico', `Temperatura corporal muy baja: ${s.temperatura.toFixed(1)} °C`)
  else if (s.temperatura <= u.temperaturaBaja.aviso) agregar('vital-temperatura', 'aviso', `Temperatura corporal baja: ${s.temperatura.toFixed(1)} °C`)
  if (s.saturacion < u.saturacion.critico) agregar('vital-saturacion', 'critico', `Saturación de oxígeno muy baja: ${s.saturacion.toFixed(1)} %`)
  else if (s.saturacion < u.saturacion.aviso) agregar('vital-saturacion', 'aviso', `Saturación de oxígeno baja: ${s.saturacion.toFixed(1)} %`)
  return alertas
}
