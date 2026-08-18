import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AnimatePresence, motion } from 'motion/react'
import { cn, reducedMotion } from '@/lib/utils'

// Team visuals for /about: portrait tiles (photo cutout on a brand tile, initials
// fallback), the hero mosaic that leans with the pointer, and the tabbed team grid.

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')

const LinkedIn = ({ href, className }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`LinkedIn`}
      onClick={(e) => e.stopPropagation()}
      className={cn('grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-bg/60 text-ink/80 backdrop-blur transition-colors hover:border-mint hover:text-mint', className)}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M6.5 8.5h-3V20h3V8.5ZM5 3.8a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM20.5 13.2c0-3.1-1.7-4.9-4.2-4.9-1.6 0-2.6.9-3 1.6V8.5h-3V20h3v-6.1c0-1.6.6-2.7 2.1-2.7 1.4 0 2.1.9 2.1 2.7V20h3v-6.8Z" />
      </svg>
    </a>
  ) : null

// photo cutout on a tile; if /team/<slug>.png is missing, initials take over
export function Portrait({ person, className, imgClass }) {
  const [missing, setMissing] = useState(false)
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-[#161c27] to-[#0d1119]', className)}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(47,211,154,0.22),transparent_70%)]" />
      {missing ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-3xl font-semibold tracking-wide text-mint/80">{initials(person.name)}</span>
        </div>
      ) : (
        <img
          src={`/team/${person.slug}.png`}
          alt={person.name}
          loading="lazy"
          onError={() => setMissing(true)}
          className={cn('absolute inset-x-0 bottom-0 h-full w-full object-cover object-top transition-transform duration-500', imgClass)}
        />
      )}
    </div>
  )
}

// hero: three columns of portraits at different depths, leaning toward the pointer
export function HeroMosaic({ people }) {
  const root = useRef(null)
  const cols = [people.slice(0, 3), people.slice(3, 6), people.slice(6, 9)]

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined
    const el = root.current
    const tos = [...el.querySelectorAll('[data-col]')].map((c, i) => ({
      x: gsap.quickTo(c, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(c, 'y', { duration: 0.9, ease: 'power3.out' }),
      k: [0.5, 1, 0.7][i],
    }))
    const rx = gsap.quickTo(el, 'rotationY', { duration: 1, ease: 'power3.out' })
    const onMove = (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1
      const ny = (e.clientY / innerHeight) * 2 - 1
      tos.forEach((t) => {
        t.x(-nx * 14 * t.k)
        t.y(-ny * 10 * t.k)
      })
      rx(nx * 4)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="relative [perspective:1400px]">
      <div className="mint-glow pointer-events-none absolute inset-[-20%]" />
      <div ref={root} className="grid grid-cols-3 gap-3 [transform-style:preserve-3d] md:gap-4">
        {cols.map((col, ci) => (
          <div key={ci} data-col className={cn('flex flex-col gap-3 md:gap-4', ci === 1 ? '-mt-8 md:-mt-12' : 'mt-4')}>
            {col.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + ci * 0.08 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5 + ci + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
                >
                  <Portrait person={p} className="border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]" imgClass="group-hover:scale-[1.04]" />
                </motion.div>
                <div className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-1 rounded-lg bg-bg/80 px-2 py-1.5 opacity-0 backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="truncate text-[11px] font-semibold text-ink">{p.name}</div>
                  <div className="truncate text-[10px] text-mute">{p.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonCard({ p, open = false, onOpen }) {
  const clickable = !!p.bio
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('group relative', clickable && 'cursor-pointer')}
      onClick={clickable ? onOpen : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen()) : undefined}
      aria-expanded={clickable ? open : undefined}
    >
      <div className="relative">
        <Portrait person={p} className={cn('border border-white/5 transition-colors group-hover:border-mint/40', open && 'border-mint/60')} imgClass="group-hover:scale-[1.04]" />
        <LinkedIn href={p.linkedin} className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" />
        {/* quote slides up on hover */}
        {p.quote && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 rounded-b-2xl bg-gradient-to-t from-bg via-bg/90 to-transparent p-4 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-[12px] leading-snug text-ink/90">“{p.quote}”</p>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-[15px] font-semibold leading-tight">{p.name}</div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[13px] text-mute">
          <span>{p.role}</span>
          {clickable && <span className={cn('text-xs text-mint transition-opacity', open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>{open ? 'Close' : 'Read bio'}</span>}
        </div>
      </div>
    </motion.div>
  )
}

export function TeamGrid({ groups }) {
  const [tab, setTab] = useState(0)
  const [openSlug, setOpenSlug] = useState(null)
  const g = groups[tab]
  const openPerson = g.people.find((p) => p.slug === openSlug)

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Teams">
        {groups.map((x, i) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === i}
            onClick={() => {
              setTab(i)
              setOpenSlug(null)
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
              tab === i ? 'border-mint bg-mint/10 text-mint' : 'border-line text-mute hover:text-ink',
            )}
          >
            {x.label}
            <span className={cn('rounded-full px-1.5 py-0.5 font-mono text-[10px]', tab === i ? 'bg-mint/15' : 'bg-card')}>{x.people.length}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" role="tabpanel">
        <AnimatePresence mode="popLayout">
          {g.people.map((p) => (
            <PersonCard key={`${g.key}-${p.slug}`} p={p} open={openSlug === p.slug} onOpen={() => setOpenSlug(openSlug === p.slug ? null : p.slug)} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* bio drawer (leadership) */}
      <AnimatePresence>
        {openPerson && (
          <motion.div
            key={openPerson.slug}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-8 grid gap-6 rounded-2xl border border-mint/30 bg-card/60 p-6 md:grid-cols-[180px_1fr] md:p-8">
              <Portrait person={openPerson} className="hidden md:block" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold">{openPerson.name}</h3>
                  <span className="rounded-full border border-line px-3 py-1 text-xs text-mute">{openPerson.role}</span>
                  <LinkedIn href={openPerson.linkedin} />
                </div>
                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink/85">{openPerson.bio}</p>
                <button type="button" onClick={() => setOpenSlug(null)} className="mt-5 text-sm text-mint hover:underline">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
