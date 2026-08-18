import { Link } from 'react-router-dom'
import { PyvotLogo, MyntMark } from '@/components/Brand'
import { SmartLink } from '@/components/ui'
import { FOOTER, SOCIALS, CONTACT } from '@/lib/site'

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.5 8.5h-3V20h3V8.5ZM5 3.8a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM20.5 13.2c0-3.1-1.7-4.9-4.2-4.9-1.6 0-2.6.9-3 1.6V8.5h-3V20h3v-6.1c0-1.6.6-2.7 2.1-2.7 1.4 0 2.1.9 2.1 2.7V20h3v-6.8Z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 20l1.3-3.8A8 8 0 1 1 8.2 19L4 20Z" strokeLinejoin="round" />
      <path d="M9.5 9.5c0 3 2 5 5 5l1-1.5-1.8-.9-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.9-1.8-1.1 0.4Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  ),
}

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
          {/* brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3" aria-label="Mynt by Pyvot — home">
              <MyntMark className="h-7" wordClass="text-xl" />
              <span className="h-5 w-px bg-line" aria-hidden />
              <PyvotLogo className="h-5" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
              Mynt is restaurant intelligence by Pyvot — marketplace, payout, discount, ad and outlet data turned into decisions. Pyvot Experts make them happen.
            </p>
            <ul className="mt-6 flex items-center gap-2" role="list" aria-label="Social">
              {SOCIALS.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-mute transition-colors hover:border-mint/60 hover:text-mint [&>svg]:h-[18px] [&>svg]:w-[18px]"
                  >
                    {ICONS[s.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">{col.title}</div>
              <ul className="mt-4 flex flex-col gap-2.5" role="list">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmartLink to={l.to} className="text-sm text-ink/80 transition-colors hover:text-mint">
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">Contact</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-ink/80" role="list">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-mint">{CONTACT.email}</a>
              </li>
              {CONTACT.phones.map((p, i) => (
                <li key={p}>
                  <a href={CONTACT.phoneHrefs[i]} className="hover:text-mint">{p}</a>
                </li>
              ))}
              <li>
                <a href={CONTACT.maps} target="_blank" rel="noreferrer" className="block leading-relaxed text-mute hover:text-mint">
                  {CONTACT.address.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line/40 pt-6 text-xs text-mute md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Pyvot Consultancy & Analytics Pvt. Ltd. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a href="https://pyvot.in/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-ink">Privacy</a>
            <a href="https://pyvot.in/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-ink">Terms</a>
            <a href="https://app.pyvotmynt.in" target="_blank" rel="noreferrer" className="hover:text-ink">Sign in to Mynt</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
