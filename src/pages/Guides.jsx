import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Accordion, Button, GlowCard, PageHero, Reveal, Section, SectionHead } from '@/components/ui'
import { CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

const CATS = [
  'All Guides',
  'Getting started',
  'Connect platforms',
  'Payouts',
  'Ads',
  'Discounts',
  'Refunds',
  'Mynt AI',
  'Billing',
]

const GUIDES = [
  {
    id: 'setup-15',
    cat: 'Getting started',
    t: 'Set up your restaurant workspace in 15 minutes',
    mins: 4,
    badge: 'QUICK START',
    color: 'border-mint text-mint bg-mint/10',
    steps: [
      'Create your workspace and register your primary brand entity.',
      'Add outlets — name, city, Zomato/Swiggy outlet IDs, and store codes.',
      'Invite team members and configure granular roles (owner, finance, growth, ops, outlet manager).',
      'Connect your first platform: Mynt initiates automatic 90-day historic data backfill.',
    ],
  },
  {
    id: 'overview-tiles',
    cat: 'Getting started',
    t: 'Reading the Command Overview: what each tile means',
    mins: 5,
    badge: 'CORE METRICS',
    color: 'border-mint text-mint bg-mint/10',
    formula: 'Net Payout = Gross Orders − Aggregator Charges − Funded Discounts − Customer Refunds ± Adjustments',
    steps: [
      'Net Payout is what actually hits your bank account after all deductions.',
      'Net Margin % represents Net Payout ÷ Gross Order Value.',
      'Global Filter: clicking any outlet, city, or platform filters all 11 modules simultaneously.',
      'Date selector defaults to Latest Settlement Week with instant MoM like-for-like comparison.',
    ],
  },
  {
    id: 'connect-aggregators',
    cat: 'Connect platforms',
    t: 'Connect Zomato & Swiggy Merchant APIs',
    mins: 3,
    badge: 'INTEGRATION',
    color: 'border-amber text-amber bg-amber/10',
    steps: [
      'Navigate to Settings → Connected Sources → Add New Platform.',
      'Authorize via your merchant partner login and select the target outlets.',
      'Mynt scopes read-only report & telemetry tokens — never write or menu edit permissions.',
      'Initial 90-day sync finishes in under 5 minutes; automated daily reconciliations run at 05:00 IST.',
    ],
  },
  {
    id: 'email-payouts',
    cat: 'Connect platforms',
    t: 'Forward Payout Statements & Invoices by Email',
    mins: 3,
    badge: 'AUTO-INGESTION',
    color: 'border-amber text-amber bg-amber/10',
    steps: [
      'Copy your dedicated workspace ingestion address from Settings → Sources → Payouts.',
      'Configure an automated forward rule in Gmail or Outlook for aggregator settlement emails.',
      'Mynt’s proprietary OCR/parser parses PDF and CSV statement tables into ledger rows.',
      'Any unmatched or flagged statements show under "Needs Review" with 1-click outlet assignment.',
    ],
  },
  {
    id: 'reconcile-payouts',
    cat: 'Payouts',
    t: 'Reconcile Expected Orders vs Bank Received Payout',
    mins: 6,
    badge: 'FINANCIAL AUDIT',
    color: 'border-grape text-grape bg-grape/10',
    steps: [
      'Open Payouts module → select the target weekly or monthly settlement cycle.',
      'Expected amount is calculated from raw delivered orders; Received is extracted from bank credit notes.',
      'Discrepancy is split across commission creep, uncredited refunds, and penalty deductions.',
      'Tag discrepancies as "Explained" or "Raise Dispute with Aggregator" with auto-generated dispute sheets.',
    ],
  },
  {
    id: 'charge-waterfall',
    cat: 'Payouts',
    t: 'Demystifying the Platform Charge Waterfall',
    mins: 4,
    badge: 'DEDUCTIONS',
    color: 'border-grape text-grape bg-grape/10',
    steps: [
      'Deductions are grouped: Base Commission, Payment Gateway (PG), Packaging, Delivery Share, and GST.',
      'Compare charge % across outlets to detect contract misconfigurations or tier changes.',
      'Automated alerts trigger whenever any deduction bucket exceeds your historical 30-day baseline.',
    ],
  },
  {
    id: 'ads-roas',
    cat: 'Ads',
    t: 'Measuring True Incremental ROAS by Outlet & Campaign',
    mins: 5,
    badge: 'MARKETING ROI',
    color: 'border-coral text-coral bg-coral/10',
    steps: [
      'Open Ads Intelligence → Campaigns to inspect ad spend, attributed orders, and direct ROAS.',
      'Toggle the "Incremental Lift" filter to subtract baseline organic orders you would have received anyway.',
      'Sort campaigns by outlet contribution margin to relocate budget to top-performing kitchen radiuses.',
    ],
  },
  {
    id: 'discounts-burn',
    cat: 'Discounts',
    t: 'Auditing Discount Burn & Coupon Effectiveness',
    mins: 5,
    badge: 'PROFITABILITY',
    color: 'border-coral text-coral bg-coral/10',
    steps: [
      'Discounts → Burn shows discount cost as a % of Gross Order Value per offer code.',
      'Configure your brand margin threshold (e.g. max 18% total discount subsidy).',
      'Coupon Effectiveness ranks offers by net gross profit after cost, not just order count vanity.',
    ],
  },
  {
    id: 'refunds-tracking',
    cat: 'Refunds',
    t: 'Diagnosing Customer Refund Spikes & Reason Codes',
    mins: 4,
    badge: 'OPERATIONS',
    color: 'border-mint text-mint bg-mint/10',
    steps: [
      'Refunds → Reasons breaks disputes down by aggregator fault codes (Missing Item, Spillage, Delay).',
      'Sudden surges alert store managers in real time to kitchen prep or packaging issues.',
      'Export one-click evidence reports with Order IDs and timestamps to claim aggregator reimbursement.',
    ],
  },
  {
    id: 'mynt-ai-prompts',
    cat: 'Mynt AI',
    t: 'Prompting Mynt AI: High-Impact Financial Questions',
    mins: 3,
    badge: 'AI ANALYST',
    color: 'border-mint text-mint bg-mint/10',
    steps: [
      '“Which outlet suffered the largest net margin contraction this week, and what drove it?”',
      '“Compare ROAS on Zomato vs Swiggy campaigns for the Salt Lake branch.”',
      '“Show all payout adjustments above ₹500 that remain unsettled this month.”',
      'Every answer provides citations to the underlying ledger row for instant verification.',
    ],
  },
  {
    id: 'billing-licence',
    cat: 'Billing',
    t: 'Managing Brand Outlets, Licenses & Tax Invoices',
    mins: 2,
    badge: 'WORKSPACE',
    color: 'border-mint text-mint bg-mint/10',
    steps: [
      'Mynt is licensed simply per active outlet per year — with unlimited seats for your team.',
      'Add or pause branch outlets at any time; billing pro-rates automatically.',
      'Download GST-compliant tax invoices anytime under Settings → Billing.',
    ],
  },
]

const QUICK_SEARCH_CHIPS = ['Payout Reconcile', 'Zomato API', 'Discount Burn', 'ROAS', 'Refunds', 'Mynt AI']

const FAQ = [
  {
    q: 'Can Mynt modify menus, prices, or store status on Zomato or Swiggy?',
    a: 'No. Mynt operates strictly with read-only report and statement ingestion tokens. It has zero capabilities or permissions to alter your active store listings, menu pricing, or operational status.',
  },
  {
    q: 'How far back can Mynt backfill historic restaurant data?',
    a: 'Upon first API connection, Mynt automatically backfills up to 90 days of historic order telemetry. For forwarded email payout statements and CSVs, we can ingest as many historic years as you possess.',
  },
  {
    q: 'How do role permissions work for multi-outlet restaurant chains?',
    a: 'Workspace admins can assign roles per user. Outlet store managers only view data for their assigned branch; finance teams see payout ledgers and reconciliation; brand founders and partners see consolidated group analytics.',
  },
  {
    q: 'Is our restaurant financial data used to train public AI models?',
    a: 'Absolutely not. Mynt AI queries strictly against your private tenant database context using retrieval-augmented prompts. Your sales, margin numbers, and formulas are never fed into shared LLM training weights.',
  },
  {
    q: 'What happens if a complex PDF payout statement fails to parse?',
    a: 'It is routed to a secure "Needs Review" queue with the original PDF attached. You can assign the outlet with one click, or our dedicated onboarding engineering team will resolve the layout pattern within hours.',
  },
]

export default function Guides() {
  const [cat, setCat] = useState('All Guides')
  const [q, setQ] = useState('')
  const [openGuide, setOpenGuide] = useState(null)
  const [completedSteps, setCompletedSteps] = useState({})

  const list = useMemo(() => {
    return GUIDES.filter((g) => {
      const matchCat = cat === 'All Guides' || g.cat === cat
      const matchQ =
        !q ||
        `${g.t} ${g.cat} ${g.badge} ${g.steps.join(' ')} ${g.formula || ''}`
          .toLowerCase()
          .includes(q.toLowerCase().trim())
      return matchCat && matchQ
    })
  }, [cat, q])

  const toggleStep = (guideId, stepIdx) => {
    setCompletedSteps((prev) => {
      const key = `${guideId}-${stepIdx}`
      return { ...prev, [key]: !prev[key] }
    })
  }

  return (
    <>
      {/* Animated Help Centre Hero with Floating Ambient Elements */}
      <PageHero
        eyebrow="Mynt Guides & Knowledge Base"
        title={
          <>
            Operator manuals, formulas & <span className="text-gradient">how-tos.</span>
          </>
        }
        lede="Written by the engineering and restaurant ops team that onboards brands every week. Search any metric, integration, or financial formula."
      >
        {/* Interactive Search Bar with Glow */}
        <div className="relative mx-auto max-w-2xl">
          <div className="relative flex items-center">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guides — e.g. payout mismatch, ROAS, Zomato API..."
              className="w-full rounded-2xl border border-line bg-surface/90 px-5 py-4 pl-12 font-sans text-sm text-ink placeholder:text-mute/60 outline-none transition-all duration-300 focus:border-mint focus:shadow-[0_0_30px_rgba(47,211,154,0.2)]"
            />
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 h-5 w-5 text-mute"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-4 text-xs font-mono text-mute hover:text-ink"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Quick-Filter Search Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-mute">
            <span className="font-mono text-[10px] uppercase tracking-wider">Popular:</span>
            {QUICK_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQ(chip)}
                className="rounded-full border border-line/60 bg-card/60 px-2.5 py-1 font-mono text-[11px] text-mute hover:border-mint/50 hover:text-mint transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </PageHero>

      <Section tight className="pt-0">
        {/* Interactive Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-6" role="tablist">
          {CATS.map((c) => {
            const isSelected = cat === c
            const count = c === 'All Guides' ? GUIDES.length : GUIDES.filter((g) => g.cat === c).length
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setCat(c)}
                className={cn(
                  'relative rounded-full border px-4 py-2 font-medium text-xs transition-all duration-200',
                  isSelected
                    ? 'border-mint bg-mint/10 text-mint font-semibold shadow-sm'
                    : 'border-line text-mute hover:border-line/90 hover:text-ink',
                )}
              >
                <span>{c}</span>
                <span className="ml-2 rounded-full bg-bg/80 px-1.5 py-0.5 font-mono text-[10px] text-mute">
                  {count}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="activeGuideCat"
                    className="absolute -bottom-6 left-2 right-2 h-0.5 bg-mint"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Guides Grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {list.map((g) => {
            const isOpen = openGuide === g.id
            return (
              <GlowCard
                key={g.id}
                as="div"
                onClick={() => setOpenGuide(isOpen ? null : g.id)}
                className={cn(
                  'cursor-pointer transition-all duration-300',
                  isOpen && 'border-mint/60 shadow-[0_0_30px_rgba(47,211,154,0.12)]',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={cn('rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', g.color)}>
                    {g.badge}
                  </span>
                  <span className="font-mono text-xs text-mute flex items-center gap-1">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                    </svg>
                    {g.mins} min read
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-ink hover:text-mint transition-colors">{g.t}</h3>

                {g.formula && (
                  <div className="mt-3 rounded-xl border border-mint/20 bg-mint/5 p-3 font-mono text-xs text-mint">
                    <span className="text-[10px] text-mute block uppercase tracking-widest mb-1">Calculation Formula</span>
                    {g.formula}
                  </div>
                )}

                {/* Animated Steps Drawer */}
                <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr] mt-5 pt-4 border-t border-line/60' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-mint">Execution Checklist:</div>
                    <ol className="space-y-3 text-sm text-ink/90">
                      {g.steps.map((step, i) => {
                        const isDone = completedSteps[`${g.id}-${i}`]
                        return (
                          <li
                            key={step}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStep(g.id, i)
                            }}
                            className={cn(
                              'group flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer',
                              isDone ? 'bg-mint/5 text-mute line-through' : 'hover:bg-card/80',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-xs transition-colors',
                                isDone ? 'border-mint bg-mint text-[#06251a] font-bold' : 'border-line text-mute group-hover:border-mint',
                              )}
                            >
                              {isDone ? '✓' : String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 text-xs font-mono text-mint">
                  <span>{isOpen ? 'Collapse checklist ↑' : 'Expand step-by-step checklist →'}</span>
                  <span className="text-mute group-hover:text-ink">{g.cat}</span>
                </div>
              </GlowCard>
            )
          })}

          {list.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line/80 p-12 text-center text-sm text-mute md:col-span-2">
              <p className="text-base font-semibold text-ink">No guides found matching “{q}”</p>
              <p className="mt-2 text-xs">Try searching for generic terms like &quot;payouts&quot;, &quot;ROAS&quot;, or &quot;API&quot;.</p>
              <Button to={CTA.expert} variant="ghost" size="sm" className="mt-5">
                Ask a Pyvot Onboarding Expert Directly →
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* Interactive FAQ Section */}
      <Section id="faq" tight>
        <SectionHead
          eyebrow="Onboarding FAQ"
          title="Frequently asked questions on data, security & setup."
          lede="Everything restaurant operators ask during their first 30 days."
        />
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQ} />
        </div>
      </Section>

      {/* Hands-On Onboarding Support Banner */}
      <Section tight className="pb-28">
        <Reveal>
          <GlowCard className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center border-mint/40 bg-gradient-to-r from-card/90 to-surface/90">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-mint">Zero Setup Overhead</span>
              <h2 className="mt-1 text-2xl font-bold text-ink">Want our engineering team to handle onboarding?</h2>
              <p className="mt-2 max-w-xl text-sm text-mute">
                White-glove setup and 90-day historic backfill is included with every annual license. A dedicated onboarding partner walks through your first statement with you.
              </p>
            </div>
            <Button to={CTA.expert} size="lg" className="shrink-0">
              Schedule Setup Session
            </Button>
          </GlowCard>
        </Reveal>
      </Section>
    </>
  )
}
