import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import CtaPair from '@/components/CtaPair'
import { HeroMosaic, TeamGrid } from '@/components/TeamCards'
import { PyvotLogo } from '@/components/Brand'
import { Button, Card, Eyebrow, Reveal, Section, SectionHead, SmartLink } from '@/components/ui'
import { GROUPS, LEADERSHIP, TEAM } from '@/data/team'

const EVOLUTION = [
  ['Inside the industry', '20+ years of cumulative experience across dining and delivery — including years building and operating inside platforms like Zomato, watching how restaurants grow and where growth breaks.'],
  ['Consulting across brands', 'Pyvot started as hands-on growth and profitability work with restaurant operators: menus, pricing, ads, discounts, payouts, dining ops.'],
  ['Patterns', 'The same problems repeated across brands: data in silos, no single owner, decisions made from GMV instead of margin.'],
  ['Operating systems', 'We turned what worked into repeatable systems — weekly rhythms, benchmarks, governance — and ran them for clients.'],
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
  { value: 250, suffix: '+', label: 'restaurant brands' },
  { value: 35, suffix: ' Cr+', label: 'monthly revenue managed' },
  { value: 7, suffix: ' L+', label: 'monthly orders' },
  { value: 10, suffix: 'K+', label: 'monthly dining transactions' },
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

function CountStats() {
  const root = useRef(null)
  useGSAP(
    () => {
      gsap.utils.toArray('.about-stat').forEach((el, i) => {
        const s = STATS[i]
        const o = { v: 0 }
        gsap.to(o, {
          v: s.value,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
          onUpdate: () => (el.textContent = `${Math.round(o.v)}${s.suffix}`),
        })
      })
    },
    { scope: root },
  )
  return (
    <section ref={root} className="border-y border-line/60 bg-surface/50 py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="about-stat text-4xl font-bold tracking-tight md:text-5xl">0{s.suffix}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-mute">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

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
          </div>
        </div>
      </Section>

      {/* evolution timeline */}
      <Section tight>
        <SectionHead eyebrow="The evolution" title="From industry experience to consulting to software — in that order." />
        <ol className="relative grid gap-6 md:grid-cols-5" role="list">
          <span className="absolute left-0 right-0 top-3 hidden h-px bg-gradient-to-r from-line via-mint/60 to-line md:block" aria-hidden />
          {EVOLUTION.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <li className="relative md:pt-8">
                <span className="absolute left-0 top-1.5 hidden h-3 w-3 rounded-full border-2 border-mint bg-bg md:block" aria-hidden />
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <CountStats />

      {/* philosophy */}
      <Section id="philosophy">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Eyebrow>Our philosophy</Eyebrow>
            <Reveal>
              <blockquote className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                “Growth is not a campaign. <span className="text-mint">It is a system.</span>”
              </blockquote>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-6 max-w-md text-mute">Sustainable growth comes from well-designed systems, not short-term tactics: ownership, operational discipline and data-driven execution that compound.</p>
            </Reveal>
          </div>
          <ul className="divide-y divide-line/60 border-y border-line/60" role="list">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal key={t} as="li" delay={i * 0.04} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]">
                <span className="font-semibold">{t}</span>
                <span className="text-sm text-mute">{d}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* team */}
      <Section id="team">
        <SectionHead eyebrow="Our team" title="Operators, analysts, strategists, creators, engineers — people who have sat on both sides of the pass." lede="Hover or tap a card for what they believe. Leaders open to a full bio." />
        <TeamGrid groups={GROUPS} />
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
        <SectionHead eyebrow="Why choose us" title="Four reasons operators stay." />
        <div className="grid gap-4 md:grid-cols-2">
          {WHY.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 2) * 0.05}>
              <Card className="h-full p-8">
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-3 text-mute">{d}</p>
              </Card>
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
