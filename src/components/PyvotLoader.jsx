import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader — the V's mint stroke is the event.
//  1. letters rise in; V's white right stroke with them
//  2. one silky ribbon (a twisting gradient band with a glass sheen) glides in
//     from the left on a gentle arc and pours into the V's left stroke, which
//     fills bottom → top from white to mint as the ribbon drains
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
      // ribbon geometry in pixel space: a gentle arc from the left edge into
      // the V. Width along the arc is modulated (narrow → wide → narrow) so the
      // band reads as twisting; two offset outlines are joined into one shape.
      const W = innerWidth
      const H = innerHeight
      const svg = ribbonSvgRef.current
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const r = vLeftRef.current.getBoundingClientRect()
      const ex = r.left + r.width * 0.5
      const ey = r.top + r.height * 0.85
      const P0 = { x: -0.08 * W, y: 0.78 * H }
      const P1 = { x: 0.22 * W, y: 0.36 * H }
      const P2 = { x: ex - 0.14 * W, y: ey - 0.03 * H }
      const P3 = { x: ex, y: ey }
      const bez = (t) => {
        const u = 1 - t
        return {
          x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
          y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
        }
      }
      const N = 60
      const base = Math.max(14, Math.min(34, W * 0.022))
      const top = []
      const bot = []
      for (let i = 0; i <= N; i++) {
        const t = i / N
        const p = bez(t)
        const q = bez(Math.min(1, t + 0.01))
        const dx = q.x - p.x
        const dy = q.y - p.y
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        // twist: width breathes twice along the arc, and tapers to a point at the V
        const twist = 0.55 + 0.45 * Math.abs(Math.cos(t * Math.PI * 2 + 0.6))
        const taper = 1 - Math.pow(t, 3)
        const w = base * twist * taper + 1
        top.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`)
        bot.push(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`)
      }
      const shape = `M ${top.join(' L ')} L ${bot.reverse().join(' L ')} Z`
      svg.querySelectorAll('.pl-ribbon-body, .pl-ribbon-shadow, .pl-ribbon-shape').forEach((el) => el.setAttribute('d', shape))

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.from('.pl-letter', { y: 10, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' })
        // ribbon glides in: reveal sweeps left → right along the arc
        .set('.pl-ribbon', { opacity: 1 }, 0.3)
        .fromTo('.pl-ribbon-reveal', { attr: { x: 0, width: 0 } }, { attr: { width: ex + 40 }, duration: 1.1, ease: 'power2.inOut' }, 0.3)
        // sheen travels the band while it moves
        .fromTo('.pl-ribbon-sheen', { attr: { x: -0.3 * W } }, { attr: { x: ex }, duration: 1.4, ease: 'power1.inOut' }, 0.35)
        // pour: the reveal window slides right (tail follows head into the V) while the stroke fills
        .to('.pl-ribbon-reveal', { attr: { x: ex + 40, width: 0 }, duration: 0.75, ease: 'power2.in' }, 1.35)
        .fromTo('.pl-fill-clip', { attr: { y: 31.2, height: 0 } }, { attr: { y: 5.9, height: 25.4 }, duration: 0.75, ease: 'power2.in' }, 1.35)
        .fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'sine.out' }, 1.4)
        .to('.pl-ribbon', { opacity: 0, duration: 0.15 }, 2.1)
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
      {/* full-screen ribbon overlay: a filled band (not a stroke) so it can twist,
          with a moving glass highlight; geometry is generated at runtime */}
      <svg ref={ribbonSvgRef} className="pl-ribbon pointer-events-none absolute inset-0 h-full w-full opacity-0" aria-hidden>
        <defs>
          <linearGradient id="pl-silk" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1F9D6D" />
            <stop offset="0.45" stopColor="#33BE86" />
            <stop offset="1" stopColor="#7FE0B8" />
          </linearGradient>
          <linearGradient id="pl-sheen" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="pl-ribbon-reveal">
            <rect className="pl-ribbon-reveal" x="0" y="0" width="0" height="100%" />
          </clipPath>
          <clipPath id="pl-ribbon-band-clip">
            <path className="pl-ribbon-shape" d="" />
          </clipPath>
        </defs>
        <g clipPath="url(#pl-ribbon-reveal)">
          {/* underside shadow band, slightly offset for depth */}
          <path className="pl-ribbon-shadow" d="" fill="#0B4A33" opacity="0.55" transform="translate(0,6)" />
          {/* body */}
          <path className="pl-ribbon-body" d="" fill="url(#pl-silk)" />
          {/* glass sheen: a soft diagonal highlight that travels along the band */}
          <g clipPath="url(#pl-ribbon-band-clip)">
            <rect className="pl-ribbon-sheen" x="-30%" y="0" width="22%" height="100%" fill="url(#pl-sheen)" style={{ mixBlendMode: 'screen' }} />
          </g>
        </g>
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
