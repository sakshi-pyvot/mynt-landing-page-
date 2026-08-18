import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { reducedMotion } from '@/lib/utils'
import { onLoaded } from '@/lib/loaded'

// Live command-centre mock: numbers tick, sparkline redraws, alerts slide in,
// AI line types itself. All DOM — no React re-renders on tick.

const KPIS = [
  { key: 'gov', label: 'Gross Order Value', value: 2496411, prefix: '₹', delta: '+14.4%', up: true, tone: 'mint' },
  { key: 'orders', label: 'Orders', value: 4579, prefix: '', delta: '+11.3%', up: true, tone: 'mint' },
  { key: 'payout', label: 'Net Payout', value: 1409710, prefix: '₹', delta: '+15.6%', up: true, tone: 'mint' },
  { key: 'ads', label: 'Ad Spend', value: 143160, prefix: '₹', delta: '+18.9%', up: false, tone: 'coral' },
  { key: 'disc', label: 'Discounts', value: 403452, prefix: '₹', delta: '+6.3%', up: false, tone: 'coral' },
  { key: 'margin', label: 'Net Margin', value: 56.5, prefix: '', suffix: '%', decimals: 1, delta: '+1.0%', up: true, tone: 'mint' },
]

const ALERTS = [
  { tag: 'ACT NOW', tone: 'coral', text: 'Refund spike · Salt Lake · +63% vs last week' },
  { tag: 'REVIEW', tone: 'amber', text: 'FLAT175 burn up 18% — contribution falling' },
  { tag: 'OPPORTUNITY', tone: 'mint', text: 'Ad-day sales +1.0% · scale Tuesday campaigns' },
  { tag: 'ACT NOW', tone: 'coral', text: 'Zomato charges rose ₹14,320 · statement mismatch' },
]

const AI_LINES = [
  'Why did payout drop last week?',
  'Which coupon has the highest burn?',
  'Compare Zomato vs Swiggy margin',
]

const fmt = (v, k) => {
  const n = k.decimals ? Number(v.toFixed(k.decimals)) : Math.round(v)
  return `${k.prefix}${n.toLocaleString('en-IN', {
    minimumFractionDigits: k.decimals || 0,
    maximumFractionDigits: k.decimals || 0,
  })}${k.suffix || ''}`
}

const TONE = {
  mint: { text: 'text-mint', ring: 'border-mint/40', bg: 'bg-mint/10' },
  coral: { text: 'text-coral', ring: 'border-coral/40', bg: 'bg-coral/10' },
  amber: { text: 'text-amber', ring: 'border-amber/40', bg: 'bg-amber/10' },
}

// build a smooth path from points (Catmull-Rom → cubic bezier)
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

const W = 520
const H = 96
// deterministic seed series so render is pure; the live loop mutates a copy
const SEED = Array.from({ length: 24 }, (_, i) => 40 + Math.sin(i / 2.2) * 14 + ((i * 37) % 10))
const toPath = (arr) => smoothPath(arr.map((v, i) => [(i / (arr.length - 1)) * W, H - (v / 100) * H]))
const SEED_LINE = toPath(SEED)
const SEED_AREA = `${SEED_LINE} L ${W} ${H} L 0 ${H} Z`

