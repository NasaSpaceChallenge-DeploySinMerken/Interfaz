# División de tareas — Interfaz

**Repo de la app:** [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). La interfaz se arma primero en este repo y, cuando esté lista, se pasa ahí.
**Responsables:** Juan y Pamela
**Stack:** React + Vite
**Base:** [Reunión 1](https://github.com/NasaSpaceChallenge-DeploySinMerken/docs/blob/main/Reunion1_ordenada.md) · [Arquitectura](arquitectura.jpeg) · [Contrato con el backend](Contrato_API.md)
**Zona de la demo:** Cráter Gale, 137.30–137.60° E y 4.50–4.75° S.

## 1. Qué hace la interfaz

La interfaz conversa con el backend en dos fases (detalle en [Contrato_API.md](Contrato_API.md)):

1. **Preparar el viaje.** Pide las capas disponibles, recibe el punto de aterrizaje y los puntos a visitar, los manda al backend y muestra la ruta y las métricas que devuelve (oxígeno, esfuerzo, etc.).
2. **Monitorear.** Durante la caminata manda cada segundo los sensores y la ubicación del astronauta. El backend evalúa el estado y devuelve las alertas, que la interfaz muestra.

**Las reglas de las alertas viven en el backend.** La interfaz no decide cuándo hay una alerta: solo la muestra.

| Parte | Responsable |
| --- | --- |
| Interfaz (planificación, monitoreo, alertas, estilo) | **Nosotros** |
| Mapa (OpenLayers, capas de Mars Trek) | Equipo del mapa |
| Cálculo de la ruta, métricas y reglas de alertas | Equipo del backend |

## 2. Reparto

> **Estado al 14/11/2026:** todas las tareas tienen una primera versión funcionando con el backend falso (`npm run dev`). Cada uno revisa, prueba y ajusta su parte, y la conecta con el backend real cuando esté.

### Pamela — Fase 1: preparar el viaje, y estilo

| # | Tarea | Detalle |
| --- | --- | --- |
| P1 | Capas | Pedir las capas al backend y dejar elegir cuáles se ven (`SelectorCapas.jsx`). |
| P2 | Puntos | Punto de aterrizaje y lista de puntos a visitar: agregar, quitar y reordenar, **máximo 6 puntos** (`ListaPuntos.jsx`). Pueden llegar desde un clic en el mapa o escribirse a mano. Validar que estén dentro del tramo. |
| P3 | Calcular la ruta | Botón que manda todo al backend y muestra un "calculando…" mientras responde (`Planificacion.jsx`). |
| P4 | Métricas | Distancia, duración, oxígeno necesario, esfuerzo y pendiente máxima, en total y por tramo. Mostrar el error si no hay ruta posible (`Metricas.jsx`). |
| P5 | Estilo visual | Paleta, tipografía y colores por nivel de alerta en `style.css`, siguiendo [mockup/gale-hud.html](mockup/gale-hud.html). |

### Juan — Conexión con el backend y fase 2: monitorear

| # | Tarea | Detalle |
| --- | --- | --- |
| J1 | Proyecto base | ✅ Esqueleto con Vite + React. Ver [README](README.md). |
| J2 | Cliente del backend | `src/api/cliente.js`: las tres llamadas del contrato. Sin `VITE_API_URL` usa el backend falso. |
| J3 | Backend falso | `src/api/mock.js`: responde con el formato del contrato, para que Pamela y yo trabajemos sin esperar al backend. **Va antes que lo demás.** |
| J4 | Sensores simulados | `sensoresSimulados.js`: mueve al astronauta por la ruta y genera las lecturas del traje (oxígeno, temperaturas, pulso, saturación). |
| J5 | Bucle de monitoreo | `useMonitoreo.js`: cada segundo manda posición y sensores y guarda las alertas. Iniciar, pausar, reiniciar y velocidad. Si el backend no responde, avisarlo sin cortar la caminata. |
| J6 | Alertas y HUD | `useAlertas.js`, `Alertas.jsx` y `BarraSuperior.jsx`: mostrar las alertas del backend (crítico primero, que se puedan cerrar) y la barra superior, siguiendo [mockup/gale-hud.html](mockup/gale-hud.html). |

### En conjunto

| Tarea | Cuándo |
| --- | --- |
| Revisar [Contrato_API.md](Contrato_API.md) con el equipo del backend | **Lo antes posible**: todo depende de esto. |
| Acordar con el equipo del mapa cómo llegan los clics en el mapa (puntos) y cómo se dibuja la ruta | Al empezar. |
| Probar las dos fases de punta a punta con el backend falso | Cuando estén J3, P3 y J5. |
| Cambiar al backend real (`VITE_API_URL`) | Cuando el backend tenga las rutas listas. |
| Prueba completa y demo | Al final. |

## 3. Forma de trabajo con Git

1. Cada uno trabaja en su rama: `juan/monitoreo`, `pamela/puntos`, etc.
2. Los cambios entran a `main` por pull request, y el otro le da una mirada rápida.
3. Antes de abrir un PR: `git pull origin main` para traer lo último y resolver conflictos en la propia rama.

## 4. Pendientes

- **Contrato con el backend:** confirmar formato, unidades de las métricas, qué pasa si no hay ruta y si el monitoreo va por REST o WebSocket.
- **Clics en el mapa:** cómo nos pasa el equipo del mapa el punto donde se hizo clic.
- **React o JS simple en martian-map:** la arquitectura usa archivos `.js`. Si usamos React, hay que avisar al resto, porque `martian-map` tendría que pasar a `main.jsx`.
