import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

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

export default function DetectChain() {
  const root = useRef(null)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.chain-path',
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top 75%',
              end: 'bottom 55%',
              scrub: 0.5,
            },
          },
        )
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

      <div className="relative mt-16">
        {/* connecting line behind cards */}
        <svg
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          className="absolute left-0 top-1/2 hidden h-14 w-full -translate-y-1/2 md:block"
        >
          <path
            className="chain-path"
            d="M 20 30 C 180 -10, 320 70, 500 30 C 680 -10, 820 70, 980 30"
            pathLength="1"
            strokeDasharray="1"
            fill="none"
            stroke="#2fd39a"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </svg>

        <div className="relative grid gap-6 md:grid-cols-3">
          {STAGES.map((s, i) => (
            <div
              key={s.tag}
              className="chain-card rounded-2xl border border-line bg-card p-6"
            >
              <span
                className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${s.tone}`}
              >
                {i + 1} · {s.tag}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-ink">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
