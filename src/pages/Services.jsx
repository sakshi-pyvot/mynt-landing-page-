import CtaPair from '@/components/CtaPair'
import OrbitCarousel from '@/components/OrbitCarousel'
import ExpertsSplit from '@/components/sections/ExpertsSplit'
import { Button, Card, CountUp, Eyebrow, InteractiveCard, PageHero, Reveal, Section, SectionHead, SmartLink, Stat } from '@/components/ui'
import VideoLoop from '@/components/VideoLoop'
import { CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

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
  ['Understand', 'Sit with the P&L, the platforms and the kitchen. Name the real constraint.'],
  ['Measure', 'Connect Mynt. Get one version of orders, payouts, ads, discounts and refunds.'],
  ['Prioritise', 'Rank interventions by rupee impact and effort. Pick three, not thirty.'],
  ['Execute', 'Menus, offers, campaigns, listings, dining ops — done with your team, owned by ours.'],
  ['Govern', 'Weekly rhythm, monthly review, clear owners. No slide decks that never ship.'],
  ['Improve', 'What worked compounds. What didn’t is retired. Repeat.'],
]

const RESULTS = [
  ['50%', 'revenue growth', 'Hatari'],
  ['5×', 'return on ad spend', 'Idly Go'],
  ['+7 pp', 'net margin', 'Koshe Kosha'],
  ['40%', 'more combo-led orders', 'Kolkata’s No.1 biryani house'],
  ['100%', 'increase in new users', 'OG by the Lake'],
  ['21%', 'controlled discount burn', 'Land of Cakes'],
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
              {proof.map((p) => (
                <SmartLink key={p.brand} to={p.to || `/case-studies#${p.slug}`} className="block">
                  <InteractiveCard className="h-full">
                    <div className="text-xs uppercase tracking-[0.2em] text-mute">{p.brand}</div>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-mint">{p.metric}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-mute">{p.label}</div>
                  </InteractiveCard>
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default function Services() {
  return (
    <>
      <PageHero eyebrow="Pyvot Experts · Services" title={<>Software finds the opportunity. <span className="text-gradient">People make it happen.</span></>} lede="Restaurant operators can use Mynt directly, or work with Pyvot's team to execute growth and profitability programmes — online ordering, dining, and social.">
        <CtaPair />
      </PageHero>

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
          { brand: 'Idly Go', metric: '5×', label: 'ROAS', slug: 'idly-go' },
          { brand: 'Koshe Kosha', metric: '+7 pp', label: 'net margin', slug: 'koshe-kosha' },
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
          { brand: 'OG by the Lake', metric: '100%', label: 'more new users', slug: 'og-by-the-lake' },
          { brand: 'Hatari', metric: '50%', label: 'revenue growth', slug: 'hatari' },
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
          { brand: 'Instagram', metric: '@pyvot.in', label: 'see the work', to: 'https://www.instagram.com/pyvot.in/' },
          { brand: 'Restaurant brands', metric: '250+', label: 'partnered with Pyvot', to: '/case-studies' },
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
      <Section id="how-we-work" tight>
        <SectionHead eyebrow="How we work" title="An operating rhythm, not a deck." lede="Six steps, in order — because the order is the point. Measurement before prioritisation; execution before governance." />
        <ol className="grid gap-4 md:grid-cols-3" role="list">
          {HOW.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 0.05}>
              <li className="h-full rounded-2xl border border-line/70 bg-card/50 p-6">
                <div className="font-mono text-xs text-mint">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-mute">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* results wall */}
      <section className="border-y border-line/60 bg-surface/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Results</Eyebrow>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {RESULTS.map(([v, l, b]) => (
              <div key={b}>
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
          <CtaPair size="lg" className="mt-10 justify-center" />
        </div>
      </section>
    </>
  )
}
