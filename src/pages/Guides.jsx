import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Accordion, Button, Eyebrow, GlowCard, GlowOrbs, Reveal, Section, SectionHead } from '@/components/ui'
import { ARTICLES, CATEGORIES, getPopularArticles } from '@/help/catalog'
import MEDIA from '@/help/media.json'
import { CONTACT, CTA } from '@/lib/site'
import FaqScene from '@/components/FaqScenes'
import { cn, reducedMotion } from '@/lib/utils'

// Content comes from src/help/catalog.ts; imagery from src/help/media.json —
// both synced from the Mynt app (see src/help/README.md).
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
const M = MEDIA.articles
const CAT_COVER = MEDIA.categories
const POPULAR = getPopularArticles()
const VIDEOS = ARTICLES.filter((a) => M[a.id]?.video)
const MAX_RESULTS = 8

// FAQ = question-titled guides; answer is the catalog excerpt verbatim (no site-authored copy)
const FAQ_IDS = [
  '02-gmail-permissions',
  '05-how-often-sync',
  '01-why-todays-recent-data-not-showing',
  '01-what-is-outlet-mapping-and-why-required',
  '01-what-are-mynt-tokens',
  '02-which-mynt-features-consume-tokens',
  '01-understanding-mynt-pricing-annual-outlet-licences',
]
const FAQ = FAQ_IDS.map((id) => ARTICLES.find((a) => a.id === id))
  .filter(Boolean)
  .map((a) => ({
    article: a,
    q: a.title,
    a: (
      <>
        {a.excerpt}{' '}
        <Link to={`/mynt/guides/${a.id}`} className="whitespace-nowrap font-medium text-mint hover:underline">
          Read the full guide →
        </Link>
      </>
    ),
  }))

// a topic opens on its first guide; the reader's rail lists the rest
const firstOf = (catId) => ARTICLES.find((a) => a.category === catId)
const guideTo = (a) => `/mynt/guides/${a.id}`

// one glyph per help category — ids match catalog.ts CATEGORY_DEFS
const ICONS = {
  'getting-started': 'M6 4l13 8-13 8V4z',
  email: 'M4 6h16v12H4zM4 7l8 6 8-6',
  outlets: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  dashboard: 'M5 20v-8M11 20V5M17 20v-5M2 20h20',
  reports: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h6',
  tokens: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h4.5a2 2 0 0 1 0 4H9h5a2 2 0 0 1 0 4H9M11 7v2M11 17v2',
  billing: 'M3 6h18v12H3zM3 10h18M7 15h4',
  data: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01',
  security: 'M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3zM9 12l2 2 4-4',
}

const fmt = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null)

function Icon({ id, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[id]} />
    </svg>
  )
}

function Play({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  )
}

// live results under the search field
function Results({ results, active, onHover, query }) {
  return (
    <div className="lq absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line/70 shadow-[0_30px_80px_rgba(0,0,0,0.6)]" role="listbox" aria-label="Matching guides">
      {results.length === 0 ? (
        <div className="p-5 text-sm text-mute">
          No guides match “{query}”.{' '}
          <Link to={CTA.expert} className="text-mint hover:underline">Talk to an expert →</Link>
        </div>
      ) : (
        <ul role="list">
          {results.map((a, i) => {
            const m = M[a.id]
            const on = i === active
            return (
              <li key={a.id}>
                <Link
                  to={guideTo(a)}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => onHover(i)}
                  className={cn('flex items-center gap-4 px-4 py-3 transition-colors', on ? 'bg-mint/10' : 'hover:bg-white/[0.03]')}
                >
                  <span className="grid h-10 w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-md border border-white/10 bg-bg">
                    {m?.cover ? <img src={m.cover} alt="" className="h-full w-full object-cover object-top" /> : <Icon id={a.category} className="h-4 w-4 text-mint/70" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-mint">
                      {CAT_BY_ID[a.category].label}
                      {m?.mins && <span className="text-mute"> · {m.mins} min</span>}
                    </span>
                    <span className={cn('mt-0.5 block truncate text-sm font-semibold', on ? 'text-mint' : 'text-ink')}>{a.title}</span>
                  </span>
                  <span className={cn('hidden font-mono text-[10px] text-mute sm:block', on ? 'opacity-100' : 'opacity-0')}>↵</span>
                </Link>
              </li>
            )
          })}
          <li className="flex items-center justify-between border-t border-line/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-mute">
            <span>{results.length === MAX_RESULTS ? `Top ${MAX_RESULTS}` : results.length} of {ARTICLES.length}</span>
            <span className="hidden sm:block">↑↓ move · ↵ open · esc clear</span>
          </li>
        </ul>
      )}
    </div>
  )
}

