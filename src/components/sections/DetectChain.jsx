import { Fragment, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const STAGES = [
  {
    tag: 'Detect',
    tone: 'text-coral border-coral/40',
    text: 'Salt Lake has the weakest profitability at 46.2% net payout vs 53.7% brand average.',
  },
  {
    tag: 'Explain',
    tone: 'text-amber border-amber/40',
    text: 'Main drivers: discount burn +3.8 pp and ad spend +2.4 pp.',
  },
  {
    tag: 'Act',
    tone: 'text-mint border-mint/40',
    text: 'Pause FLAT175 and reduce weekday ad spend for the Salt Lake outlet.',
  },
]

// the physical link between two stages: a drawn line with a pulse travelling
// down the chain — vertical when stacked, horizontal on md+
function ChainLink({ index }) {
  const rm = reducedMotion()
  return (
    <div className="relative mx-auto h-10 w-px shrink-0 md:mx-0 md:h-px md:w-14 md:self-center" aria-hidden>
      <span className="chain-line absolute inset-0 origin-top bg-gradient-to-b from-mint/70 via-mint/30 to-mint/70 md:origin-left md:bg-gradient-to-r" />
      {!rm && (
        <>
          <motion.span
            className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mint shadow-[0_0_10px_rgba(47,211,154,0.9)] md:hidden"
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.7, repeatDelay: 0.6 }}
          />
          <motion.span
            className="absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-mint shadow-[0_0_10px_rgba(47,211,154,0.9)] md:block"
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.7, repeatDelay: 0.6 }}
          />
        </>
      )}
    </div>
  )
}

export default function DetectChain() {
  const root = useRef(null)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.chain-card', {
          opacity: 0,
          y: 40,
          stagger: 0.25,
          scrollTrigger: {
            trigger: root.current,
            start: 'top 70%',
            end: 'bottom 55%',
            scrub: 0.5,
          },
        })
        gsap.from('.chain-line', {
          scaleX: 0,
          scaleY: 0,
          stagger: 0.3,
          scrollTrigger: {
            trigger: root.current,
            start: 'top 65%',
            end: 'bottom 55%',
            scrub: 0.5,
          },
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative mx-auto max-w-6xl px-6 py-28">
      <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl">
        Not another dashboard. <span className="text-mint">A decision chain.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-center text-mute">
        Mynt detects the anomaly, explains the drivers, and recommends the action.
      </p>

      <div className="mt-16 md:flex md:items-stretch">
        {STAGES.map((s, i) => (
          <Fragment key={s.tag}>
            {i > 0 && <ChainLink index={i - 1} />}
            <div className="chain-card relative rounded-2xl border border-line bg-card p-6 md:flex-1">
              {/* connector ports on the card edges */}
              {i > 0 && (
                <span
                  className="absolute left-0 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/60 bg-bg md:block"
                  aria-hidden
                />
              )}
              {i < STAGES.length - 1 && (
                <span
                  className="absolute right-0 top-1/2 hidden h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full border border-mint/60 bg-bg md:block"
                  aria-hidden
                />
              )}
              <span
                className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${s.tone}`}
              >
                {i + 1} · {s.tag}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-ink">{s.text}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}
