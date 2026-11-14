import { reglaOxigeno } from './oxigeno'
import { reglaTemperatura } from './temperatura'
import { reglaSalud } from './salud'

const REGLAS = [reglaOxigeno, reglaTemperatura, reglaSalud]

export function evaluarReglas(estado) {
  return REGLAS.flatMap((regla) => regla(estado))
}
