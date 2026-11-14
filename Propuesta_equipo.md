# Propuesta de la interfaz para el equipo

**De:** Juan y Pamela (interfaz)
**Para:** equipos de backend y mapa
**Qué necesitamos:** que cada equipo revise su sección y responda las preguntas de la sección 5. Si no hay comentarios, seguimos con lo propuesto.

## 1. Cómo funciona la app

La demo es una caminata en el **Cráter Gale** (137.30–137.60° E, 4.50–4.75° S), con los datos de Mars Trek: el mosaico CTX de Gale y el modelo de elevación HiRISE de Gale.

La app tiene dos fases:

1. **Preparar el viaje.** El usuario ve las capas del mapa, marca el punto de aterrizaje y los puntos que quiere visitar. El backend calcula la ruta y devuelve sus métricas: distancia, duración, oxígeno necesario, esfuerzo y pendiente.
2. **Monitorear la caminata.** El astronauta avanza por la ruta. Cada segundo, la interfaz manda al backend la posición y los sensores del traje. El backend evalúa el estado y responde con alertas (oxígeno bajo, pulso alto, etc.), que la interfaz muestra.

```
          Interfaz                    Backend                 Mapa
Fase 1    pide capas ───────────────▶ capas
          clic en el mapa ◀─────────────────────────────────── punto (lon, lat)
          aterrizaje + puntos ──────▶ calcula ruta
          muestra métricas ◀───────── ruta + métricas
          ruta ─────────────────────────────────────────────▶ la dibuja
Fase 2    cada 1 s: posición ───────▶ evalúa
          + sensores
          muestra alertas ◀────────── alertas
          posición ─────────────────────────────────────────▶ mueve al astronauta
```

## 2. Quién hace qué

| Equipo | Responsable de |
| --- | --- |
| **Interfaz** | Pantallas de las dos fases: selección de capas, puntos, métricas, panel de la caminata y alertas. Simula los sensores del traje para la demo. |
| **Backend** | Capas disponibles, cálculo de la ruta y sus métricas, y **las reglas de las alertas**: la interfaz no decide cuándo hay una alerta, solo la muestra. |
| **Mapa** | Dibujar el mapa con las capas, avisar dónde hace clic el usuario, dibujar la ruta y mover al astronauta. |

## 3. Propuesta para el backend

Tres llamadas. El detalle con ejemplos de cada mensaje está en [Contrato_API.md](Contrato_API.md).

| Llamada | Qué manda la interfaz | Qué responde el backend |
| --- | --- | --- |
| `GET /api/capas` | — | Lista de capas que se dibujan en el mapa: nombre y URL de las teselas. |
| `POST /api/rutas` | Punto de aterrizaje y de 1 a 6 puntos a visitar (`lon`, `lat`). | Ruta (GeoJSON), métricas totales y métricas por tramo. |
| `POST /api/monitoreo` (cada 1 s) | Posición y sensores: oxígeno, temperatura del traje y exterior, pulso y saturación. | Todas las alertas activas, cada una con un `id` fijo, un nivel (`info`, `aviso`, `critico`) y un mensaje. |

Mientras el backend no esté listo, la interfaz usa un backend falso con este mismo formato, así nadie espera a nadie.

## 4. Propuesta para el mapa

Proponemos que el mapa exponga una función en JS simple, que sirve igual si la interfaz usa React o no:

```js
const mapa = crearMapa(document.getElementById('map'))

mapa.mostrarCapas(capas)              // las capas que entrega el backend
mapa.alHacerClic(({ lon, lat }) => {}) // la interfaz recibe el punto marcado
mapa.mostrarPuntos(puntos)            // aterrizaje y puntos a visitar
mapa.dibujarRuta(rutaGeoJSON)         // la ruta que calculó el backend
mapa.moverAstronauta({ lon, lat, rumbo }) // cada segundo durante la caminata
```

Una sugerencia: para la caminata conviene la capa **HiRISE de Curiosity** de Mars Trek (`curiosity_hirise_mosaic`). Cubre todo el tramo y tiene menos de 1 m por píxel, frente a los cientos de metros por píxel del mosaico global de Viking.

## 5. Preguntas por responder

Cada pregunta tiene nuestra propuesta. Basta con un "ok" o un cambio.

| # | Para | Pregunta | Propuesta |
| --- | --- | --- | --- |
| 1 | Backend | ¿El formato de [Contrato_API.md](Contrato_API.md) les sirve? | Sí, con los cambios que pidan. |
| 2 | Backend | ¿Qué métricas devuelve la ruta, y en qué unidades? | Metros, minutos, % de oxígeno, grados de pendiente; esfuerzo como `bajo`, `medio` o `alto`. |
| 3 | Backend | ¿La ruta vuelve al punto de aterrizaje? | Sí: es más realista y permite la alerta "el oxígeno no alcanza para volver". |
| 4 | Backend | ¿Qué pasa si no hay ruta posible? | Responder `422` con un mensaje para mostrar al usuario. |
| 5 | Backend | ¿Monitoreo por REST cada 1 s o por WebSocket? | REST para la demo; es más simple y alcanza. |
| 6 | Mapa | ¿Les sirve la función `crearMapa` de la sección 4? | Sí. |
| 7 | Todos | ¿Usamos React en `martian-map`? | Sí, para la interfaz. El mapa puede seguir en JS simple gracias a `crearMapa`, pero `main.js` pasa a `main.jsx`. |
