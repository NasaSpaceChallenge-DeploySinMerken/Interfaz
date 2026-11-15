import test from 'node:test'
import assert from 'node:assert/strict'

const memoria = new Map()
globalThis.localStorage = {
  getItem: (clave) => memoria.get(clave) ?? null,
  setItem: (clave, valor) => memoria.set(clave, valor),
}
globalThis.document = { documentElement: { lang: '' } }
globalThis.window = {
  location: { search: '', href: 'https://martian-map.page/' },
  history: { replaceState: (_, __, url) => {
    window.location.href = String(url)
    window.location.search = new URL(url).search
  } },
}

const { cambiarIdioma, idiomaActual, tr, trPunto } = await import('./idioma.js')

test('el selector cambia las pantallas y mantiene la preferencia', () => {
  assert.equal(idiomaActual(), 'es')
  assert.equal(tr('Preparar el viaje'), 'Preparar el viaje')
  cambiarIdioma('en')
  assert.equal(tr('Preparar el viaje'), 'Plan your journey')
  assert.equal(trPunto('Punto 3'), 'Point 3')
  assert.equal(tr('El oxígeno no alcanza para volver'), 'There is not enough oxygen to return')
  assert.equal(tr('Pulso muy alto: 171 latidos/min'), 'Very high heart rate: 171 bpm')
  assert.equal(document.documentElement.lang, 'en')
  assert.equal(localStorage.getItem('martian-map-idioma'), 'en')
  assert.equal(new URL(window.location.href).searchParams.get('lang'), 'en')
  cambiarIdioma('es')
  assert.equal(trPunto('Point 3'), 'Punto 3')
  assert.equal(new URL(window.location.href).searchParams.has('lang'), false)
})
