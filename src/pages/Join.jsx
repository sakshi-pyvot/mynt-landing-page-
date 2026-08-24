import { useState } from 'react'
import { motion } from 'motion/react'
import { Button, CountUp, Eyebrow, GlowCard, InteractiveCard, Reveal, Section, SectionHead } from '@/components/ui'
import VideoLoop from '@/components/VideoLoop'
import { submitForm, STATUS_TEXT } from '@/lib/forms'
import { cn, reducedMotion } from '@/lib/utils'

const BUILDING = [
  {
    title: 'Mynt — The Restaurant Intelligence Layer',
    badge: 'SAAS PRODUCT',
    d: 'A unified financial and intelligence platform: automated statement ingestion, P&L reconciliation, deduction waterfalls, anomaly detection, and LLM-driven driver analysis.',
    tags: ['React 19', 'Vite', 'FastAPI', 'PostgreSQL', 'LLM Agentic RAG'],
  },
  {
    title: 'Growth & Margin Operating System',
    badge: 'SCALE INFRASTRUCTURE',
    d: 'Data benchmarks, bid algorithms, and weekly operating rhythms that turn one outlet’s profitability breakthrough into a repeatable blueprint for 250+ brands.',
    tags: ['ROAS Algorithms', 'Discount Optimization', 'Benchmark Ledgers'],
  },
  {
    title: 'Hands-On Operator Advisory',
    badge: 'MARKETPLACE EXPERTS',
    d: 'Direct execution on Zomato, Swiggy, and dining channels. We visit kitchen floors, analyze delivery radiuses, and run menu experiments directly with founders.',
    tags: ['Aggregator Growth', 'Dining Experience', 'Unit Economics'],
  },
]

const PRINCIPLES = [
  {
    title: 'Own the Outcome, Not the Ticket',
    desc: 'You take a business metric (net margin, ingestion accuracy, ROAS), not a generic task. If the number doesn’t move, the code or slide didn’t matter.',
    quote: '“Measure on rupees moved, not tickets closed.”',
  },
  {
    title: 'Stay Close to the Kitchen Pass',
    desc: 'Consultants visit kitchens; engineers inspect real aggregator PDF statements. Everyone on the team knows what a Friday dinner rush and a 20% platform deduction feels like.',
    quote: '“Software built for operators by people who know service hours.”',
  },
  {
    title: 'Data & Charts Beat Opinion',
    desc: 'Bring the structured query and the distribution chart. Loudness is never a substitute for empirical evidence.',
    quote: '“If we have data, let’s look at data. If all we have are opinions, let’s go with data.”',
  },
  {
    title: 'High-Velocity Cadence',
    desc: 'Weekly ship cycles, short feedback loops, rapid prototype validation. A week lost in food-tech is a week you never get back.',
    quote: '“Ship, test with 5 brands on Monday, deploy to 250 by Friday.”',
  },
  {
    title: 'Obsessive Craft in the Details',
    desc: 'From a micro-interaction on a dashboard tile to SQL indexing and copy nuance — either done properly or not at all.',
    quote: '“The details are not the details. They make the product.”',
  },
]

const ROLES = [
  {
    id: 'senior-full-stack',
    title: 'Senior Full Stack Software Developer',
    fn: 'Engineering',
    loc: 'Kolkata (Work from Office)',
    type: 'Full-time',
    equity: 'CTC: ₹18–30 LPA · ESOPs Included',
    summary: 'We’re looking for a top-tier Senior Full Stack Software Developer to take complete ownership of the product — from creating the user interface to managing the complex data running behind the scenes. You’ll be the trusted technical owner of our software, making key design decisions and building features from start to finish.',
    aiFirst: 'AI-First Engineering Team: We actively use Cursor, Claude, and Gemini to code smarter, boosting team efficiency by 3–5x!',
    tech: ['Node.js', 'React', 'PostgreSQL', 'AWS', 'Cursor / Claude / Gemini'],
    bullets: [
      'Take complete technical ownership of the product from UI to complex data running behind the scenes',
      'Make key architecture and system design decisions, building features from start to finish',
      'Work in an AI-first engineering environment (Cursor, Claude, Gemini) to ship 3–5x faster',
      'Build scalable backend services in Node.js, design PostgreSQL schemas, and deploy on AWS cloud',
    ],
  },
]

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Application & Profile Review',
    duration: '24–48 Hours',
    desc: 'We review what you’ve built and shipped. A live GitHub, portfolio, or code walkthrough matters far more than a corporate resume.',
  },
  {
    step: '02',
    title: 'First Alignment Conversation',
    duration: '30 Minutes · In-Person/Video',
    desc: 'An informal discussion with the founders to understand your technical philosophy, problem-solving approach, and ambition.',
  },
  {
    step: '03',
    title: 'Practical Technical Assessment',
    duration: 'Hands-on / Take-Home',
    desc: 'A real-world engineering challenge you’d solve at Pyvot — architecting an end-to-end full-stack feature using modern tools.',
  },
  {
    step: '04',
    title: 'Team & In-Office Deep Dive',
    duration: '60 Minutes · Kolkata Office',
    desc: 'Meet the engineering team at our Sector V office, discuss system trade-offs, review architecture, and experience our work culture.',
  },
  {
    step: '05',
    title: 'Formal Offer & Roadmap',
    duration: 'Within 48 Hours',
    desc: 'Competitive compensation (₹18–30 LPA), ESOPs allocation, top-spec hardware setup, and your immediate milestone roadmap.',
  },
]

