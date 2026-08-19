import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Reveal, Eyebrow, GlowCard, Button } from '@/components/ui'
import { CONTACT } from '@/lib/site'
import { cn } from '@/lib/utils'

const TRUST_PILLARS = [
  {
    id: 'access',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Least-Privilege Read Access',
    tag: 'READ-ONLY SCOPE',
    body: 'Mynt reads platform reports, payout statements, and connected feeds. Where aggregators support read-only tokens, that is all we request — never permissions to modify listings or prices.',
    highlight: 'Zero write permissions on aggregator accounts',
  },
  {
    id: 'auth',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Authentication & Session Shield',
    tag: 'OTP + RBAC',
    body: 'Email with hardware/time-based OTP sign-in, per-user scoped accounts, and instantaneous session termination. Revoke any team member or device with a single click.',
    highlight: 'Instant device & credential revocation',
  },
  {
    id: 'encryption',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Encryption in Flight & at Rest',
    tag: 'TLS 1.3 + AES-256',
    body: 'All incoming streams and API calls are encrypted using TLS 1.3 in transit and stored in hardened, VPC-isolated cloud databases with AES-256 encryption at rest.',
    highlight: 'Dedicated VPC isolation & restricted engineer access',
  },
  {
    id: 'roles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Granular Role-Based Access Control',
    tag: 'OUTLET SCOPED',
    body: 'Hierarchical role boundaries. Outlet managers only inspect their specific branch; finance reconciles payouts; owners access whole-brand analytics.',
    highlight: 'Zero cross-outlet data leakage across seats',
  },
  {
    id: 'retention',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
    title: 'Absolute Ownership & Immediate Deletion',
    tag: 'ZERO VENDOR LOCK-IN',
    body: 'Your restaurant data is strictly yours. Disconnect any source and data collection halts immediately. Request a purge, and all logs are deleted with written verification.',
    highlight: 'Data wipe with written audit certificate',
  },
  {
    id: 'ai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-mint">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'AI Isolation & Zero Model Training',
    tag: 'PRIVATE CONTEXT ONLY',
    body: 'Mynt AI runs on isolated, retrieval-augmented prompts bound strictly to your active workspace. Your proprietary sales and margin numbers are never used to train shared foundation models.',
    highlight: 'No customer data leaks into general LLM weights',
  },
]

const ROLE_SIMULATION = [
  {
    role: 'Brand Owner',
    badge: 'Full Command',
    color: 'border-mint text-mint bg-mint/10',
    visibleData: ['Consolidated Brand P&L', 'All 14 Outlets Benchmark', 'Discrepancy Alerts', 'Direct Platform Payouts'],
    blockedData: [],
    scopeNote: 'Unrestricted visibility across all branches, bank accounts, and growth levers.',
  },
  {
    role: 'Finance & Accounts',
    badge: 'Reconciliation Scope',
    color: 'border-grape text-grape bg-grape/10',
    visibleData: ['Aggregator Invoices & Statements', 'Deduction & Commission Waterfall', 'Bank Settlement Delta'],
    blockedData: ['Staff Schedule Notes', 'Social Ad Creative Drafts'],
    scopeNote: 'Full financial audit ledger without operational distraction.',
  },
  {
    role: 'Outlet Store Manager',
    badge: 'Single-Outlet Isolated',
    color: 'border-amber text-amber bg-amber/10',
    visibleData: ['Salt Lake Outlet Daily Orders', 'Item-Level Refunds & Reasons', 'Kitchen Prep-Time Drift'],
    blockedData: ['Other Outlet Numbers', 'Headquarters Payout Bank Accounts', 'Brand-Wide Valuation'],
    scopeNote: 'Strictly restricted to their own pass. Zero cross-branch leak.',
  },
]

