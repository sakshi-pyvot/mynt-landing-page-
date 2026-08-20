import { useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Button, Eyebrow, GlowCard, Reveal, Section } from '@/components/ui'
import ContactHeroVideo from '@/components/sections/ContactHeroVideo'
import { CONTACT } from '@/lib/site'
import SocialLinks from '@/components/SocialLinks'
import { submitForm, STATUS_TEXT } from '@/lib/forms'
import { cn, reducedMotion } from '@/lib/utils'

const INTENTS = [
  {
    key: 'mynt',
    badge: '30-MIN LIVE DEMO',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-mint">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    title: 'Explore Mynt',
    d: 'See your own outlets in Mynt. A live 30-minute walkthrough with real food aggregator data.',
    cta: 'Book a Mynt Walkthrough',
    subject: 'Mynt walkthrough request',
    fields: [
      { label: 'Full name', name: 'name', type: 'text', required: true, placeholder: 'e.g. Rahul Sharma' },
      { label: 'Work email', name: 'email', type: 'email', required: true, placeholder: 'rahul@brand.com' },
      { label: 'Phone', name: 'phone', type: 'tel', required: true, placeholder: '+91 98765 43210' },
      { label: 'Restaurant / Brand', name: 'company', type: 'text', required: true, placeholder: 'e.g. Chaat & Co.' },
      { label: 'Number of active outlets', name: 'outlets', type: 'chips', required: true, options: ['1', '2–5', '6–20', '21–50', '50+'] },
      { label: 'Platforms currently used', name: 'platforms', type: 'chips', required: true, options: ['Zomato', 'Swiggy', 'Both', 'Both + Dining'] },
    ],
  },
  {
    key: 'expert',
    badge: 'GROWTH CONSULTING',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-mint">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Grow with Pyvot',
    d: 'Talk to a Pyvot expert about online ordering, dining economics, ad efficiency, or all three.',
    cta: 'Connect with Growth Partner',
    subject: 'Consulting enquiry',
    fields: [
      { label: 'Full name', name: 'name', type: 'text', required: true, placeholder: 'Your name' },
      { label: 'Brand name', name: 'brand', type: 'text', required: true, placeholder: 'Your restaurant brand' },
      { label: 'City', name: 'city', type: 'text', required: true, placeholder: 'Kolkata, Mumbai, Delhi...' },
      { label: 'Number of outlets', name: 'outlets', type: 'chips', required: true, options: ['1', '2–5', '6–20', '21–50', '50+'] },
      { label: 'Phone', name: 'phone', type: 'tel', required: true, placeholder: '+91' },
      { label: 'Email', name: 'email', type: 'email', required: true, placeholder: 'you@brand.com' },
      { label: 'Biggest growth bottleneck right now', name: 'problem', type: 'textarea', required: true, placeholder: 'e.g. High discount burn, poor ROAS on Zomato, low dine-in footfall...' },
    ],
  },
  {
    key: 'social',
    badge: 'CREATIVE AUDIT',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-mint">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    title: 'Social & Creative',
    d: 'Get a restaurant social audit — Instagram cadence, shoot strategy, and reels that drive dining.',
    cta: 'Get Free Social Audit',
    subject: 'Social audit request',
    fields: [
      { label: 'Full name', name: 'name', type: 'text', required: true, placeholder: 'Your name' },
      { label: 'Brand name', name: 'brand', type: 'text', required: true, placeholder: 'Brand name' },
      { label: 'Instagram handle / URL', name: 'instagram', type: 'text', required: false, placeholder: '@yourbrand' },
      { label: 'City', name: 'city', type: 'text', required: true, placeholder: 'City' },
      { label: 'Outlets', name: 'outlets', type: 'chips', required: true, options: ['1', '2–5', '6–20', '21+'] },
      { label: 'Current management', name: 'current', type: 'chips', required: true, options: ['In-house', 'Agency', 'None yet'] },
      { label: 'Primary target', name: 'goal', type: 'chips', required: true, options: ['Footfall', 'Delivery', 'Brand Aesthetics', 'New Launch'] },
      { label: 'Phone', name: 'phone', type: 'tel', required: true, placeholder: '+91' },
      { label: 'Email', name: 'email', type: 'email', required: true, placeholder: 'you@brand.com' },
    ],
  },
  {
    key: 'other',
    badge: 'GENERAL DESK',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-mint">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Partnerships & Press',
    d: 'Strategic partnerships, media queries, vendors, or custom integrations.',
    cta: 'Send Direct Dispatch',
    subject: 'Enquiry',
    fields: [
      { label: 'Full name', name: 'name', type: 'text', required: true, placeholder: 'Your name' },
      { label: 'Work email', name: 'email', type: 'email', required: true, placeholder: 'you@domain.com' },
      { label: 'Topic category', name: 'topic', type: 'chips', required: true, options: ['Partnership', 'Press & Media', 'Vendor', 'Other'] },
      { label: 'Message note', name: 'message', type: 'textarea', required: true, placeholder: 'How can we collaborate?' },
    ],
  },
]