export default function HeroDashboard({ boot = true }) {
  const root = useRef(null)
  const lineRef = useRef(null)
  const areaRef = useRef(null)
  const alertRef = useRef(null)
  const aiRef = useRef(null)
  const series = useRef(null)

  // boot sequence
  useGSAP(
    () => {
      if (!boot) return
      // paused timeline; `from` renders its start state immediately so the
      // stage sits hidden until the loader lifts
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      tl.fromTo(root.current, { opacity: 0, rotationX: 18, y: 60, z: -400 }, { opacity: 1, rotationX: 0, y: 0, z: 0, duration: 1.1, immediateRender: true })
        .from('.hd-top', { opacity: 0, y: -10, duration: 0.4 }, '-=0.5')
        .from('.hd-tile', { opacity: 0, y: 26, scale: 0.94, stagger: 0.07, duration: 0.5 }, '-=0.3')
        .from('.hd-chart', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
        .fromTo(lineRef.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' }, '-=0.1')
        .from(areaRef.current, { opacity: 0, duration: 0.6 }, '-=0.6')
        .from('.hd-ai', { opacity: 0, x: 16, duration: 0.5 }, '-=0.6')
      // count-ups ride on the same timeline
      gsap.utils.toArray('.hd-val').forEach((el, i) => {
        const k = KPIS[i]
        const o = { v: 0 }
        tl.to(o, { v: k.value, duration: 1.4, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(o.v, k)) }, 0.9 + i * 0.07)
      })
      const off = onLoaded(() => tl.delay(0.3).play())
      return () => off()
    },
    { scope: root, dependencies: [boot] },
  )

  // live loop: tick numbers, roll chart, rotate alerts, type AI question
  useEffect(() => {
    if (reducedMotion()) return undefined
    const vals = root.current.querySelectorAll('.hd-val')
    const timers = []

    const tick = setInterval(() => {
      // 1–2 random KPI nudges
      for (let n = 0; n < 2; n++) {
        const i = (Math.random() * KPIS.length) | 0
        const k = KPIS[i]
        const cur = parseFloat(vals[i].textContent.replace(/[^\d.]/g, '')) || k.value
        const drift = (Math.random() - 0.45) * (k.decimals ? 0.4 : k.value * 0.004)
        const next = Math.max(0, cur + drift)
        vals[i].textContent = fmt(next, k)
        vals[i].style.color = drift >= 0 ? '#2fd39a' : '#f0524e'
        timers.push(setTimeout(() => (vals[i].style.color = ''), 500))
      }
      // roll the sparkline
      if (!series.current) series.current = [...SEED]
      const s = series.current
      s.push(Math.min(96, Math.max(8, s[s.length - 1] + (Math.random() - 0.5) * 22)))
      s.shift()
      const d = toPath(s)
      lineRef.current.setAttribute('d', d)
      areaRef.current.setAttribute('d', `${d} L ${W} ${H} L 0 ${H} Z`)
    }, 900)

    let ai = 0
    let alertI = 0
    const cycleAlert = () => {
      const a = ALERTS[alertI++ % ALERTS.length]
      const el = alertRef.current
      el.innerHTML = `<span class="rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] ${TONE[a.tone].ring} ${TONE[a.tone].text} ${TONE[a.tone].bg}">${a.tag}</span><span class="text-[11px] text-ink">${a.text}</span>`
      gsap.fromTo(el, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' })
      timers.push(setTimeout(() => gsap.to(el, { x: 12, opacity: 0, duration: 0.4 }), 4200))
    }
    const typeAI = () => {
      const q = AI_LINES[ai++ % AI_LINES.length]
      const el = aiRef.current
      let i = 0
      el.textContent = ''
      const t = setInterval(() => {
        el.textContent = q.slice(0, ++i)
        if (i >= q.length) clearInterval(t)
      }, 42)
      timers.push(t)
    }
    const startLive = () => {
      cycleAlert()
      typeAI()
      timers.push(setInterval(cycleAlert, 5200))
      timers.push(setInterval(typeAI, 6400))
    }
    const off = boot ? onLoaded(() => timers.push(setTimeout(startLive, 2400))) : (startLive(), () => {})

    return () => {
      off()
      clearInterval(tick)
      timers.forEach((t) => {
        clearTimeout(t)
        clearInterval(t)
      })
    }
  }, [boot])

  return (
    <div
      ref={root}
      className="hd relative w-[min(92vw,640px)] rounded-[26px] border border-white/10 bg-[#0d1119]/95 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.65),0_0_0_1px_rgba(47,211,154,0.08),0_0_120px_rgba(47,211,154,0.12)] [transform-style:preserve-3d]"
    >
      {/* glass sweep */}
      <div className="hd-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
        <div className="absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* top bar */}
      <div className="hd-top flex items-center justify-between px-2 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">
            mynt<span className="text-mint">.</span>
          </span>
          <span className="text-[11px] text-mute">Command Centre</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-mint">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Live
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[9px] text-mute">Aug 3 – Aug 9</span>
        </div>
      </div>

      {/* tiles: raised layer for parallax */}
      <div className="grid grid-cols-3 gap-2 [transform:translateZ(28px)]">
        {KPIS.map((k) => (
          <div key={k.key} className="hd-tile rounded-xl border border-line bg-card/90 px-3 py-2.5">
            <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-mute">{k.label}</div>
            <div className="hd-val mt-1 text-[15px] font-bold tabular-nums text-ink md:text-lg">{fmt(0, k)}</div>
            <div className={`text-[10px] font-medium ${TONE[k.tone].text}`}>
              {k.up ? '↗' : '↘'} {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="hd-chart mt-2 rounded-xl border border-line bg-card/90 p-3 [transform:translateZ(14px)]">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink">Sales · last 24h</span>
          <span className="flex items-center gap-1 text-[9px] text-mute">
            <span className="h-0.5 w-3 rounded bg-mint" /> live
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full md:h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hd-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2fd39a" stopOpacity="0.28" />
              <stop offset="1" stopColor="#2fd39a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path ref={areaRef} d={SEED_AREA} fill="url(#hd-area)" />
          <path
            ref={lineRef}
            d={SEED_LINE}
            pathLength="1"
            strokeDasharray="1"
            fill="none"
            stroke="#2fd39a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* AI ask bar */}
      <div className="hd-ai mt-2 flex items-center gap-2 rounded-xl border border-mint/25 bg-mint/[0.06] px-3 py-2 [transform:translateZ(20px)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-mint">Ask Mynt</span>
        <span className="text-[11px] text-ink">
          <span ref={aiRef} />
          <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-mint align-middle" />
        </span>
      </div>

      {/* alert toast: floats above the panel */}
      <div
        ref={alertRef}
        className="glass absolute -top-7 right-6 flex items-center gap-2 whitespace-nowrap rounded-xl border border-line px-3 py-2 opacity-0 shadow-xl [transform:translateZ(60px)]"
      />
    </div>
  )
}
