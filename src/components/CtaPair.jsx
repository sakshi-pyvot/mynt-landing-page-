import Magnetic from './MagneticButton'
import { SmartLink } from './ui'
import { CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

// The one CTA pair used everywhere: primary "Get started with Mynt", secondary
// "Talk to an expert". Both route into the contact intent router.
const SIZES = {
  sm: { btn: 'h-10 px-4 text-sm', gap: 'gap-2' },
  md: { btn: 'h-12 px-6 text-[15px]', gap: 'gap-3' },
  lg: { btn: 'h-14 px-8 text-base', gap: 'gap-4' },
}

export default function CtaPair({ size = 'md', className = '', magnetic = true }) {
  const s = SIZES[size]
  const primary = (
    <SmartLink
      to={CTA.start}
      target="_self"
      className={cn(
        'lq-press inline-flex items-center whitespace-nowrap rounded-full bg-mint font-semibold text-[#06251a] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_32px_rgba(47,211,154,0.5)]',
        s.btn,
      )}
    >
      Get started with Mynt
    </SmartLink>
  )
  return (
    <div className={cn('flex flex-wrap items-center', s.gap, className)}>
      {magnetic ? <Magnetic>{primary}</Magnetic> : primary}
      <SmartLink
        to={CTA.expert}
        className={cn(
          'lq lq-press relative inline-flex items-center whitespace-nowrap rounded-full font-medium text-ink transition-colors hover:text-mint',
          s.btn,
        )}
      >
        Talk to an expert
      </SmartLink>
    </div>
  )
}
