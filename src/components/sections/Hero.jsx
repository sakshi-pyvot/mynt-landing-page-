import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion } from 'motion/react'
import Magnetic from '@/components/MagneticButton'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

function BgVideo({ src, className }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <video
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setOk(false)}
    />
  )
}

const CHIPS = [
  {
    label: 'NET PAYOUT',
    value: '₹6,76,171',
    delta: '↗ +3.2%',
    tone: 'text-mint',
    pos: 'left-[2%] top-[12%] md:-left-10 md:top-[18%]',
    delay: 0,
  },
  {
    label: 'NET MARGIN',
    value: '48.8%',
    delta: '↗ +1.2%',
    tone: 'text-mint',
    pos: 'right-[2%] top-[4%] md:-right-8 md:top-[8%]',
    delay: 0.6,
  },
  {
    label: 'ALERT · ZOMATO',
    value: 'Refund spike caught',
    delta: '2 min ago',
    tone: 'text-coral',
    pos: 'right-[6%] bottom-[6%] md:-right-12 md:bottom-[14%] hidden md:block',
    delay: 1.2,
  },
]

export default function Hero() {
  const root = useRef(null)
  // mount WebGL only on desktop viewports; fall back to static image if the
  // browser evicts the context (background tabs, GPU pressure)
  const [showCanvas, setShowCanvas] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    if (!showCanvas) return undefined
    let timer
    const onLost = () => {
      // R3F disposal (StrictMode/HMR) also fires this event — only fall back
      // if no healthy hero canvas remains shortly after
      clearTimeout(timer)
      timer = setTimeout(() => {
        const c = document.querySelector('.hero-stage canvas')
        const gl = c && (c.getContext('webgl2') || c.getContext('webgl'))
        if (!gl || gl.isContextLost()) setShowCanvas(false)
      }, 700)
    }
    window.addEventListener('webglcontextlost', onLost, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('webglcontextlost', onLost, true)
    }
  }, [showCanvas])

  useGSAP(
    () => {
      // entrance
      gsap.from('.hero-line', {
        yPercent: 110,
        stagger: 0.08,
        duration: 0.9,
        ease: 'power3.out',
        delay: 2.1, // after preloader wipe
      })
      gsap.from('.hero-sub, .hero-ctas', {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        delay: 2.6,
      })

      // scroll exit: camera-push feel — card scales past viewport, copy drifts up
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        })
        tl.to('.hero-stage', { scale: 1.45, yPercent: -12, opacity: 0, ease: 'power1.in' }, 0)
          .to('.hero-copy', { yPercent: -30, opacity: 0, ease: 'power1.in' }, 0)
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative min-h-screen overflow-hidden pt-[72px]">
      {/* V1 ambient video (drops in when generated) over dot field */}
      <div className="dot-field absolute inset-0" />
      <BgVideo
        src="/videos/hero-ambient.mp4"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-14 text-center md:pt-20">
        <div className="hero-copy">
          <div className="overflow-hidden">
            <p className="hero-line text-xs font-semibold uppercase tracking-[0.3em] text-mint">
              Mynt — by Pyvot
            </p>
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            <span className="block overflow-hidden">
              <span className="hero-line block">Your restaurant</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block">has the data.</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line text-gradient block pb-2">Mynt finds the money in it.</span>
            </span>
          </h1>
          <p className="hero-sub mx-auto mt-6 max-w-xl text-base text-mute md:text-lg">
            Connect marketplace, payout, discount, ad and outlet data — and turn it
            into decisions your team can act on.
          </p>
          <div className="hero-ctas mt-8 flex items-center justify-center gap-4">
            <Magnetic>
              <a
                href="#cta"
                className="inline-flex h-12 items-center rounded-full bg-mint px-7 font-semibold text-[#06251a] hover:shadow-[0_0_32px_rgba(47,211,154,0.5)]"
              >
                Book a Mynt Demo
              </a>
            </Magnetic>
            <a
              href="#data"
              className="inline-flex h-12 items-center rounded-full border border-line px-7 font-medium text-ink transition-colors hover:border-mint/60"
            >
              Explore Mynt
            </a>
          </div>
        </div>

        {/* stage: 3D card on desktop, static screenshot on mobile */}
        <div className="hero-stage relative mt-10 w-full max-w-4xl md:mt-4">
          <div className="mint-glow absolute inset-[-20%]" />
          {showCanvas ? (
            <div className="relative h-[520px]">
              <Suspense
                fallback={
                  <img
                    src="/shots/overview.jpg"
                    alt="Mynt dashboard"
                    className="mx-auto mt-14 w-[85%] rounded-xl border border-line"
                  />
                }
              >
                <HeroCanvas />
              </Suspense>
            </div>
          ) : (
            <img
              src="/shots/overview.jpg"
              alt="Mynt dashboard — gross order value, orders, payouts and platform comparison"
              className="relative rounded-xl border border-line shadow-[0_0_60px_rgba(47,211,154,0.15)]"
            />
          )}

          {/* KPI chips breaking out of the frame */}
          {CHIPS.map((c) => (
            <motion.div
              key={c.label}
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
              className={`glass absolute ${c.pos} rounded-xl border border-line px-4 py-3 text-left shadow-xl`}
            >
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-mute">
                {c.label}
              </div>
              <div className="mt-0.5 text-sm font-bold text-ink md:text-base">{c.value}</div>
              <div className={`text-[11px] font-medium ${c.tone}`}>{c.delta}</div>
            </motion.div>
          ))}
        </div>

        {/* scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-mute md:block"
        >
          Scroll
        </motion.div>
      </div>
    </section>
  )
}
