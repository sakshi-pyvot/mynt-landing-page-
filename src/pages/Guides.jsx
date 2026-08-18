import { useState } from 'react'
import { Accordion, Button, Card, PageHero, Section, SectionHead } from '@/components/ui'
import { CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

const CATS = ['All', 'Getting started', 'Connect platforms', 'Payouts', 'Ads', 'Discounts', 'Refunds', 'Mynt AI', 'Billing']

const GUIDES = [
  { cat: 'Getting started', t: 'Set up your workspace in 15 minutes', mins: 4, steps: ['Create your workspace and add your brand(s).', 'Add outlets — name, city, platform IDs.', 'Invite your team and assign roles (owner, finance, growth, ops, manager).', 'Connect your first platform. Mynt backfills the last 90 days automatically.'] },
  { cat: 'Getting started', t: 'Reading the overview: what each tile means', mins: 5, steps: ['Net payout = gross order value − platform charges − discounts funded by you − refunds + adjustments.', 'Net margin % is net payout ÷ gross order value.', 'Every tile filters the whole page: click an outlet, everything follows.', 'The date picker defaults to Latest Week; use Previous Month for a like-for-like view.'] },
  { cat: 'Connect platforms', t: 'Connect Zomato and Swiggy', mins: 3, steps: ['Go to Settings → Sources → Add.', 'Sign in with your partner account and pick the outlets to sync.', 'Mynt requests report access only — nothing that can change your listing.', 'First sync completes in minutes; daily refresh runs early morning.'] },
  { cat: 'Connect platforms', t: 'Forward payout statements by email', mins: 3, steps: ['Copy your workspace inbox address from Settings → Sources → Statements.', 'Set an auto-forward rule in Gmail/Outlook for platform payout emails.', 'Mynt parses PDF and CSV statements and matches them to outlets by ID.', 'Unmatched statements show under Needs review with a one-click assign.'] },
  { cat: 'Payouts', t: 'Reconcile expected vs received payout', mins: 6, steps: ['Open Payouts → pick a settlement period.', 'Expected is built from orders; Received is read from the statement.', 'The gap is split into charges, discounts, refunds and adjustments — click any to see the lines.', 'Mark a gap Explained or Raise with platform; Mynt tracks it until it closes.'] },
  { cat: 'Payouts', t: 'Understanding the charge waterfall', mins: 4, steps: ['Charges are grouped: commission, payment gateway, packaging, delivery, taxes, other.', 'Compare charge % across outlets to spot contract differences.', 'Month-on-month rise in any bucket triggers an alert.'] },
  { cat: 'Ads', t: 'Read ROAS by campaign and outlet', mins: 5, steps: ['Ads → Campaigns lists spend, attributed orders and ROAS.', 'Toggle Incremental to see orders you would likely have got anyway removed.', 'Sort by outlet to find where the same budget works hardest.'] },
  { cat: 'Discounts', t: 'Measure discount burn against your benchmark', mins: 5, steps: ['Discounts → Burn shows discount as % of gross by offer.', 'Set your benchmark per brand in Settings; anything above is flagged.', 'Coupon effectiveness ranks offers by contribution after burn, not just orders.'] },
  { cat: 'Refunds', t: 'Track refund rate and reasons per outlet', mins: 4, steps: ['Refunds → Reasons breaks refunds down by platform reason code.', 'A spike above your trailing average sends an alert to the outlet manager.', 'Export the list with order IDs to raise disputes.'] },
  { cat: 'Mynt AI', t: 'Ask Mynt: good questions to start with', mins: 3, steps: ['“Which outlet is hurting profitability the most?”', '“Why did net margin drop last week?”', '“Which discount has the worst contribution this month?”', 'Answers cite the tiles they read from — click through to verify.'] },
  { cat: 'Billing', t: 'Licence, outlets and invoices', mins: 2, steps: ['Mynt is licensed annually per brand, priced by active outlets.', 'Add or pause outlets any time; changes pro-rate on the next invoice.', 'Invoices and GST details live under Settings → Billing.'] },
]

const FAQ = [
  { q: 'Can Mynt change anything on my Zomato or Swiggy listing?', a: 'No. Mynt reads reports and statements. It never edits menus, prices, offers or availability.' },
  { q: 'How far back does data go?', a: 'On first connect Mynt backfills up to 90 days where the platform allows; forwarded statements can go back as far as you have them.' },
  { q: 'Who on my team can see what?', a: 'Roles are set per workspace: owners see everything, finance sees payouts and charges, growth sees ads and discounts, and outlet managers see only their outlet.' },
  { q: 'Is my data used to train AI models?', a: 'No. Mynt AI answers from your workspace data only. It is not used to train shared models and is never visible to another customer.' },
  { q: 'What if a statement doesn’t parse?', a: 'It lands under Needs review with the raw file attached. Assign the outlet manually or forward it to support — most cases are fixed the same day.' },
]

export default function Guides() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const list = GUIDES.filter((g) => (cat === 'All' || g.cat === cat) && (!q || `${g.t} ${g.cat} ${g.steps.join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <PageHero eyebrow="Mynt Guides / Help Centre" title="Set-up, metrics and how-tos — in the order you'll need them." lede="Short guides written by the team that onboards restaurants every week. Search, or start with Getting started.">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search guides</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides — payouts, ROAS, refunds…"
            className="w-full rounded-full border border-line bg-surface/80 px-5 py-3.5 pl-11 text-sm text-ink placeholder:text-mute/60 outline-none transition-colors focus:border-mint"
          />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </label>
      </PageHero>

      <Section tight className="pt-0">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn('rounded-full border px-4 py-2 text-sm transition-colors', cat === c ? 'border-mint bg-mint/10 text-mint' : 'border-line text-mute hover:text-ink')}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {list.map((g) => {
            const isOpen = open === g.t
            return (
              <Card key={g.t} className={cn('cursor-pointer', isOpen && 'border-mint/50')} onClick={() => setOpen(isOpen ? null : g.t)}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">{g.cat}</span>
                  <span className="text-xs text-mute">{g.mins} min</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{g.t}</h3>
                <div className={cn('grid transition-[grid-template-rows] duration-300', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <ol className="overflow-hidden text-sm leading-relaxed text-mute" role="list">
                    {g.steps.map((s, i) => (
                      <li key={s} className={cn('flex gap-3', i === 0 && 'pt-4', i === g.steps.length - 1 && 'pb-1')}>
                        <span className="mt-0.5 font-mono text-xs text-mint">{String(i + 1).padStart(2, '0')}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <span className="mt-3 inline-block text-xs text-mute">{isOpen ? 'Collapse' : 'Read guide →'}</span>
              </Card>
            )
          })}
          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-mute md:col-span-2">
              No guide matches “{q}”. Try a metric name, or <a href={CTA.expert} className="text-mint">ask an expert</a>.
            </div>
          )}
        </div>
      </Section>

      <Section id="faq" tight>
        <SectionHead eyebrow="FAQ" title="Questions we get on most onboarding calls." />
        <Accordion items={FAQ} className="max-w-3xl" />
      </Section>

      <Section tight className="pb-28">
        <Card glow className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Still stuck?</h2>
            <p className="mt-2 text-sm text-mute">Onboarding is included with every licence. A Pyvot expert will get you set up and read your first month with you.</p>
          </div>
          <Button to={CTA.expert}>Talk to an expert</Button>
        </Card>
      </Section>
    </>
  )
}
