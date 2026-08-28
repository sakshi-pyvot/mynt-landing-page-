import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import CtaPair from '@/components/CtaPair'
import { Button, CountUp, Eyebrow, InteractiveCard, Reveal, Section, SectionHead } from '@/components/ui'
import VideoLoop from '@/components/VideoLoop'
import { cn } from '@/lib/utils'

const TAGS = ['All', 'Revenue', 'Profitability', 'Ads', 'Discounts', 'Dining', 'Menu']

const CASES = [
  {
    slug: 'hatari',
    brand: 'Hatari',
    title: 'Transforming Hatari into a regular dining affair',
    tags: ['Revenue', 'Menu'],
    metrics: [['50%', 'overall revenue growth'], ['2×', 'low-affluent funnel'], ['2×', 'new portion sizes launched']],
    challenge: 'A well-loved brand with a loyal but narrow customer base. Ticket sizes kept a large, price-sensitive segment out of the funnel.',
    data: 'Order-level analysis showed demand concentrated in a few high-value dishes and a steep drop-off where affordability began.',
    intervention: 'Affordable combos and customisable portion sizes, designed from the dish-level data and launched with a clear menu architecture.',
    result: 'The low-affluent customer funnel doubled and overall revenue rose 50%, without diluting the core menu.',
  },
  {
    slug: 'biryani-house',
    brand: 'Dada Boudi Biryani',
    title: 'Turning a biryani specialist into a full-menu powerhouse',
    tags: ['Revenue', 'Menu'],
    metrics: [['40%', 'increase in combo-led orders'], ['5 min', 'faster average prep time']],
    challenge: 'Revenue rode almost entirely on one category. Kitchen load peaked on it too, stretching prep times at rush hour.',
    data: 'Menu engineering and demand planning across millions of order lines showed where adjacent items were being searched but not converted.',
    intervention: 'Rebuilt the menu around combos, widened the revenue base with data-backed adjacent categories and streamlined kitchen operations.',
    result: 'Combo-led orders grew 40%, average prep time fell by five minutes, and non-biryani items became a real revenue contributor.',
  },
  {
    slug: 'idly-go',
    brand: 'Idly Go',
    title: 'Turbo-charging visibility on food aggregators with hyper-targeted advertising',
    tags: ['Ads', 'Revenue'],
    metrics: [['5×', 'return on ad spend'], ['65%', 'more first-page search visibility'], ['4 mo', 'to revenue growth']],
    challenge: 'Great product, poor discoverability. Ad spend was flat across outlets and hours, and search visibility lagged competitors.',
    data: 'Order frequency, dish-level searches, conversion rates and geo-hotspots — millions of data points — pointed to when, where and for what to bid.',
    intervention: 'A three-tiered advertising playbook: always-on for the hotspots, dayparted for demand peaks, and tactical bursts for new-user pockets.',
    result: '5× ROAS, 65% more first-page visibility, and revenue growth inside four months.',
  },
  {
    slug: 'koshe-kosha',
    brand: 'Koshe Kosha',
    title: 'Reclaiming profitability for Koshe Kosha',
    tags: ['Profitability', 'Discounts', 'Ads'],
    metrics: [['+7 pp', 'net margin improvement'], ['40%', 'revenue uplift'], ['3×', 'ROAS across paid campaigns']],
    challenge: 'Growing top line, shrinking margin. Blanket discounts and undirected ads were buying orders that didn’t pay for themselves.',
    data: 'Funnel analytics and cohort modelling separated incremental orders from subsidised ones — and showed which offers actually earned contribution.',
    intervention: 'A profitability-first playbook: smart discounts targeted by cohort and outlet, and ROI-first ads with hard ROAS floors.',
    result: 'A 7-point net margin lift, 40% revenue uplift and 3× ROAS across paid campaigns.',
  },
  {
    slug: 'land-of-cakes',
    brand: 'Land of Cakes',
    title: 'From flat discounts to a revenue boost',
    tags: ['Discounts', 'Revenue'],
    metrics: [['21%', 'controlled discount burn'], ['30%', 'increase in menu opens']],
    challenge: 'Flat, always-on discounts had become the price. Burn was rising while the offers stopped moving behaviour.',
    data: 'Sales data and customer behaviour showed which items and cohorts responded to offers — and which bought anyway.',
    intervention: 'A smarter promotion strategy: item- and occasion-led offers replaced flat discounts; visibility mechanics were tuned to drive menu opens.',
    result: 'Discount burn was controlled at 21%, menu opens rose 30% and revenue lifted.',
  },
  {
    slug: 'og-by-the-lake',
    brand: 'OG by the Lake',
    title: 'Boosting dining by improving ads ROI and CTR',
    tags: ['Dining', 'Ads'],
    metrics: [['100%', 'increase in new users'], ['19%', 'boost in lunch hours']],
    challenge: 'Dining-platform investments were being made without a clear read on return. Lunch hours under-performed the space and the brand.',
    data: 'Ads ROI and CTR analysis by daypart and creative showed where spend converted into visits — and where it didn’t.',
    intervention: 'Reworked dining-platform ads and offers around the strongest dayparts and creatives, with a weekly review of ROI.',
    result: 'New users doubled, lunch hours grew 19% and revenue lifted.',
  },
]

