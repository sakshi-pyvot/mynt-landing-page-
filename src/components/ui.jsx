import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { PyvotLogo } from './Brand'

// Small shared primitives for inner pages. Kept deliberately thin — the landing
// sections own their own visuals; these only give the inner pages one voice.

export function SmartLink({ to, children, className, ...rest }) {
  const external = /^(https?:|mailto:|tel:)/.test(to)
  if (external) {
    return (
      <a href={to} className={className} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  )
}

const rise = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }
export function Reveal({ children, className, delay = 0, as = 'div' }) {
  const M = motion[as] || motion.div
  return (
    <M
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </M>
  )
}

export function Eyebrow({ children, className }) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-mint', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
      {children}
    </div>
  )
}

export function PageHero({ eyebrow, title, lede, children, className, align = 'left', logo = true }) {
  return (
    <section className={cn('relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24', className)}>
      <div className="dot-field pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
      <div className="mint-glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />
      <div className={cn('relative mx-auto max-w-7xl px-6', align === 'center' && 'text-center')}>
        {logo && (
          <Reveal>
            <PyvotLogo className={cn('mb-6 h-6', align === 'center' && 'mx-auto')} />
          </Reveal>
        )}
        {eyebrow && (
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
        )}
        <Reveal delay={0.05}>
          <h1 className={cn('mt-5 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl', align === 'center' && 'mx-auto')}>
            {title}
          </h1>
        </Reveal>
        {lede && (
          <Reveal delay={0.1}>
            <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed text-mute md:text-xl', align === 'center' && 'mx-auto')}>{lede}</p>
          </Reveal>
        )}
        {children && <Reveal delay={0.15} className="mt-9">{children}</Reveal>}
      </div>
    </section>
  )
}

export function SectionHead({ eyebrow, title, lede, className, align = 'left' }) {
  return (
    <div className={cn('mb-12 max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Reveal>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.05}>
          <p className="mt-4 text-base leading-relaxed text-mute md:text-lg">{lede}</p>
        </Reveal>
      )}
    </div>
  )
}

export function Section({ id, children, className, tight = false }) {
  return (
    <section id={id} className={cn('mx-auto max-w-7xl px-6', tight ? 'py-16 md:py-20' : 'py-20 md:py-28', className)}>
      {children}
    </section>
  )
}

export function Card({ children, className, glow = false, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={cn(
        'relative rounded-2xl border border-line/70 bg-card/70 p-6 transition-colors hover:border-mint/40',
        glow && 'shadow-[0_0_60px_-20px_rgba(47,211,154,0.35)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Stat({ value, label, className }) {
  return (
    <div className={cn('', className)}>
      <div className="text-4xl font-bold tracking-tight md:text-5xl">{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-mute">{label}</div>
    </div>
  )
}

export function Accordion({ items, className }) {
  const [open, setOpen] = useState(0)
  return (
    <div className={cn('divide-y divide-line/70 rounded-2xl border border-line/70 bg-card/50', className)}>
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[15px] font-medium text-ink hover:text-mint"
            >
              <span>{it.q}</span>
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-mute transition-transform', isOpen && 'rotate-45 border-mint text-mint')} aria-hidden>
                +
              </span>
            </button>
            <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden">
                <div className="px-6 pb-6 text-sm leading-relaxed text-mute">{it.a}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Field({ label, name, type = 'text', required, placeholder, as = 'input', options, className }) {
  const id = `f-${name}`
  const base = 'mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-mute/60 outline-none transition-colors focus:border-mint'
  return (
    <label htmlFor={id} className={cn('block text-xs font-medium uppercase tracking-[0.14em] text-mute', className)}>
      {label}
      {required && <span className="text-mint"> *</span>}
      {as === 'textarea' ? (
        <textarea id={id} name={name} rows={4} required={required} placeholder={placeholder} className={base} />
      ) : as === 'select' ? (
        <select id={id} name={name} required={required} className={base} defaultValue="">
          <option value="" disabled>
            {placeholder || 'Select'}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input id={id} name={name} type={type} required={required} placeholder={placeholder} className={base} />
      )}
    </label>
  )
}

export function Button({ to, children, variant = 'primary', size = 'md', className, ...rest }) {
  const cls = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all',
    size === 'sm' ? 'h-10 px-4 text-sm' : size === 'lg' ? 'h-14 px-8 text-base' : 'h-12 px-6 text-[15px]',
    variant === 'primary' && 'bg-mint text-[#06251a] hover:shadow-[0_0_32px_rgba(47,211,154,0.5)]',
    variant === 'ghost' && 'border border-line font-medium text-ink hover:border-mint/60 hover:text-mint',
    className,
  )
  if (to) {
    return (
      <SmartLink to={to} className={cls} {...rest}>
        {children}
      </SmartLink>
    )
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
