import { SOCIALS } from '@/lib/site'
import { cn } from '@/lib/utils'

// One social row used everywhere: Instagram, LinkedIn, WhatsApp, Email.
// Email opens Gmail compose in the browser (not the OS mail app).
const SOCIAL_ICONS = {
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

const href = (s) => (s.key === 'mail' ? 'https://mail.google.com/mail/?view=cm&to=contact@pyvot.in' : s.href)

export default function SocialLinks({ variant = 'icons', size = 'md', className }) {
  const dim = size === 'sm' ? 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4' : 'h-10 w-10 [&>svg]:h-[18px] [&>svg]:w-[18px]'
  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)} role="list" aria-label="Social">
      {SOCIALS.map((s) => (
        <li key={s.key}>
          <a
            href={href(s)}
            target="_blank"
            rel="noreferrer"
            aria-label={s.label}
            className={cn(
              'lq lq-press relative inline-flex items-center justify-center gap-2 rounded-full text-mute transition-colors hover:text-mint',
              variant === 'pills' ? 'px-3.5 py-1.5 font-mono text-xs [&>svg]:h-4 [&>svg]:w-4' : dim,
            )}
          >
            {SOCIAL_ICONS[s.key]}
            {variant === 'pills' && <span>{s.label} ↗</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
