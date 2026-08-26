import { motion } from 'motion/react'
import CtaPair from '@/components/CtaPair'
import OrbitCarousel from '@/components/OrbitCarousel'
import ExpertsSplit from '@/components/sections/ExpertsSplit'
import { Button, Card, CountUp, Eyebrow, GlowOrbs, InteractiveCard, Reveal, Section, SectionHead, SmartLink, Stat } from '@/components/ui'
import VideoLoop from '@/components/VideoLoop'
import { CTA } from '@/lib/site'
import { cn, reducedMotion } from '@/lib/utils'

// real @pyvot.in content made for restaurant brands — each card links to its post
const SOCIAL_POSTS = [
  ['growth-files-haji-saheb', 'DXesKldEVjg'],
  ['growth-files-barbq', 'DUAUO20kkwk'],
  ['growth-files-hatari', 'DSNiNcmkeu7'],
  ['growth-files-8th-day', 'DWoVSoWCZxz'],
  ['growth-files-cocoa', 'Db3IWGpxPzG'],
  ['growth-files-og', 'DTNbBmrERW6'],
  ['growth-files-bhikharam', 'DbOD20axwSK'],
  ['growth-files-lmb', 'DZe4q49Rezn'],
  ['growth-files-wah-foods', 'DbvXe1DR69L'],
  ['growth-files-pabrais', 'DZ7iawbRwHg'],
].map(([n, id]) => ({ src: `/social/${n}.jpg`, href: `https://www.instagram.com/pyvot.in/reel/${id}/` }))

const ROUTES = [
  { to: '/mynt', k: 'Mynt by Pyvot', d: 'The intelligence layer. Use it yourself; experts optional.', tag: 'Software' },
  { to: '#online-ordering', k: 'Online Ordering Aggregator Consulting', d: 'Zomato & Swiggy growth without losing the economics.', tag: 'Service' },
  { to: '#dining', k: 'Dining Aggregator Consulting', d: 'Dine-in performance and a consistent brand experience.', tag: 'Service' },
  { to: '#social-media', k: 'Social Media Management', d: 'Strategy, shoots, reels, posting, community — end to end.', tag: 'Service' },
]

const HOW = [
  ['Understand', 'Start with the business, not assumptions.', 'Align on goals, economics, platform performance and the real constraints holding growth back.'],
  ['Measure', 'Create one version of the truth.', 'Bring revenue, payouts, ads, discounts, refunds and outlet performance together so every decision starts from the same numbers.'],
  ['Prioritise', 'Focus on what will move the business most.', 'Rank opportunities by financial impact, urgency and effort — then concentrate the team on the highest-value actions.'],
  ['Execute', 'Turn decisions into live changes.', 'Implement improvements across menus, offers, ads, listings, dining campaigns and operating processes, with clear ownership.'],
  ['Govern', 'Keep execution accountable.', 'Run a disciplined weekly and monthly rhythm around owners, actions, deadlines, results and next steps.'],
  ['Improve', 'Scale what works. Fix what doesn’t.', 'Measure the outcome, retain what creates value, remove what does not, and feed every learning into the next cycle.'],
]

// portfolio-level averages only — individual client results live on /case-studies
const RESULTS = [
  ['40%\u00A0↑', 'Average revenue growth', 'Online Ordering Aggregator Consulting'],
  ['+2 pp', 'Average profitability improvement', 'Online Ordering Aggregator Consulting'],
  ['63%\u00A0↑', 'Average dining revenue growth', 'Dining Aggregator Consulting'],
  ['120%\u00A0↑', 'Average new diner growth', 'Dining Aggregator Consulting'],
  ['70%\u00A0↑', 'Average organic reach growth', 'Social Media Management'],
  ['220%\u00A0↑', 'Average profile action growth', 'Social Media Management'],
]

const WHY = [
  { tag: 'Proven operating system', t: 'Online ordering growth', s: 'Grow orders without losing margin.', d: 'We optimise visibility, menus, ads, discounts and marketplace execution with profitability built into every decision.', m: 'Measured on revenue, contribution and ROI' },
  { tag: 'Proven operating system', t: 'Dining growth', s: 'Turn dining platforms into a real growth channel.', d: 'We improve visibility, offers, campaigns, reviews and guest acquisition to drive more diners and stronger dining revenue.', m: 'Measured on dining revenue and new diner growth' },
  { tag: 'Mynt powered', t: 'Data-backed decisions', s: 'One source of truth behind every action.', d: 'Mynt connects revenue, payouts, ads, discounts, charges and outlet performance so decisions are based on verified business data — not assumptions.', m: 'Measured before, during and after every intervention' },
  { tag: 'Pyvot Experts', t: 'Execution with ownership', s: 'We do not just recommend. We make it happen.', d: 'Every priority has an owner, a timeline and a review rhythm — from identifying the opportunity to implementing the change and measuring the result.', m: 'Clear owners. Clear actions. Clear outcomes.' },
]

