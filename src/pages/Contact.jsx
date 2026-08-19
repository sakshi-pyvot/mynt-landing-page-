import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Button, Card, Eyebrow, Field, Reveal, Section } from '@/components/ui'
import ContactHeroVideo from '@/components/sections/ContactHeroVideo'
import { CONTACT, SOCIALS } from '@/lib/site'
import { submitForm, STATUS_TEXT } from '@/lib/forms'
import { cn } from '@/lib/utils'

const INTENTS = [
  {
    key: 'mynt',
    badge: '30-MIN DEMO',
    title: 'Explore Mynt',
    d: 'See your own outlets in Mynt. A 30-minute walkthrough with real data.',
    cta: 'Book a Mynt walkthrough',
    subject: 'Mynt walkthrough request',
    fields: [
      ['Full name', 'name', 'text', true],
      ['Work email', 'email', 'email', true],
      ['Phone', 'phone', 'tel', true],
      ['Restaurant / company', 'company', 'text', true],
      ['Number of outlets', 'outlets', 'select', true, ['1', '2–5', '6–20', '21–50', '50+']],
      ['Platforms used', 'platforms', 'select', true, ['Zomato', 'Swiggy', 'Both', 'Both + dining platforms']],
    ],
  },
  {
    key: 'expert',
    badge: 'CONSULTING',
    title: 'Grow with Pyvot',
    d: 'Talk to a Pyvot expert about online ordering, dining, profitability or all three.',
    cta: 'Talk to an expert',
    subject: 'Consulting enquiry',
    fields: [
      ['Full name', 'name', 'text', true],
      ['Brand', 'brand', 'text', true],
      ['City', 'city', 'text', true],
      ['Number of outlets', 'outlets', 'select', true, ['1', '2–5', '6–20', '21–50', '50+']],
      ['Phone', 'phone', 'tel', true],
      ['Email', 'email', 'email', true],
      ['Biggest growth problem right now', 'problem', 'textarea', true],
    ],
  },
  {
    key: 'social',
    badge: 'SOCIAL AUDIT',
    title: 'Social Media',
    d: 'Get a social audit — Instagram and Facebook, content, cadence, what to change first.',
    cta: 'Get a social audit',
    subject: 'Social audit request',
    fields: [
      ['Full name', 'name', 'text', true],
      ['Brand', 'brand', 'text', true],
      ['Instagram URL', 'instagram', 'url', false],
      ['Facebook URL', 'facebook', 'url', false],
      ['City', 'city', 'text', true],
      ['Number of outlets', 'outlets', 'select', true, ['1', '2–5', '6–20', '21+']],
      ['Who manages social today?', 'current', 'select', true, ['In-house', 'Agency', 'Nobody, really']],
      ['Primary goal', 'goal', 'select', true, ['Footfall / bookings', 'Delivery orders', 'Brand & consistency', 'Launch / campaign']],
      ['Phone', 'phone', 'tel', true],
      ['Email', 'email', 'email', true],
    ],
  },
  {
    key: 'other',
    badge: 'GENERAL',
    title: 'Something else',
    d: 'Partnerships, press, vendors, careers — or you are not sure which door to knock on.',
    cta: 'Send',
    subject: 'Enquiry',
    fields: [
      ['Full name', 'name', 'text', true],
      ['Email', 'email', 'email', true],
      ['Topic', 'topic', 'select', true, ['Partnership', 'Press', 'Careers', 'Vendor', 'Other']],
      ['Message', 'message', 'textarea', true],
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
  const q = params.get('intent')
  const intent = INTENTS.some((i) => i.key === q) ? q : 'mynt'
  const active = INTENTS.find((i) => i.key === intent)

  const pick = (k) => {
    setStatus('idle')
    setParams({ intent: k }, { replace: true })
    document.getElementById('contact-tracks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    setStatus(await submitForm(form, active.subject))
    if (form.isConnected) form.reset()
  }

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
                No generic ticket queues. Select the track you need — your message goes straight to the right operator or engineer.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              {PROOF.map((p) => (
                <div
                  key={p.label}
                  className="rounded-2xl border border-line/60 bg-card/40 px-4 py-3 backdrop-blur-sm"
                >
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
                <span>Live dispatch · Kolkata HQ online now</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Section tight className="pt-0">
        <div id="contact-tracks" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-28" role="tablist" aria-label="Intent">
          {INTENTS.map((i) => {
            const selected = intent === i.key
            return (
              <button
                key={i.key}
                role="tab"
                aria-selected={selected}
                onClick={() => pick(i.key)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300',
                  selected
                    ? 'border-mint bg-mint/10 shadow-[0_0_30px_rgba(47,211,154,0.12)] scale-[1.02]'
                    : 'border-line/70 bg-card/50 hover:border-mint/40 hover:bg-card/70',
                )}
              >
                <span className="font-mono text-[9px] uppercase tracking-wider text-mint/80">{i.badge}</span>
                <div className={cn('mt-2 font-semibold', selected && 'text-mint')}>{i.title}</div>
                <p className="mt-1.5 text-sm text-mute">{i.d}</p>
                {selected && (
                  <motion.div
                    layoutId="contactTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.45fr_1fr]">
          <AnimatePresence mode="wait">
            <motion.form
              key={active.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={onSubmit}
              role="tabpanel"
              className="grid gap-4 rounded-3xl border border-line/70 bg-surface/60 p-6 backdrop-blur-xl sm:grid-cols-2 md:p-8"
            >
              <div className="sm:col-span-2 border-b border-line/50 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mint">{active.badge}</span>
                <h2 className="mt-1 text-2xl font-bold">{active.title}</h2>
                <p className="mt-1 text-sm text-mute">{active.d}</p>
              </div>
              {active.fields.map(([label, name, type, required, options]) => (
                <Field
                  key={name}
                  label={label}
                  name={name}
                  type={type === 'select' || type === 'textarea' ? undefined : type}
                  as={type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input'}
                  options={options}
                  required={required}
                  placeholder={type === 'select' ? 'Select' : ''}
                  className={type === 'textarea' || name === 'instagram' || name === 'facebook' ? 'sm:col-span-2' : undefined}
                />
              ))}
              <div className="flex flex-col items-start gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" size="lg" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : active.cta}
                </Button>
                <span className={cn('text-xs', status === 'sent' ? 'text-mint font-medium' : 'text-mute')} role="status">
                  {STATUS_TEXT[status] || 'We reply within one working day.'}
                </span>
              </div>
            </motion.form>
          </AnimatePresence>

          <div className="space-y-4">
            <Card className="border-mint/20 bg-mint/[0.04]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mint">Write to us</div>
              <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-lg font-semibold hover:text-mint transition-colors">{CONTACT.email}</a>
            </Card>
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Call or WhatsApp</div>
              {CONTACT.phones.map((p, i) => (
                <a key={p} href={CONTACT.phoneHrefs[i]} className="mt-2 block font-semibold hover:text-mint transition-colors">{p}</a>
              ))}
              <Button to={CONTACT.whatsapp} variant="ghost" size="sm" className="mt-4">WhatsApp</Button>
            </Card>
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Office</div>
              <address className="mt-2 not-italic leading-relaxed text-ink/85">
                {CONTACT.address.map((l) => (
                  <span key={l} className="block">{l}</span>
                ))}
              </address>
              <Button to={CONTACT.maps} variant="ghost" size="sm" className="mt-4">Get directions</Button>
            </Card>
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Follow</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SOCIALS.filter((s) => s.key === 'instagram' || s.key === 'linkedin').map((s) => (
                  <a key={s.key} href={s.href} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm text-mute hover:border-mint/60 hover:text-mint transition-colors">
                    {s.label}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
