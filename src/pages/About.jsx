import SocialLinks from '@/components/SocialLinks'
import CtaPair from '@/components/CtaPair'
import VideoLoop from '@/components/VideoLoop'
import { HeroMosaic, TeamGrid } from '@/components/TeamCards'
import { MyntMark, PyvotLogo } from '@/components/Brand'
import { Button, CountUp, Eyebrow, GlowCard, Reveal, Section, SectionHead, SmartLink } from '@/components/ui'
import { GROUPS, LEADERSHIP, TEAM } from '@/data/team'

// [title, description, tiles?] — tiles are era-appropriate [src, alt] pairs;
// the Mynt milestone has none and renders the Mynt mark instead.
const EVOLUTION = [
  ['Inside the industry', '20+ years of cumulative experience across dining and delivery — including years building and operating inside platforms like Zomato, watching how restaurants grow and where growth breaks.', [
    ['/team/bhaskar-halder.png', 'Bhaskar Halder'],
    ['/team/sanchit-surana.png', 'Sanchit Surana'],
    ['/team/rohit-jain.png', 'Rohit Jain'],
  ]],
  ['Consulting across brands', 'Pyvot started as hands-on growth and profitability work with restaurant operators: menus, pricing, ads, discounts, payouts, dining ops.', [
    ['/brand/curated/koshe-kosha.jpg', 'Koshe Kosha'],
    ['/brand/curated/chai-break.png', 'Chai Break'],
    ['/brand/curated/oro-cafe.jpg', 'Oro Cafe'],
  ]],
  ['Patterns', 'The same problems repeated across brands: data in silos, no single owner, decisions made from GMV instead of margin.', [
    ['/brand/curated/haji-saheb.jpg', 'Haji Saheb'],
    ['/brand/curated/mio-amore.png', 'Mio Amore'],
    ['/brand/curated/tao-bao.png', 'Tao Bao'],
  ]],
  ['Operating systems', 'We turned what worked into repeatable systems — weekly rhythms, benchmarks, governance — and ran them for clients.', [
    ['/brand/curated/pa-pa-ya.jpg', 'Pa Pa Ya'],
    ['/brand/curated/soda-bottle-opener-wala.jpg', 'Soda Bottle Opener Wala'],
    ['/brand/curated/the-biryani-bari.jpg', 'The Biryani Bari'],
  ]],
  ['Mynt', 'Then we built the software the systems needed: one intelligence layer for marketplace, payout, discount, ad and outlet data. Experts stay optional.'],
]

const PRINCIPLES = [
  ['Outcome ownership', 'We are measured on rupees moved, not slides delivered.'],
  ['Stay close to restaurant reality', 'Kitchens, service hours and thin margins shape every recommendation.'],
  ['Data beats opinion', 'If it isn’t in the numbers, it’s a hypothesis — and we test it.'],
  ['Move with urgency', 'A month lost on a marketplace is a month you don’t get back.'],
  ['Craft matters', 'From a menu description to a dashboard tile, the details are the product.'],
]

const STATS = [
  ['250+', 'restaurant brands'],
  ['35 Cr+', 'monthly revenue managed'],
  ['7 L+', 'monthly orders'],
  ['10K+', 'monthly dining transactions'],
]

const WHY = [
  ['Online ordering optimisation', 'Marketplace growth with the economics intact — visibility, menu, ads and discounts read against contribution.'],
  ['Dining & brand experience', 'Dine-in performance and a consistent brand across aggregators, reviews and the floor.'],
  ['Data-led decision making', 'Mynt gives one version of the truth; every intervention is measured against it.'],
  ['Ownership-driven execution', 'Named owners, weekly rhythm, monthly review. Strategy that ships.'],
]

// faces in the hero: leaders + a few of the team who have photos
const MOSAIC = [
  LEADERSHIP[0], TEAM.find((p) => p.slug === 'heena-khubani'), LEADERSHIP[4],
  LEADERSHIP[1], LEADERSHIP[2], TEAM.find((p) => p.slug === 'kshitij-murarka'),
  TEAM.find((p) => p.slug === 'namrata-pareek'), LEADERSHIP[5], TEAM.find((p) => p.slug === 'keshav-saraf'),
].filter(Boolean)

