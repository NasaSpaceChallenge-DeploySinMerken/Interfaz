// Colores de las salidas cuando el backend divide el viaje en varias
// (vuelve al aterrizaje a recargar oxígeno entre una y otra).
// Elegidos para distinguirse entre sí y sobre el terreno ocre de Marte.

export const COLORES_SALIDA = ['#e0784a', '#5fb0ff', '#b98cff', '#5fd3a0', '#ffd166', '#ff7eb6']

export const colorSalida = (indice) => COLORES_SALIDA[indice % COLORES_SALIDA.length]
