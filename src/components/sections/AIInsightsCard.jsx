import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AnimatePresence, motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

// Live mock of the product's AI Insights panel. Rows stagger in after a short
// "analysing" shimmer; afterwards one row pulses every ~5s and a fresh
// opportunity slides in every ~9s (oldest drops) so the card never sits still.

const TONE = {
  act: { label: 'ACT NOW', dot: 'bg-coral', text: 'text-coral', bar: 'bg-coral', ring: 'border-coral/35', glow: 'rgba(240,82,78,0.35)', icon: '↘' },
  review: { label: 'REVIEW', dot: 'bg-amber', text: 'text-amber', bar: 'bg-amber', ring: 'border-amber/35', glow: 'rgba(245,166,35,0.35)', icon: '→' },
  opp: { label: 'OPPORTUNITY', dot: 'bg-mint', text: 'text-mint', bar: 'bg-mint', ring: 'border-mint/35', glow: 'rgba(47,211,154,0.35)', icon: '↗' },
}

const SEED = [
  { id: 1, tone: 'act', text: 'Overall Group order volume is down 10.0% vs the previous period.' },
  { id: 2, tone: 'act', text: 'Net payout for Group is down 5.9% vs the previous period.' },
  { id: 3, tone: 'review', text: 'Discounts for Group are up 6.3% — contribution is slipping.' },
  { id: 4, tone: 'opp', text: 'Average order value for Group is up 6.3%, now at ₹530 per order.' },
  { id: 6, tone: 'opp', text: 'Total platform charges for Group are down 3.9% vs the previous period.' },
]

const FRESH = [
  { tone: 'opp', text: 'Tuesday ad days return 1.6× — worth extending the campaign.' },
  { tone: 'act', text: 'Refund spike on Swiggy · Salt Lake — 3 complaints in 2 hours.' },
  { tone: 'review', text: 'FLAT175 now drives 18% of orders but only 9% of contribution.' },
  { tone: 'opp', text: 'Weekend AOV is ₹64 higher — push combos Fri–Sun.' },
]