const PERKS = [
  {
    t: 'Real Industry Exposure',
    d: 'Work close to the restaurant business — through client reviews, restaurant visits, menu and performance discussions, and real operating problems. You learn how F&B businesses actually grow, make money, and make decisions.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-mint">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  },
  {
    t: 'High-Ownership Roles',
    d: 'Take meaningful responsibility early. You will work on real business problems, make decisions, execute ideas, and see the impact of your work directly on restaurant brands and internal products.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-mint">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  {
    t: 'Kolkata HQ — Sector V',
    d: 'We work closely, move fast, and solve problems together from our Kolkata office. Being in the same room helps us learn faster, collaborate better, and stay connected to the restaurants and teams we work with.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-mint">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
]

// Floating square motion-graphic card ("SHARE YOUR WORK" Jitter loop). Pure black
// video on the black page bg, so only the glow + rim separate it — same motion
// language as ContactHeroVideo: spring entry, gentle infinite float, glow blobs.
function HeroSceneCard() {
  const [still] = useState(() => reducedMotion())

  return (
    <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[420px]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-14 rounded-full bg-[radial-gradient(ellipse_at_35%_30%,rgba(47,211,154,0.25),transparent_60%)] blur-3xl"
        animate={still ? undefined : { rotate: [0, 30, 0], scale: [1, 1.12, 1] }}
        transition={still ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-14 rounded-full bg-[radial-gradient(ellipse_at_70%_70%,rgba(56,189,248,0.14),transparent_60%)] blur-3xl"
        animate={still ? undefined : { rotate: [0, -25, 0], scale: [1.1, 1, 1.1] }}
        transition={still ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="relative"
      >
        <motion.div
          animate={still ? undefined : { y: [0, -10, 0] }}
          transition={still ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* glass shell: gradient ring + specular over the footage, copy as crisp HTML
              (the old clip baked the typography and stock photos into the video) */}
          <div className="lq relative aspect-square overflow-hidden rounded-3xl border border-white/15 shadow-[0_40px_80px_rgba(0,0,0,0.55)]">
            <VideoLoop
              src="/videos/scene.mp4"
              poster="/videos/scene-poster.jpg"
              label="Portfolio of aggregator, dining, social and tech work spread on a desk"
              className="absolute inset-0"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/25 to-bg/30" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between px-8 py-9 text-center">
              <span aria-hidden />
              <span className="text-[44px] font-black uppercase leading-[0.92] tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] md:text-5xl">
                Share
                <br />
                your
                <br />
                work
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                Pyvot · contact@pyvot.in
              </span>
            </div>
          </div>
        </motion.div>

        <div
          className="pointer-events-none mx-auto mt-4 h-8 w-[70%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.2),transparent_70%)] blur-md"
          aria-hidden
        />
      </motion.div>
    </div>
  )
}

export default function Join() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].title)
  const [status, setStatus] = useState('idle')

  const handleApplyClick = (roleTitle) => {
    setSelectedRole(roleTitle)
    const formEl = document.getElementById('apply')
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const role = new FormData(form).get('role') || 'General Application'
    setStatus('sending')
    const res = await submitForm(form, `Application — ${role}`)
    setStatus(res)
    if (res === 'sent' && form.isConnected) {
      form.reset()
      setSelectedRole('')
    }
  }

  return (
    <>
      {/* Animated Careers Hero — headline beside the "SHARE YOUR WORK" motion graphic */}
      <section className="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-20">
        <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="mint-glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <Eyebrow>Join the Pyvot Team</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Build the intelligence layer for{' '}
                <span className="text-gradient">
                  <CountUp value="250+" /> restaurant brands.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute md:text-xl">
                We are operators, engineers, and growth strategists solving one of the largest unorganized data problems in food-tech. Based in Sector V, Kolkata — working with top culinary brands across India.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-9">
              <div className="flex flex-wrap items-center gap-3">
                <Button to="#open-positions" size="lg">
                  View Open Positions ({ROLES.length})
                </Button>
                <Button to="#why-join" variant="ghost" size="lg">
                  Why Join Pyvot ↓
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <HeroSceneCard />
          </Reveal>
        </div>
      </section>

      {/* What We're Building (Bento Grid) */}
      <Section id="why-join" tight className="pt-0">
        <SectionHead
          eyebrow="Our Mission & Focus"
          title="What we are building every day."
          lede="Three interconnected pillars powering restaurant growth from the ground up."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {BUILDING.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08}>
              <InteractiveCard className="h-full p-7 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mint border border-mint/30 bg-mint/5 px-2.5 py-0.5 rounded">
                    {b.badge}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-ink">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mute">{b.d}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-line/60">
                  {b.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-bg/80 border border-line/80 px-2 py-0.5 font-mono text-[11px] text-mute">
                      {tag}
                    </span>
                  ))}
                </div>
              </InteractiveCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Operating Principles / How We Work */}
      <Section tight>
        <SectionHead
          eyebrow="Culture & Philosophy"
          title="How we work: the five operating tenets."
          lede="We keep teams lean, high-autonomy, and obsessed with practical impact."
        />

        {/* 3 + 2 layout: no orphan slot — bottom pair widens to fill the row */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {PRINCIPLES.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 0.05}
              className={cn(i < 3 ? 'lg:col-span-2' : 'lg:col-span-3', i === 4 && 'md:max-lg:col-span-2')}
            >
              <GlowCard className="h-full p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-mint">0{i + 1}</span>
                    <span className="h-2 w-2 rounded-full bg-mint" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-mute">{p.desc}</p>
                </div>

                <blockquote className="mt-4 rounded-xl border border-line/60 bg-bg/50 p-3 font-mono text-[11px] text-mint italic">
                  {p.quote}
                </blockquote>
              </GlowCard>
            </Reveal>
          ))}
        </div>

        {/* Perks & Life at Pyvot */}
        {/* TODO(asset): office/tasting candid photos */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PERKS.map((item, i) => (
            <Reveal key={item.t} delay={i * 0.06}>
              <InteractiveCard className="h-full bg-card/50">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/[0.08] blur-2xl" aria-hidden />
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-mint/30 bg-mint/10">{item.icon}</div>
                <div className="mt-4 font-bold text-sm text-ink">{item.t}</div>
                <p className="mt-2 text-xs leading-relaxed text-mute">{item.d}</p>
              </InteractiveCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Interactive Vertical Hiring Process Timeline */}
      <Section tight id="hiring-process">
        <SectionHead
          eyebrow="Hiring Process"
          title="Transparent, fast & respectful of your time."
          lede="Typically 2 weeks from first application to formal offer. You receive clear feedback at every step."
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Mint spine */}
          <div className="absolute left-6 top-6 bottom-6 hidden w-0.5 bg-gradient-to-b from-mint via-mint/40 to-line shadow-[0_0_12px_rgba(47,211,154,0.4)] md:block" aria-hidden />

          <div className="space-y-6">
            {PROCESS_STEPS.map((step, idx) => (
              <Reveal key={step.step} delay={idx * 0.06}>
                <div className="relative flex flex-col md:flex-row md:items-start gap-5 rounded-2xl border border-line/70 bg-card/60 p-6 md:pl-16 transition-all hover:border-mint/50">
                  {/* Numbered glass dot on the spine */}
                  <div className="flex md:absolute md:left-1.5 md:top-6 h-9 w-9 shrink-0 items-center justify-center rounded-full border border-mint/70 bg-bg/60 backdrop-blur-md font-mono text-xs font-bold text-mint shadow-[0_0_18px_rgba(47,211,154,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]">
                    {step.step}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="text-base font-bold text-ink">{step.title}</h3>
                      <span className="font-mono text-xs text-mint bg-mint/10 border border-mint/20 px-2.5 py-0.5 rounded-full w-fit">
                        {step.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-mute">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* TODO(asset): Life at Pyvot reels wall (awaiting IG exports) */}

      {/* Open Positions */}
      <Section id="open-positions">
        <SectionHead
          eyebrow="Active Openings (1)"
          title="Senior Full Stack Software Developer"
          lede="We’re looking for a top-tier engineer to take complete ownership of the Mynt product from user interface to data infrastructure."
        />

        {/* Single Featured Role Card */}
        <div className="space-y-6">
          {ROLES.map((r) => (
            <InteractiveCard key={r.id} maxTilt={3} className="p-7 md:p-10 border-mint/40 bg-gradient-to-b from-card/90 to-surface/90">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-mute">
                    <span className="text-mint font-bold bg-mint/10 border border-mint/30 px-2.5 py-0.5 rounded">{r.fn}</span>
                    <span>·</span>
                    <span>{r.loc}</span>
                    <span>·</span>
                    <span>{r.type}</span>
                    <span>·</span>
                    <span className="text-grape font-bold">{r.equity}</span>
                  </div>

                  <h3 className="mt-3 text-2xl md:text-3xl font-bold text-ink">{r.title}</h3>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-mute">{r.summary}</p>

                  {/* AI First Banner */}
                  <div className="mt-4 rounded-xl border border-mint/30 bg-mint/5 p-3.5 font-mono text-xs text-mint flex items-start gap-2.5">
                    <span className="text-base">🤖</span>
                    <div>
                      <span className="font-bold text-ink block mb-0.5">AI-First Engineering Culture</span>
                      <span>{r.aiFirst}</span>
                    </div>
                  </div>

                  {/* Tech stack badges */}
                  <div className="mt-5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-mute block mb-2">Tech Stack:</span>
                    <div className="flex flex-wrap gap-2">
                      {r.tech.map((t) => (
                        <span key={t} className="rounded-lg bg-bg/90 border border-line px-3 py-1 font-mono text-xs text-ink font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="mt-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-mute block mb-2">Key Responsibilities & Ownership:</span>
                    <ul className="space-y-2 text-xs md:text-sm text-ink/90" role="list">
                      {r.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 lg:pt-2">
                  <Button onClick={() => handleApplyClick(r.title)} size="lg" className="w-full sm:w-auto">
                    Apply for this Role →
                  </Button>
                  <span className="font-mono text-[11px] text-mute">Immediate hire · Sector V Kolkata</span>
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>

        {/* Application Form */}
        <div id="apply" className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-mint">Direct Application</span>
            <h3 className="mt-1 text-2xl font-bold text-ink">Apply to Pyvot</h3>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              Pick the role you are targeting and tell us what you have built, shipped or grown end-to-end. A portfolio, GitHub or work link helps.
            </p>
            <div className="mt-6 rounded-2xl border border-line/70 bg-card/40 p-5 space-y-2">
              <span className="font-mono text-xs font-semibold text-mint block">Direct hiring inbox:</span>
              <div className="space-y-1 font-mono text-xs text-ink">
                <div><a href="mailto:career@pyvot.in" className="hover:text-mint transition-colors">career@pyvot.in</a></div>
                <div><a href="mailto:anirudh@pyvot.in" className="hover:text-mint transition-colors">anirudh@pyvot.in</a></div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line/80 bg-surface/70 p-6 md:p-8 backdrop-blur-xl shadow-2xl sm:grid-cols-2">
            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute">
              Full name <span className="text-mint">*</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Your full name"
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute">
              Email address <span className="text-mint">*</span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@domain.com"
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute">
              Phone number <span className="text-mint">*</span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute">
              Target Role <span className="text-mint">*</span>
              <select
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mint/40 bg-mint/5 px-4 py-3 text-sm font-semibold text-mint outline-none focus:border-mint"
              >
                <option value="" disabled>Select a role</option>
                {ROLES.map((r) => (
                  <option key={r.title} value={r.title}>{r.title}</option>
                ))}
                <option value="General Application">General Application</option>
              </select>
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute sm:col-span-2">
              LinkedIn / GitHub / Portfolio URL <span className="text-mint">*</span>
              <input
                name="link"
                type="url"
                required
                placeholder="https://github.com/... or https://linkedin.com/in/..."
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute sm:col-span-2">
              CV / Resume Link (Google Drive, Dropbox, Notion) <span className="text-mint">*</span>
              <input
                name="cv"
                type="url"
                required
                placeholder="https://drive.google.com/..."
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute sm:col-span-2">
              What have you built or scaled, and what interests you about Pyvot? <span className="text-mint">*</span>
              <textarea
                name="message"
                rows={4}
                required
                placeholder="Tell us about a project, product, campaign or system you took complete ownership of."
                className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none focus:border-mint"
              />
            </label>

            <div className="flex flex-col items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Button type="submit" size="lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Submitting Application...' : 'Submit Application →'}
              </Button>
              <span className={cn('font-mono text-xs', status === 'sent' ? 'text-mint' : 'text-mute')} role="status">
                {STATUS_TEXT[status] || 'We review and reply to every application.'}
              </span>
            </div>
          </form>
        </div>
      </Section>
    </>
  )
}
