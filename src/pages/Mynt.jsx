import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import CtaPair from '@/components/CtaPair'
import HeroDashboard from '@/components/sections/HeroDashboard'
import TrustSecuritySection from '@/components/sections/TrustSecuritySection'
import { MyntMark } from '@/components/Brand'
import { Button, Card, Eyebrow, InteractiveCard, Reveal, Section, SectionHead } from '@/components/ui'
import { CTA } from '@/lib/site'
import { cn, reducedMotion } from '@/lib/utils'

/* ------------------------------------------------------------------ data -- */

const HOW_STEPS = [
  { n: '01', t: 'Connect', s: 'Bring your restaurant data together.', d: 'Connect supported marketplaces and data sources, including platform reports, payout statements and outlet information.' },
  { n: '02', t: 'Organise', s: 'Turn different formats into one model.', d: 'Mynt maps the data to the correct brand, outlet, platform and date — without rebuilding the same spreadsheet every month.' },
  { n: '03', t: 'Understand', s: 'See the business clearly.', d: 'The same data powers your dashboards, comparisons, alerts, AI Assistant and reports.' },
  { n: '04', t: 'Act', s: 'Know what deserves attention.', d: 'When something changes — margin, payouts, refunds, charges, ads or discounts — Mynt helps surface the issue instead of leaving you to find it manually.' },
]

const FLOW_SOURCES = ['Zomato', 'Swiggy', 'Statements', 'Reports', 'Outlet Data']
const FLOW_OUTPUTS = ['Dashboards', 'Compare', 'AI', 'Reports']

const DASHBOARDS = [
  { key: 'overview', label: 'Overview', title: 'See the business in one screen.', body: 'Gross Order Value, orders, AOV, net payout, net margin, ads, discounts, charges, refunds and platform performance — together.', shot: 'overview' },
  { key: 'revenue', label: 'Revenue', title: 'Understand where growth is coming from.', body: 'Track orders, Gross Order Value, AOV and revenue movement across brands, outlets, platforms and periods.', shot: 'revenue' },
  { key: 'payouts', label: 'Payouts', title: 'Know what you earned and what you actually received.', body: 'Understand settlements, deductions, adjustments and payout differences without manually reconciling statements.', shot: 'payouts' },
  { key: 'ads', label: 'Ads', title: 'See whether your advertising is creating worthwhile growth.', body: 'Track spend, ROAS and performance across platforms, campaigns and outlets.', shot: 'ads' },
  { key: 'discounts', label: 'Discounts', title: 'Understand what every discount is costing you.', body: 'Track discount burn, coupon performance and contribution so growth is not bought at the expense of profitability.', shot: 'discounts' },
  { key: 'charges', label: 'Charges', title: 'See exactly what platforms are deducting.', body: 'Break down platform charges and understand how each deduction affects the final payout.', shot: 'charges' },
  { key: 'refunds', label: 'Refunds', title: 'Spot leakage before it becomes normal.', body: 'Track refund and cancellation rates, reasons, trends and their financial impact.', shot: 'refunds' },
]

const TEAMS = [
  { t: 'Owner', d: 'Start with net margin, payout, major changes and actions.' },
  { t: 'Finance', d: 'Go deeper into payouts, charges, refunds and reconciliation.' },
  { t: 'Growth', d: 'Focus on revenue, ads, discounts and platform performance.' },
  { t: 'Operations', d: 'Compare outlets, identify exceptions and act on operational alerts.' },
]

const COMPARE_MODES = [
  { t: 'Compare outlets', d: 'Find which locations are outperforming and which ones need attention.' },
  { t: 'Compare platforms', d: 'See Zomato, Swiggy and other supported channels side by side.' },
  { t: 'Compare periods', d: 'Understand what changed versus the previous week, month or selected period.' },
  { t: 'Compare brands or groups', d: 'Move from the group view to the brand, outlet or platform level without rebuilding the analysis.' },
]

