import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader.
//  1. letters rise in (blur → sharp), V right stroke with them
//  2. V left stroke fills bottom → top like a mint ribbon
//  3. the "vot" underline is a dashed progress bar driven by real load
//     progress; at 100% the dashes merge into the solid mint bar
//  4. curtain wipes up
// Pure SVG + GSAP; ~9KB, no video/canvas.

const MINT = '#33BE86'
const UNDERLINE_LEN = 72 // path spans x 64.8 → 137 (≈72 units)
const DASH = 5
const GAP = 3
const MIN_SHOW_MS = 1400 // never flash — even on instant loads the bar reads

export default function PyvotLoader({ onDone }) {
  const root = useRef(null)
  const progress = useRef({ v: 0 })
  const barRef = useRef(null)
  const startedAt = useRef(0)

  // real load signal: fonts + window load + hero chunk. We move a target and
  // the bar eases toward it; 100% only after window 'load'.
  useEffect(() => {
    startedAt.current = performance.now()
    const target = { v: 0.15 }
    const tick = () => {
      // ease displayed progress toward target
      progress.current.v += (target.v - progress.current.v) * 0.12
      paint(progress.current.v)
    }
    gsap.ticker.add(tick)
    document.fonts?.ready.then(() => (target.v = Math.max(target.v, 0.45)))
    const t1 = setTimeout(() => (target.v = Math.max(target.v, 0.7)), 500)
    let loaded = false
    const onLoad = () => {
      loaded = true
      target.v = 1
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    // safety: never hang the loader
    const t2 = setTimeout(() => (target.v = 1), 3200)

    // completion watcher
    const done = setInterval(() => {
      const elapsed = performance.now() - startedAt.current
      if ((loaded || target.v >= 1) && progress.current.v > 0.985 && elapsed > MIN_SHOW_MS) {
        clearInterval(done)
        exit()
      }
    }, 60)

    function paint(p) {
      const bar = barRef.current
      if (!bar) return
      // dashed → progressive fill: reveal length p*LEN; gap shrinks to 0 near the end
      const shown = Math.max(0, Math.min(1, p)) * UNDERLINE_LEN
      const merge = Math.max(0, (p - 0.9) / 0.1) // 0..1 over the last 10%
      const gap = GAP * (1 - merge)
      bar.setAttribute('stroke-dasharray', `${DASH + merge * UNDERLINE_LEN} ${gap}`)
      bar.setAttribute('stroke-dashoffset', '0')
      bar.style.clipPath = `inset(0 ${100 - (shown / UNDERLINE_LEN) * 100}% 0 0)`
    }

    function exit() {
      gsap
        .timeline({ onComplete: onDone })
        .to('.pl-glow', { opacity: 1, scale: 1.4, duration: 0.35, ease: 'power2.out' })
        .to('.pl-glow', { opacity: 0, duration: 0.4 }, '+=0.05')
        .to('.pl-mark', { scale: 1.04, duration: 0.35, ease: 'power2.out' }, '<-0.4')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power3.inOut' }, '-=0.15')
    }

    return () => {
      gsap.ticker.remove(tick)
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(done)
      window.removeEventListener('load', onLoad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useGSAP(
    () => {
      if (reducedMotion()) {
        gsap.set('.pl-letter, .pl-vleft-clip', { clearProps: 'all' })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      // 1. letters rise in
      tl.from('.pl-letter', {
        y: 14,
        opacity: 0,
        filter: 'blur(6px)',
        stagger: 0.07,
        duration: 0.55,
      })
        // 2. V left stroke: ribbon fills bottom → top (clip rect grows upward)
        .fromTo('.pl-vleft-clip', { attr: { y: 32, height: 0 } }, { attr: { y: 5, height: 27 }, duration: 0.7, ease: 'power2.inOut' }, 0.35)
        .fromTo('.pl-vleft-glow', { opacity: 0 }, { opacity: 0.9, duration: 0.25, yoyo: true, repeat: 1 }, 0.95)
    },
    { scope: root },
  )

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
      aria-label="Loading Pyvot"
      role="status"
    >
      <div className="pl-mark relative w-[min(56vw,300px)]">
        <div className="pl-glow pointer-events-none absolute inset-[-40%] rounded-full opacity-0 [background:radial-gradient(circle,rgba(51,190,134,0.28),transparent_60%)]" />
        <svg viewBox={VIEWBOX} className="relative w-full overflow-visible" fill="none">
          <defs>
            <clipPath id="pl-vleft-clip">
              <rect className="pl-vleft-clip" x="56" y="5" width="16" height="27" />
            </clipPath>
            <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {/* letters */}
          <path className="pl-letter" d={PATHS.p} fill="#fff" />
          <path className="pl-letter" d={PATHS.y} fill="#fff" />
          {/* V right stroke (white) rides in with the letters */}
          <path className="pl-letter" d={PATHS.vRight} fill="#fff" />
          <path className="pl-letter" d={PATHS.o} fill="#fff" />
          <path className="pl-letter" d={PATHS.t} fill="#fff" />

          {/* V left stroke: mint, revealed by the rising clip */}
          <path className="pl-vleft-glow" d={PATHS.vLeft} fill={MINT} filter="url(#pl-soft)" opacity="0" />
          <path d={PATHS.vLeft} fill={MINT} clipPath="url(#pl-vleft-clip)" />

          {/* underline track (faint) + progress dashes */}
          <line x1="64.8" y1="42.75" x2="137" y2="42.75" stroke={MINT} strokeOpacity="0.18" strokeWidth="4.5" strokeLinecap="round" />
          <line
            ref={barRef}
            x1="64.8"
            y1="42.75"
            x2="137"
            y2="42.75"
            stroke={MINT}
            strokeWidth="4.5"
            strokeLinecap="butt"
            strokeDasharray={`${DASH} ${GAP}`}
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          />
        </svg>
      </div>
      <div className="mt-6 text-[10px] uppercase tracking-[0.35em] text-mute">Loading</div>
    </div>
  )
}
