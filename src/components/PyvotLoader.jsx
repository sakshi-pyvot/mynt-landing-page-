import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'
import { reducedMotion } from '@/lib/utils'

// Pyvot wordmark loader — the V's mint stroke is the event.
//  1. letters rise in; V's white right stroke with them
//  2. a full-screen burst of green ribbons + confetti erupts from the V and
//     rises across the page; as it flies the V's left stroke turns white → mint
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

const GREENS = ['#33BE86', '#8FE3C0', '#DFFBEE', '#1F9D6D', '#5ED4A5']

const STATUS = ['Waking Mynt', 'Connecting platforms', 'Reading payouts', 'Ready']

export default function PyvotLoader({ onDone }) {
  const root = useRef(null)
  const barRef = useRef(null)
  const statusRef = useRef(null)
  const startedAt = useRef(0)
  const progress = useRef({ v: 0 })
  const canvasRef = useRef(null)
  const vLeftRef = useRef(null)

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


  // full-screen ribbon + confetti burst from the V; the V's left stroke turns
  // white → mint while it flies. Canvas 2D, ~140 particles, ~1.6s, then stops.
  useEffect(() => {
    if (reducedMotion()) {
      gsap.set(vLeftRef.current, { attr: { fill: MINT } })
      return undefined
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const resize = () => {
      canvas.width = Math.round(innerWidth * dpr)
      canvas.height = Math.round(innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let parts = []
    let raf = 0
    let running = false
    let t0 = 0

    const spawn = () => {
      // origin: the V's left stroke in screen space
      const r = vLeftRef.current.getBoundingClientRect()
      const ox = r.left + r.width / 2
      const oy = r.top + r.height / 2
      parts = []
      for (let i = 0; i < 140; i++) {
        const ribbon = i % 3 !== 0 // 2/3 ribbons, 1/3 confetti flakes
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35 // mostly upward, wide fan
        const speed = 520 + Math.random() * 720
        parts.push({
          ribbon,
          x: ox + (Math.random() - 0.5) * r.width,
          y: oy + (Math.random() - 0.5) * r.height,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          w: ribbon ? 3 + Math.random() * 3 : 6 + Math.random() * 6,
          len: ribbon ? 40 + Math.random() * 60 : 6 + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 12,
          phase: Math.random() * Math.PI * 2,
          color: GREENS[(Math.random() * GREENS.length) | 0],
          life: 1.3 + Math.random() * 0.6,
          age: 0,
          trail: [],
        })
      }
    }

    const step = (now) => {
      if (!running) return
      const dt = Math.min((now - t0) / 1000, 0.033)
      t0 = now
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      let alive = 0
      for (const p of parts) {
        p.age += dt
        if (p.age > p.life) continue
        alive++
        // physics: gravity + drag + flutter
        p.vy += 900 * dt
        p.vx *= 1 - 1.6 * dt
        p.vy *= 1 - 0.9 * dt
        p.vx += Math.sin(p.age * 9 + p.phase) * 60 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        const a = 1 - Math.pow(p.age / p.life, 2)
        ctx.globalAlpha = a
        ctx.fillStyle = p.color
        if (p.ribbon) {
          // curly ribbon: short trail of positions drawn as a tapering strip
          p.trail.push({ x: p.x, y: p.y })
          if (p.trail.length > 8) p.trail.shift()
          ctx.beginPath()
          ctx.lineWidth = p.w
          ctx.lineCap = 'round'
          ctx.strokeStyle = p.color
          for (let k = 0; k < p.trail.length; k++) {
            const q = p.trail[k]
            const wob = Math.sin(p.age * 14 + k * 0.9 + p.phase) * 4
            if (k === 0) ctx.moveTo(q.x + wob, q.y)
            else ctx.lineTo(q.x + wob, q.y)
          }
          ctx.stroke()
        } else {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          // flake tumbles: scale x by cos to fake 3D flip
          ctx.scale(Math.cos(p.age * 10 + p.phase), 1)
          ctx.fillRect(-p.w / 2, -p.len / 2, p.w, p.len)
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(step)
      else {
        running = false
        ctx.clearRect(0, 0, innerWidth, innerHeight)
      }
    }

    const fire = () => {
      spawn()
      running = true
      t0 = performance.now()
      raf = requestAnimationFrame(step)
      // stroke turns mint as the burst leaves it
      gsap.to(vLeftRef.current, { attr: { fill: MINT }, duration: 0.55, ease: 'power2.inOut', delay: 0.05 })
      gsap.fromTo('.pl-vignette', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'sine.out' })
    }
    const timer = setTimeout(fire, 450)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // intro choreography
  useGSAP(
    () => {
      if (reducedMotion()) return
      gsap.from('.pl-letter', { y: 10, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' })
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
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className="pl-mark relative w-[min(58vw,320px)]">
        <svg viewBox={VIEWBOX} className="relative w-full overflow-visible" fill="none">
          {/* letters */}
          <path className="pl-letter" d={PATHS.p} fill="#fff" />
          <path className="pl-letter" d={PATHS.y} fill="#fff" />
          <path className="pl-letter" d={PATHS.vRight} fill="#fff" />
          <path className="pl-letter" d={PATHS.o} fill="#fff" />
          <path className="pl-letter" d={PATHS.t} fill="#fff" />

          {/* V left stroke: starts white, turns mint as the burst leaves it */}
          <path ref={vLeftRef} className="pl-letter" d={PATHS.vLeft} fill="#fff" />

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
