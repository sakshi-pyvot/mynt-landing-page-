import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader — the V's mint stroke is the event.
//  1. letters rise in; V's white right stroke with them
//  2. one green ribbon sweeps across the screen and pours into the V's left
//     stroke, which fills bottom → top from white to mint as the ribbon drains
//  3. the "vot" underline is a dashed progress bar bound to real load signals;
//     over the last 10% the dashes merge into the solid bar
//  4. exit: the mint stroke drains down into the bar, then the curtain lifts
// Pure SVG + GSAP; no video/canvas.

const MINT = '#33BE86'
const UNDERLINE_X1 = 64.8
const UNDERLINE_X2 = 137
const UNDERLINE_LEN = UNDERLINE_X2 - UNDERLINE_X1
const DASH = 5
const GAP = 3
const MIN_SHOW_MS = 1500


const STATUS = ['Waking Mynt', 'Connecting platforms', 'Reading payouts', 'Ready']

export default function PyvotLoader({ onDone }) {
  const root = useRef(null)
  const barRef = useRef(null)
  const statusRef = useRef(null)
  const startedAt = useRef(0)
  const progress = useRef({ v: 0 })
  const vLeftRef = useRef(null)
  const ribbonSvgRef = useRef(null)

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
      tl.to('.pl-bar', { attr: { 'stroke-width': 6.5 }, duration: 0.25 })
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
        gsap.set('.pl-fill-clip', { attr: { y: 5.9, height: 25.4 } })
        gsap.set('.pl-ribbon', { opacity: 0 })
        return
      }
      // ribbon overlay works in pixel space so dash lengths are exact
      const W = innerWidth
      const H = innerHeight
      ribbonSvgRef.current.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const r = vLeftRef.current.getBoundingClientRect()
      const ex = r.left + r.width * 0.55
      const ey = r.top + r.height * 0.9
      // bottom-left → S sweep across → curl above-right of the mark → dive into the V
      const d = `M ${-0.06 * W} ${0.96 * H} C ${0.18 * W} ${0.92 * H}, ${0.22 * W} ${0.66 * H}, ${0.34 * W} ${0.6 * H} C ${0.46 * W} ${0.54 * H}, ${ex + 0.16 * W} ${ey + 0.22 * H}, ${ex + 0.21 * W} ${ey + 0.04 * H} C ${ex + 0.26 * W} ${ey - 0.1 * H}, ${ex + 0.13 * W} ${ey - 0.18 * H}, ${ex + 0.05 * W} ${ey - 0.1 * H} C ${ex + 0.005 * W} ${ey - 0.05 * H}, ${ex} ${ey - 0.02 * H}, ${ex} ${ey}`
      gsap.set('.pl-ribbon-band', { attr: { d, 'stroke-width': Math.max(10, Math.min(22, W * 0.014)) } })
      const band = root.current.querySelector('.pl-ribbon-band')
      const L = band.getTotalLength()

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.from('.pl-letter', { y: 10, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' })
        // ribbon: enters bottom-left, sweeps in an S across the screen toward the V,
        // narrows as it arrives (motion path on a full-screen SVG overlay)
        .fromTo('.pl-ribbon', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.35)
        .fromTo(
          band,
          { attr: { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L } },
          { attr: { 'stroke-dashoffset': 0 }, duration: 1.05, ease: 'power2.inOut' },
          0.35,
        )
        // once the head reaches the V the tail follows: the visible segment shrinks
        // toward the V (draining) while the stroke fills bottom → top
        // drain: with dasharray "1 1" the visible unit slides along the path and off
        // its end into the V as the offset runs 0 → -1
        .to(band, { attr: { 'stroke-dashoffset': -L }, duration: 0.7, ease: 'power2.in' }, 1.15)
        .fromTo('.pl-fill-clip', { attr: { y: 31.2, height: 0 } }, { attr: { y: 5.9, height: 25.4 }, duration: 0.7, ease: 'power2.in' }, 1.15)
        .fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'sine.out' }, 1.2)
        .to('.pl-ribbon', { opacity: 0, duration: 0.2 }, 1.85)
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
      {/* full-screen ribbon overlay: one silky band on a bezier that ends at the V */}
      <svg ref={ribbonSvgRef} className="pl-ribbon pointer-events-none absolute inset-0 h-full w-full opacity-0" aria-hidden>
        <defs>
          <linearGradient id="pl-ribbon-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1F9D6D" />
            <stop offset="0.5" stopColor="#33BE86" />
            <stop offset="1" stopColor="#8FE3C0" />
          </linearGradient>
        </defs>
        {/* path: bottom-left → mid sweep → top curl → lands on the V (≈ 46.5%, 47.5% of viewport) */}
        <path
          className="pl-ribbon-band"
          d="M -6 96 C 18 92, 22 66, 34 60 C 46 54, 62 70, 68 52 C 73 38, 60 30, 52 38 C 47 43, 46.5 45.5, 46.6 47.4"
          fill="none"
          stroke="url(#pl-ribbon-grad)"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </svg>
      <div className="pl-mark relative w-[min(58vw,320px)]">
        <svg viewBox={VIEWBOX} className="relative w-full overflow-visible" fill="none">
          {/* letters */}
          <path className="pl-letter" d={PATHS.p} fill="#fff" />
          <path className="pl-letter" d={PATHS.y} fill="#fff" />
          <path className="pl-letter" d={PATHS.vRight} fill="#fff" />
          <path className="pl-letter" d={PATHS.o} fill="#fff" />
          <path className="pl-letter" d={PATHS.t} fill="#fff" />

          <defs>
            <clipPath id="pl-fill">
              <rect className="pl-fill-clip" x="56" y="31.2" width="16" height="0" />
            </clipPath>
          </defs>
          {/* V left stroke: white, then mint fills bottom → top as the ribbon pours in */}
          <path ref={vLeftRef} className="pl-letter" d={PATHS.vLeft} fill="#fff" />
          <path d={PATHS.vLeft} fill={MINT} clipPath="url(#pl-fill)" />

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
