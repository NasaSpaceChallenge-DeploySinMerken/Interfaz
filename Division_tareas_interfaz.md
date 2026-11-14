# División de tareas — Interfaz

**Repo de la app:** [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). La interfaz se arma primero en este repo y, cuando esté lista, se pasa ahí.
**Responsables:** Juan y Pamela
**Stack:** React + Vite (Chart.js más adelante, para el panel)
**Base:** [Reunión 1](https://github.com/NasaSpaceChallenge-DeploySinMerken/docs/blob/main/Reunion1_ordenada.md) · [Arquitectura](arquitectura.jpeg)

## 1. Qué nos toca

En la [arquitectura](arquitectura.jpeg) del proyecto ([martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map)), lo nuestro es **la interfaz del navegador**:

| Carpeta / archivo | Responsable | Qué es |
| --- | --- | --- |
| `src/ui/panel.js` | **Nosotros** | Indicadores con Chart.js. **Por ahora no se hace** (ver sección 2) |
| `src/ui/alerts.js` | **Nosotros** | Alertas de oxígeno, temperatura y salud |
| `index.html`, `src/style.css` | **Nosotros** | Estructura y estilo de la página |
| `src/map/` | Otro equipo | Mapa OpenLayers, capas de Mars Trek, proyección |
| `src/sim/` | Otro equipo | Posición del astronauta, recursos, teclado y joystick |
| `analysis/`, `public/data/` | Otro equipo | Análisis en Python y la ruta en GeoJSON |

Nosotros **no calculamos nada**: leemos el estado que entrega `src/sim/` y lo mostramos. En el mapa solo dejamos el espacio (`<div id="map">`) donde el otro equipo lo monta.

## 2. Reparto

**Por ahora, oxígeno, temperatura y salud se muestran solo como alertas.** El panel con gráficos de Chart.js (`panel.js`) queda para después, si hay tiempo.

### Juan — Página, datos de prueba y sistema de alertas

| # | Tarea | Detalle |
| --- | --- | --- |
| J1 | Proyecto base | ✅ Esqueleto con Vite + React en este repo. Ver [README](README.md). |
| J2 | Simulación de prueba | `src/mock/simulacionFalsa.js`: genera cada segundo un estado con la forma de la sección 3 (el oxígeno baja, el pulso sube y baja, etc.). Así trabajamos sin esperar a `src/sim/`. |
| J3 | Layout de la página | Barra superior (tiempo de misión, play/pausa, velocidad), espacio para el mapa y zona de alertas. Que se vea bien en pantalla completa, que es como se va a presentar. |
| J4 | Sistema de alertas (`alerts.js`) | La parte que muestra las alertas: tres niveles (info, aviso, crítico) que aparecen, se apilan y se pueden cerrar. Sin repetir la misma alerta en cada segundo mientras siga activa. Recibe alertas con la forma `{ id, nivel, mensaje }`, sin saber de dónde vienen. |

### Pamela — Reglas de las alertas y estilo

Cada regla mira el estado de la simulación y devuelve las alertas que correspondan, que el sistema de Juan muestra. Los umbrales son una primera propuesta: ajustarlos con datos reales si se consiguen.

| # | Tarea | Detalle |
| --- | --- | --- |
| P1 | Oxígeno | Aviso bajo 30 %, crítico bajo 15 %. Crítico también si `minutosRestantes` es menor que `minutosParaVolver` (no alcanza para volver). Es la alerta más importante: tiene que ser la más visible. |
| P2 | Temperatura | Aviso y crítico si la temperatura del traje sale de rango (por ejemplo, fuera de 18–27 °C y de 10–35 °C). La exterior solo como info. |
| P3 | Salud | Aviso y crítico por pulso alto (más de 120 y de 150) y por saturación baja (menos de 94 % y de 90 %). |
| P4 | Estilo visual | Paleta de colores, tipografía y estados (normal, aviso, crítico) en `style.css`. Juan los usa en el layout y en las alertas para que todo se vea igual. |

### En conjunto

| Tarea | Cuándo |
| --- | --- |
| Confirmar con el equipo de `src/sim/` el formato del estado (sección 3) | Al empezar. |
| Probar las alertas con la simulación de prueba (que la simulación falsa pase por todos los umbrales) | Cuando estén J2, J4 y P1. |
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
2. Cada uno trabaja en su rama: `juan/alertas`, `pamela/oxigeno`, etc.
3. Los cambios entran a `main` por pull request, y el otro le da una mirada rápida.
4. Antes de abrir un PR: `git pull origin main` para traer lo último y resolver conflictos en la propia rama.

## 5. Pendientes

- **React o JS simple:** la arquitectura usa archivos `.js` (`main.js`, `panel.js`), que es la plantilla de Vite sin React. Si usamos React, hay que avisar al resto del equipo, porque `martian-map` tendría que pasar a `main.jsx` y los componentes de `ui/` a `.jsx`.
- **Formato del estado:** confirmarlo con el equipo de `src/sim/` (sección 3).
