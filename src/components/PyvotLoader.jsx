import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader — the V's mint stroke is the event.
//  1. letters rise in; V's white right stroke with them
//  2. light-green ribbons pour up inside the V's left stroke and stack until it
//     is full; a thin specular flash runs the stroke's edge when it lands
//  3. the "vot" underline is a dashed progress bar bound to real load signals;
//     over the last 10% the dashes merge into the solid bar
//  4. exit: the mint stroke drains down into the bar, then the curtain lifts
// Pure SVG + GSAP; no video/canvas.

const MINT = '#33BE86'
const MINT_LIGHT = '#8FE3C0'
const UNDERLINE_X1 = 64.8
const UNDERLINE_X2 = 137
const UNDERLINE_LEN = UNDERLINE_X2 - UNDERLINE_X1
const DASH = 5
const GAP = 3
const MIN_SHOW_MS = 1500

// V left stroke bbox: x 57.3–70.9, y 5.9–31.2 → ribbons live in that column
const RIBBONS = [
  { x: 57.6, w: 2.4, tint: MINT_LIGHT, delay: 0.0 },
  { x: 60.1, w: 2.2, tint: MINT, delay: 0.08 },
  { x: 62.4, w: 2.6, tint: MINT_LIGHT, delay: 0.16 },
  { x: 65.1, w: 2.1, tint: MINT, delay: 0.24 },
  { x: 67.3, w: 2.4, tint: MINT_LIGHT, delay: 0.32 },
  { x: 69.8, w: 1.4, tint: MINT, delay: 0.4 },
]

const STATUS = ['Waking Mynt', 'Connecting platforms', 'Reading payouts', 'Ready']

export default function PyvotLoader({ onDone }) {
  const root = useRef(null)
  const barRef = useRef(null)
  const statusRef = useRef(null)
  const startedAt = useRef(0)
  const progress = useRef({ v: 0 })

  // real load progress → underline dashes + status word
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
      const gap = GAP * (1 - merge)
      bar.setAttribute('stroke-dasharray', `${DASH + merge * UNDERLINE_LEN} ${gap}`)
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
      // the pour drains: stroke clip slides down + out; bar brightens as it "receives" it
      tl.to('.pl-vleft-clip', { attr: { y: 32, height: 0 }, duration: 0.55 })
        .to('.pl-bar', { attr: { 'stroke-width': 6.5 }, duration: 0.25 }, '-=0.25')
        .to('.pl-bar', { attr: { 'stroke-width': 4.5 }, duration: 0.3 })
        .to('.pl-vignette', { opacity: 0, duration: 0.4 }, '<')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.7 }, '-=0.1')
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

  // intro choreography
  useGSAP(
    () => {
      if (reducedMotion()) {
        gsap.set('.pl-ribbon', { attr: { y: 5.9, height: 25.4 } })
        gsap.set('.pl-vleft-clip', { attr: { y: 5.9, height: 25.4 } })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      // 1. letters rise (no blur — quieter)
      tl.from('.pl-letter', { y: 10, opacity: 0, stagger: 0.06, duration: 0.5 })
        // vignette breathes once behind the mark while the pour happens
        .fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'sine.out' }, 0.2)
        // 2. ribbons pour up: each strand rises from below the baseline, overshoots, settles
        .fromTo(
          '.pl-ribbon',
          { attr: { y: 33, height: 0 } },
          {
            attr: { y: 5.9, height: 25.4 },
            duration: 0.85,
            ease: 'back.out(1.35)',
            stagger: (i) => RIBBONS[i].delay,
          },
          0.3,
        )
        // strand tips glow slightly brighter as they rise
        .fromTo('.pl-ribbon-tip', { attr: { y: 33 } }, { attr: { y: 5.9 }, duration: 0.85, ease: 'back.out(1.35)', stagger: (i) => RIBBONS[i].delay }, 0.3)
        // 3. when full: specular flash runs the stroke's edge, then flat mint takes over
        .fromTo('.pl-spec', { attr: { y1: 33, y2: 33 }, opacity: 0 }, { attr: { y1: 5.9, y2: 5.9 }, opacity: 1, duration: 0.45, ease: 'power2.in' }, 1.15)
        .to('.pl-spec', { opacity: 0, duration: 0.3 }, 1.6)
        // solid stroke fades in over the strands, then strands drop — never dimmer than the logo
        .fromTo('.pl-vleft-solid', { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.45 }, 1.4)
        .to('.pl-ribbons', { opacity: 0, duration: 0.3 }, 1.85)
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
      <div className="pl-vignette pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(ellipse_40%_35%_at_50%_50%,rgba(51,190,134,0.14),transparent_70%)]" />
      <div className="pl-mark relative w-[min(58vw,320px)]">
        <svg viewBox={VIEWBOX} className="relative w-full overflow-visible" fill="none">
          <defs>
            {/* everything mint lives inside the V's left-stroke silhouette */}
            <clipPath id="pl-vshape">
              <path d={PATHS.vLeft} />
            </clipPath>
            {/* the drain-out clip on exit */}
            <clipPath id="pl-vleft-clip">
              <rect className="pl-vleft-clip" x="56" y="5.9" width="16" height="25.4" />
            </clipPath>
            <filter id="pl-tip" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </defs>

          {/* letters */}
          <path className="pl-letter" d={PATHS.p} fill="#fff" />
          <path className="pl-letter" d={PATHS.y} fill="#fff" />
          <path className="pl-letter" d={PATHS.vRight} fill="#fff" />
          <path className="pl-letter" d={PATHS.o} fill="#fff" />
          <path className="pl-letter" d={PATHS.t} fill="#fff" />

          {/* V left stroke: faint track so the pour has a vessel */}
          <path d={PATHS.vLeft} fill={MINT} opacity="0.12" />

          {/* ribbons — clipped to the stroke, then to the drain rect */}
          <g clipPath="url(#pl-vleft-clip)">
            <g clipPath="url(#pl-vshape)">
              <g className="pl-ribbons">
                {RIBBONS.map((r, i) => (
                  <g key={i}>
                    <rect className="pl-ribbon" x={r.x} y="33" width={r.w} height="0" fill={r.tint} />
                    <rect className="pl-ribbon-tip" x={r.x - 0.3} y="33" width={r.w + 0.6} height="1.6" fill="#DFFBEE" filter="url(#pl-tip)" opacity="0.9" />
                  </g>
                ))}
              </g>
              {/* solid mint stroke takes over once full */}
              <path className="pl-vleft-solid" d={PATHS.vLeft} fill={MINT} opacity="0" />
              {/* specular flash along the left edge */}
              <line className="pl-spec" x1="58" y1="33" x2="60.5" y2="33" stroke="#F2FFF8" strokeWidth="1.2" strokeLinecap="round" opacity="0" />
            </g>
          </g>

          {/* underline: faint track + progress dashes */}
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
      <div className="mt-6 h-4 font-mono text-[10px] uppercase tracking-[0.32em] text-mute">
        <span ref={statusRef} className="inline-block" />
      </div>
    </div>
  )
}