function ServiceBlock({ id, eyebrow, title, lede, monitor, playbook, get, proof, children, cta, ctaLabel = 'Talk to an expert', flip = false }) {
  return (
    <Section id={id}>
      <div className="rounded-3xl border border-line/70 bg-surface/50 p-6 md:p-12">
        <div className={cn('grid gap-12 lg:grid-cols-[1.1fr_1fr]', flip && 'lg:[&>*:first-child]:order-2')}>
          <div>
            <SectionHead eyebrow={eyebrow} title={title} lede={lede} className="mb-8" />
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">What we monitor</div>
                <ul className="mt-3 space-y-2 text-sm text-ink/85" role="list">
                  {monitor.map((m) => (
                    <li key={m} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">What you get</div>
                <ul className="mt-3 space-y-2 text-sm text-ink/85" role="list">
                  {get.map((m) => (
                    <li key={m} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button to={cta || CTA.expert} className="mt-10">{ctaLabel}</Button>
          </div>
          <div className="space-y-4">
            {children}
            <Card className="bg-card/50">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Our playbook</div>
              <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="list">
                {playbook.map((p, i) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="rounded-full border border-line px-3 py-1">{p}</span>
                    {i < playbook.length - 1 && <span className="text-mint" aria-hidden>→</span>}
                  </li>
                ))}
              </ol>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {proof.map((p) => {
                const card = (
                  <InteractiveCard className="h-full">
                    <div className="text-xs uppercase tracking-[0.2em] text-mute">{p.brand}</div>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-mint">{p.metric}</div>
                    <div className="mt-1 text-xs text-mute">{p.label}</div>
                  </InteractiveCard>
                )
                const to = p.to || (p.slug && `/case-studies#${p.slug}`)
                return to ? (
                  <SmartLink key={p.brand} to={to} className="block">{card}</SmartLink>
                ) : (
                  <div key={p.brand}>{card}</div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ambient background for the How-we-work / Why-choose-us sections: soft mint
// orbs drifting slowly behind the cards
// header-side visual for HOW WE WORK: the six steps as a slowly-orbited cycle —
// the "repeatable rhythm" drawn literally
function RhythmVisual() {
  const rm = reducedMotion()
  const R = 43.75 // node ring radius in % — matches the inset-4 border circle
  return (
    <div className="relative mx-auto hidden h-64 w-64 lg:block" aria-hidden>
      <div className="absolute inset-4 rounded-full border border-mint/25" />
      <div className="absolute inset-10 rounded-full border border-line/40" />
      {['01', '02', '03', '04', '05', '06'].map((n, i) => {
        const a = (i / 6) * 2 * Math.PI - Math.PI / 2
        return (
          <span
            key={n}
            className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-mint/40 bg-bg font-mono text-[10px] text-mint shadow-[0_0_14px_rgba(47,211,154,0.18)]"
            style={{ left: `${50 + R * Math.cos(a)}%`, top: `${50 + R * Math.sin(a)}%` }}
          >
            {n}
          </span>
        )
      })}
      {!rm && (
        <motion.div className="absolute inset-4" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}>
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint shadow-[0_0_14px_rgba(47,211,154,0.95)]" />
        </motion.div>
      )}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-mint/80">Operating</div>
        <div className="mt-1 text-sm font-bold">Rhythm</div>
      </div>
    </div>
  )
}

// header-side visual for WHY CHOOSE US: growth bars rising toward the 250+ mark
const PROOF_BARS = [34, 48, 42, 60, 55, 74, 68, 88]

function ProofVisual() {
  const rm = reducedMotion()
  return (
    <div className="hidden w-72 flex-col justify-end lg:flex" aria-hidden>
      <div className="flex h-40 items-end gap-2.5 border-b border-line/60">
        {PROOF_BARS.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-mint/10 to-mint/70"
            initial={rm ? false : { height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-mint">250+</span>
        <span className="text-xs text-mute">brands measured on outcomes</span>
      </div>
    </div>
  )
}

export default function Services() {
  return (
    <>
      {/* PageHero has no background slot, so the hero is composed by hand: consulting-
          session loop behind the copy under a heavy scrim, text content unchanged. */}
      <section className="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <VideoLoop src="/videos/experts-india.mp4" poster="/videos/experts-india-poster.jpg" label="Consultants and a restaurant owner reviewing dashboards" className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-bg/75" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/30 to-bg" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <Eyebrow>Pyvot Experts · Services</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Software finds the opportunity. <span className="text-gradient">People make it happen.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute md:text-xl">
              Restaurant operators can use Mynt directly, or work with Pyvot's team to execute growth and profitability programmes — online ordering, dining, and social.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-9">
            <CtaPair />
          </Reveal>
        </div>
      </section>

      <Section tight className="pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ROUTES.map((r, i) => (
            <Reveal key={r.k} delay={i * 0.05}>
              <SmartLink to={r.to} className="block h-full">
                <InteractiveCard className="h-full">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">{r.tag}</span>
                  <h3 className="mt-2 font-semibold leading-snug">{r.k}</h3>
                  <p className="mt-2 text-sm text-mute">{r.d}</p>
                  <span className="mt-4 inline-block text-sm text-mint">Open →</span>
                </InteractiveCard>
              </SmartLink>
            </Reveal>
          ))}
        </div>
      </Section>

      <ServiceBlock
        id="online-ordering"
        eyebrow="Online Ordering Aggregator Consulting"
        title="Win more marketplace demand — without losing control of the economics."
        lede="Marketplace growth, ordering operations, unit economics and governance for brands on Zomato and Swiggy. For operators who want the orders and the margin."
        monitor={['Marketplace visibility and search positioning', 'Menu architecture and conversion', 'Ads and discount strategy vs. contribution', 'Listing and platform hygiene', 'Order funnel, refunds and repeat behaviour']}
        get={['A named growth owner and weekly rhythm', 'Menu, offer and campaign changes shipped, not recommended', 'Payout, charge and burn reviewed monthly in Mynt', 'A profitability plan with rupee targets']}
        playbook={['Diagnose', 'Prioritise', 'Execute', 'Review', 'Improve']}
        proof={[
          { brand: 'Average revenue growth', metric: '40% ↑', label: 'Across brands managed by Pyvot' },
          { brand: 'Average profitability improvement', metric: '2% ↑', label: 'Across brands managed by Pyvot' },
        ]}
      >
        <VideoLoop src="/videos/rider-india.mp4" poster="/videos/rider-india-poster.jpg" scrim label="Night delivery rider through an Indian street" className="aspect-[21/9] rounded-2xl border border-line/70" />
        <Card className="bg-card/50">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Disciplines inside</div>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2" role="list">
            {['Marketplace Growth & Ordering Operations', 'Data, Metrics & Performance Intelligence', 'Revenue, Unit Economics & Profitability', 'Execution, Governance & Ownership'].map((x) => (
              <li key={x} className="rounded-lg border border-line/70 px-3 py-2 text-ink/85">{x}</li>
            ))}
          </ul>
        </Card>
      </ServiceBlock>

      <ServiceBlock
        id="dining"
        eyebrow="Dining Aggregator Consulting"
        title="Turn restaurant visits into a stronger, more consistent brand."
        lede="Dine-in performance and brand experience across dining aggregators and your own touchpoints — visibility, offers, ads ROI, reviews and the service that brings people back."
        monitor={['Dining aggregator visibility and CTR', 'Offer design and table-hour utilisation', 'Ads ROI on dining platforms', 'Reviews, ratings and response discipline', 'Brand consistency online and on the floor']}
        get={['Dining growth owner and monthly review', 'Offer and campaign calendar, executed', 'Review and rating playbook for the team', 'Lunch/dinner and weekday programmes with targets']}
        playbook={['Audit', 'Position', 'Activate', 'Measure', 'Refine']}
        proof={[
          { brand: 'Average dining revenue growth', metric: '63% ↑', label: 'Across dining aggregator programmes managed by Pyvot' },
          { brand: 'Average new diner growth', metric: '120% ↑', label: 'Across dining aggregator programmes managed by Pyvot' },
        ]}
        flip
      >
        <VideoLoop src="/videos/dining-india.mp4" poster="/videos/dining-india-poster.jpg" label="Thali service at the table" className="aspect-video rounded-2xl border border-white/10" />
      </ServiceBlock>

      <ServiceBlock
        id="social-media"
        eyebrow="Social Media Management"
        title="We make restaurants worth following."
        lede="Strategy, shoots, reels, posts, community and performance — managed end-to-end for restaurant brands. From the restaurant floor to the feed."
        monitor={['Content strategy and monthly calendar', 'Shoot planning, photography, reels, carousels', 'Captions, posting, community management', 'Campaign launches and influencer coordination', 'Monthly reporting: reach, saves, profile actions, bookings']}
        get={['A content engine: plan → shoot → edit → approve → schedule → report', 'Instagram and Facebook treated as different channels, not repost feeds', 'Content pillars tuned to your brand: food, people, ambience, occasions, offers, culture', 'Reporting tied to business outcomes where measurable']}
        playbook={['Audit', 'Strategy', 'Calendar', 'Shoot', 'Publish', 'Review']}
        proof={[
          { brand: 'Average organic reach growth', metric: '70% ↑', label: 'Across restaurant social accounts managed by Pyvot' },
          { brand: 'Average profile action growth', metric: '220% ↑', label: 'Across restaurant social accounts managed by Pyvot' },
        ]}
        cta="/contact?intent=social"
        ctaLabel="Get a social audit"
      >
        <div>
          <OrbitCarousel images={SOCIAL_POSTS} radiusX={185} cardWidth={140} />
          <a href="https://www.instagram.com/pyvot.in/" target="_blank" rel="noreferrer" className="mt-2 block text-center text-sm text-mint hover:underline">
            @pyvot.in — see the work →
          </a>
        </div>
      </ServiceBlock>

      {/* how we work */}
      <Section id="how-we-work" tight className="relative">
        <GlowOrbs />
        <div className="lg:mb-12 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-12">
          <SectionHead className="lg:mb-0" eyebrow="How we work" title="A repeatable operating rhythm — built to move numbers." lede="We diagnose first, measure what matters, prioritise the highest-impact actions, execute with your team, review the results, and keep improving." />
          <Reveal delay={0.1}>
            <RhythmVisual />
          </Reveal>
        </div>
        <ol className="grid gap-4 md:grid-cols-3" role="list">
          {HOW.map(([t, s, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.05}>
              <li className="h-full rounded-2xl border border-line/70 bg-card/50 p-6">
                <div className="font-mono text-xs text-mint">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <div className="mt-1 text-sm font-medium text-ink/85">{s}</div>
                <p className="mt-2 text-sm text-mute">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* why choose us */}
      <Section id="why-choose-us" tight className="relative">
        <GlowOrbs />
        <div className="lg:mb-12 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-12">
          <SectionHead className="lg:mb-0" eyebrow="Why choose us" title="Built for restaurant growth. Proven across 250+ brands." lede="Pyvot combines restaurant operating experience, deep aggregator expertise, financial intelligence and hands-on execution — so recommendations do not stop at strategy." />
          <Reveal delay={0.1}>
            <ProofVisual />
          </Reveal>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {WHY.map((w, i) => (
            <Reveal key={w.t} delay={(i % 2) * 0.05}>
              <InteractiveCard className="h-full">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-mint">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rounded-full border border-mint/30 bg-mint/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mint">{w.tag}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{w.t}</h3>
                <div className="mt-1 text-sm font-medium text-ink/85">{w.s}</div>
                <p className="mt-2 text-sm leading-relaxed text-mute">{w.d}</p>
                <div className="mt-4 border-t border-line/50 pt-3 text-xs text-mute">{w.m}</div>
              </InteractiveCard>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* results wall — portfolio averages, no client names */}
      <section className="border-y border-line/60 bg-surface/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Results across the Pyvot portfolio</Eyebrow>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {RESULTS.map(([v, l, b]) => (
              <div key={l}>
                <Stat value={<CountUp value={v} />} label={l} />
                <div className="mt-1 text-xs text-mute/70">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExpertsSplit />

      <section className="relative overflow-hidden py-24 text-center md:py-32">
        <div className="mint-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Tell us where growth is stuck.</h2>
          <p className="mt-4 text-mute">A 30-minute conversation with a Pyvot expert. Bring your numbers, or let Mynt bring them.</p>
          <div className="mt-10 flex justify-center">
            <Button to={CTA.expert} size="lg">Talk to an expert</Button>
          </div>
        </div>
      </section>
    </>
  )
}
