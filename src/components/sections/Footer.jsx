import { Link } from 'react-router-dom'
import { PyvotLogo } from '@/components/Brand'
import { SmartLink } from '@/components/ui'
import { FOOTER, CONTACT, CTA } from '@/lib/site'
import SocialLinks from '@/components/SocialLinks'

export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
          {/* brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center" aria-label="Pyvot — home">
              <PyvotLogo className="h-6" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">
              Mynt is restaurant intelligence by Pyvot — marketplace, payout, discount, ad and outlet data turned into decisions. Pyvot Experts make them happen.
            </p>
            <SocialLinks className="mt-6" />
          </div>

          {FOOTER.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">{col.title}</div>
              <ul className="mt-4 flex flex-col gap-2.5" role="list">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmartLink to={l.to} target={l.to === CTA.start ? '_self' : undefined} className="text-sm text-ink/80 transition-colors hover:text-mint">
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
            <a href="https://app.pyvotmynt.in" target="_blank" rel="noreferrer" className="hover:text-ink">Sign in to Mynt</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
