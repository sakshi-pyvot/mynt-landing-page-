import { useEffect, useRef } from 'react'

// mapcn-style MapLibre map: Carto dark-matter basemap + a pulsing mint marker
// on the Ergo Tower HQ. maplibre is loaded from /vendor as untransformed ESM —
// the bundler breaks its sibling-file worker bootstrap, so it must stay out of
// the build graph (files copied from node_modules/maplibre-gl/dist).

const HQ = { lng: 88.4311, lat: 22.577 }
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

let libPromise = null
const loadMaplibre = () => {
  if (!libPromise) {
    if (!document.querySelector('link[href="/vendor/maplibre-gl.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/vendor/maplibre-gl.css'
      document.head.appendChild(link)
    }
    libPromise = import(/* @vite-ignore */ '/vendor/maplibre-gl.mjs')
  }
  return libPromise
}

export default function HqMap({ className }) {
  const box = useRef(null)

  useEffect(() => {
    let map
    let dead = false
    loadMaplibre().then((lib) => {
      if (dead || !box.current) return
      map = new lib.Map({
        container: box.current,
        style: STYLE,
        center: [HQ.lng, HQ.lat],
        zoom: 14.4,
        attributionControl: { compact: true },
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
      })
      map.on('error', (e) => console.warn('[hqmap]', e.error?.message || e))
      const el = document.createElement('span')
      el.className = 'hq-marker'
      new lib.Marker({ element: el }).setLngLat([HQ.lng, HQ.lat]).addTo(map)
    })
    return () => {
      dead = true
      map?.remove()
    }
  }, [])

  return <div ref={box} className={className} />
}