export default function TrustSecuritySection() {
  const [activeRole, setActiveRole] = useState(0)
  const [activePipelineStep, setActivePipelineStep] = useState(0)
  const role = ROLE_SIMULATION[activeRole]

  const PIPELINE_STEPS = [
    { title: '1. Ingestion', desc: 'Encrypted webhook or email parser receives raw statement', icon: '📥', status: 'TLS 1.3' },
    { title: '2. Normalization', desc: 'Line items mapped to standardized ledger schema', icon: '⚡', status: 'In-Memory VPC' },
    { title: '3. Isolation Vault', desc: 'Stored in tenant-segregated partition with zero cross-tenant lookup', icon: '🔒', status: 'AES-256' },
    { title: '4. Scoped Delivery', desc: 'Rendered to browser filtered by authenticated role JWT', icon: '🎯', status: 'RBAC Enforced' },
  ]

  return (
    <section id="trust" className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
      {/* Background ambient shield glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.12),transparent_70%)]" />

      {/* Main Section Header */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">Enterprise-Grade Security Architecture</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Your restaurant data is confidential. <span className="text-gradient">We protect it like banking infrastructure.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-base leading-relaxed text-mute md:text-lg">
            Zero write access on aggregators, role-isolated tenant vaults, and strict AI data boundaries. Here is exactly how Mynt safeguards every rupee and line item.
          </p>
        </Reveal>
      </div>

      {/* Interactive Shield Hero Visual + Pipeline */}
      <div className="relative mt-16 overflow-hidden rounded-3xl border border-line/80 bg-surface/70 p-6 md:p-10 backdrop-blur-xl shadow-2xl">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left: Animated Shield Radar */}
          <div className="relative flex flex-col items-center justify-center text-center lg:col-span-4 lg:items-start lg:text-left">
            <div className="relative flex h-36 w-36 items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-0 rounded-full border border-mint/30 animate-pulse-ring" />
              <div className="absolute inset-2 rounded-full border border-mint/20 animate-radar" style={{ borderTopColor: '#2fd39a' }} />
              <div className="absolute inset-6 rounded-full bg-mint/5 border border-mint/40 flex items-center justify-center shadow-[0_0_30px_rgba(47,211,154,0.25)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-mint">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 font-mono text-xs font-semibold text-mint">
                <span className="h-2 w-2 rounded-full bg-mint animate-pulse" /> LIVE ENFORCEMENT
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink">Zero-Trust Architecture</h3>
              <p className="mt-2 text-xs leading-relaxed text-mute">
                Every API call and PDF parsed passes through signature verification before reaching your dashboard.
              </p>
            </div>
          </div>

          {/* Right: Interactive Pipeline Stepper */}
          <div className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-mute">Data Journey & Verification Protocol</span>
              <span className="font-mono text-[11px] text-mint">Interactive Pipeline</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PIPELINE_STEPS.map((step, idx) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  className={cn(
                    'lq-card group relative rounded-xl border p-4 text-left',
                    activePipelineStep === idx
                      ? 'border-mint bg-mint/10 shadow-[0_0_25px_rgba(47,211,154,0.15)]'
                      : 'border-line/70 bg-card/50 hover:border-line hover:bg-card/80',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{step.icon}</span>
                    <span className="rounded bg-bg/80 px-2 py-0.5 font-mono text-[10px] text-mint">
                      {step.status}
                    </span>
                  </div>
                  <div className="mt-3 font-semibold text-sm text-ink group-hover:text-mint transition-colors">
                    {step.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-mute">{step.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Role-Based Isolation Simulator */}
      <div className="mt-14 rounded-3xl border border-line/80 bg-surface/50 p-6 md:p-10 backdrop-blur-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-mint">Live Verification</span>
            <h3 className="mt-1 text-2xl font-bold md:text-3xl">Interactive Role-Isolation Sandbox</h3>
            <p className="mt-2 max-w-xl text-sm text-mute">
              Click different seats below to preview how Mynt enforces strict data scoping in real time.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="flex flex-wrap gap-2" role="tablist">
            {ROLE_SIMULATION.map((r, i) => (
              <button
                key={r.role}
                type="button"
                role="tab"
                aria-selected={activeRole === i}
                onClick={() => setActiveRole(i)}
                className={cn(
                  'rounded-full border px-4 py-2 font-medium text-xs transition-all duration-200',
                  activeRole === i
                    ? cn(r.color, 'shadow-sm')
                    : 'border-line text-mute hover:border-line/90 hover:text-ink',
                )}
              >
                {r.role}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={role.role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-8 grid gap-6 rounded-2xl border border-line/60 bg-bg/60 p-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', role.color)}>
                  {role.badge}
                </span>
                <span className="font-mono text-xs text-mute">{role.scopeNote}</span>
              </div>

              <div className="mt-5">
                <span className="text-xs font-semibold uppercase tracking-widest text-mint">Authorized Telemetry & Views</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.visibleData.map((item) => (
                    <span key={item} className="flex items-center gap-1.5 rounded-lg border border-mint/30 bg-mint/10 px-3 py-1.5 text-xs text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {role.blockedData.length > 0 && (
                <div className="mt-5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-coral">Strictly Blocked / Redacted</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.blockedData.map((item) => (
                      <span key={item} className="flex items-center gap-1.5 rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs text-mute line-through">
                        <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-line/60 bg-card/60 p-4 font-mono text-xs text-mute lg:col-span-5">
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <span className="text-[11px] text-ink">Session Scoping Token</span>
                <span className="text-[10px] text-mint">RBAC_ACTIVE</span>
              </div>
              <pre className="mt-3 overflow-x-auto text-[11px] text-ink/80">
{`{
  "user_role": "${role.role}",
  "tenant_id": "org_pyvot_live",
  "read_scope": "restricted_jwt",
  "anonymized_llm": true
}`}
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 6 High-Engagement Trust Pillars (Glow Cards) */}
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TRUST_PILLARS.map((pillar, i) => (
          <Reveal key={pillar.id} delay={(i % 3) * 0.06}>
            <GlowCard className="h-full flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl border border-mint/20 bg-mint/5 p-2.5">
                    {pillar.icon}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mint/90 border border-mint/30 bg-mint/5 px-2 py-0.5 rounded">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{pillar.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mute">{pillar.body}</p>
              </div>

              <div className="mt-5 border-t border-line/50 pt-3 flex items-center gap-2 text-xs text-mint">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <span>{pillar.highlight}</span>
              </div>
            </GlowCard>
          </Reveal>
        ))}
      </div>

      {/* Compliance Roadmap & Quick Contact Actions */}
      <Reveal delay={0.1}>
        <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-mint/30 bg-gradient-to-br from-card/80 to-surface/90 p-6 md:p-8 md:flex-row md:items-center md:justify-between shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-mint animate-ping" />
              <div className="text-base font-bold text-ink">Compliance & Transparency Commitment</div>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-mute">
              Formal audit reports, data-processing addendums (DPA), and penetration test summaries are available for enterprise restaurant groups upon request.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to={`mailto:${CONTACT.email}?subject=Mynt%20Security%20Questionnaire%20Request`} variant="primary" size="sm">
              Request Security Pack
            </Button>
            <Button to={`mailto:${CONTACT.email}?subject=Mynt%20Data%20Deletion%20Request`} variant="ghost" size="sm">
              Request Data Purge
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
