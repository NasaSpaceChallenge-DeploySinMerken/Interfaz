# Interfaz — Martian Map

Interfaz del navegador del proyecto [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). Se arma aquí y, cuando esté lista, se pasa al repo principal.

- Reparto de tareas: [Division_tareas_interfaz.md](Division_tareas_interfaz.md)
- Contrato con el backend: [Contrato_API.md](Contrato_API.md)
- Diseño de referencia: [mockup/gale-hud.html](mockup/gale-hud.html) (se abre directo en el navegador)

## Cómo correrlo

```bash
npm install
npm run dev
```

Sin configurar nada usa un backend falso. Para usar el real, crear `.env.local` con:

```
VITE_API_URL=http://localhost:8000
```

## Estructura

```
src/
  App.jsx                     pasa de la fase 1 a la fase 2
  style.css                   estilo (Pamela)
  api/
    cliente.js                llamadas al backend (Juan)
    mock.js                   backend falso (Juan)
  planificacion/              fase 1: preparar el viaje (Pamela)
    Planificacion.jsx
    SelectorCapas.jsx
    ListaPuntos.jsx
    Metricas.jsx
  monitoreo/                  fase 2: monitorear la caminata (Juan)
    Monitoreo.jsx
    useMonitoreo.js           manda sensores y ubicación cada 1 s
    sensoresSimulados.js      lecturas del traje para la demo
    useAlertas.js, Alertas.jsx
    BarraSuperior.jsx
mockup/
  planificacion.html          fase 1: marcar aterrizaje y puntos (máx. 6) y calcular la ruta
  gale.html                   primera maqueta (vista de mapa)
  gale-hud.html               maqueta tipo videojuego en 2D (mapa que sigue al astronauta + minimapa)
  datos-gale.js               ruta real de Curiosity y sus paradas
```
