# Contrato entre la interfaz y el backend

**Estado:** propuesta original de la interfaz. Los backends ya tienen su propio contrato (`docs/API.md` en martian-map), y la interfaz se adapta a él en `src/api/cliente.js` (ver el README). El monitoreo lo implementó Ingrid en el servicio de análisis con este mismo formato, con dos diferencias: el `idRuta` es el que devuelve `/plan`, y el backend calcula el oxígeno por su cuenta (no usa los `sensores`).
**Zona de la demo:** Cráter Gale, 137.30–137.60° E y 4.50–4.75° S, con los datos de Mars Trek: *MRO CTX, Gale Crater Mosaic* y *MRO HiRISE, Gale Crater DEM*.

Coordenadas siempre en grados decimales: `lon` este positivo y `lat` sur negativo.

## Cómo funciona

La interfaz trabaja en dos fases:

1. **Preparar el viaje.** La interfaz pide las capas disponibles. El usuario marca el punto de aterrizaje y los puntos a visitar, la interfaz los manda al backend y el backend devuelve la ruta y sus métricas.
2. **Monitorear.** Durante la caminata, la interfaz manda una vez por segundo los sensores y la ubicación del astronauta. El backend evalúa el estado y responde con las alertas. **Las reglas de las alertas viven en el backend**: la interfaz solo las muestra.

```
Interfaz                                 Backend
   │  GET  /api/capas                       │
   │ ─────────────────────────────────────▶ │
   │ ◀───────────────────────────────────── │  capas disponibles
   │                                        │
   │  POST /api/rutas                       │
   │  aterrizaje + puntos a visitar         │
   │ ─────────────────────────────────────▶ │  calcula la ruta
   │ ◀───────────────────────────────────── │  ruta + métricas
   │                                        │
   │  POST /api/monitoreo  (cada 1 s)       │
   │  posición + sensores                   │
   │ ─────────────────────────────────────▶ │  evalúa
   │ ◀───────────────────────────────────── │  alertas
```

## Fase 1 — Preparar el viaje

### `GET /api/capas`

Respuesta:

```json
[
  {
    "id": "gale_ctx",
    "nombre": "MRO CTX, Gale Crater Mosaic",
    "url": "https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0/default/default028mm/{z}/{y}/{x}.png",
    "bbox": [135.18, -6.57, 139.24, -2.81]
  },
  {
    "id": "curiosity_hirise",
    "nombre": "MRO HiRISE, Curiosity Roving Site Mosaic",
    "url": "https://trek.nasa.gov/tiles/Mars/EQ/curiosity_hirise_mosaic/1.0.0/default/default028mm/{z}/{y}/{x}.png",
    "bbox": [137.12, -4.93, 137.73, -4.25]
  }
]
```

Solo van las capas que se dibujan en el mapa. `bbox` va en el orden `[oeste, sur, este, norte]`. Campos opcionales: `descripcion` (texto corto para la lista de capas), `zMin` (desde qué zoom se muestra) y `zMax` (último nivel de zoom con teselas; por ejemplo, 12 para el CTX de Gale y 16 para el HiRISE de Curiosity). La elevación (*MRO HiRISE, Gale Crater DEM*) vive solo en el backend, que la usa para calcular la ruta: la interfaz no la pide ni la dibuja.

### `POST /api/rutas`

Pedido:

```json
{
  "aterrizaje": { "lon": 137.4416, "lat": -4.5895 },
  "puntos": [
    { "id": "p1", "nombre": "Darwin", "lon": 137.4271, "lat": -4.6063 },
    { "id": "p2", "nombre": "Pahrump Hills", "lon": 137.3830, "lat": -4.6592 }
  ],
  "volver": true
}
```

Respuesta:

```json
{
  "idRuta": "r-123",
  "ruta": { "type": "LineString", "coordinates": [[137.4416, -4.5895], [137.4271, -4.6063]] },
  "metricas": {
    "distanciaM": 7800,
    "duracionMin": 160,
    "oxigenoPct": 42,
    "esfuerzo": "medio",
    "pendienteMaxGrados": 12
  },
  "tramos": [
    { "desde": "aterrizaje", "hasta": "p1", "distanciaM": 2800, "duracionMin": 55, "oxigenoPct": 14, "pendienteMaxGrados": 6 }
  ]
}
```

- `puntos` tiene **entre 1 y 6 puntos a visitar**, sin contar el aterrizaje. La interfaz no deja agregar más.
- `volver` indica si la ruta termina en el punto de aterrizaje. En la respuesta, el último tramo tiene `"hasta": "aterrizaje"`.
- `pendienteMaxGrados` puede venir en `null` si no se calculó.
- **Por confirmar:** los nombres y unidades de `metricas` y los valores posibles de `esfuerzo`.
- **Por confirmar:** qué responde el backend cuando no hay ruta posible, por ejemplo cuando no alcanza el oxígeno. Propuesta: estado `422` con `{ "error": "mensaje para mostrar" }`.

## Fase 2 — Monitorear

### `POST /api/monitoreo` (cada 1 segundo)

Pedido:

```json
{
  "idRuta": "r-123",
  "t": 3600,
  "posicion": { "lon": 137.4150, "lat": -4.6223 },
  "sensores": {
    "oxigenoPct": 61.5,
    "temperaturaTraje": 22.4,
    "temperaturaExterior": -58,
    "pulso": 112,
    "spo2": 97
  }
}
```

`t` son los segundos desde el inicio de la caminata.

Respuesta:

```json
{
  "alertas": [
    { "id": "oxigeno-retorno", "nivel": "critico", "mensaje": "El oxígeno no alcanza para volver" }
  ]
}
```

- `nivel` es `info`, `aviso` o `critico`.
- **El `id` tiene que ser fijo para cada condición.** Si el astronauta cierra una alerta, la interfaz no la vuelve a mostrar mientras siga llegando con el mismo `id` y el mismo nivel.
- El backend manda en cada respuesta **todas las alertas activas**, no solo las nuevas.

**Por confirmar:** REST cada 1 segundo alcanza para la demo. Si el backend prefiere WebSocket, el formato de los mensajes puede ser el mismo.

## Mientras no esté el backend

La interfaz usa un backend falso (`src/api/mock.js`) que responde con este mismo formato. Para usar el backend real se define la variable `VITE_API_URL` (por ejemplo, en un archivo `.env.local`):

```
VITE_API_URL=http://localhost:8000
```
