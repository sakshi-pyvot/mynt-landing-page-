import Magnetic from './MagneticButton'
import { cn } from '@/lib/utils'

// The one CTA pair used everywhere: primary "Get started with Mynt", secondary
// "Talk to an expert". Targets are placeholders until the real pages exist.
const LINKS = {
  start: '#cta',
  expert: 'https://pyvot.in/contact-us/',
}

const SIZES = {
  sm: { btn: 'h-10 px-4 text-sm', gap: 'gap-2' },
  md: { btn: 'h-12 px-6 text-[15px]', gap: 'gap-3' },
  lg: { btn: 'h-14 px-8 text-base', gap: 'gap-4' },
}

export default function CtaPair({ size = 'md', className = '', magnetic = true }) {
  const s = SIZES[size]
  const primary = (
    <a
      href={LINKS.start}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full bg-mint font-semibold text-[#06251a] transition-shadow hover:shadow-[0_0_32px_rgba(47,211,154,0.5)]',
        s.btn,
      )}
    >
      Get started with Mynt
    </a>
  )
  return (
    <div className={cn('flex flex-wrap items-center', s.gap, className)}>
      {magnetic ? <Magnetic>{primary}</Magnetic> : primary}
      <a
        href={LINKS.expert}
        target={LINKS.expert.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        className={cn(
          'inline-flex items-center whitespace-nowrap rounded-full border border-line font-medium text-ink transition-colors hover:border-mint/60 hover:text-mint',
          s.btn,
        )}
      >
        Talk to an expert
      </a>
    </div>
  )
}