// poster at rest, plays on hover/focus — a video preview that costs nothing until touched
function HoverVideo({ a }) {
  const m = M[a.id]
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  const rm = reducedMotion()
  const start = () => {
    if (rm) return
    setOn(true)
    ref.current?.play().catch(() => {})
  }
  const stop = () => {
    setOn(false)
    const v = ref.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }
  return (
    <Link
      to={guideTo(a)}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="lq-card group relative block overflow-hidden rounded-2xl border border-line/70 bg-card/70 transition-colors hover:border-mint/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-bg">
        <video ref={ref} src={m.video} poster={m.poster} muted loop playsInline preload="none" className="h-full w-full object-cover" aria-label={a.title} />
        <div className={cn('pointer-events-none absolute inset-0 grid place-items-center bg-bg/30 transition-opacity duration-300', on && 'opacity-0')} aria-hidden>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-mint text-[#06251a] shadow-[0_0_40px_rgba(47,211,154,0.55)] transition-transform group-hover:scale-110">
            <Play className="ml-0.5 h-6 w-6" />
          </span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-bg/80 px-2 py-0.5 font-mono text-[10px] text-ink">{fmt(m.secs) || 'demo'}</span>
      </div>
      <div className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-mint">{CAT_BY_ID[a.category].label}</div>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-mint">{a.title}</h3>
      </div>
    </Link>
  )
}

// hero showcase: the 9 demo clips, one after another, in the product frame
function DemoFrame() {
  const [i, setI] = useState(0)
  const ref = useRef(null)
  const a = VIDEOS[i]
  const m = M[a.id]
  const rm = reducedMotion()
  const next = () => setI((n) => (n + 1) % VIDEOS.length)

  // only run while on screen
  useEffect(() => {
    const v = ref.current
    if (!v || rm) return undefined
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { rootMargin: '80px' })
    io.observe(v)
    return () => io.disconnect()
  }, [i, rm])

  return (
    <Link to={guideTo(a)} className="group relative block" aria-label={`Watch: ${a.title}`}>
      <motion.div
        className="pointer-events-none absolute -inset-[14%] rounded-[64px] blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(47,211,154,0.45), rgba(47,211,154,0.16) 45%, transparent 72%)' }}
        animate={rm ? undefined : { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <div
        className="glass relative overflow-hidden rounded-3xl border p-3 md:p-4"
        style={{ borderColor: 'rgba(47,211,154,0.35)', boxShadow: '0 0 120px rgba(47,211,154,0.2), 0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)' }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden />
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bg">
          <AnimatePresence initial={false}>
            <motion.video
              key={a.id}
              ref={ref}
              src={m.video}
              poster={m.poster}
              muted
              playsInline
              autoPlay={!rm}
              preload="auto"
              onEnded={next}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={a.title}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/95 via-bg/60 to-transparent p-4 pt-12" aria-hidden>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mint">
              <Play className="h-3 w-3" /> Watch · {fmt(m.secs) || 'demo'}
            </div>
            <div className="mt-1 line-clamp-1 text-sm font-semibold text-ink">{a.title}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {VIDEOS.map((v, n) => (
            <span key={v.id} className={cn('h-1 rounded-full transition-all duration-300', n === i ? 'w-6 bg-mint' : 'w-2 bg-line')} />
          ))}
        </div>
      </div>
    </Link>
  )
}

// category tile: a real screen from that part of Mynt, label + count over it
function TopicTile({ c, delay }) {
  const cover = CAT_COVER[c.id]?.cover
  return (
    <Reveal delay={delay}>
      <Link to={guideTo(firstOf(c.id))} className="lq-card group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/70 bg-card text-left transition-colors hover:border-mint/50">
        {cover ? (
          <img src={cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-80" />
        ) : (
          <div className="dot-field absolute inset-0" aria-hidden />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/5" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-mint/30 bg-bg/80 text-mint shadow-[0_0_24px_rgba(47,211,154,0.25)]">
              <Icon id={c.id} className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-ink transition-colors group-hover:text-mint">{c.label}</span>
          </div>
          <span className="rounded-full border border-line bg-bg/80 px-2.5 py-1 font-mono text-[11px] text-ink/80">{c.count} guides</span>
        </div>
      </Link>
    </Reveal>
  )
}

// FAQ companion: an animated illustration of the open question's topic
function FaqFrame({ a }) {
  const m = M[a.id]
  return (
    <Link to={guideTo(a)} className="group relative block" aria-label={`Open guide: ${a.title}`}>
      <div className="pointer-events-none absolute -inset-[12%] rounded-[64px] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.35),rgba(47,211,154,0.12)_45%,transparent_72%)] blur-3xl" aria-hidden />
      <div
        className="glass relative overflow-hidden rounded-3xl border p-3 md:p-4"
        style={{ borderColor: 'rgba(47,211,154,0.3)', boxShadow: '0 0 100px rgba(47,211,154,0.16), 0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)' }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden />
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bg">
          <div className="dot-field absolute inset-0 opacity-50" aria-hidden />
          <AnimatePresence initial={false}>
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <FaqScene id={a.id} />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/95 via-bg/60 to-transparent p-4 pt-12" aria-hidden>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mint">
              {CAT_BY_ID[a.category].label}
              {m?.mins && <span className="text-mute"> · {m.mins} min</span>}
            </div>
            <div className="mt-1 line-clamp-1 text-sm font-semibold text-ink">{a.title}</div>
          </div>
        </div>
        <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-mute transition-colors group-hover:text-mint">Open the full guide →</div>
      </div>
    </Link>
  )
}

export default function Guides() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [faqShown, setFaqShown] = useState(0) // last opened FAQ item, drives the side frame
  const searchRef = useRef(null)
  const boxRef = useRef(null)
  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (!query) return []
    return ARTICLES.filter((a) => `${a.title} ${a.excerpt} ${CAT_BY_ID[a.category].label}`.toLowerCase().includes(query)).slice(0, MAX_RESULTS)
  }, [query])

  // "/" or ⌘K from anywhere lands in the search box; clicks outside close the results
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName)
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const onSearchKey = (e) => {
    if (e.key === 'Escape') {
      setQ('')
      setOpen(false)
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((n) => (n + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((n) => (n - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      navigate(guideTo(results[active] || results[0]))
    }
  }

  const showResults = open && query.length > 0

  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="dot-field absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
          <div className="mint-glow absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />
          <div className="absolute inset-x-0 top-28 md:top-36">
            <div className="animate-formula-ticker flex w-max whitespace-nowrap font-mono text-[11px] text-ink opacity-[0.05]">
              {[0, 1].map((i) => (
                <span key={i} className="pr-20">{POPULAR.map((a) => a.title).join('      •      ')}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow>Mynt Help Centre</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                What do you need <span className="text-gradient">help with?</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-md text-base text-mute md:text-lg">Short guides with real Mynt screens — search, or pick a topic.</p>
            </Reveal>

            <Reveal delay={0.15} className="mt-8">
              <div ref={boxRef} className="relative">
                <label
                  htmlFor="guide-search"
                  className="lq relative flex items-center rounded-2xl border border-mint/50 shadow-[0_0_44px_rgba(47,211,154,0.2)] transition-all duration-300 focus-within:border-mint focus-within:shadow-[0_0_64px_rgba(47,211,154,0.38)]"
                >
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-5 h-5 w-5 text-mint" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    id="guide-search"
                    ref={searchRef}
                    type="search"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      setActive(0)
                      setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onSearchKey}
                    placeholder={`Search ${ARTICLES.length} guides…`}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showResults}
                    aria-controls="guide-results"
                    className="w-full bg-transparent py-5 pl-14 pr-24 text-base text-ink outline-none placeholder:text-mute/70 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  <span className="absolute right-4 flex items-center gap-2">
                    {q ? (
                      <button type="button" onClick={() => setQ('')} className="font-mono text-xs text-mute hover:text-ink">
                        CLEAR
                      </button>
                    ) : (
                      <>
                        <kbd className="hidden rounded-md border border-line bg-bg/70 px-2 py-1 font-mono text-[11px] text-mute sm:inline-block">/</kbd>
                        <kbd className="hidden rounded-md border border-line bg-bg/70 px-2 py-1 font-mono text-[11px] text-mute sm:inline-block">⌘K</kbd>
                      </>
                    )}
                  </span>
                </label>
                {showResults && (
                  <div id="guide-results">
                    <Results results={results} active={active} onHover={setActive} query={q.trim()} />
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.2} className="mt-5">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    to={guideTo(firstOf(c.id))}
                    className="lq lq-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:text-mint"
                  >
                    <Icon id={c.id} className="h-3.5 w-3.5 text-mint" />
                    {c.label}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="hidden md:block">
            <DemoFrame />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- topics -- */}
      <Section tight className="relative">
        <GlowOrbs />
        <div className="relative">
          <SectionHead eyebrow="Browse by topic" title="Pick the part of Mynt you are in." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <TopicTile key={c.id} c={c} delay={i * 0.04} />
            ))}
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- watch -- */}
      <Section tight className="pt-0 md:pt-0">
        <SectionHead eyebrow="Watch & learn" title="See it done in under a minute." lede="Hover to play. Click for the full guide." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.04}>
              <HoverVideo a={a} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-widest text-mute">Most read</span>
            {POPULAR.map((a) => (
              <Link key={a.id} to={guideTo(a)} className="lq lq-press rounded-full px-3 py-1.5 text-xs text-ink transition-colors hover:text-mint">
                {a.title}
              </Link>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ----------------------------------------------------------- faq -- */}
      <Section id="faq" tight className="pt-0 md:pt-0">
        <SectionHead eyebrow="FAQ" title="Quick answers." lede="The short version — each one links to the full guide." />
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <Accordion items={FAQ} onChange={(i) => i >= 0 && setFaqShown(i)} />
          </Reveal>
          <Reveal delay={0.1} className="hidden lg:block lg:sticky lg:top-28">
            {FAQ[faqShown] && <FaqFrame a={FAQ[faqShown].article} />}
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------------- cta -- */}
      <Section tight className="pb-28">
        <Reveal>
          <GlowCard className="border-mint/40 bg-gradient-to-r from-card/90 to-surface/90 p-7">
            {/* GlowCard wraps children in a plain div — layout lives on this row */}
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-ink md:text-2xl">Still stuck? Talk to a human.</h2>
                <p className="mt-2 text-sm text-mute">
                  <a href={`mailto:${CONTACT.email}`} className="text-mint hover:underline">{CONTACT.email}</a> · or raise a ticket from Help &amp; Support inside Mynt.
                </p>
              </div>
              <Button to={CTA.expert} size="md" className="shrink-0">
                Talk to an expert
              </Button>
            </div>
          </GlowCard>
        </Reveal>
      </Section>
    </>
  )
}