// numeric values only scale the bars — display strings are what the reader sees
const COMPARE_SETS = {
  outlets: {
    a: 'Park Street',
    b: 'Salt Lake',
    insight: 'Salt Lake’s margin gap is driven by discount burn and ad spend — not by lower demand.',
    rows: [
      { label: 'Revenue', a: '₹12.4L', av: 124, b: '₹9.1L', bv: 91 },
      { label: 'Orders', a: '4,210', av: 4210, b: '3,380', bv: 3380 },
      { label: 'AOV', a: '₹464', av: 464, b: '₹447', bv: 447 },
      { label: 'Ads', a: '₹48k', av: 48, b: '₹92k', bv: 92, driver: true, worse: 'b' },
      { label: 'Discounts', a: '₹1.02L', av: 102, b: '₹1.58L', bv: 158, driver: true, worse: 'b' },
      { label: 'Charges', a: '₹2.61L', av: 261, b: '₹2.02L', bv: 202 },
      { label: 'Net Payout', a: '₹6.4L', av: 640, b: '₹4.2L', bv: 420 },
      { label: 'Net Margin', a: '53.7%', av: 53.7, b: '46.2%', bv: 46.2, driver: true, worse: 'b' },
    ],
  },
  platforms: {
    a: 'Zomato',
    b: 'Swiggy',
    insight: 'Zomato brings the volume but carries heavier ads and charges — watch the effective margin, not the GOV.',
    rows: [
      { label: 'Revenue', a: '₹8.71L', av: 871, b: '₹5.10L', bv: 510 },
      { label: 'Orders', a: '1,858', av: 1858, b: '1,178', bv: 1178 },
      { label: 'AOV', a: '₹469', av: 469, b: '₹433', bv: 433 },
      { label: 'Ads', a: '₹66k', av: 66, b: '₹27k', bv: 27, driver: true, worse: 'a' },
      { label: 'Discounts', a: '₹1.74L', av: 174, b: '₹1.33L', bv: 133 },
      { label: 'Charges', a: '₹1.98L', av: 198, b: '₹1.15L', bv: 115, driver: true, worse: 'a' },
      { label: 'Net Payout', a: '₹4.35L', av: 435, b: '₹2.38L', bv: 238 },
      { label: 'Net Margin', a: '49.9%', av: 49.9, b: '46.6%', bv: 46.6 },
    ],
  },
}

const AI_QUESTIONS = [
  'Why did my payout drop last week?',
  'Which outlet is hurting profitability the most?',
  'Are my ads actually generating profitable growth?',
  'Which discount is burning too much?',
  'What changed compared with last month?',
  'Where should my team focus today?',
]

const AI_ANATOMY = [
  { t: 'The answer', d: 'What happened.' },
  { t: 'The drivers', d: 'What caused it.' },
  { t: 'The supporting numbers', d: 'What data the conclusion is based on.' },
  { t: 'The next action', d: 'What deserves attention now.' },
]

const AI_ANSWER = 'Salt Lake has the lowest net margin this month at 46.2% versus the brand average of 53.7%, primarily because of higher discount burn and ad spend.'
const AI_CHART = [
  { o: 'Park Street', v: 55.4 },
  { o: 'Esplanade', v: 54.1 },
  { o: 'Jubilee Hills', v: 52.9 },
  { o: 'Salt Lake', v: 46.2, low: true },
]

const REPORT_STEPS = [
  { t: 'Choose what to report', d: 'Select the brand, outlet, platform, period and metrics.' },
  { t: 'Generate automatically', d: 'Mynt converts the selected data into a clean, structured business report.' },
  { t: 'Share with the right team', d: 'Create owner summaries, finance reviews, growth reports or outlet-level performance reports.' },
  { t: 'Repeat without repeating the work', d: 'Schedule recurring reports where supported so the same review reaches the right people automatically.' },
]

const REPORT_SECTIONS = ['Executive Summary', 'Revenue', 'Payout', 'Ads', 'Discounts', 'Charges', 'Outlet Comparison', 'Key Changes', 'Actions']

const TRUST_FLOW = [
  { name: 'Raw Sources', sub: 'Marketplaces · statements · reports' },
  { name: 'Normalised Data', sub: 'One schema, every source' },
  { name: 'Reconciled Records', sub: 'Matched & validated' },
  { name: 'Verified Metrics', sub: 'Two-decimal precision' },
  { name: 'Mynt', sub: 'Dashboards · Reports · AI' },
]

const TRUST_POINTS = [
  { t: 'Fully reconciled data model', d: 'Every metric is internally reconciled across all available sources — marketplace data, payout statements, platform reports and outlet-level records. Revenue, costs, deductions, refunds and adjustments are matched and validated before being surfaced.' },
  { t: 'One definition. One truth.', d: 'Every metric has a single, consistent definition across dashboards, reports and AI responses. There is no variation in how revenue, net payout, margin or costs are calculated — every team works from the same financial truth.' },
  { t: 'Precision you can rely on', d: 'All financial metrics are calculated and displayed with exact precision up to two decimal points. No rounding ambiguity, no approximation, no hidden variance.' },
  { t: 'Zero uncertainty in displayed data', d: 'Mynt does not surface incomplete, unverified or low-confidence data. If data is missing or delayed it is explicitly flagged — never blended into totals. You always see a fully verified number or a clearly indicated data gap. Nothing in between.' },
  { t: 'Expert-validated accuracy', d: 'Reconciliation logic and financial models are reviewed and validated with industry experts, restaurant operators and growth strategists — so the numbers are technically correct and operationally meaningful.' },
  { t: 'End-to-end internal reconciliation', d: 'From ingestion to final output, every data point passes through structured reconciliation: revenue matches order-level records, payouts match settlement statements, costs align with source transactions.' },
]

