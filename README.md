# Interfaz — Martian Map

Interfaz del navegador (alertas, barra superior y layout) del proyecto [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). Se arma aquí y, cuando esté lista, se pasa al repo principal.

Reparto de tareas: [Division_tareas_interfaz.md](Division_tareas_interfaz.md)

## Cómo correrlo

```bash
npm install
npm run dev
```

## Estructura

```
src/
  main.jsx, App.jsx            layout general
  style.css                    estilo (Pamela) y layout (Juan)
  mock/simulacionFalsa.js      simulación de prueba mientras no esté src/sim/ (Juan)
  ui/
    useSimulacion.js           conecta la interfaz con la simulación
    BarraSuperior.jsx          tiempo de misión y controles (Juan)
    alertas/
      Alertas.jsx, useAlertas.js   sistema de alertas (Juan)
      reglas/                      oxígeno, temperatura y salud (Pamela)
```
