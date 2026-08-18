import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import PyvotLoader3D from './PyvotLoader3D'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader.
//  1. 3D extruded letters (three.js) tumble in from depth one by one and settle
//     flat; the mark breathes and leans toward the pointer while loading
//  2. the "vot" underline is a dashed progress bar bound to real load signals;
//     over the last 10% the dashes merge into the solid bar
//  3. on completion the V's left stroke fills white → mint, then the curtain lifts
// Falls back to the flat SVG mark when WebGL is unavailable / reduced motion.

const MINT = '#33BE86'
const UNDERLINE_X1 = 64.8
const UNDERLINE_X2 = 137
const UNDERLINE_LEN = UNDERLINE_X2 - UNDERLINE_X1
const DASH = 5
const GAP = 3
const MIN_SHOW_MS = 1600
const STATUS = ['Waking Mynt', 'Connecting platforms', 'Reading payouts', 'Ready']

const canWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function PyvotLoader({ onDone }) {
  const root = useRef(null)
  const barRef = useRef(null)
  const statusRef = useRef(null)
  const api3d = useRef(null)
  const startedAt = useRef(0)
  const progress = useRef({ v: 0 })
  const [use3d] = useState(() => !reducedMotion() && canWebGL())

  useEffect(() => {
    startedAt.current = performance.now()
    const target = { v: 0.12 }
    let statusI = -1
    const setStatus = (i) => {
      if (i === statusI || !statusRef.current) return
      statusI = i
      gsap.fromTo(statusRef.current, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
      statusRef.current.textContent = STATUS[i]
    }
    setStatus(0)

    const paint = (p) => {
      const bar = barRef.current
      if (!bar) return
      const shown = Math.max(0, Math.min(1, p))
      const merge = Math.max(0, (p - 0.9) / 0.1)
      bar.setAttribute('stroke-dasharray', `${DASH + merge * UNDERLINE_LEN} ${GAP * (1 - merge)}`)
      bar.style.clipPath = `inset(0 ${(1 - shown) * 100}% 0 0)`
      setStatus(p < 0.4 ? 0 : p < 0.7 ? 1 : p < 0.985 ? 2 : 3)
    }
    const tick = () => {
      progress.current.v += (target.v - progress.current.v) * 0.1
      paint(progress.current.v)
    }
    gsap.ticker.add(tick)

    document.fonts?.ready.then(() => (target.v = Math.max(target.v, 0.45)))
    const t1 = setTimeout(() => (target.v = Math.max(target.v, 0.7)), 550)
    let loaded = false
    const onLoad = () => {
      loaded = true
      target.v = 1
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    const t2 = setTimeout(() => (target.v = 1), 3200)

    const done = setInterval(() => {
      const elapsed = performance.now() - startedAt.current
      if ((loaded || target.v >= 1) && progress.current.v > 0.985 && elapsed > MIN_SHOW_MS) {
        clearInterval(done)
        exit()
      }
    }, 60)

    function exit() {
      const tl = gsap.timeline({ onComplete: onDone, defaults: { ease: 'power3.inOut' } })
      // V left stroke fills white → mint (3D) or flat fill clip (fallback)
      if (api3d.current) tl.add(api3d.current.fill(), 0)
      else tl.fromTo('.pl-fill-clip', { attr: { y: 31.2, height: 0 } }, { attr: { y: 5.9, height: 25.4 }, duration: 0.6 }, 0)
      tl.to('.pl-bar', { attr: { 'stroke-width': 6.5 }, duration: 0.25 }, 0.4)
        .to('.pl-bar', { attr: { 'stroke-width': 4.5 }, duration: 0.3 })
        .to('.pl-vignette', { opacity: 0, duration: 0.4 }, '<')
      if (api3d.current) tl.add(api3d.current.exit(), '-=0.2')
      tl.to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.7 }, '-=0.35')
    }

    gsap.fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'sine.out', delay: 0.3 })

    return () => {
      gsap.ticker.remove(tick)
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(done)
      window.removeEventListener('load', onLoad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
      aria-label="Loading Pyvot"
      role="status"
    >
      <div className="pl-vignette pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(ellipse_40%_35%_at_50%_50%,rgba(51,190,134,0.14),transparent_70%)]" />

      <div className="pl-mark relative w-[min(48vw,240px)]">
        {/* 3D letters (or flat SVG fallback) */}
        <div className="relative aspect-[137/45]">
          {use3d ? (
            <PyvotLoader3D apiRef={api3d} className="absolute inset-[-40%]" />
          ) : (
            <svg viewBox={VIEWBOX} className="absolute inset-0 h-full w-full" fill="none">
              <defs>
                <clipPath id="pl-fill">
                  <rect className="pl-fill-clip" x="56" y="31.2" width="16" height="0" />
                </clipPath>
              </defs>
              {['p', 'y', 'vRight', 'o', 't'].map((k) => (
                <path key={k} d={PATHS[k]} fill="#fff" />
              ))}
              <path d={PATHS.vLeft} fill="#fff" />
              <path d={PATHS.vLeft} fill={MINT} clipPath="url(#pl-fill)" />
            </svg>
          )}
        </div>
        {/* progress underline overlays the mark's own underline position */}
        <svg viewBox={VIEWBOX} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
          <line x1={UNDERLINE_X1} y1="42.75" x2={UNDERLINE_X2} y2="42.75" stroke={MINT} strokeOpacity="0.16" strokeWidth="4.5" strokeLinecap="round" />
          <line
            ref={barRef}
            className="pl-bar"
            x1={UNDERLINE_X1}
            y1="42.75"
            x2={UNDERLINE_X2}
            y2="42.75"
            stroke={MINT}
            strokeWidth="4.5"
            strokeDasharray={`${DASH} ${GAP}`}
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          />
        </svg>
      </div>
      <div className="mt-8 h-4 font-mono text-[10px] uppercase tracking-[0.32em] text-mute">
        <span ref={statusRef} className="inline-block" />
      </div>
    </div>
  )
}