export default function About() {
  return (
    <>
      {/* hero: thesis + the people */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <PyvotLogo className="mb-6 h-6" />
              <Eyebrow>About Pyvot</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                We spent years inside the restaurant industry. <span className="text-gradient">Then we built what was missing.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
                Pyvot helps restaurants scale faster online with data-driven strategy and marketplace expertise — and builds Mynt, the intelligence layer that makes it repeatable. Ex-Zomato operators, consultants, analysts, creators and engineers, working from Kolkata with brands across India.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button to="#team">Meet the team</Button>
                <Button to="#story" variant="ghost">Read our story</Button>
              </div>
            </Reveal>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-[460px] lg:justify-self-end">
            <HeroMosaic people={MOSAIC} />
          </div>
        </div>
      </section>

      {/* story */}
      <Section id="story" tight>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHead eyebrow="Our story" title="Restaurants were never short of data. They were short of clarity, ownership and a repeatable decision system." className="mb-0" />
          <div className="space-y-5 text-[17px] leading-relaxed text-ink/85">
            <Reveal><p>Pyvot was founded by a team with over 20 years of cumulative experience working alongside restaurants across dining and delivery. While building and operating within platforms like Zomato, we spent years closely observing how restaurants grow — and where that growth often breaks down.</p></Reveal>
            <Reveal><p>As restaurants expanded across dine-in and online ordering, the complexity increased. Menus, pricing, technology, performance and operations began to operate in silos. Many brands were growing, but without the systems or clarity needed to sustain that growth.</p></Reveal>
            <Reveal><p className="font-semibold text-ink">Pyvot was created to solve this gap.</p></Reveal>
            <Reveal><p>Today, we partner with restaurants to bring structure to both sides of the business. We help strengthen dining fundamentals while building high-performing delivery channels. Our approach blends data, marketplace expertise and hands-on execution — and Mynt, our own software, gives every operator the same visibility our experts use.</p></Reveal>
            {/* TODO(asset): archival office/kitchen candids */}
          </div>
        </div>
      </Section>

      {/* evolution timeline */}
      <Section tight>
        <SectionHead eyebrow="The evolution" title="From industry experience to consulting to software — in that order." />
        {/* TODO(asset): archival office/kitchen candids */}
        <ol className="relative max-w-3xl space-y-12 pl-10" role="list">
          <span className="absolute bottom-6 left-1.5 top-2 w-px bg-gradient-to-b from-mint/70 via-mint/30 to-transparent" aria-hidden />
          {EVOLUTION.map(([t, d, tiles], i) => (
            <Reveal key={t} as="li" delay={i * 0.06} className="relative">
              <span className="absolute -left-10 top-1 h-3 w-3 rounded-full border-2 border-mint bg-bg" aria-hidden />
              <span className="font-mono text-[11px] font-bold tracking-wider text-mint">0{i + 1}</span>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">{d}</p>
              {tiles ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tiles.map(([src, alt]) => (
                    <img
                      key={src}
                      src={src}
                      alt={alt}
                      loading="lazy"
                      className={`h-11 w-11 rounded-lg border border-line/70 bg-card object-cover ${src.startsWith('/team/') ? 'object-top' : ''}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 inline-flex h-11 items-center rounded-lg border border-mint/30 bg-mint/5 px-4">
                  <MyntMark className="h-5" wordClass="text-sm" />
                </div>
              )}
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* stats band */}
      <section className="border-y border-line/60 bg-surface/50 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {STATS.map(([value, label], i) => (
            <Reveal key={label} delay={i * 0.05}>
              <CountUp value={value} className="block text-4xl font-bold tracking-tight md:text-5xl" />
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-mute">{label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* philosophy — the page's one cinematic break: full-bleed kitchen loop */}
      <section id="philosophy" className="relative overflow-hidden">
        <VideoLoop
          src="/videos/restaurant.mp4"
          label="Kitchen flames and service during a dinner rush"
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-bg/80" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-44">
          <Reveal>
            <Eyebrow>Our philosophy</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <blockquote className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              “Growth is not a campaign. <span className="text-mint">It is a system.</span>”
            </blockquote>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-ink/80">Sustainable growth comes from well-designed systems, not short-term tactics: ownership, operational discipline and data-driven execution that compound.</p>
          </Reveal>
        </div>
      </section>

      {/* principles */}
      <Section tight>
        <ul className="divide-y divide-line/60 border-y border-line/60" role="list">
          {PRINCIPLES.map(([t, d], i) => (
            <Reveal key={t} as="li" delay={i * 0.04} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]">
              <span className="font-semibold">{t}</span>
              <span className="text-sm text-mute">{d}</span>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* team */}
      <Section id="team">
        <SectionHead eyebrow="Our team" title="Operators, analysts, strategists, creators, engineers — people who have sat on both sides of the pass." lede="Hover or tap a card for what they believe. Leaders open to a full bio." />
        <TeamGrid groups={GROUPS} />
        <SocialLinks size="sm" className="mt-10" />
        <Reveal className="mt-16">
          <figure className="relative overflow-hidden rounded-3xl border border-line/70">
            <img src="/team/pyvot-team.jpg" alt="The Pyvot team at the Kolkata office" loading="lazy" className="block aspect-[3/2] w-full object-cover md:aspect-[21/9]" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-bg via-bg/60 to-transparent p-6 pt-20 text-sm">
              <span className="font-medium text-ink">The whole team, Kolkata office.</span>
              <span className="text-mute">Sector V · Salt Lake</span>
            </figcaption>
          </figure>
        </Reveal>
      </Section>

      {/* why us */}
      <Section id="why-us" tight>
        <SectionHead eyebrow="Why choose us" title="Four reasons 250+ restaurant brands choose Pyvot." lede="No generic agency slides. We operate at the intersection of fintech reconciliation, aggregator economics, and deep dining fundamentals." />
        <div className="grid gap-5 md:grid-cols-2">
          {WHY.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 2) * 0.06}>
              <GlowCard className="h-full p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-mint">0{i + 1}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-mint/80 border border-mint/20 bg-mint/5 px-2.5 py-0.5 rounded-full">
                      PROVEN OPERATING SYSTEM
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">{t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mute">{d}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-mint">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                  <span>Measured directly against contribution margin</span>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="relative overflow-hidden py-24 text-center md:py-32">
        <div className="mint-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Work with the team. Or with the software. Or both.</h2>
          <CtaPair size="lg" className="mt-10 justify-center" />
          <p className="mt-6 text-sm text-mute">
            Want to be on this page? <SmartLink to="/join" className="text-mint hover:underline">See open roles</SmartLink>
          </p>
        </div>
      </section>
    </>
  )
}
