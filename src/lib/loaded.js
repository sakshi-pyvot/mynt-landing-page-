// Tiny "site is revealed" signal so intro animations start when the loader
// curtain lifts, however long the load actually took.
let fired = false
const EVENT = 'pyvot:loaded'

export function markLoaded() {
  if (fired) return
  fired = true
  window.dispatchEvent(new Event(EVENT))
}

// Calls cb once, when the loader has finished (immediately if already done).
export function onLoaded(cb) {
  if (fired) {
    cb()
    return () => {}
  }
  const h = () => cb()
  window.addEventListener(EVENT, h, { once: true })
  return () => window.removeEventListener(EVENT, h)
}
