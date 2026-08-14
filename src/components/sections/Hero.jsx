import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion } from 'motion/react'
import Magnetic from '@/components/MagneticButton'
import { reducedMotion } from '@/lib/utils'

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
  const glowRef = useRef(null)
  const spotRef = useRef(null)
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

  // reactive edge glow + cursor spotlight (desktop pointers only)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined
    const glow = glowRef.current
    const spot = spotRef.current
    const aTo = gsap.quickTo(glow, '--edge-a', { duration: 0.9, ease: 'power3.out' })
    const oTo = gsap.quickTo(glow, '--edge-o', { duration: 0.5, ease: 'power2.out' })
    const mxTo = gsap.quickTo(spot, 'x', { duration: 0.7, ease: 'power3.out' })
    const myTo = gsap.quickTo(spot, 'y', { duration: 0.7, ease: 'power3.out' })

    let angle = 0
    let last = { x: innerWidth / 2, y: innerHeight / 2, t: performance.now() }
    let fadeTimer

    const onMove = (e) => {
      const r = root.current.getBoundingClientRect()
      if (e.clientY > r.bottom) return
      // continuous angle (no -180/180 snap): accumulate shortest delta
      const raw = (Math.atan2(e.clientY - r.height / 2, e.clientX - r.width / 2) * 180) / Math.PI
      let delta = raw - (((angle % 360) + 540) % 360) + 180
      delta = ((delta % 360) + 540) % 360 - 180
      angle += delta
      aTo(angle)

      // intensity follows cursor speed, decays back to calm
      const now = performance.now()
      const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y)
      const speed = dist / Math.max(now - last.t, 1)
      last = { x: e.clientX, y: e.clientY, t: now }
      oTo(Math.min(0.2 + speed * 0.35, 0.65))
      clearTimeout(fadeTimer)
      fadeTimer = setTimeout(() => oTo(0.2), 350)

      mxTo(e.clientX)
      myTo(e.clientY - r.top)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      clearTimeout(fadeTimer)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

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
      gsap.from('.hero-ctas', {
        opacity: 0,
        y: 24,
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
      {/* V1 ambient video over dot field */}
      <div className="dot-field absolute inset-0" />
      <BgVideo
        src="/videos/hero-ambient.mp4"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-transparent to-bg" />

      {/* cursor spotlight */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={spotRef}
          className="absolute -left-[560px] -top-[560px] h-[1120px] w-[1120px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(47,211,154,0.11), transparent 62%)',
          }}
        />
      </div>

      {/* reactive edge glow frame */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-20"
        style={{ '--edge-a': 0, '--edge-o': 0.2 }}
      >
        <div className="glow-ring absolute inset-0" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-12 text-center md:pt-16">
        <div className="hero-copy">
          <div className="overflow-hidden">
            <p className="hero-line text-xs font-semibold uppercase tracking-[0.3em] text-mint">
              Your restaurant has the data
            </p>
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            <span className="block overflow-hidden">
              <span className="hero-line text-gradient block pb-2">
                Mynt finds the money in it.
              </span>
            </span>
          </h1>
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

        {/* stage: physics canvas on desktop, static screenshot on mobile */}
        <div className="hero-stage relative mt-8 w-full max-w-4xl md:mt-2">
          <div className="mint-glow absolute inset-[-20%]" />
          {showCanvas ? (
            <div className="relative h-[560px]">
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
