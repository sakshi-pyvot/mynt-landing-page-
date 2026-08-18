import { useState } from 'react'
import { Button, Card, Field, PageHero, Reveal, Section, SectionHead } from '@/components/ui'
import { CONTACT } from '@/lib/site'
import { cn } from '@/lib/utils'

const BUILDING = [
  ['Mynt', 'A SaaS platform at the intersection of fintech, data intelligence and food-tech: payout parsing, reconciliation, anomaly detection, LLM summaries, recommendations.'],
  ['Growth infrastructure', 'Benchmarks, playbooks and operating rhythms that turn one brand’s win into a repeatable system for hundreds.'],
  ['Expert services', 'Marketplace, dining and social programmes run hands-on with restaurant operators across India.'],
]

const HOW = [
  ['Own the outcome', 'You take a number, not a task. If the number doesn’t move, the task didn’t matter.'],
  ['Stay close to the restaurant', 'Consultants visit kitchens. Engineers read payout statements. Everyone knows what a Friday dinner rush costs.'],
  ['Data beats opinion', 'Bring the chart. Loud is not the same as right.'],
  ['Move with urgency', 'Weekly cadence, small bets, ship and learn.'],
  ['Craft matters', 'The menu description, the SQL, the slide — done properly or not at all.'],
]

const ROLES = [
  {
    title: 'Head of Engineering',
    fn: 'Engineering',
    loc: 'Kolkata · Work from office',
    type: 'Full-time · 5+ yrs',
    summary: 'A hands-on, product-first engineering leader to own Mynt’s architecture and take the platform from 0→1 with the founders. Full-stack + leadership; ESOPs included.',
    bullets: ['Own end-to-end architecture: backend, APIs, data, dashboards', 'Secure pipelines that fetch, parse and reconcile Zomato/Swiggy payout statements', 'AI layer: anomaly detection, discrepancy identification, LLM summarisation', 'Hire, mentor and run a growing engineering + data team'],
  },
]

const PROCESS = ['Application', 'Conversation', 'Assessment (role-dependent)', 'Team / founder round', 'Decision']

export default function Join() {
  const [sent, setSent] = useState(false)

  // ponytail: no backend yet — hand the application to the mail client.
  const onSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const lines = [...f.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Application — ${f.get('role') || 'General'}`)}&body=${encodeURIComponent(lines)}`
    setSent(true)
  }

  return (
    <>
      <PageHero eyebrow="Join Us" title={<>Build the intelligence layer <span className="text-gradient">for restaurants.</span></>} lede="Small team, real problems, visible results. We work from Kolkata with restaurant brands across India — and we are building the software category we wished existed.">
        <div className="flex flex-wrap gap-3">
          <Button to="#open-positions">View open roles</Button>
          <Button to="#why-join" variant="ghost">Why join us</Button>
        </div>
      </PageHero>

      <Section id="why-join" tight>
        <SectionHead eyebrow="Why join us" title="What we’re building, and how we work." />
        <div className="grid gap-4 md:grid-cols-3">
          {BUILDING.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.05}>
              <Card className="h-full">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <ul className="mt-12 divide-y divide-line/60 border-y border-line/60" role="list">
          {HOW.map(([t, d], i) => (
            <Reveal key={t} as="li" delay={i * 0.04} className="grid gap-2 py-5 sm:grid-cols-[260px_1fr]">
              <span className="font-semibold">{t}</span>
              <span className="text-sm text-mute">{d}</span>
            </Reveal>
          ))}
        </ul>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ['Life at Pyvot', 'Client workshops, restaurant visits, shoot days, product reviews. Fewer meetings than you fear, more field time than you expect.'],
            ['Compensation', 'Competitive, with ESOPs for early roles. We hire for ownership and pay like it.'],
            ['Where', 'Sector V, Kolkata. Work from office — restaurants are not remote, and neither are we.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line/60 p-6">
              <div className="font-semibold">{t}</div>
              <p className="mt-2 text-sm text-mute">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="open-positions">
        <SectionHead eyebrow="Open positions" title="Roles open right now." lede="Don’t see yours? Send a general application below — we hire strong people before we write the job description." />
        <div className="space-y-4">
          {ROLES.map((r) => (
            <Card key={r.title} className="p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                    <span className="text-mint">{r.fn}</span>
                    <span>·</span>
                    <span>{r.loc}</span>
                    <span>·</span>
                    <span>{r.type}</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold">{r.title}</h3>
                  <p className="mt-2 text-mute">{r.summary}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-ink/85" role="list">
                    {r.bullets.map((b) => (
                      <li key={b} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button to="#apply" className="shrink-0">Apply</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* process */}
        <div className="mt-14">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Hiring process</div>
          <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm" role="list">
            {PROCESS.map((p, i) => (
              <li key={p} className="flex items-center gap-2">
                <span className="rounded-full border border-line px-3 py-1.5">{p}</span>
                {i < PROCESS.length - 1 && <span className="text-mint" aria-hidden>→</span>}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-mute">Typically two to three weeks from application to decision. You will hear back at every step.</p>
        </div>

        {/* application */}
        <div id="apply" className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h3 className="text-2xl font-bold">Apply</h3>
            <p className="mt-3 text-mute">Tell us what you have built or grown, and why restaurants. A LinkedIn or portfolio link does more than a long cover letter.</p>
            <p className="mt-6 text-sm text-mute">Prefer email? <a href={`mailto:${CONTACT.email}?subject=Application`} className="text-mint">{CONTACT.email}</a></p>
          </div>
          <form onSubmit={onSubmit} className={cn('grid gap-4 rounded-2xl border border-line/70 bg-card/50 p-6 sm:grid-cols-2', sent && 'opacity-70')}>
            <Field label="Full name" name="name" required placeholder="Your name" />
            <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
            <Field label="Phone" name="phone" type="tel" placeholder="+91" />
            <Field label="Role" name="role" as="select" required placeholder="Choose a role" options={[...ROLES.map((r) => r.title), 'General application']} />
            <Field label="LinkedIn / portfolio" name="link" type="url" placeholder="https://" className="sm:col-span-2" />
            <Field label="CV link (Drive, Dropbox…)" name="cv" type="url" placeholder="https://" className="sm:col-span-2" />
            <Field label="Why Pyvot, and what have you built or grown?" name="message" as="textarea" required placeholder="A few honest lines." className="sm:col-span-2" />
            <div className="flex flex-col items-start gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit">{sent ? 'Opened in your mail app' : 'Send application'}</Button>
              <span className="text-xs text-mute">We reply to every application.</span>
            </div>
          </form>
        </div>
      </Section>
    </>
  )
}
