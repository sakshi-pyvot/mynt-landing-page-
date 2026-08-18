import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader — the V's mint stroke is the event.
//  1. letters rise in; V's white right stroke with them
//  2. a short silky ribbon orbits the V while loading (its sheen loops); when
//     the load completes it pours into the V's left stroke, filling white → mint
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
  const idleRef = useRef(null)
  const pourRef = useRef(null)

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
      idleRef.current?.kill()
      const tl = gsap.timeline({ onComplete: onDone, defaults: { ease: 'power3.inOut' } })
      if (pourRef.current) tl.add(pourRef.current.play(), 0)
      tl.to('.pl-bar', { attr: { 'stroke-width': 6.5 }, duration: 0.25 }, 0.55)
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
      // reduced-motion path handled above; below builds the animated ribbon
      // ribbon lives around the V: a short twisting band that wraps behind the
      // V from lower-left to upper-right and ends at the left stroke's foot
      const W = innerWidth
      const H = innerHeight
      const svg = ribbonSvgRef.current
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const r = vLeftRef.current.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.5
      const R = Math.max(50, r.height * 1.5) // orbit radius scales with the mark
      const ex = r.left + r.width * 0.5
      const ey = r.top + r.height * 0.9
      const P0 = { x: cx - R * 1.0, y: cy + R * 1.05 }
      const P1 = { x: cx - R * 1.15, y: cy - R * 0.5 }
      const P2 = { x: cx + R * 0.3, y: cy - R * 1.0 }
      const P3 = { x: ex, y: ey }
      const bez = (t) => {
        const u = 1 - t
        return {
          x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
          y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
        }
      }
      const N = 60
      const base = Math.max(5, Math.min(12, r.height * 0.26))
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
        const twist = 0.5 + 0.5 * Math.abs(Math.cos(t * Math.PI * 1.6 + 0.4))
        const taper = 1 - Math.pow(t, 4)
        const w = base * twist * taper + 0.8
        top.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`)
        bot.push(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`)
      }
      const shape = `M ${top.join(' L ')} L ${bot.reverse().join(' L ')} Z`
      svg.querySelectorAll('.pl-ribbon-body, .pl-ribbon-shadow, .pl-ribbon-shape').forEach((el) => el.setAttribute('d', shape))
      const x0 = P0.x - 20
      const x1 = P3.x + 20

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.from('.pl-letter', { y: 10, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' })
        // ribbon appears around the V (reveal along the band) and idles
        .set('.pl-ribbon', { opacity: 1 }, 0.35)
        .fromTo('.pl-ribbon-reveal', { attr: { x: x0, width: 0 } }, { attr: { width: x1 - x0 }, duration: 0.7 }, 0.35)
      // idle: sheen loops along the band, band breathes slightly, until the pour
      idleRef.current = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } })
        .fromTo('.pl-ribbon-sheen', { attr: { x: x0 - 40 } }, { attr: { x: x1 }, duration: 1.4, ease: 'power1.inOut' })
        .fromTo('.pl-ribbon-body', { attr: { opacity: 0.85 } }, { attr: { opacity: 1 }, duration: 0.7, yoyo: true, repeat: 1 }, 0)
      // the pour, played by exit(): tail follows head into the stroke; stroke fills
      pourRef.current = gsap.timeline({ paused: true, defaults: { ease: 'power2.in' } })
        .to('.pl-ribbon-reveal', { attr: { x: x1, width: 0 }, duration: 0.7 }, 0)
        .fromTo('.pl-fill-clip', { attr: { y: 31.2, height: 0 } }, { attr: { y: 5.9, height: 25.4 }, duration: 0.7 }, 0)
        .fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'sine.out' }, 0.05)
        .to('.pl-ribbon', { opacity: 0, duration: 0.15 }, 0.7)
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
      <div className="pl-mark relative z-10 w-[min(58vw,320px)]">
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