const TRUST_STATUS = [
  { l: 'Reconciliation Status', v: 'Complete' },
  { l: 'Data Confidence', v: '100% Verified' },
  { l: 'Precision', v: 'Two Decimal Accuracy' },
  { l: 'Coverage', v: 'All Connected Sources' },
]

const PRICING_POINTS = [
  { t: 'Annual subscription', d: 'Simple annual licensing instead of monthly plan complexity.' },
  { t: 'Outlet-based pricing', d: 'Pricing scales with the number of outlets connected to Mynt.' },
  { t: 'Add outlets as you grow', d: 'Expand the account when new locations are added.' },
  { t: 'No separate dashboard plans', d: 'You should not need one plan for payouts, another for ads and another for profitability.' },
]

/* --------------------------------------------------- shared motion props -- */

const inView = { once: false, margin: '-10% 0px' }

/* ------------------------------------------------- section 2: flow visual -- */

// Zomato/Swiggy/Statements/Reports/Outlet Data → MYNT → Dashboards/Compare/AI/Reports
// One tight braid: every path shares the same curvature family, merges into a
// single spine through the MYNT core, then fans out. Dashes march while in view.
const SRC_Y = [48, 104, 160, 216, 272]
const OUT_Y = [64, 128, 192, 256]
const flowIn = (y) => `M 0 ${y} C 72 ${y}, 84 160, 150 160`
const flowOut = (y) => `M 250 160 C 316 160, 328 ${y}, 400 ${y}`
const FLOW_PATHS = [...SRC_Y.map(flowIn), 'M 150 160 H 250', ...OUT_Y.map(flowOut)]

function FlowDiagram() {
  const rm = reducedMotion()
  const box = useRef(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (rm) return undefined
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting))
    io.observe(box.current)
    return () => io.disconnect()
  }, [rm])

  const pill = (side) =>
    cn(
      'absolute flex h-10 w-full items-center rounded-xl border border-line/70 bg-card/80 px-4 text-xs font-medium text-ink',
      side === 'l' ? 'justify-end border-r-2 border-r-mint/40 text-right' : 'justify-start border-l-2 border-l-mint/40',
    )

  return (
    <div ref={box}>
      {/* desktop */}
      <div className="mx-auto hidden max-w-5xl items-center gap-3 lg:grid lg:grid-cols-[11rem_1fr_11rem]">
        <div className="relative h-[320px]">
          {FLOW_SOURCES.map((s, i) => (
            <span key={s} className={pill('l')} style={{ top: SRC_Y[i] - 20 }}>{s}</span>
          ))}
        </div>
        <div className="relative h-[320px]">
          <svg viewBox="0 0 400 320" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            {FLOW_PATHS.map((d) => (
              <path key={d} d={d} fill="none" stroke="rgba(47,211,154,0.16)" strokeWidth="1.5" />
            ))}
            {live &&
              FLOW_PATHS.map((d, i) => (
                <motion.path
                  key={`m${d}`}
                  d={d}
                  fill="none"
                  stroke="rgba(47,211,154,0.65)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="3 13"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, strokeDashoffset: [0, -32] }}
                  transition={{
                    opacity: { duration: 0.6, delay: i * 0.05 },
                    strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: 'linear' },
                  }}
                />
              ))}
          </svg>
          {/* MYNT core with breathing glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              aria-hidden
              className="absolute -inset-4 rounded-3xl bg-mint/20 blur-2xl"
              animate={live ? { opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.06, 0.95] } : { opacity: 0.5 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative rounded-2xl border border-mint/40 bg-bg px-5 py-3 shadow-[0_0_40px_rgba(47,211,154,0.3)]">
              <MyntMark className="h-6" wordClass="text-lg" />
            </div>
          </div>
        </div>
        <div className="relative h-[320px]">
          {FLOW_OUTPUTS.map((s, i) => (
            <span key={s} className={pill('r')} style={{ top: OUT_Y[i] - 20 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* mobile: the same flow as a compact strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 lg:hidden" aria-hidden>
        {FLOW_SOURCES.map((s) => (
          <span key={s} className="rounded-full border border-line/70 bg-card/70 px-3 py-1.5 text-[11px] text-mute">{s}</span>
        ))}
        <span className="text-mint">→</span>
        <span className="rounded-full border border-mint/50 bg-mint/10 px-4 py-1.5 text-[11px] font-bold text-mint">MYNT</span>
        <span className="text-mint">→</span>
        {FLOW_OUTPUTS.map((s) => (
          <span key={s} className="rounded-full border border-line/70 bg-card/70 px-3 py-1.5 text-[11px] text-mute">{s}</span>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------- section 3: dashboard tabs -- */

function DashboardTabs() {
  const [tab, setTab] = useState(0)
  const [auto, setAuto] = useState(() => !reducedMotion())
  const hover = useRef(false)
  const vis = useRef(false)
  const box = useRef(null)
  const d = DASHBOARDS[tab]

  useEffect(() => {
    if (!auto) return undefined
    const io = new IntersectionObserver(([e]) => { vis.current = e.isIntersecting })
    io.observe(box.current)
    const t = setInterval(() => {
      if (!vis.current || hover.current) return
      setTab((v) => (v + 1) % DASHBOARDS.length)
    }, 4500)
    return () => { io.disconnect(); clearInterval(t) }
  }, [auto])

  const pick = (i) => { setAuto(false); setTab(i) }

  return (
    <div ref={box}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dashboards">
        {DASHBOARDS.map((x, i) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === i}
            onClick={() => pick(i)}
            className={cn(
              'relative rounded-full border border-transparent px-4 py-2 text-sm transition-colors',
              tab === i ? 'text-mint' : 'text-mute hover:text-ink',
            )}
          >
            {tab === i && (
              <motion.span
                layoutId="mynt-dash-pill"
                aria-hidden
                style={{ position: 'absolute' }}
                className="lq lq-pill inset-0 rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{x.label}</span>
          </button>
        ))}
      </div>

      <div
        className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_1.7fr]"
        role="tabpanel"
        onMouseEnter={() => { hover.current = true }}
        onMouseLeave={() => { hover.current = false }}
      >
        <div className="min-h-[132px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold md:text-3xl">{d.title}</h3>
              <p className="mt-3 text-mute">{d.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* glassy interactive frame around the live product shot */}
        <Reveal>
          <InteractiveCard maxTilt={4} className="glass rounded-2xl border-white/10 p-0 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <div className="relative aspect-[1280/1000] bg-[#0d1119]">
              {DASHBOARDS.map((x, i) => (
                <img
                  key={x.key}
                  src={`/shots/${x.shot}.jpg`}
                  alt={`${x.label} dashboard`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', tab === i ? 'opacity-100' : 'opacity-0')}
                />
              ))}
            </div>
            {auto && (
              <motion.div
                key={tab}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 4.5, ease: 'linear' }}
                className="h-0.5 origin-left bg-mint/60"
              />
            )}
          </InteractiveCard>
        </Reveal>
      </div>
    </div>
  )
}

