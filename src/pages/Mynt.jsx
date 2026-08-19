import { useState } from 'react'
import { motion } from 'motion/react'
import CtaPair from '@/components/CtaPair'
import HeroDashboard from '@/components/sections/HeroDashboard'
import TrustSecuritySection from '@/components/sections/TrustSecuritySection'
import { MyntMark, PyvotLogo } from '@/components/Brand'
import { Button, Card, Eyebrow, Reveal, Section, SectionHead, SmartLink } from '@/components/ui'
import { CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

const SOURCES = [
  { name: 'Zomato', kind: 'Marketplace' },
  { name: 'Swiggy', kind: 'Marketplace' },
  { name: 'Payout statements', kind: 'Email / PDF' },
  { name: 'Ads & discount reports', kind: 'Platform exports' },
  { name: 'Outlets & menus', kind: 'Master data' },
]

const FEATURES = [
  { name: 'Revenue Intelligence', chip: 'Orders · AOV · contribution', body: 'Track orders, AOV, revenue and contribution — and see which outlet or platform actually moved the number.', shot: 'overview' },
  { name: 'Payout Intelligence', chip: 'Expected vs received', body: 'Statement to structured reconciliation. Deductions, adjustments and settlement gaps, line by line.' },
  { name: 'Discount Intelligence', chip: 'Burn · coupon ROI', body: 'Burn, contribution and coupon effectiveness against your own benchmarks — with anomalies flagged.', shot: 'discounts' },
  { name: 'Ads Intelligence', chip: 'Spend · ROAS', body: 'Spend, ROAS and campaign-by-outlet comparison, so budget follows incremental orders, not habit.', shot: 'ads' },
  { name: 'Refunds', chip: 'Rate · reasons', body: 'Refund rate, reasons and outlet/platform impact — alerts before a spike becomes a month.', shot: 'refunds' },
  { name: 'Charges', chip: 'Deduction waterfall', body: 'Every platform charge explainable and drillable, from gross order value to net payout.' },
  { name: 'Mynt AI', chip: 'Ask why', body: 'Ask why a metric changed, what drives a result and what deserves attention. Answers cite the data.' },
  { name: 'Alerts', chip: 'Proactive', body: 'Margin drop, refund spike, charge rise, processing failure, disconnected email — with the next action attached.' },
  { name: 'Multi-outlet', chip: 'Chain · group · outlet', body: 'Compare locations, spot outliers, roll up to brand. Built for 5 outlets and for 500.' },
  { name: 'Reports', chip: 'Scheduled · exportable', body: 'Automated summaries and role-specific views your finance and ops teams can share without rework.' },
  { name: 'Mobile', chip: 'Owner summary', body: 'The morning view: what changed, what needs attention, drill down in two taps.' },
]

const ROLES = [
  { key: 'Owner', headline: 'The morning answer.', body: 'Which outlet is hurting margin, whether payouts landed, and what to do about it — before the first service.', points: ['Net margin by outlet, ranked', 'Alerts with a next action', 'Weekly summary on mobile'], shot: 'overview' },
  { key: 'Finance', headline: 'Payouts you can reconcile.', body: 'Expected vs received, every deduction categorised, every adjustment traceable back to the statement.', points: ['Statement → structured ledger', 'Charge waterfall per platform', 'Exports that match your books'], shot: 'refunds' },
  { key: 'Growth', headline: 'Spend that earns its keep.', body: 'Ads and discounts read against incremental orders and contribution — not just GMV.', points: ['ROAS by campaign and outlet', 'Discount burn vs benchmark', 'Coupon effectiveness ranking'], shot: 'ads' },
  { key: 'Operations', headline: 'Fix the outlet, not the average.', body: 'Refund reasons, cancellations and prep-time drift surfaced per outlet, per platform, per day.', points: ['Refund reason breakdown', 'Outlet outliers flagged', 'Alerts routed to the right manager'], shot: 'discounts' },
  { key: 'Restaurant manager', headline: 'Your outlet, one screen.', body: 'What sold, what refunded, what discount is eating margin — for your outlet only, no noise from the rest.', points: ['Outlet-scoped view', 'Daily digest', 'Ask Mynt in plain language'], shot: 'overview' },
]



const PROOF = [
  { brand: 'Koshe Kosha', metric: '+7 pp', label: 'net margin', body: 'Smart discounts and ROI-first ads reclaimed profitability.', slug: 'koshe-kosha' },
  { brand: 'Idly Go', metric: '5×', label: 'ROAS', body: 'Hyper-targeted advertising, 65% more first-page visibility.', slug: 'idly-go' },
  { brand: 'Land of Cakes', metric: '21%', label: 'discount burn controlled', body: 'From flat discounts to a promotion strategy that grew revenue.', slug: 'land-of-cakes' },
]

function Shot({ id, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[#0d1119]', className)}>
      <img src={`/shots/${id}.jpg`} alt="" loading="lazy" className="block w-full" />
    </div>
  )
}

export default function Mynt() {
  const [role, setRole] = useState(0)
  const r = ROLES[role]

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <PyvotLogo className="mb-6 h-6" />
              <Eyebrow>Mynt · product overview</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Restaurant intelligence, <span className="text-gradient">finally in one place.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
                Unified financial, marketplace and operational visibility for restaurant groups. Every platform, payout, discount, ad and outlet — connected, explained, and turned into the next action.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <CtaPair className="mt-9" />
            </Reveal>
          </div>
          <div className="relative flex justify-center [perspective:1400px] lg:justify-end">
            <div className="mint-glow pointer-events-none absolute inset-0 scale-125" />
            <div className="[transform:rotateX(6deg)_rotateY(-8deg)] [transform-style:preserve-3d]">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* connect */}
      <Section id="connect" tight>
        <SectionHead eyebrow="Connect" title="Every source your restaurant already produces." lede="Marketplaces, payout statements, platform reports and outlet master data flow into one workspace. No re-keying, no monthly spreadsheet." />
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" role="list">
              {SOURCES.map((s, i) => (
                <li key={s.name} className="flex items-center justify-between rounded-xl border border-line/70 bg-card/60 px-4 py-3" style={{ marginLeft: `${(i % 2) * 8}px` }}>
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{s.kind}</span>
                </li>
              ))}
            </ul>
            <div className="hidden flex-col items-center gap-2 lg:flex" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-px w-24 bg-gradient-to-r from-line via-mint to-mint/0" style={{ opacity: 1 - i * 0.25 }} />
              ))}
              <span className="text-mint">→</span>
            </div>
            <Card glow className="p-8">
              <MyntMark className="h-9" wordClass="text-2xl" />
              <p className="mt-4 text-sm leading-relaxed text-mute">
                Parsed, reconciled and normalised into one model: orders, payouts, deductions, discounts, ad spend, refunds — per outlet, per platform, per day.
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-2 text-xs" role="list">
                {['Auto-parsed statements', 'Daily refresh', 'Outlet-level model', 'Alerts + AI on top'].map((x) => (
                  <li key={x} className="rounded-lg border border-mint/20 bg-mint/5 px-3 py-2 text-mint">
                    {x}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>
      </Section>

      {/* command centre */}
      <Section id="command-centre" tight>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHead eyebrow="Command centre" title="Revenue, payout, refunds, charges, ads, discounts and alerts. One workspace." lede="The overview is not a summary of dashboards — it is the dashboard. Every tile drills to the outlet and the day." className="mb-6" />
            <ul className="space-y-3 text-sm text-ink/85" role="list">
              {['Net margin, payout and revenue by brand → outlet → platform', 'Alerts inline: refund spike, margin drop, missing statement', 'Ask Mynt from any screen'].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <Reveal>
            <div className="glass rounded-2xl border border-white/10 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
              <Shot id="overview" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* features */}
      <Section id="features">
        <SectionHead eyebrow="What Mynt does" title="Eleven modules. One question underneath them all: where is the money going?" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.name} delay={(i % 3) * 0.05}>
              <Card className={cn('h-full', f.shot && 'overflow-hidden pb-0')}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">{f.chip}</div>
                <h3 className="mt-2 text-lg font-semibold">{f.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
                {f.shot && (
                  <div className="mt-5 -mx-6 overflow-hidden">
                    <div className="mx-6 translate-y-2 overflow-hidden rounded-t-xl border border-b-0 border-white/10">
                      <img src={`/shots/${f.shot}.jpg`} alt="" loading="lazy" className="block w-full" style={{ maxHeight: 140, objectFit: 'cover', objectPosition: 'top' }} />
                    </div>
                  </div>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* roles */}
      <Section id="roles" tight>
        <SectionHead eyebrow="Built for roles" title="Same data. A different first screen for every seat." />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roles">
          {ROLES.map((x, i) => (
            <button
              key={x.key}
              role="tab"
              aria-selected={role === i}
              onClick={() => setRole(i)}
              className={cn(
                'relative rounded-full border border-transparent px-4 py-2 text-sm transition-colors',
                role === i ? 'text-mint' : 'text-mute hover:text-ink',
              )}
            >
              {role === i && (
                <motion.span
                  layoutId="mynt-role-pill"
                  aria-hidden
                  style={{ position: 'absolute' }}
                  className="lq lq-pill inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{x.key}</span>
            </button>
          ))}
        </div>
        <div className="mt-8 grid items-center gap-10 rounded-2xl border border-line/70 bg-card/50 p-6 md:p-10 lg:grid-cols-[1fr_1.2fr]" role="tabpanel">
          <div key={r.key}>
            <h3 className="text-2xl font-bold md:text-3xl">{r.headline}</h3>
            <p className="mt-3 text-mute">{r.body}</p>
            <ul className="mt-6 space-y-2 text-sm" role="list">
              {r.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Shot id={r.shot} />
        </div>
      </Section>

      {/* proof */}
      <Section id="proof" tight>
        <SectionHead eyebrow="Customer proof" title="Numbers that came from the same modules." />
        <div className="grid gap-4 md:grid-cols-3">
          {PROOF.map((p, i) => (
            <Reveal key={p.brand} delay={i * 0.06}>
              <Card as={SmartLink} to={`/case-studies#${p.slug}`} className="block h-full">
                <div className="text-xs uppercase tracking-[0.2em] text-mute">{p.brand}</div>
                <div className="mt-3 text-4xl font-bold tracking-tight text-mint">{p.metric}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-mute">{p.label}</div>
                <p className="mt-4 text-sm text-ink/85">{p.body}</p>
                <span className="mt-4 inline-block text-sm text-mint">Read the case study →</span>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* trust & security */}
      <TrustSecuritySection />

      {/* pricing teaser */}
      <Section id="pricing" tight>
        <div className="mx-auto max-w-3xl">
          <Card glow className="p-8 text-center md:p-12">
            <Eyebrow className="justify-center">Pricing</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Simple annual licence. Priced by outlets, not by seats.</h2>
            <p className="mt-4 text-mute">Every module included. Add outlets as you grow. Pyvot Experts are a separate engagement — you decide if and when.</p>
            <Button to={CTA.start} target="_self" className="mt-8">Get a quote for your brand</Button>
          </Card>
        </div>
      </Section>

      {/* final */}
      <section className="relative overflow-hidden py-28 text-center md:py-36">
        <div className="mint-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6">
          <MyntMark className="mx-auto h-10" withWord={false} />
          <h2 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">See your restaurant through Mynt.</h2>
          <CtaPair size="lg" className="mt-10 justify-center" />
        </div>
      </section>
    </>
  )
}
