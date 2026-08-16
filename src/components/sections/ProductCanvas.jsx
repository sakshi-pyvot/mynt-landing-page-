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
    shot: '/shots/ads.jpg',
  },
  {
    title: 'Refunds & Cancellations',
    line: 'Leakage caught early — before ratings fall.',
    shot: '/shots/refunds.jpg',
  },
  {
    title: 'Discount Intelligence',
    line: 'Which coupon actually pays. Stop the burn.',
    shot: '/shots/discounts.jpg',
  },
]

export default function ProductCanvas() {
  const root = useRef(null)
  const stepRef = useRef(0)
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
              if (idx === stepRef.current) return
              stepRef.current = idx
              setActive(idx)
              // step change: pulse the frame glow
              gsap.fromTo(
                '.pc-frame',
                { boxShadow: '0 0 160px rgba(47,211,154,0.42), 0 24px 80px rgba(0,0,0,0.5)' },
                {
                  boxShadow: '0 0 120px rgba(47,211,154,0.18), 0 24px 80px rgba(0,0,0,0.5)',
                  duration: 0.8,
                  ease: 'power2.out',
                  overwrite: true,
                },
              )
            },
          },
        })
        // timeline spans 4 units so shot i reveals at progress i/4 — matches
        // the active-step math in onUpdate
        shots.forEach((shot, i) => {
          if (i === 0) return
          tl.fromTo(
            shot,
            { clipPath: 'inset(100% 0 0 0)', yPercent: 6 },
            { clipPath: 'inset(0% 0 0 0)', yPercent: 0, duration: 0.6, ease: 'power2.inOut' },
            i,
          ).to(shots[i - 1], { yPercent: -4, scale: 0.985, duration: 0.6 }, i)
        })
        tl.to({}, { duration: 1 }, 3) // hold last shot for the final quarter
      })
    },
    { scope: root },
  )

  return (
    <section id="product" ref={root} className="relative overflow-hidden">
      {/* desktop: pinned scrub story */}
      <div className="dot-field relative hidden h-screen min-h-[700px] items-center md:flex">
        {/* ambient glow field behind the product frame */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute right-[-10%] top-[10%] h-[70vh] w-[55vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.16),transparent_65%)] blur-2xl"
            animate={{ x: [0, -40, 20, 0], y: [0, 30, -20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-10%] right-[20%] h-[50vh] w-[35vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.10),transparent_65%)] blur-2xl"
            animate={{ x: [0, 30, -30, 0], y: [0, -25, 15, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,380px)_1fr] items-center gap-14 px-6">
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

          <div className="pc-frame relative aspect-[1280/743] overflow-hidden rounded-2xl border border-mint/25 bg-surface shadow-[0_0_120px_rgba(47,211,154,0.18),0_24px_80px_rgba(0,0,0,0.5)]">
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