function Row({ row, pulse }) {
  const t = TONE[row.tone]
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.3 } }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`lq-card relative overflow-hidden rounded-xl border bg-card/80 py-3 pl-4 pr-9 ${t.ring}`}
      style={pulse ? { boxShadow: `0 0 0 1px ${t.glow}, 0 0 28px ${t.glow}` } : undefined}
    >
      {/* tone bar draws down */}
      <motion.span
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`absolute inset-y-0 left-0 w-[3px] origin-top ${t.bar}`}
      />
      <div className="flex items-center gap-2">
        <span className={`text-xs ${t.text}`}>{t.icon}</span>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3, ease: 'backOut' }}
          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] ${t.ring} ${t.text}`}
        >
          {t.label}
        </motion.span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mt-1.5 text-[13px] leading-snug text-ink"
      >
        {row.text}
      </motion.p>
      <span className="absolute right-3 top-3.5 text-mute/70">⌄</span>
      {/* pulse sheen */}
      <AnimatePresence>
        {pulse && (
          <motion.span
            key="sheen"
            initial={{ x: '-120%' }}
            animate={{ x: '160%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export default function AIInsightsCard({ start }) {
  const cardRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle → scanning → live
  const [rows, setRows] = useState([])
  const [pulseId, setPulseId] = useState(null)
  const still = reducedMotion()

  // boot: scan shimmer, then rows stagger in
  useEffect(() => {
    if (!start) return undefined
    const timers = []
    if (still) {
      timers.push(setTimeout(() => { setPhase('live'); setRows(SEED) }, 0))
      return () => timers.forEach(clearTimeout)
    }
    timers.push(setTimeout(() => setPhase('scanning'), 0))
    timers.push(setTimeout(() => setPhase('live'), 900))
    SEED.forEach((r, i) => timers.push(setTimeout(() => setRows((prev) => [...prev, r]), 950 + i * 220)))
    return () => timers.forEach(clearTimeout)
  }, [start, still])

  // live loop: pulse a row every ~5s, add a fresh row every ~9s
  useEffect(() => {
    if (phase !== 'live' || still) return undefined
    let nextId = 100
    let fi = 0
    const pulse = setInterval(() => {
      setRows((prev) => {
        if (!prev.length) return prev
        const r = prev[(Math.random() * prev.length) | 0]
        setPulseId(r.id)
        setTimeout(() => setPulseId((cur) => (cur === r.id ? null : cur)), 1400)
        return prev
      })
    }, 5000)
    const fresh = setInterval(() => {
      setRows((prev) => {
        // pick the next fresh line that isn't already showing
        let f = null
        for (let k = 0; k < FRESH.length && !f; k++) {
          const cand = FRESH[(fi + k) % FRESH.length]
          if (!prev.some((r) => r.text === cand.text)) f = cand
        }
        fi += 1
        if (!f) return prev
        const next = [...prev, { id: nextId++, ...f }]
        return next.slice(Math.max(0, next.length - 6)) // hard cap: 6 visible
      })
    }, 9000)
    return () => {
      clearInterval(pulse)
      clearInterval(fresh)
    }
  }, [phase, still])

  // glassy cursor tilt
  const tilt = useRef(null)
  const getTilt = () => {
    if (!tilt.current && cardRef.current) {
      const o = { duration: 0.6, ease: 'power3.out' }
      tilt.current = {
        rx: gsap.quickTo(cardRef.current, 'rotationX', o),
        ry: gsap.quickTo(cardRef.current, 'rotationY', o),
      }
    }
    return tilt.current
  }
  const onMove = (e) => {
    if (still || !window.matchMedia('(pointer: fine)').matches) return
    const t = getTilt()
    if (!t) return
    const r = cardRef.current.getBoundingClientRect()
    t.rx(-((e.clientY - r.top) / r.height - 0.5) * 10)
    t.ry(((e.clientX - r.left) / r.width - 0.5) * 10)
  }
  const onLeave = () => {
    const t = getTilt()
    if (t) {
      t.rx(0)
      t.ry(0)
    }
  }

  return (
    <div className="[perspective:1400px]">
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="glass relative w-full max-w-sm rounded-3xl border border-white/10 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] [transform-style:preserve-3d]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* header */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 text-mint">✦</span>
          <span className="text-base font-semibold text-ink">AI Insights</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-mute">
          <span>Priority</span>
          {Object.values(TONE).map((t) => (
            <span key={t.label} className="flex items-center gap-1 normal-case tracking-normal">
              <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
              {t.label.charAt(0) + t.label.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        {/* proactive hero row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={start ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mt-4 overflow-hidden rounded-xl border border-mint/40 bg-gradient-to-br from-mint/15 via-mint/5 to-transparent px-4 py-3"
        >
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            animate={{ x: ['-130%', '180%'] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.6, ease: 'easeInOut', delay: 2 }}
          />
          <span className="rounded-full border border-mint/50 bg-bg/40 px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-mint">
            PROACTIVE
          </span>
          <p className="mt-1.5 text-[15px] font-semibold leading-tight text-ink">
            You didn't ask. Mynt still noticed.
          </p>
          <p className="mt-1 text-xs text-mute">
            Fresh insights land here every morning — no dashboard digging.
          </p>
        </motion.div>

        {/* scanning shimmer → rows */}
        <div className="mt-3 min-h-[564px]">{/* reserves the 6-row height so the reveal never shifts sections below */}
          <AnimatePresence mode="wait">
            {phase === 'scanning' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-mute">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                  Analysing 3 platforms · 3 outlets · 31 days…
                </div>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl border border-line bg-card/60" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {phase === 'live' && (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {rows.map((r) => (
                  <Row key={r.id} row={r} pulse={pulseId === r.id} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