const LOGOS = { 'idly-go': '/brand/curated/idly-go.png', 'koshe-kosha': '/brand/curated/koshe-kosha.jpg', 'og-by-the-lake': '/brand/curated/og-by-the-lake.jpg' }

// soft brand-coloured wash per card, kept faint so the cards stay quiet
const TINTS = {
  hatari: 'rgba(255,122,70,0.11)',
  'biryani-house': 'rgba(255,182,64,0.10)',
  'idly-go': 'rgba(120,220,140,0.10)',
  'koshe-kosha': 'rgba(232,84,84,0.10)',
  'land-of-cakes': 'rgba(255,128,176,0.10)',
  'og-by-the-lake': 'rgba(84,186,224,0.10)',
}

// slugs match /public/testimonials/{full,poster}/<slug>.*
const VOICES = [
  { slug: 'og-by-the-lake', brand: 'OG by the Lake', hook: '136% revenue uplift' },
  { slug: 'bhikharam-chandmal', brand: 'Bhikharam Chandmal', hook: 'Legacy brand, marketplace-first' },
  { slug: 'nepal-sweets', brand: 'Nepal Sweets', hook: 'Discount burn under control' },
  { slug: 'golbari', brand: 'Golbari', hook: 'Heritage kitchen, modern ops' },
]