/* -------------------------------------------- section 4: compare (duel) -- */

function CompareDuel() {
  const [mode, setMode] = useState('outlets')
  const set = COMPARE_SETS[mode]

  const bar = (r, side) => {
    const v = side === 'a' ? r.av : r.bv
    const pct = Math.max(10, (v / Math.max(r.av, r.bv)) * 100)
    const losing = r.driver && r.worse === side
    return (
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={inView}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn(
          'h-2.5 rounded-full',
          losing
            ? 'bg-gradient-to-r from-coral/40 to-coral shadow-[0_0_14px_rgba(240,82,78,0.45)]'
            : side === 'a'
              ? 'bg-gradient-to-l from-mint to-mint/30'
              : 'bg-gradient-to-r from-grape/30 to-grape',
          side === 'a' && losing && 'bg-gradient-to-l from-coral/40 to-coral',
        )}
      />
    )
  }

  return (
    <div className="rounded-3xl border border-line/80 bg-surface/60 p-5 backdrop-blur-md md:p-10">
      {/* toggle */}
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-full border border-line/70 bg-bg/60 p-1" role="tablist" aria-label="Comparison type">
          {[['outlets', 'Outlets'], ['platforms', 'Platforms']].map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={cn('relative rounded-full px-5 py-2 text-sm transition-colors', mode === k ? 'text-mint' : 'text-mute hover:text-ink')}
            >
              {mode === k && (
                <motion.span
                  layoutId="mynt-cmp-pill"
                  aria-hidden
                  style={{ position: 'absolute' }}
                  className="lq lq-pill inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* contenders */}
      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center justify-end gap-2 text-right">
          <span className="text-lg font-bold md:text-2xl">{set.a}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">vs</span>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-grape" aria-hidden />
          <span className="text-lg font-bold md:text-2xl">{set.b}</span>
        </div>
      </div>

      {/* the duel */}
      <div className="mt-8 space-y-4">
        {set.rows.map((r) => (
          <div key={r.label} className={cn('grid grid-cols-[1fr_96px_1fr] items-center gap-2 md:gap-4', r.driver && 'rounded-xl bg-coral/[0.04] py-1')}>
            <div className="flex items-center justify-end gap-2 md:gap-3">
              <span className={cn('shrink-0 text-xs font-semibold tabular-nums md:text-sm', r.driver && r.worse === 'a' ? 'text-coral' : 'text-ink')}>{r.a}</span>
              <div className="flex w-full max-w-[260px] justify-end">{bar(r, 'a')}</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-mute md:text-[10px]">{r.label}</div>
              {r.driver && (
                <span className="mt-1 inline-block animate-pulse rounded-full border border-coral/50 bg-coral/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-coral">
                  Driver
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-full max-w-[260px]">{bar(r, 'b')}</div>
              <span className={cn('shrink-0 text-xs font-semibold tabular-nums md:text-sm', r.driver && r.worse === 'b' ? 'text-coral' : 'text-ink')}>{r.b}</span>
            </div>
          </div>
        ))}
      </div>

      {/* auto-surfaced insight */}
      <AnimatePresence mode="wait">
        <motion.p
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto mt-8 max-w-xl border-l-2 border-mint pl-4 text-sm leading-relaxed text-ink/85"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mint">Mynt insight · </span>
          {set.insight}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------- section 5: conversation -- */

function AiConversation() {
  const rm = reducedMotion()
  const [step, setStep] = useState(() => (rm ? 5 : 0))
  const [typed, setTyped] = useState(() => (rm ? AI_ANSWER : ''))
  const ref = useRef(null)
  const ran = useRef(false)

  useEffect(() => {
    if (rm) return undefined
    const timers = []
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || ran.current) return
        ran.current = true
        io.disconnect()
        timers.push(setTimeout(() => setStep(1), 200))
        timers.push(setTimeout(() => setStep(2), 1000))
        timers.push(
          setTimeout(() => {
            setStep(3)
            let i = 0
            const t = setInterval(() => {
              i += 2
              setTyped(AI_ANSWER.slice(0, i))
              if (i >= AI_ANSWER.length) {
                clearInterval(t)
                setTyped(AI_ANSWER)
                setStep(4)
                timers.push(setTimeout(() => setStep(5), 600))
              }
            }, 22)
            timers.push(t)
          }, 2100),
        )
      },
      { threshold: 0.35 },
    )
    io.observe(ref.current)
    return () => {
      io.disconnect()
      timers.forEach((t) => { clearTimeout(t); clearInterval(t) })
    }
  }, [rm])

  return (
    <div ref={ref} className="glass rounded-3xl border border-white/10 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:p-8">
      <div className="flex items-center justify-between border-b border-line/60 pb-4">
        <div className="flex items-center gap-2">
          <MyntMark className="h-5" withWord={false} />
          <span className="text-sm font-bold">Mynt AI</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-mint">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Connected to your data
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {/* you */}
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md border border-mint/25 bg-mint/[0.08] px-4 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-mint">You</div>
              <p className="mt-1 text-sm text-ink">Which outlet is hurting profitability the most?</p>
            </div>
          </motion.div>
        )}

        {/* typing indicator */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 px-4 py-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </motion.div>
        )}

        {/* mynt */}
        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line/70 bg-card/80 px-4 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-mute">Mynt</div>
              <p className="mt-1 text-sm leading-relaxed text-ink">
                {typed}
                {step === 3 && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-mint align-middle" aria-hidden />}
              </p>
            </div>
          </motion.div>
        )}

        {/* suggested action */}
        {step >= 4 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-1 flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3">
            <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-amber">Suggested action</span>
            <p className="text-sm text-ink/90">Review Salt Lake&rsquo;s weekday ad spend and active discount codes.</p>
          </motion.div>
        )}

        {/* supporting chart */}
        {step >= 5 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-line/70 bg-bg/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink">Net margin by outlet · this month</span>
              <span className="font-mono text-[9px] text-mute">brand avg 53.7%</span>
            </div>
            <div className="space-y-2.5">
              {AI_CHART.map((c, i) => (
                <div key={c.o} className="grid grid-cols-[92px_1fr_46px] items-center gap-2">
                  <span className="truncate text-[11px] text-mute">{c.o}</span>
                  <div className="relative h-2 rounded-full bg-line/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.v / 60) * 100}%` }}
                      transition={{ duration: 0.7, delay: i * 0.12, ease: 'easeOut' }}
                      className={cn('h-2 rounded-full', c.low ? 'bg-coral shadow-[0_0_10px_rgba(240,82,78,0.5)]' : 'bg-mint/80')}
                    />
                    <span className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 border-l border-dashed border-mute/60" style={{ left: `${(53.7 / 60) * 100}%` }} aria-hidden />
                  </div>
                  <span className={cn('text-right text-[11px] font-semibold tabular-nums', c.low ? 'text-coral' : 'text-ink')}>{c.v}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------- section 6: report preview -- */

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const itemV = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } } }

function ReportPreview() {
  return (
    <div className="relative">
      {/* paper stack for depth */}
      <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rotate-[1.8deg] rounded-2xl border border-line/40 bg-card/30" />
      <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 rotate-[0.9deg] rounded-2xl border border-line/60 bg-card/50" />
      <Card glow className="relative p-6 md:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">Mynt · Monthly Report</div>
        <h3 className="mt-2 text-xl font-bold md:text-2xl">Monthly Performance Report — Arsalan</h3>
        <div className="mt-1 text-xs text-mute">June 2026 · All outlets · All platforms</div>

        <motion.ul variants={listV} initial="hidden" whileInView="show" viewport={inView} className="mt-6 space-y-2.5" role="list">
          {REPORT_SECTIONS.map((s, i) => (
            <motion.li key={s} variants={itemV} className="flex items-center gap-3 text-sm">
              <span className="w-5 shrink-0 font-mono text-[10px] text-mute">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-ink/90">{s}</span>
              <span className="mx-1 h-px flex-1 border-b border-dashed border-line/70" aria-hidden />
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-mint" aria-hidden>
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </motion.li>
          ))}
        </motion.ul>

        {/* mock controls — part of the preview, not live actions */}
        <div className="mt-7 flex flex-wrap gap-2" aria-hidden>
          <span className="rounded-full bg-mint px-4 py-2 text-xs font-semibold text-[#06251a]">Generate Report</span>
          <span className="rounded-full border border-line px-4 py-2 text-xs text-ink">Download</span>
          <span className="rounded-full border border-line px-4 py-2 text-xs text-ink">Schedule</span>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------ section 7: trust pipeline -- */

// Vertical verification flow: data drips down the spine, each checkpoint
// seals with a tick as the pulse passes, the Mynt node glows at the end.
function TrustPipeline() {
  const rm = reducedMotion()
  const box = useRef(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (rm) return undefined
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting))
    io.observe(box.current)
    return () => io.disconnect()
  }, [rm])

  const draw = rm
    ? { initial: { pathLength: 1 } }
    : { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: inView, transition: { duration: 0.5, ease: 'easeOut' } }

  return (
    <div ref={box} className="glass relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)] md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Verification flow</span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-mint">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Live
        </span>
      </div>

      <div className="relative">
        {/* spine + travelling drops */}
        <div className="absolute bottom-5 left-[21px] top-5 w-px bg-gradient-to-b from-mint/10 via-mint/35 to-mint/60" aria-hidden />
        {live &&
          [0, 1.6].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden
              className="absolute left-[18px] h-[7px] w-[7px] rounded-full bg-mint shadow-[0_0_10px_rgba(47,211,154,0.9)]"
              initial={{ top: '0%', opacity: 0 }}
              animate={{ top: ['2%', '96%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.2, delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

        <div className="space-y-5">
          {TRUST_FLOW.map((f, i) => {
            const last = i === TRUST_FLOW.length - 1
            return (
              <div key={f.name} className="relative flex items-center gap-4">
                <motion.span
                  className={cn(
                    'relative z-10 grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border bg-bg',
                    last ? 'border-mint shadow-[0_0_28px_rgba(47,211,154,0.45)]' : 'border-mint/40',
                  )}
                  initial={false}
                  animate={live && !rm ? { boxShadow: ['0 0 0px rgba(47,211,154,0)', '0 0 18px rgba(47,211,154,0.55)', '0 0 0px rgba(47,211,154,0)'] } : {}}
                  transition={{ duration: 3.2, delay: 0.3 + i * 0.62, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {last ? (
                    <MyntMark className="h-4" withWord={false} />
                  ) : (
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-mint" aria-hidden>
                      <motion.path d="M4 10.5l4 4 8-9" {...draw} transition={{ ...draw.transition, delay: 0.15 + i * 0.18 }} />
                    </svg>
                  )}
                </motion.span>
                <div className="min-w-0">
                  <div className={cn('text-sm font-semibold', last ? 'text-mint' : 'text-ink')}>{f.name}</div>
                  <div className="text-[11px] leading-snug text-mute">{f.sub}</div>
                </div>
                {!last && (
                  <span className="ml-auto hidden font-mono text-[9px] uppercase tracking-[0.16em] text-mint/70 sm:block" aria-hidden>
                    Verified ✓
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- the page -- */

export default function Mynt() {
  return (
    <>
      {/* 1 · hero */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <Eyebrow>Mynt · Restaurant Intelligence</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Know what your restaurant earned. <span className="text-gradient">Know where the money went.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
                Mynt brings your revenue, payouts, ads, discounts, charges, refunds and outlet performance into one place — so you can see what changed, why it changed, and what needs your attention.
              </p>
              <p className="mt-4 max-w-xl text-base font-medium text-ink/80">
                No scattered reports. No rebuilding spreadsheets. No switching between platforms to understand the business.
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

      {/* 2 · how mynt works */}
      <Section id="how-it-works" tight>
        <SectionHead
          eyebrow="One connected data layer"
          title="Connect your restaurant data once. Mynt does the rest."
          lede={
            <>
              Mynt brings together the information your restaurant already generates across marketplaces, payout statements, platform reports and outlets.
              <span className="mt-3 block">It structures that data into one consistent view so every dashboard, comparison, AI answer and report works from the same underlying numbers.</span>
            </>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <InteractiveCard className="h-full">
                <div className="font-mono text-xs text-mint">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <div className="mt-1 text-sm font-medium text-ink/85">{s.s}</div>
                <p className="mt-2 text-sm leading-relaxed text-mute">{s.d}</p>
              </InteractiveCard>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12">
          <FlowDiagram />
        </Reveal>
      </Section>

      {/* 3 · dashboards */}
      <Section id="dashboards">
        <SectionHead
          eyebrow="Dashboards"
          title="A dashboard for every question that matters."
          lede="Instead of putting everything into one overloaded screen, Mynt separates the business into focused dashboards."
        />
        <DashboardTabs />

        <div className="mt-16">
          <Reveal>
            <h3 className="text-xl font-bold md:text-2xl">Different teams. The same source of truth.</h3>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAMS.map((t, i) => (
              <Reveal key={t.t} delay={i * 0.05}>
                <InteractiveCard className="lq h-full rounded-2xl border-white/10 bg-card/40 p-5">
                  <div className="text-sm font-semibold text-mint">{t.t}</div>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{t.d}</p>
                </InteractiveCard>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* 4 · compare */}
      <Section id="compare">
        <SectionHead
          eyebrow="Compare"
          title="Compare before you decide."
          lede={
            <>
              A number by itself rarely tells you enough.
              <span className="mt-3 block">Mynt lets you compare performance across brands, outlets, platforms and time periods using the same definitions and the same underlying data.</span>
            </>
          }
        />
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMPARE_MODES.map((m, i) => (
            <Reveal key={m.t} delay={i * 0.05}>
              <div className="h-full rounded-2xl border border-line/70 bg-card/50 p-5">
                <div className="text-sm font-semibold text-ink">{m.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-mute">{m.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <CompareDuel />
        </Reveal>
        <Reveal className="mt-10 text-center">
          <p className="text-lg font-semibold md:text-xl">
            See the difference. <span className="text-mint">Find the driver.</span> Decide what to do next.
          </p>
        </Reveal>
      </Section>

      {/* 5 · mynt ai */}
      <Section id="ai-assistant">
        <SectionHead
          eyebrow="Mynt AI"
          title="Ask the business question. Get the answer from your own data."
          lede={
            <>
              You should not need to know which dashboard to open every time you have a question.
              <span className="mt-3 block">Ask Mynt in plain language. Mynt looks across the relevant data, identifies the important drivers and gives you an answer you can act on.</span>
            </>
          }
        />
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Example questions</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {AI_QUESTIONS.map((q, i) => (
                <Reveal key={q} delay={i * 0.04} as="span">
                  <span className="inline-block rounded-full border border-line/70 bg-card/60 px-4 py-2 text-sm text-ink/90">&ldquo;{q}&rdquo;</span>
                </Reveal>
              ))}
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-bold">Not just an answer.</h3>
              <p className="mt-1 text-sm text-mute">A useful Mynt response shows:</p>
              <ul className="mt-4 space-y-3" role="list">
                {AI_ANATOMY.map((a, i) => (
                  <li key={a.t} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-mint/40 bg-mint/5 font-mono text-[10px] text-mint">{i + 1}</span>
                    <div>
                      <span className="text-sm font-semibold text-ink">{a.t}</span>
                      <span className="ml-2 text-sm text-mute">{a.d}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Reveal>
            <AiConversation />
          </Reveal>
        </div>
      </Section>

      {/* 6 · reports */}
      <Section id="reports">
        <SectionHead
          eyebrow="Reports"
          title="Turn your live data into a report in seconds."
          lede={
            <>
              Stop rebuilding the same management report every week or month.
              <span className="mt-3 block">Create reports directly from Mynt using the latest available data and the exact scope you need.</span>
            </>
          }
        />
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            {REPORT_STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.05}>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 font-mono text-xs text-mint">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-base font-semibold">{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.2}>
              <p className="border-l-2 border-mint pl-4 text-sm font-medium text-ink/85">
                From live dashboard to management review — without rebuilding Excel.
              </p>
            </Reveal>
          </div>
          <Reveal>
            <ReportPreview />
          </Reveal>
        </div>
      </Section>

      {/* 7 · data trust */}
      <Section id="data-trust">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <SectionHead
            className="mb-0"
            eyebrow="Data trust"
            title="Every number is verified. Every metric is consistent. Every time."
            lede={
              <>
                Mynt is built on a simple principle: if a number is shown, it is already correct.
                <span className="mt-3 block">Every revenue, payout, cost, discount, charge and margin metric is fully reconciled across all underlying sources before it appears in any dashboard, report or AI response.</span>
              </>
            }
          />
          <Reveal>
            <TrustPipeline />
          </Reveal>
        </div>

        {/* live status strip */}
        <Reveal className="mt-12">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line/40 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_STATUS.map((s) => (
              <div key={s.l} className="flex items-center gap-3 bg-bg/90 px-5 py-4">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-mint" aria-hidden />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-mute">{s.l}</div>
                  <div className="text-sm font-semibold text-ink">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TRUST_POINTS.map((p, i) => (
            <Reveal key={p.t} delay={(i % 3) * 0.05}>
              <InteractiveCard className="h-full">
                <h3 className="text-base font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{p.d}</p>
              </InteractiveCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <div className="rounded-2xl border border-mint/30 bg-mint/[0.05] p-8 text-center md:p-10">
            <p className="mx-auto max-w-2xl text-xl font-bold leading-snug md:text-2xl">
              If a number appears in Mynt, it is already <span className="text-mint">verified, reconciled, and final.</span>
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-mute">
              No estimates, no partial calculations, no uncertain data — validated and cross-checked down to two decimal precision.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* 8 · security */}
      <TrustSecuritySection />

      {/* 9 · pricing */}
      <Section id="pricing" tight>
        <SectionHead
          eyebrow="Pricing"
          title="One annual licence. Priced by outlets, not by seats."
          lede={
            <>
              Pay based on the number of restaurant outlets you want to manage in Mynt — not the number of people who need visibility.
              <span className="mt-3 block">Your core Mynt workspace brings the dashboards, comparisons, alerts, reporting and intelligence layer together under one product.</span>
            </>
          }
          align="center"
        />
        {/* one clean pricing model — deliberately a single licence plate, no fake tiers */}
        <Card glow className="mx-auto max-w-5xl overflow-hidden p-0">
          <div className="grid lg:grid-cols-[1.15fr_1fr]">
            <div className="p-8 md:p-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mint">Mynt · Annual Licence</div>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tight md:text-5xl">One licence.</span>
                <span className="text-lg text-mute">Every module included.</span>
              </div>
              <div className="mt-8 space-y-5">
                {PRICING_POINTS.map((p) => (
                  <div key={p.t} className="flex items-start gap-3">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="mt-1 h-4 w-4 shrink-0 text-mint" aria-hidden>
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                    <div>
                      <div className="text-base font-semibold">{p.t}</div>
                      <p className="mt-1 text-sm leading-relaxed text-mute">{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* outlet-based scaling visual */}
            <div className="flex flex-col justify-center border-t border-line/60 bg-bg/40 p-8 md:p-10 lg:border-l lg:border-t-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Priced by outlets</div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {['Park Street', 'Salt Lake', 'Esplanade'].map((o, i) => (
                  <Reveal key={o} delay={i * 0.07}>
                    <span className="flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/[0.06] px-3.5 py-2.5 text-xs font-medium text-ink">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-mint" aria-hidden>
                        <path d="M3 9l1-5h16l1 5" />
                        <path d="M4 9v11h16V9" />
                        <path d="M9 20v-6h6v6" />
                      </svg>
                      {o}
                    </span>
                  </Reveal>
                ))}
                <Reveal delay={0.24}>
                  <span className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-xs text-mute">
                    <span className="text-mint">+</span> Add outlet
                  </span>
                </Reveal>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-mute">
                One licence covers the workspace. The price scales only with the outlets you connect — never with seats.
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <Button to={CTA.start} target="_self" className="w-full">Get pricing for your brand</Button>
                <Button to={CTA.expert} variant="ghost" className="w-full">Talk to an expert</Button>
              </div>
            </div>
          </div>
          <p className="border-t border-line/60 px-8 py-4 text-center text-xs text-mute">
            Any usage-based services or optional additions, where applicable, are shown separately and transparently.
          </p>
        </Card>
      </Section>

      {/* 10 · final cta */}
      <section className="relative overflow-hidden py-28 text-center md:py-36">
        <div className="mint-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6">
          <MyntMark className="mx-auto h-10" withWord={false} />
          <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            <Reveal as="span" className="block">See what your restaurant earned.</Reveal>
            <Reveal as="span" delay={0.08} className="block">See what changed.</Reveal>
            <Reveal as="span" delay={0.16} className="block text-gradient">Know what to do next.</Reveal>
          </h2>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-xl text-mute">
              Bring your restaurant data together and turn it into numbers your team can understand, trust and act on.
            </p>
          </Reveal>
          <CtaPair size="lg" className="mt-10 justify-center" />
        </div>
      </section>
    </>
  )
}
