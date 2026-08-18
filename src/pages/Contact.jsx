import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, Field, PageHero, Section } from '@/components/ui'
import { CONTACT, SOCIALS } from '@/lib/site'
import { cn } from '@/lib/utils'

const INTENTS = [
  {
    key: 'mynt',
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

export default function Contact() {
  const [params, setParams] = useSearchParams()
  const [sent, setSent] = useState(false)
  const q = params.get('intent')
  const intent = INTENTS.some((i) => i.key === q) ? q : 'mynt'
  const active = INTENTS.find((i) => i.key === intent)

  const pick = (k) => {
    setSent(false)
    setParams({ intent: k }, { replace: true })
  }

  // ponytail: no backend yet — hand the enquiry to the mail client with the intent as subject.
  const onSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const lines = [...f.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(active.subject)}&body=${encodeURIComponent(lines)}`
    setSent(true)
  }

  return (
    <>
      <PageHero eyebrow="Contact" title="What can we help you with?" lede="Pick a door. Each one goes to the right person, with the right first questions — no generic enquiry form." />

      <Section tight className="pt-0">
        <div className="grid gap-3 md:grid-cols-4" role="tablist" aria-label="Intent">
          {INTENTS.map((i) => (
            <button
              key={i.key}
              role="tab"
              aria-selected={intent === i.key}
              onClick={() => pick(i.key)}
              className={cn(
                'rounded-2xl border p-5 text-left transition-colors',
                intent === i.key ? 'border-mint bg-mint/10' : 'border-line/70 bg-card/50 hover:border-mint/40',
              )}
            >
              <div className={cn('font-semibold', intent === i.key && 'text-mint')}>{i.title}</div>
              <p className="mt-1.5 text-sm text-mute">{i.d}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <form key={active.key} onSubmit={onSubmit} role="tabpanel" className="grid gap-4 rounded-2xl border border-line/70 bg-card/50 p-6 sm:grid-cols-2 md:p-8">
            <div className="sm:col-span-2">
              <h2 className="text-2xl font-bold">{active.title}</h2>
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
              <Button type="submit">{sent ? 'Opened in your mail app' : active.cta}</Button>
              <span className="text-xs text-mute">We reply within one working day.</span>
            </div>
          </form>

          <div className="space-y-4">
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Write to us</div>
              <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-lg font-semibold hover:text-mint">{CONTACT.email}</a>
            </Card>
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Call or WhatsApp</div>
              {CONTACT.phones.map((p, i) => (
                <a key={p} href={CONTACT.phoneHrefs[i]} className="mt-2 block font-semibold hover:text-mint">{p}</a>
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
                  <a key={s.key} href={s.href} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm text-mute hover:border-mint/60 hover:text-mint">
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