export default function CaseStudies() {
  const { hash } = useLocation()
  const hashSlug = CASES.some((c) => c.slug === hash.slice(1)) ? hash.slice(1) : null
  const [tag, setTag] = useState('All')
  const [open, setOpen] = useState(hashSlug)
  // deep link (/case-studies#koshe-kosha) opens that case, also on later hash changes
  const [seenHash, setSeenHash] = useState(hash)
  if (hash !== seenHash) {
    setSeenHash(hash)
    if (hashSlug) {
      setOpen(hashSlug)
      setTag('All')
    }
  }

  const list = CASES.filter((c) => tag === 'All' || c.tags.includes(tag))

  return (
    <>
      {/* PageHero has no background slot, so the hero is composed by hand: quiet kitchen
          loop behind the copy under a heavy scrim, text content unchanged. */}
      <Section id="client-voices" tight className="scroll-mt-28 pt-32 md:pt-40">
        <SectionHead eyebrow="Client voices" title="Hear it from the operators." lede="Restaurant owners on what changed, filmed on their own floors. Watch all ten with sound on the home page." className="mb-8" />
        {/* row scrolls sideways on mobile, sits 4-across on desktop */}
        <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x gap-4 pb-2">
            {VOICES.map((v, i) => (
              <Reveal key={v.slug} delay={i * 0.05} className="w-[220px] shrink-0 snap-center md:w-auto md:flex-1">
                <div className="lq-card relative overflow-hidden rounded-2xl border border-line/70 hover:border-mint/40">
                  <VideoLoop
                    src={`/testimonials/preview/${v.slug}.mp4`}
                    poster={`/testimonials/poster/${v.slug}.jpg`}
                    label={`${v.brand} testimonial`}
                    scrim
                    className="aspect-[9/16]"
                  />
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="text-sm font-semibold text-ink">{v.brand}</div>
                    <div className="mt-0.5 text-xs text-mute">{v.hook}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mt-6">
          <Button to="/#voices" variant="ghost">Watch client voices</Button>
        </Reveal>
      </Section>

      <section id="cases" className="relative scroll-mt-20 overflow-hidden pt-12 pb-8 md:pt-16 md:pb-10">
        <VideoLoop src="/videos/cases-india.mp4" poster="/videos/cases-india-poster.jpg" label="Evening service in an Indian dining room" className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-bg/75" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/30 to-bg" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <Eyebrow>Case studies</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">Built on outcomes, not presentations.</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute md:text-xl">Quantified results from restaurant brands Pyvot has worked with — revenue, profitability, ads, discounts, dining and menu. Every metric here was validated with the client.</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-9">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={cn('rounded-full border px-4 py-2 text-sm transition-colors', tag === t ? 'border-mint bg-mint/10 text-mint' : 'border-line text-mute hover:text-ink')}
                >
                  {t}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Section tight className="pt-0 md:pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c, i) => {
            const isOpen = open === c.slug
            return (
              <Reveal key={c.slug} delay={(i % 2) * 0.05} className={cn(isOpen && 'md:col-span-2')}>
                <InteractiveCard
                  id={c.slug}
                  className={cn('h-full', isOpen ? 'border-mint/50' : 'cursor-pointer')}
                  onClick={() => !isOpen && setOpen(c.slug)}
                >
                  {/* -inset-6 cancels the card's p-6 so the wash still covers the full card; the card's overflow-hidden clips it */}
                  {TINTS[c.slug] && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-6"
                      style={{ background: `radial-gradient(120% 90% at 100% 0%, ${TINTS[c.slug]}, transparent 55%)` }}
                    />
                  )}
                  {/* TODO(asset): food photography backgrounds per brand */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {LOGOS[c.slug] ? (
                        <img src={LOGOS[c.slug]} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-lg border border-line text-xs font-semibold text-mint" aria-hidden>
                          {c.brand.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')}
                        </span>
                      )}
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-mute">{c.brand}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.tags.map((t) => (
                            <span key={t} className="rounded-full border border-line/70 px-2 py-0.5 text-[10px] text-mute">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(isOpen ? null : c.slug)
                      }}
                      aria-expanded={isOpen}
                      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-mute hover:border-mint/60 hover:text-mint"
                    >
                      {isOpen ? 'Close' : 'Read'}
                    </button>
                  </div>
                  <h3 className="mt-7 text-xl font-semibold leading-snug">{c.title}</h3>
                  {/* two validated metrics split the row evenly; three keep the tighter grid */}
                  <div className={cn('mt-6 grid gap-3', c.metrics.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                    {c.metrics.map(([v, l]) => (
                      <div key={l} className="rounded-xl border border-line/60 bg-bg/40 p-3">
                        <div className="text-2xl font-bold tracking-tight text-mint"><CountUp value={v} /></div>
                        <div className="mt-1 text-[11px] leading-snug text-mute">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className={cn('grid transition-[grid-template-rows] duration-400', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <div className="overflow-hidden">
                      <div className="mt-6 grid gap-6 border-t border-line/60 pt-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                          ['Challenge', c.challenge],
                          ['What the data showed', c.data],
                          ['Intervention', c.intervention],
                          ['Result', c.result],
                        ].map(([t, d]) => (
                          <div key={t}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mint">{t}</div>
                            <p className="mt-2 text-sm leading-relaxed text-ink/85">{d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </Reveal>
            )
          })}
        </div>
      </Section>

      <section className="relative overflow-hidden py-24 text-center md:py-32">
        <div className="mint-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Bring us the growth problem.</h2>
          <CtaPair size="lg" className="mt-10 justify-center" />
        </div>
      </section>
    </>
  )
}
