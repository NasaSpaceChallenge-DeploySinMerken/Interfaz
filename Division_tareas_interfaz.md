# División de tareas — Interfaz

**Repo de la app:** [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map) (el código va ahí; este repo solo guarda la organización de la interfaz)
**Responsables:** Juan y Pamela
**Stack:** React + Vite · Chart.js
**Base:** [Reunión 1](https://github.com/NasaSpaceChallenge-DeploySinMerken/docs/blob/main/Reunion1_ordenada.md) · [Arquitectura](arquitectura.jpeg)

## 1. Qué nos toca

En la [arquitectura](arquitectura.jpeg) del proyecto ([martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map)), lo nuestro es **la interfaz del navegador**:

| Carpeta / archivo | Responsable | Qué es |
| --- | --- | --- |
| `src/ui/panel.js` | **Nosotros** | Indicadores con Chart.js (oxígeno, temperatura, salud) |
| `src/ui/alerts.js` | **Nosotros** | Notificaciones al astronauta |
| `index.html`, `src/style.css` | **Nosotros** | Estructura y estilo de la página |
| `src/map/` | Otro equipo | Mapa OpenLayers, capas de Mars Trek, proyección |
| `src/sim/` | Otro equipo | Posición del astronauta, recursos, teclado y joystick |
| `analysis/`, `public/data/` | Otro equipo | Análisis en Python y la ruta en GeoJSON |

Nosotros **no calculamos nada**: leemos el estado que entrega `src/sim/` y lo mostramos. En el mapa solo dejamos el espacio (`<div id="map">`) donde el otro equipo lo monta.

## 2. Reparto

### Juan — Página, datos de prueba y alertas

| # | Tarea | Detalle |
| --- | --- | --- |
| J1 | Proyecto base | En `martian-map` los archivos existen pero están vacíos. Si nadie lo hizo todavía, dejar Vite funcionando (`package.json`, `vite.config.js`, `index.html`, `src/main.js`) y subirlo a `main`, avisando al resto del equipo porque todos dependen de eso. **Va primero, porque Pamela lo necesita para empezar.** |
| J2 | Simulación de prueba | `src/mock/simulacionFalsa.js`: genera cada segundo un estado con la forma de la sección 3 (el oxígeno baja, el pulso sube y baja, etc.). Así trabajamos sin esperar a `src/sim/`. |
| J3 | Layout de la página | Barra superior (tiempo de misión, play/pausa, velocidad), espacio para el mapa y panel lateral. Que se vea bien en pantalla completa, que es como se va a presentar. |
| J4 | Alertas (`alerts.js`) | Notificaciones con tres niveles (info, aviso, crítico) que aparecen, se apilan y se pueden cerrar. Reglas: oxígeno bajo, el oxígeno no alcanza para volver, pulso alto, temperatura del traje fuera de rango. |

### Pamela — Panel de indicadores

| # | Tarea | Detalle |
| --- | --- | --- |
| P1 | Oxígeno | Medidor del porcentaje que queda, minutos que alcanza y gráfico del consumo en el tiempo (Chart.js). Es el indicador más importante: tiene que ser el más visible. |
| P2 | Temperatura | Exterior y del traje, con un gráfico en vivo. |
| P3 | Salud | Pulso y saturación de oxígeno, con un gráfico en vivo. |
| P4 | Estilo visual | Paleta de colores, tipografía y estados (normal, aviso, crítico) en `style.css`. Juan los usa en el layout y en las alertas para que todo se vea igual. |

### En conjunto

| Tarea | Cuándo |
| --- | --- |
| Confirmar con el equipo de `src/sim/` el formato del estado (sección 3) | Al empezar. |
| Probar el panel y las alertas con la simulación de prueba | Cuando estén J2 y P1. |
| Cambiar la simulación de prueba por la real de `src/sim/` | Cuando el equipo de simulación tenga `resources.js` listo. |
| Prueba completa y demo | Al final, sobre la versión publicada. |

## 3. Contrato con el equipo de simulación

Es lo único que necesitamos de `src/sim/`. **Propuesta para acordar con ese equipo:**

```js
{
  t: 0,                    // segundos desde el inicio de la caminata
  enMarcha: false,
  velocidad: 1,            // x1, x10, x60
  oxigeno: { porcentaje: 100, consumoPorMin: 0.4, minutosRestantes: 250, minutosParaVolver: 40 },
  temperatura: { exterior: -60, traje: 21 },   // °C
  salud: { pulso: 80, spo2: 98 }
}
```

También necesitamos que la simulación avise cada vez que cambia el estado (un evento o un callback) y que exponga `iniciar()`, `pausar()` y `cambiarVelocidad(v)` para los botones de la barra superior.

## 4. Forma de trabajo con Git

1. Juan sube el proyecto base a `main` (J1).
2. En `martian-map`, cada uno trabaja en su rama: `juan/alertas`, `pamela/oxigeno`, etc.
3. Los cambios entran a `main` por pull request, y el otro le da una mirada rápida.
4. Antes de abrir un PR: `git pull origin main` para traer lo último y resolver conflictos en la propia rama.

## 5. Pendientes

- **React o JS simple:** la arquitectura usa archivos `.js` (`main.js`, `panel.js`), que es la plantilla de Vite sin React. Si usamos React, hay que avisar al resto del equipo, porque `martian-map` tendría que pasar a `main.jsx` y los componentes de `ui/` a `.jsx`.
- **Formato del estado:** confirmarlo con el equipo de `src/sim/` (sección 3).