const PROOF = [
  { value: '< 2hr', label: 'Weekday reply' },
  { value: '100+', label: 'Restaurant brands' },
  { value: 'Direct', label: 'No ticket queue' },
]

export default function Contact() {
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('idle')
  const [formValues, setFormValues] = useState({})
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const q = params.get('intent')
  const intent = INTENTS.some((i) => i.key === q) ? q : 'mynt'
  const active = INTENTS.find((i) => i.key === intent)

  // deep links like /contact?intent=mynt land on the form, not the page top.
  // Keyed on location.key so re-clicking the CTA while already here re-scrolls too.
  const { key: locationKey } = useLocation()
  useEffect(() => {
    if (!q) return
    const t = setTimeout(() => document.getElementById('contact-tracks')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 10000)
    return () => clearInterval(timer)
  }, [])

  const pick = (k) => {
    setStatus('idle')
    setFormValues({})
    setParams({ intent: k }, { replace: true })
    document.getElementById('contact-tracks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFieldChange = (name, val) => {
    setFormValues((prev) => ({ ...prev, [name]: val }))
  }

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(CONTACT.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    const res = await submitForm(form, active.subject)
    setStatus(res)
    if (res === 'sent' && form.isConnected) {
      form.reset()
      setFormValues({})
    }
  }

  // Calculate completion percentage
  const totalRequired = active.fields.filter((f) => f.required).length
  const completedRequired = active.fields.filter((f) => f.required && formValues[f.name]).length
  const progressPercent = Math.min(100, Math.round((completedRequired / Math.max(1, totalRequired)) * 100))

  return (
    <>
      <section className="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-20">
        <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
        <div className="mint-glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />
        <div className="pointer-events-none absolute -left-32 top-1/3 h-[400px] w-[400px] rounded-full bg-mint/[0.06] blur-[100px]" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <ContactHeroVideo />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <Eyebrow>Contact & Demo Desk</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                Direct access to our <span className="text-gradient">restaurant team.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-mute">
                No generic ticket queues. Select the exact track you need, and your message is routed immediately to the lead operator or engineer.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              {PROOF.map((p) => (
                <div key={p.label} className="rounded-2xl border border-line/60 bg-card/40 px-4 py-3 backdrop-blur-sm">
                  <div className="font-mono text-lg font-bold text-mint">{p.value}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-mute">{p.label}</div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.2} className="mt-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-mint/30 bg-mint/5 px-4 py-2 font-mono text-xs text-mint backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                <span>Priority dispatch · &lt; 2 hour reply on weekdays</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Section tight className="pt-0">
        {/* Intent Tabs Grid */}
        <div id="contact-tracks" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-28" role="tablist" aria-label="Intent Track Selector">
          {INTENTS.map((i) => {
            const isSelected = intent === i.key
            return (
              <button
                key={i.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => pick(i.key)}
                className={cn(
                  'group relative isolate overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300',
                  isSelected
                    ? 'border-mint/50 shadow-[0_0_30px_rgba(47,211,154,0.15)] scale-[1.02]'
                    : 'border-line/70 bg-card/60 hover:border-line hover:bg-card/90',
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="contact-intent-glass"
                    aria-hidden
                    style={{ position: 'absolute', zIndex: -1 }}
                    className="lq inset-0 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-between">
                  <div className={cn('rounded-xl border p-2 transition-colors', isSelected ? 'border-mint/40 bg-mint/20' : 'border-line bg-surface')}>
                    {i.icon}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-mint border border-mint/20 bg-mint/5 px-2 py-0.5 rounded">
                    {i.badge}
                  </span>
                </div>

                <div className={cn('mt-4 font-bold text-base transition-colors', isSelected ? 'text-mint' : 'text-ink group-hover:text-ink')}>
                  {i.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">{i.d}</p>

                {isSelected && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-mint"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Main Content: Interactive Form + Living Contact Sidebar */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.45fr_1fr]">
          {/* Animated Form Container */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.form
                key={active.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.25 }}
                onSubmit={onSubmit}
                role="tabpanel"
                className="relative overflow-hidden rounded-3xl border border-line/80 bg-surface/70 p-6 md:p-9 backdrop-blur-xl shadow-2xl"
              >
                {/* Form Header with Progress Bar */}
                <div className="border-b border-line/60 pb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-mint">{active.badge}</span>
                      <h2 className="mt-1 text-2xl font-bold text-ink">{active.title}</h2>
                    </div>
                    <div className="text-right font-mono text-xs text-mute">
                      <span>{completedRequired}/{totalRequired} required</span>
                      <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-line/80">
                        <div
                          className="h-full bg-mint transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {active.fields.map((field) => {
                    const isFullWidth = field.type === 'textarea' || field.type === 'chips'
                    const val = formValues[field.name] || ''

                    if (field.type === 'chips') {
                      return (
                        <div key={field.name} className="sm:col-span-2">
                          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-mute">
                            {field.label} {field.required && <span className="text-mint">*</span>}
                          </label>
                          {/* Hidden input for formData submit */}
                          <input type="hidden" name={field.name} value={val} required={field.required} />
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {field.options.map((opt) => {
                              const activeChip = val === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleFieldChange(field.name, opt)}
                                  className={cn(
                                    'rounded-xl border px-3.5 py-2 font-mono text-xs transition-all duration-200',
                                    activeChip
                                      ? 'border-mint bg-mint/15 text-mint shadow-[0_0_15px_rgba(47,211,154,0.2)] font-semibold'
                                      : 'border-line bg-card/60 text-mute hover:border-line/90 hover:text-ink',
                                  )}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }

                    if (field.type === 'textarea') {
                      return (
                        <label key={field.name} className="block text-xs font-medium uppercase tracking-[0.14em] text-mute sm:col-span-2">
                          {field.label} {field.required && <span className="text-mint">*</span>}
                          <textarea
                            name={field.name}
                            rows={4}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={val}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none transition-colors focus:border-mint focus:ring-1 focus:ring-mint"
                          />
                        </label>
                      )
                    }

                    return (
                      <label key={field.name} className={cn('block text-xs font-medium uppercase tracking-[0.14em] text-mute', isFullWidth && 'sm:col-span-2')}>
                        {field.label} {field.required && <span className="text-mint">*</span>}
                        <input
                          name={field.name}
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={val}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-line bg-card/70 px-4 py-3 text-sm text-ink placeholder:text-mute/50 outline-none transition-colors focus:border-mint focus:ring-1 focus:ring-mint"
                        />
                      </label>
                    )
                  })}
                </div>

                {/* Submit & Status Bar */}
                <div className="mt-8 flex flex-col items-start gap-4 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full sm:w-auto">
                    {status === 'sending' ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#06251a] border-t-transparent" />
                        Routing message...
                      </span>
                    ) : status === 'sent' ? (
                      <span className="flex items-center gap-2">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                        Dispatched Successfully
                      </span>
                    ) : (
                      active.cta
                    )}
                  </Button>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn('h-2 w-2 rounded-full', status === 'sent' ? 'bg-mint' : 'bg-mint/40')} />
                    <span className={status === 'sent' ? 'text-mint font-medium' : 'text-mute'}>
                      {STATUS_TEXT[status] || 'We reply directly within 2 business hours.'}
                    </span>
                  </div>
                </div>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Living Contact Sidebar */}
          <div className="space-y-4">
            {/* Email Card with 1-Click Copy */}
            <GlowCard className="p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mint">Direct Dispatch</span>
                <span className="font-mono text-[10px] text-mute">{copied ? 'COPIED!' : 'CLICK TO COPY'}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="mt-2 flex w-full items-center justify-between text-left group"
              >
                <span className="text-lg font-bold text-ink group-hover:text-mint transition-colors">
                  {CONTACT.email}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-mute group-hover:text-mint transition-colors">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </GlowCard>

            {/* Direct WhatsApp / Phone Desk */}
            <GlowCard className="p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mint">Phone & WhatsApp Desk</span>
                <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
              </div>
              <div className="mt-3 space-y-1.5">
                {CONTACT.phones.map((p, i) => (
                  <a
                    key={p}
                    href={CONTACT.phoneHrefs[i]}
                    className="block font-mono text-sm font-semibold text-ink hover:text-mint transition-colors"
                  >
                    {p}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button to={CONTACT.whatsapp} variant="ghost" size="sm" className="w-full">
                  Open WhatsApp Chat
                </Button>
              </div>
            </GlowCard>

            {/* Kolkata HQ Living Clock & Directions */}
            <GlowCard className="p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mint">Headquarters</span>
                <span className="font-mono text-[11px] text-mint">{currentTime} IST</span>
              </div>
              {/* stylized map tile — pure CSS/SVG, opens the same maps link */}
              <a
                href={CONTACT.maps}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Pyvot HQ location in Google Maps"
                className="dot-field group/map relative mt-3 block h-24 overflow-hidden rounded-2xl border border-line/70 bg-card/60 transition-colors hover:border-mint/40"
              >
                <svg viewBox="0 0 200 96" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full opacity-40">
                  <path d="M0 64 H200" stroke="rgba(143,153,168,0.35)" strokeWidth="1" />
                  <path d="M56 0 V96" stroke="rgba(143,153,168,0.35)" strokeWidth="1" />
                  <path d="M0 26 C60 34 140 14 200 24" stroke="rgba(47,211,154,0.3)" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
                  {!reducedMotion() && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-50" />
                  )}
                  <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-bg bg-mint shadow-[0_0_12px_rgba(47,211,154,0.6)]" />
                </span>
                <span className="absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-wider text-mute transition-colors group-hover/map:text-mint">
                  Sector V, Kolkata
                </span>
              </a>
              <address className="mt-3 not-italic font-sans text-xs leading-relaxed text-ink/80">
                {CONTACT.address.map((l) => (
                  <span key={l} className="block">{l}</span>
                ))}
              </address>
              <div className="mt-4">
                <Button to={CONTACT.maps} variant="ghost" size="sm" className="w-full">
                  Get Google Maps Directions →
                </Button>
              </div>
            </GlowCard>

            {/* Social Network Hub */}
            <GlowCard className="p-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-mint">Follow Pyvot</div>
              <SocialLinks variant="pills" className="mt-3" />
            </GlowCard>
          </div>
        </div>
      </Section>
    </>
  )
}
