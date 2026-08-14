import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

function CinematicPanel() {
  const [videoOk, setVideoOk] = useState(true)
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden">
      {videoOk ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/restaurant.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      ) : (
        // fallback until the Higgsfield film lands: warm kitchen-light gradient
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(245,166,35,0.25),transparent_60%),radial-gradient(ellipse_at_75%_25%,rgba(240,82,78,0.16),transparent_55%)] bg-surface" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent" />
      <div className="absolute bottom-0 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber">Pyvot Experts</p>
        <h3 className="mt-2 text-2xl font-bold">Experts when you want acceleration.</h3>
        <p className="mt-2 max-w-sm text-sm text-mute">
          Strategy, marketplace growth, profitability and governance — executed by the
          team that has run it inside 100+ restaurants.
        </p>
        <a
          href="https://pyvot.in/"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center rounded-full border border-amber/50 px-6 text-sm font-medium text-amber transition-colors hover:bg-amber/10"
        >
          Meet Pyvot Experts
        </a>
      </div>
    </div>
  )
}

export default function ExpertsSplit() {
  const root = useRef(null)

  useGSAP(
    () => {
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.from('.split-left', {
          clipPath: 'inset(0 100% 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 30%', scrub: 0.5 },
        })
        gsap.from('.split-right', {
          clipPath: 'inset(0 0 0 100%)',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 30%', scrub: 0.5 },
        })
      })
    },
    { scope: root },
  )

  return (
    <section id="experts" ref={root} className="mx-auto max-w-7xl px-6 py-28">
      <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl">
        Technology when you want <span className="text-mint">control</span>.
        <br className="hidden md:block" /> Experts when you want{' '}
        <span className="text-amber">acceleration</span>.
      </h2>

      <div className="mt-14 grid overflow-hidden rounded-2xl border border-line md:grid-cols-2">
        <div className="split-left relative bg-surface">
          <div className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mint">Mynt</p>
            <h3 className="mt-2 text-2xl font-bold">Technology when you want control.</h3>
            <p className="mt-2 max-w-sm text-sm text-mute">
              Revenue, payouts, ads, discounts, refunds and alerts — every outlet,
              every platform, one intelligence layer.
            </p>
            <a
              href="#product"
              className="mt-5 inline-flex h-11 items-center rounded-full border border-mint/50 px-6 text-sm font-medium text-mint transition-colors hover:bg-mint/10"
            >
              Explore Mynt
            </a>
          </div>
          <img
            src="/shots/outlets-insights.jpg"
            alt="Mynt outlet performance and AI insights"
            loading="lazy"
            className="mt-2 w-full rounded-tl-xl border-l border-t border-line object-cover pl-8"
          />
        </div>
        <div className="split-right">
          <CinematicPanel />
        </div>
      </div>
    </section>
  )
}
