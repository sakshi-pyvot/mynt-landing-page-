import CtaPair from '@/components/CtaPair'
import { PyvotLogo } from '@/components/Brand'
import { Button, Card, Eyebrow, PageHero, Reveal, Section, SectionHead, Stat } from '@/components/ui'
import { cn } from '@/lib/utils'

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

const LEADERSHIP = [
  ['Bhaskar Halder', 'Co-Founder'],
  ['Sanchit Surana', 'Co-Founder'],
  ['Rohit Jain', 'Chief Strategy Officer'],
  ['Abhishek Unni', 'Associate Director'],
  ['Anirudh Saraf', 'Associate Director'],
  ['Madhav Poddar', 'Associate Director'],
]

const TEAM = [
  ['Ishprit Singh Batra', 'Senior Consultant'],
  ['Pratik Jaiswal', 'Senior Consultant'],
  ['Yatharth Srivastava', 'Senior Consultant'],
  ['Heena Khubani', 'Consultant'],
  ['Divya Dave', 'Consultant'],
  ['Devika Khaitan', 'Consultant'],
  ['Kshitij Murarka', 'Consultant'],
  ['Sayantan Deb', 'Consultant'],
  ['Tapash Paul', 'Consultant'],
  ['Anish Roy', 'Creative Lead'],
  ['Keshav Saraf', 'Analyst'],
  ['Namrata Pareek', 'Analyst'],
  ['Anagh Kumar Pasari', 'Operations Associate'],
  ['Shreyansh Bardia', 'Operations Associate'],
  ['Dibya Sarkar', 'Finance Associate'],
  ['Nikita Thakkar', 'Chief of Staff'],
]

const WHY = [
  ['Online ordering optimisation', 'Marketplace growth with the economics intact — visibility, menu, ads and discounts read against contribution.'],
  ['Dining & brand experience', 'Dine-in performance and a consistent brand across aggregators, reviews and the floor.'],
  ['Data-led decision making', 'Mynt gives one version of the truth; every intervention is measured against it.'],
  ['Ownership-driven execution', 'Named owners, weekly rhythm, monthly review. Strategy that ships.'],
]

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')

function Person({ name, role, big = false }) {
  return (
    <div className={cn('flex items-center gap-4', big && 'flex-col items-start gap-5')}>
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-2xl border border-line/70 bg-gradient-to-br from-card to-surface font-semibold tracking-wide text-mint',
          big ? 'h-24 w-24 text-2xl' : 'h-11 w-11 text-xs',
        )}
        aria-hidden
      >
        {initials(name)}
      </div>
      <div>
        <div className={cn('font-semibold', big ? 'text-lg' : 'text-sm')}>{name}</div>
        <div className={cn('text-mute', big ? 'text-sm' : 'text-xs')}>{role}</div>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <>
      <PageHero eyebrow="About Pyvot" title={<>We spent years inside the restaurant industry. <span className="text-gradient">Then we built what was missing.</span></>} lede="Pyvot helps restaurants scale faster online with data-driven strategy and marketplace expertise — and builds Mynt, the intelligence layer that makes it repeatable.">
        <div className="flex flex-wrap items-center gap-6">
          <Button to="#story" variant="ghost">Read our story</Button>
          <PyvotLogo className="h-6 opacity-70" />
        </div>
      </PageHero>

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

      {/* proof */}
      <section className="border-y border-line/60 bg-surface/50 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          <Stat value="250+" label="restaurant brands" />
          <Stat value="35 Cr+" label="monthly revenue managed" />
          <Stat value="7 L+" label="monthly orders" />
          <Stat value="10K+" label="monthly dining transactions" />
        </div>
      </section>

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
      <Section id="team" tight>
        <SectionHead eyebrow="Our team" title="Operators, analysts, strategists — people who have sat on both sides of the pass." />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {LEADERSHIP.map(([n, r], i) => (
            <Reveal key={n} delay={(i % 3) * 0.05}>
              <Card className="h-full">
                <Person name={n} role={r} big />
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map(([n, r]) => (
            <Person key={n} name={n} role={r} />
          ))}
        </div>
      </Section>

      {/* why us */}
      <Section id="why-us">
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
        </div>
      </section>
    </>
  )
}
