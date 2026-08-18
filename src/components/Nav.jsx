import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import CtaPair from './CtaPair'
import { Lockup } from './Brand'
import { SmartLink } from './ui'
import { NAV, CTA } from '@/lib/site'
import { getLenis } from '@/lib/scroll'
import { cn } from '@/lib/utils'

// Mega-nav: Mynt-by-Pyvot lockup · grouped dropdowns · CTA pair.
// Desktop (xl+): hover/click panels; below: full-screen sheet with accordions.

const Chevron = ({ className }) => (
  <svg viewBox="0 0 16 16" className={cn('h-3.5 w-3.5', className)} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// which top-level group "owns" a path, for the active underline
const groupActive = (item, pathname) => {
  if (item.to) return item.to === pathname
  return item.items.some((l) => !l.to.startsWith('/#') && pathname.startsWith(l.to.split('#')[0]))
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(-1) // desktop panel index
  const [sheet, setSheet] = useState(false) // mobile sheet
  const closeTimer = useRef(0)
  const location = useLocation()

  // glass once scrolled (plain listener: page height changes per route, so no ScrollTrigger 'max')
  useEffect(() => {
    let last = false
    const onScroll = () => {
      const now = window.scrollY > 50
      if (now !== last) {
        last = now
        setScrolled(now)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const t = setTimeout(onScroll, 0) // initial state (deep links land mid-page)
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // any link click inside a panel/sheet closes it
  const closeOnLink = (e) => {
    if (e.target.closest('a')) {
      setOpen(-1)
      setSheet(false)
    }
  }

  // Escape closes; mobile sheet locks scroll
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(-1)
        setSheet(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    const l = getLenis()
    if (sheet) {
      l?.stop()
      document.body.style.overflow = 'hidden'
    } else {
      l?.start()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheet])

  const enter = (i) => {
    clearTimeout(closeTimer.current)
    setOpen(i)
  }
  const leave = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(-1), 140)
  }

  const panel = open >= 0 ? NAV[open] : null

  return (
    <header
      onMouseLeave={leave}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled || open >= 0 || sheet ? 'glass border-b border-line/60' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-6" aria-label="Main">
        <Link to="/" className="shrink-0" aria-label="Mynt by Pyvot — home" onMouseEnter={leave}>
          <Lockup size="sm" />
        </Link>

        {/* desktop items */}
        <ul className="hidden items-center gap-0.5 whitespace-nowrap xl:flex" role="list">
          {NAV.map((item, i) => {
            const active = groupActive(item, location.pathname)
            const cls = cn(
              'relative inline-flex h-10 items-center gap-1 rounded-full px-2.5 text-[13px] transition-colors',
              active || open === i ? 'text-ink' : 'text-mute hover:text-ink',
            )
            const underline = active && <span className="absolute inset-x-2.5 -bottom-0.5 h-px bg-mint" aria-hidden />
            return (
              <li key={item.label} onMouseEnter={() => (item.items ? enter(i) : leave())}>
                {item.items ? (
                  <button
                    type="button"
                    className={cls}
                    aria-expanded={open === i}
                    aria-haspopup="true"
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    {item.label}
                    <Chevron className={cn('transition-transform', open === i && 'rotate-180 text-mint')} />
                    {underline}
                  </button>
                ) : (
                  <SmartLink to={item.to} className={cls}>
                    {item.label}
                    {underline}
                  </SmartLink>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3" onMouseEnter={leave}>
          <CtaPair size="sm" className="hidden flex-nowrap min-[1360px]:flex" />
          <SmartLink
            to={CTA.start}
            className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-mint px-4 text-sm font-semibold text-[#06251a] min-[1360px]:hidden"
          >
            Get started
          </SmartLink>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink xl:hidden"
            aria-label={sheet ? 'Close menu' : 'Open menu'}
            aria-expanded={sheet}
            onClick={() => setSheet((s) => !s)}
          >
            <span className="relative block h-3 w-4" aria-hidden>
              <span className={cn('absolute left-0 top-0 h-px w-4 bg-current transition-transform', sheet && 'top-1.5 rotate-45')} />
              <span className={cn('absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity', sheet && 'opacity-0')} />
              <span className={cn('absolute left-0 top-3 h-px w-4 bg-current transition-transform', sheet && 'top-1.5 -rotate-45')} />
            </span>
          </button>
        </div>
      </nav>

      {/* desktop mega panel */}
      <AnimatePresence>
        {panel && (
          <motion.div
            key={panel.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseEnter={() => enter(open)}
            onClick={closeOnLink}
            className="absolute inset-x-0 top-full hidden border-b border-line/60 bg-surface/95 backdrop-blur-xl xl:block"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-10 px-6 py-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-mint">{panel.label}</div>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink/90">{panel.intro}</p>
                {panel.cta && (
                  <SmartLink
                    to={panel.cta.to}
                    className="mt-6 inline-flex h-10 items-center rounded-full bg-mint px-4 text-sm font-semibold text-[#06251a] hover:shadow-[0_0_28px_rgba(47,211,154,0.45)]"
                  >
                    {panel.cta.label}
                  </SmartLink>
                )}
              </div>
              <ul className="grid grid-cols-2 gap-1" role="list">
                {panel.items.map((l) => (
                  <li key={l.label}>
                    <SmartLink to={l.to} className="group block rounded-xl px-4 py-3 transition-colors hover:bg-card">
                      <span className="flex items-center gap-2 text-[15px] font-medium text-ink group-hover:text-mint">
                        {l.label}
                        <span className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
                      </span>
                      {l.hint && <span className="mt-0.5 block text-xs text-mute">{l.hint}</span>}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile sheet */}
      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnLink}
            className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto bg-bg/95 backdrop-blur-xl xl:hidden"
          >
            <MobileMenu />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function MobileMenu() {
  const [openGroup, setOpenGroup] = useState(0)
  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col px-6 pb-10 pt-4">
      <ul className="divide-y divide-line/60" role="list">
        {NAV.map((item, i) =>
          item.items ? (
            <li key={item.label}>
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-left text-lg font-medium text-ink"
                aria-expanded={openGroup === i}
                onClick={() => setOpenGroup(openGroup === i ? -1 : i)}
              >
                {item.label}
                <Chevron className={cn('h-4 w-4 text-mute transition-transform', openGroup === i && 'rotate-180 text-mint')} />
              </button>
              <div className={cn('grid transition-[grid-template-rows] duration-300', openGroup === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <ul className="overflow-hidden" role="list">
                  {item.items.map((l) => (
                    <li key={l.label}>
                      <SmartLink to={l.to} className="block py-2.5 pl-4 text-[15px] text-mute hover:text-ink">
                        {l.label}
                      </SmartLink>
                    </li>
                  ))}
                  <li className="pb-4" aria-hidden />
                </ul>
              </div>
            </li>
          ) : (
            <li key={item.label}>
              <SmartLink to={item.to} className="block py-4 text-lg font-medium text-ink">
                {item.label}
              </SmartLink>
            </li>
          ),
        )}
      </ul>
      <CtaPair size="md" magnetic={false} className="mt-8" />
    </div>
  )
}
