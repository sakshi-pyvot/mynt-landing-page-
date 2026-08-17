import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'motion/react'
import AIInsightsCard from './AIInsightsCard'
import { reducedMotion } from '@/lib/utils'

const QUESTION = 'Why did payout drop last week?'

const DRIVERS = [
  { label: 'Coupon burn — FLAT175', value: '+18%', tone: 'text-coral' },
  { label: 'Platform charges — Zomato', value: '+₹14,320', tone: 'text-coral' },
  { label: 'Ad-day sales', value: '+1.0%', tone: 'text-mint' },
]

function useTypewriter(text, start, speed = 38) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!start) return undefined
    if (reducedMotion()) {
      const t = setTimeout(() => setOut(text), 0)
      return () => clearTimeout(t)
    }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
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
              <motion.p variants={item} className="text-sm text-ink">
                Net payout fell <span className="font-semibold text-coral">-4.1%</span> week-over-week.
                Three drivers explain it:
              </motion.p>
              {DRIVERS.map((d) => (
                <motion.div
                  key={d.label}
                  variants={item}
                  className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2 text-sm"
                >
                  <span className="text-mute">{d.label}</span>
                  <span className={`font-semibold ${d.tone}`}>{d.value}</span>
                </motion.div>
              ))}
              <motion.div
                variants={item}
                className="flex items-center gap-2 rounded-lg bg-mint/10 px-3 py-2 text-sm text-mint"
              >
                <span className="font-semibold">Next action:</span> pause FLAT175, shift budget to
                benchmark coupon.
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
