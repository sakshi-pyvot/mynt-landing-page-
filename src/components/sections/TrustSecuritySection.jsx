import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Reveal, Eyebrow, GlowCard } from '@/components/ui'
import { reducedMotion } from '@/lib/utils'

const TRUST_PILLARS = [
  {
    id: 'assessed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Independently assessed',
    tag: 'CASA',
    body: 'Mynt undergoes recognised security assessments, including CASA, to validate the security of our application, infrastructure and data-handling practices.',
    highlight: 'Industry-standard, independent validation',
  },
  {
    id: 'encryption',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Encrypted end-to-end',
    tag: 'IN TRANSIT & AT REST',
    body: 'Sensitive data is protected with strong encryption in transit and at rest throughout its lifecycle.',
    highlight: 'Strong encryption across the full data lifecycle',
  },
  {
    id: 'access',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Strict access controls',
    tag: 'LEAST PRIVILEGE',
    body: 'Role-based permissions, least-privilege access and isolated customer environments ensure data is accessible only to authorised users and systems.',
    highlight: 'Role-based, isolated customer environments',
  },
  {
    id: 'protected',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Continuously protected',
    tag: '24×7 MONITORING',
    body: 'Security controls, monitoring, logging and vulnerability testing help protect Mynt against evolving threats.',
    highlight: 'Monitoring, logging & vulnerability testing',
  },
]

const TRUST_BADGES = ['CASA Assessed', 'Encrypted in Transit & at Rest', 'Role-Based Access', 'Continuous Security Monitoring']

// Orbiting satellites: lock, key, eye — the controls circling the data core
const ORBITERS = [
  {
    angle: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    angle: 120,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    angle: 240,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

const CIPHER_COLS = [
  { left: '12%', chars: 'A7•F2•9C•E1•4B•D8•03•6E', dur: 14 },
  { left: '84%', chars: '5D•B0•F7•22•9A•C4•E6•18', dur: 18 },
]

// Code-built vault animation: shield draws itself, radar rings breathe,
// security controls orbit the core, faint cipher streams drift behind.
function ShieldVisual() {
  const rm = reducedMotion()
  const box = useRef(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (rm) return undefined
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting))
    io.observe(box.current)
    return () => io.disconnect()
  }, [rm])

  const draw = rm
    ? { initial: { pathLength: 1 } }
    : {
        initial: { pathLength: 0 },
        whileInView: { pathLength: 1 },
        viewport: { once: false, margin: '9999px 0px -15% 0px' },
        transition: { duration: 1.4, ease: 'easeInOut' },
      }

  return (
    <div ref={box} className="relative mx-auto flex h-[340px] w-[340px] items-center justify-center" aria-hidden>
      {/* cipher streams */}
      {!rm &&
        CIPHER_COLS.map((c) => (
          <motion.div
            key={c.left}
            className="absolute top-0 h-full overflow-hidden font-mono text-[10px] leading-5 tracking-widest text-mint/25"
            style={{ left: c.left, writingMode: 'vertical-rl' }}
            animate={live ? { y: ['-30%', '30%'] } : {}}
            transition={{ duration: c.dur, repeat: Infinity, ease: 'linear' }}
          >
            {c.chars}•{c.chars}
          </motion.div>
        ))}

      {/* breathing radar rings */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-mint/25"
          style={{ inset: 28 + i * 34 }}
          animate={live && !rm ? { scale: [1, 1.12, 1], opacity: [0.5, 0.12, 0.5] } : { opacity: 0.3 }}
          transition={{ duration: 4, delay: i * 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* orbiting security controls (icons stay upright) */}
      <motion.div
        className="absolute inset-[46px]"
        animate={live && !rm ? { rotate: 360 } : {}}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      >
        {ORBITERS.map((o) => (
          <div
            key={o.angle}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `rotate(${o.angle}deg) translateY(-124px)` }}
          >
            <motion.span
              className="grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-mint/40 bg-bg text-mint shadow-[0_0_16px_rgba(47,211,154,0.3)]"
              style={{ rotate: -o.angle }}
              animate={live && !rm ? { rotate: -o.angle - 360 } : {}}
              transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
            >
              {o.icon}
            </motion.span>
          </div>
        ))}
      </motion.div>

      {/* core glow + shield */}
      <motion.div
        className="absolute h-40 w-40 rounded-full bg-mint/15 blur-3xl"
        animate={live && !rm ? { opacity: [0.5, 1, 0.5], scale: [0.9, 1.08, 0.9] } : { opacity: 0.6 }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative grid h-32 w-32 place-items-center rounded-full border border-mint/40 bg-bg/90 shadow-[0_0_50px_rgba(47,211,154,0.25)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14 text-mint">
          <motion.path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...draw} />
          <motion.path d="M9 12l2 2 4-4" {...draw} transition={{ ...draw.transition, delay: 0.5 }} />
        </svg>
      </div>
    </div>
  )
}

export default function TrustSecuritySection() {
  return (
    <section id="trust" className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
      {/* Background ambient shield glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.12),transparent_70%)]" />

      {/* Header + vault animation */}
      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Reveal>
            <Eyebrow>Enterprise-Grade Security</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Sensitive financial data <span className="text-gradient">deserves serious security.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-mute md:text-lg">
              Mynt handles some of the most sensitive data in your restaurant — revenue, payouts, costs, margins and operational performance. That is why security is built to enterprise standards, with rigorous controls and independent industry-standard security assessments.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <ShieldVisual />
        </Reveal>
      </div>

      {/* Security pillars (Glow Cards) */}
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {TRUST_PILLARS.map((pillar, i) => (
          <Reveal key={pillar.id} delay={(i % 4) * 0.06}>
            <GlowCard className="h-full flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-mint/20 bg-mint/5 p-2.5">
                    {pillar.icon}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mint/90 border border-mint/30 bg-mint/5 px-2 py-0.5 rounded">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{pillar.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mute">{pillar.body}</p>
              </div>

              <div className="mt-5 border-t border-line/50 pt-3 flex items-center gap-2 text-xs text-mint">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <span>{pillar.highlight}</span>
              </div>
            </GlowCard>
          </Reveal>
        ))}
      </div>

      {/* Trust strip / badges */}
      <Reveal delay={0.05}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {TRUST_BADGES.map((b) => (
            <span key={b} className="flex items-center gap-2 rounded-full border border-mint/30 bg-mint/5 px-4 py-2 text-xs font-medium text-ink">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-mint" aria-hidden>
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
              {b}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
