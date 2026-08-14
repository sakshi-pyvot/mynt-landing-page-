import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    title: 'Command Centre',
    line: 'Every platform, every outlet — one P&L view.',
    shot: '/shots/overview.jpg',
  },
  {
    title: 'Ads Intelligence',
    line: 'Spend vs sales, daily. Know what ads actually return.',
    shot: '/shots/ads-timeline.jpg',
  },
  {
    title: 'Refunds & Cancellations',
    line: 'Leakage caught early — before ratings fall.',
    shot: '/shots/refunds.jpg',
  },
  {
    title: 'Discount Intelligence',
    line: 'Which coupon actually pays. Stop the burn.',
    shot: '/shots/coupons.jpg',
  },
]

export default function ProductCanvas() {
  const root = useRef(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const shots = gsap.utils.toArray('.pc-shot')
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=2400',
            pin: true,
            scrub: 0.5,
            onUpdate: (self) => {
              const idx = Math.min(3, Math.floor(self.progress * 4))
              setActive((prev) => (prev === idx ? prev : idx))
            },
          },
        })
        shots.forEach((shot, i) => {
          if (i === 0) return
          tl.fromTo(
            shot,
            { clipPath: 'inset(100% 0 0 0)', yPercent: 6 },
            { clipPath: 'inset(0% 0 0 0)', yPercent: 0, duration: 1, ease: 'power2.inOut' },
            i,
          ).to(shots[i - 1], { yPercent: -4, scale: 0.985, duration: 1 }, i)
        })
      })
    },
    { scope: root },
  )

  return (
    <section id="product" ref={root} className="relative">
      {/* desktop: pinned scrub story */}
      <div className="hidden h-screen min-h-[700px] items-center md:flex">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,380px)_1fr] items-center gap-14 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mint">Product</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              One product. Every answer.
            </h2>
            <ul className="mt-10 space-y-6">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className={cn(
                    'border-l-2 pl-5 transition-all duration-300',
                    active === i ? 'border-mint opacity-100' : 'border-line opacity-40',
                  )}
                >
                  <div className="text-lg font-semibold">{s.title}</div>
                  <div className="mt-1 text-sm text-mute">{s.line}</div>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex gap-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    active === i ? 'w-8 bg-mint' : 'w-3 bg-line',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative aspect-[1280/743] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            {STEPS.map((s, i) => (
              <img
                key={s.shot}
                src={s.shot}
                alt={s.title}
                className="pc-shot absolute inset-0 h-full w-full object-cover object-top"
                style={i > 0 ? { clipPath: 'inset(100% 0 0 0)' } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* mobile: stacked cards */}
      <div className="space-y-10 px-5 py-20 md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mint">Product</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">One product. Every answer.</h2>
        </div>
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <img
              src={s.shot}
              alt={s.title}
              loading="lazy"
              className="rounded-xl border border-line"
            />
            <div className="mt-3 font-semibold">{s.title}</div>
            <div className="text-sm text-mute">{s.line}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
