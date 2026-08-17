import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'motion/react'
import AIInsightsCard from './AIInsightsCard'
import { reducedMotion } from '@/lib/utils'

const QUESTION = 'Which outlet is hurting profitability the most?'

// pp = percentage points vs brand average; width = relative bar length
const DRIVERS = [
  { label: 'Discount burn', where: 'Salt Lake', value: '+3.8 pp', width: 52, tone: 'text-coral', bar: 'bg-coral' },
  { label: 'Ad spend', where: 'Salt Lake', value: '+2.4 pp', width: 34, tone: 'text-amber', bar: 'bg-amber' },
  { label: 'Net payout gap vs brand', where: '', value: '−7.5 pp', width: 100, tone: 'text-coral', bar: 'bg-coral' },
]

// human-paced typing: ~75ms/char with jitter, a small pause before the first
// key and a slightly longer one after the space that starts the last word
function useTypewriter(text, start, speed = 75) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!start) return undefined
    if (reducedMotion()) {
      const t = setTimeout(() => setOut(text), 0)
      return () => clearTimeout(t)
    }
    let i = 0
    let t
    const tick = () => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) return
      const ch = text[i - 1]
      const pause = ch === ' ' ? speed * 1.6 : speed
      t = setTimeout(tick, pause + (Math.random() - 0.5) * speed * 0.6)
    }
    t = setTimeout(tick, 500)
    return () => clearTimeout(t)
  }, [text, start, speed])
  return out
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
}
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function MyntAI() {
  const ref = useRef(null)
  const [start, setStart] = useState(false)
  const [answer, setAnswer] = useState(false)
  const typed = useTypewriter(QUESTION, start)
  const done = typed.length === QUESTION.length

  // ScrollTrigger is the page's scroll source of truth (Lenis + pins) — fire the
  // sequence the moment the section is really on screen, once
  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 62%',
        once: true,
        onEnter: () => setStart(true),
      })
    },
    { scope: ref },
  )

  // question done → brief "thinking" → answer
  useEffect(() => {
    if (!done) return undefined
    const t = setTimeout(() => setAnswer(true), reducedMotion() ? 0 : 900)
    return () => clearTimeout(t)
  }, [done])

  return (
    <section id="ai" ref={ref} className="relative mx-auto max-w-7xl px-6 py-28 md:py-36">
      <div className="grid items-center gap-14 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mint">Mynt AI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Don't search through dashboards.{' '}
            <span className="text-gradient">Ask Mynt.</span>
          </h2>

          {/* chat mock */}
          <div className="mt-10 space-y-4">
            <div className="ml-auto flex min-h-[46px] w-fit max-w-[90%] items-center rounded-2xl rounded-br-sm border border-line bg-card px-4 py-3 text-sm">
              {typed}
              {start && !done && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-mint align-middle" />
              )}
              {!start && <span className="text-mute/60">Ask anything…</span>}
            </div>

            <AnimatePresence>
              {done && !answer && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
                  className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm border border-mint/25 bg-surface px-4 py-3"
                >
                  <span className="text-xs text-mute">Mynt is thinking</span>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-mint"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={answer ? 'show' : 'hidden'}
              className={`w-full max-w-[95%] space-y-3 rounded-2xl rounded-bl-sm border border-mint/25 bg-surface px-4 py-4 ${answer ? '' : 'invisible absolute'}`}
            >
              {/* header: outlet chip + finding */}
              <motion.div variants={item} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-coral">
                  SALT LAKE
                </span>
                <p className="text-sm text-ink">
                  has the weakest profitability this month — three drivers explain it:
                </p>
              </motion.div>

              {/* stat pair with comparison bar */}
              <motion.div variants={item} className="rounded-xl border border-line bg-card px-3 py-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-mute">Net payout · Salt Lake</div>
                    <div className="text-xl font-bold text-coral">46.2%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-mute">Brand average</div>
                    <div className="text-xl font-bold text-mint">53.7%</div>
                  </div>
                </div>
                <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={answer ? { width: '53.7%' } : { width: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-mint/40"
                  />
                  <motion.span
                    initial={{ width: 0 }}
                    animate={answer ? { width: '46.2%' } : { width: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-coral"
                  />
                </div>
              </motion.div>

              {/* drivers with mini bars */}
              {DRIVERS.map((d, i) => (
                <motion.div
                  key={d.label}
                  variants={item}
                  className="rounded-lg border border-line bg-card px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-mute">
                      <span className="mr-1.5 text-[10px] font-semibold text-mute/70">{i + 1}</span>
                      {d.label}
                      {d.where && <span className="text-mute/60"> · {d.where}</span>}
                    </span>
                    <span className={`font-semibold tabular-nums ${d.tone}`}>{d.value}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line/60">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={answer ? { width: `${d.width}%` } : { width: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.9 + i * 0.15 }}
                      className={`block h-full rounded-full ${d.bar}`}
                    />
                  </div>
                </motion.div>
              ))}

              <motion.div
                variants={item}
                className="flex items-start gap-2 rounded-lg bg-mint/10 px-3 py-2 text-sm text-mint"
              >
                <span className="shrink-0 font-semibold">Next action:</span>
                <span>Reduce discount burn and optimise ad spend specifically for the Salt Lake outlet.</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* live AI insights panel */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="mint-glow pointer-events-none absolute inset-[-30%]" />
          <div className="relative">
            <AIInsightsCard start={start} />
          </div>
        </div>
      </div>
    </section>
  )
}
