import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { motion } from 'motion/react'
import Magnetic from '@/components/MagneticButton'
import HeroDashboard from './HeroDashboard'
import { reducedMotion } from '@/lib/utils'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

const HEADLINE = ['Mynt', 'finds', 'the', 'money', 'in', 'it.']

export default function Hero() {
  const root = useRef(null)
  const stageRef = useRef(null)
  const glowRef = useRef(null)
  const spotRef = useRef(null)
  const [desktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  const [showCanvas, setShowCanvas] = useState(desktop)

  // WebGL fallback: drop the particle canvas if the browser evicts the context
  useEffect(() => {
    if (!showCanvas) return undefined
    let timer
    const onLost = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const c = document.querySelector('.hero-canvas canvas')
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

  // cursor-driven: stage spring tilt, edge arc, spotlight
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined
    const stage = stageRef.current
    const glow = glowRef.current
    const spot = spotRef.current

    // resting pose has a deliberate 3D lean; cursor adds ±7° on top
    const REST_X = 8
    const REST_Y = -12
    const rxTo = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'elastic.out(1, 0.55)' })
    const ryTo = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'elastic.out(1, 0.55)' })
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
      const nx = (e.clientX / innerWidth) * 2 - 1
      const ny = (e.clientY / innerHeight) * 2 - 1
      rxTo(REST_X - ny * 7)
      ryTo(REST_Y + nx * 7)

      const raw = (Math.atan2(e.clientY - r.height / 2, e.clientX - r.width / 2) * 180) / Math.PI
      let delta = raw - (((angle % 360) + 540) % 360) + 180
      delta = ((delta % 360) + 540) % 360 - 180
      angle += delta
      aTo(angle)

      const now = performance.now()
      const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(now - last.t, 1)
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
      // headline: word by word, blur → sharp; mint word lands last with a pop
      gsap.from('.hw', {
        opacity: 0,
        y: 28,
        filter: 'blur(10px)',
        stagger: 0.09,
        duration: 0.8,
        ease: 'power3.out',
        delay: 2.05,
      })
      gsap.from('.hero-eyebrow, .hero-sub, .hero-ctas', {
        opacity: 0,
        y: 16,
        stagger: 0.12,
        duration: 0.6,
        ease: 'power2.out',
        delay: 2.5,
      })
      // scroll cue: enter with the ctas, leave as soon as the user scrolls
      gsap.from('.scroll-cue', { opacity: 0, y: 8, duration: 0.6, delay: 3.0 })
      gsap.to('.scroll-cue', {
        opacity: 0,
        y: 8,
        duration: 0.35,
        scrollTrigger: { start: 40, end: 120, scrub: true },
      })
      // glass sweep across the dashboard every ~8s
      gsap.to('.hd-sweep > div', { x: '380%', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 6.5, delay: 4.5 })

      // scroll exit: camera push — stage grows past the viewport, copy drifts up
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
        })
        tl.to('.hero-stage-wrap', { scale: 1.5, xPercent: 8, yPercent: -10, opacity: 0, ease: 'power1.in' }, 0)
          .to('.hero-copy', { yPercent: -30, opacity: 0, ease: 'power1.in' }, 0)
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative min-h-screen overflow-hidden pt-[72px]">
      {/* single ambient idea: the particle field (denser near the product) */}
      {showCanvas && (
        <div className="hero-canvas absolute inset-0">
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg" />

      {/* cursor spotlight */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={spotRef}
          className="absolute -left-[560px] -top-[560px] h-[1120px] w-[1120px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(47,211,154,0.10), transparent 62%)' }}
        />
      </div>

      {/* reactive edge arc */}
      <div ref={glowRef} className="pointer-events-none absolute inset-0 z-20" style={{ '--edge-a': 0, '--edge-o': 0.2 }}>
        <div className="glow-ring absolute inset-0" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-6 py-12 md:grid-cols-[minmax(0,42%)_1fr] md:py-0">
        {/* copy: left, asymmetric */}
        <div className="hero-copy relative z-10">
          <p className="hero-eyebrow text-xs font-semibold uppercase tracking-[0.3em] text-mint">
            Your restaurant has the data
          </p>
          <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.02] tracking-tight md:text-[3.9rem] xl:text-[4.4rem]">
            <span className="block whitespace-nowrap">
              {HEADLINE.slice(0, 3).map((w, i) => (
                <span key={i} className="hw inline-block">
                  {w}&nbsp;
                </span>
              ))}
            </span>
            <span className="block whitespace-nowrap">
              {HEADLINE.slice(3).map((w, i) => (
                <span key={i} className="hw text-gradient inline-block pb-1">
                  {w}
                  {i < 2 && ' '}
                </span>
              ))}
            </span>
          </h1>
          <p className="hero-sub mt-6 max-w-md text-base text-mute md:text-lg">
            Marketplace, payout, ad and discount data — unified, explained, and turned into
            the next action.
          </p>
          <div className="hero-ctas mt-8 flex flex-wrap items-center gap-4">
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

        {/* stage: right, bleeds off the edge, CSS-3D lean + spring follow */}
        <div className="hero-stage-wrap relative md:-mr-[4vw] md:justify-self-end [perspective:1600px]">
          <div className="mint-glow pointer-events-none absolute inset-[-25%]" />
          <div
            ref={stageRef}
            className="relative [transform-style:preserve-3d]"
            style={desktop ? { transform: 'rotateX(8deg) rotateY(-12deg)' } : undefined}
          >
            <HeroDashboard boot />
            {/* floating chips off the bezel, at different depths */}
            <div className="glass absolute -left-14 top-[30%] hidden rounded-xl border border-line px-3 py-2 shadow-xl [transform:translateZ(90px)] md:block">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-mute">Net Margin</div>
              <div className="text-sm font-bold text-ink">56.5% <span className="text-mint text-[10px] font-medium">↗ +1.0%</span></div>
            </div>
            <div className="glass absolute -bottom-9 left-[6%] hidden rounded-xl border border-line px-3 py-2 shadow-xl [transform:translateZ(70px)] md:block">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-mute">Outlets</div>
              <div className="text-sm font-bold text-ink">40 <span className="text-[10px] font-medium text-mute">synced</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* scroll cue: mouse pill with a dropping wheel dot; fades once the user scrolls */}
      <a
        href="#data"
        aria-label="Scroll to explore"
        className="scroll-cue absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        {/* iOS-style chevron: drops, warms to mint as it lands, soft pulse ring on the hit */}
        <span className="relative flex h-12 w-12 items-center justify-center">
          <motion.span
            className="absolute bottom-0 h-8 w-8 rounded-full bg-mint/40"
            style={{ filter: 'blur(6px)' }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 0.4, 1.6], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', times: [0, 0.6, 1] }}
            aria-hidden
          />
          <motion.svg
            viewBox="0 0 24 24"
            className="relative h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              y: [-6, 8, 8, -6],
              color: ['#8f99a8', '#8f99a8', '#7ff0c7', '#8f99a8'],
              opacity: [0.35, 1, 1, 0.35],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.55, 0.7, 1] }}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
        </span>
      </a>
    </section>
  )
}
