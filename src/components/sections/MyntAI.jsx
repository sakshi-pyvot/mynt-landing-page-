import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'

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
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.5 } },
}
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function MyntAI() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-25%' })
  const typed = useTypewriter(QUESTION, inView)
  const done = typed.length === QUESTION.length

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
            <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm border border-line bg-card px-4 py-3 text-sm">
              {typed}
              {!done && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-mint align-middle" />}
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={done ? 'show' : 'hidden'}
              className="w-full max-w-[95%] space-y-3 rounded-2xl rounded-bl-sm border border-mint/25 bg-surface px-4 py-4"
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

        {/* real AI insights panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="mint-glow absolute inset-[-30%]" />
          <img
            src="/shots/ai-insights.jpg"
            alt="Mynt AI Insights — prioritized findings: act now, review, opportunity"
            loading="lazy"
            className="relative rounded-2xl border border-line shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          />
        </motion.div>
      </div>
    </section>
  )
}
