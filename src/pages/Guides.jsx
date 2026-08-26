import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button, GlowCard, GlowOrbs, InteractiveCard, PageHero, Reveal, Section, SectionHead } from '@/components/ui'
import { ARTICLES, CATEGORIES, getPopularArticles } from '@/help/catalog'
import { getLenis } from '@/lib/scroll'
import { CONTACT, CTA } from '@/lib/site'
import { cn } from '@/lib/utils'

// Content comes from src/help/catalog.ts, synced from the Mynt app (see src/help/README.md).
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
const POPULAR = getPopularArticles()
const ALL = 'all'
const TABS = [{ id: ALL, label: 'All guides', count: ARTICLES.length }, ...CATEGORIES]

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

function Icon({ id, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[id]} />
    </svg>
  )
}

function ArticleCard({ a, className }) {
  const c = CAT_BY_ID[a.category]
  return (
    <InteractiveCard as={Link} to={`/mynt/guides/${a.id}`} className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-mint">{c.label}</span>
        {a.popular && <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-mint">Popular</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-mint">{a.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">{a.excerpt}</p>
      <span className="mt-auto pt-5 text-xs font-semibold text-mint">Read guide →</span>
    </InteractiveCard>
  )
}

export default function Guides() {
  const [cat, setCat] = useState(ALL)
  const [q, setQ] = useState('')
  const listRef = useRef(null)
  const query = q.trim().toLowerCase()

  const list = useMemo(
    () =>
      ARTICLES.filter((a) => {
        if (cat !== ALL && a.category !== cat) return false
        if (!query) return true
        return `${a.title} ${a.excerpt} ${CAT_BY_ID[a.category].label}`.toLowerCase().includes(query)
      }),
    [cat, query],
  )

  const jump = (id) => {
    setCat(id)
    const el = listRef.current
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -96 })
    else el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div className="relative overflow-hidden">
        {/* faint drifting ticker of guide titles behind the hero */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-40 md:top-52">
          <div className="animate-formula-ticker flex w-max whitespace-nowrap font-mono text-[11px] text-ink opacity-[0.055]">
            {[0, 1].map((i) => (
              <span key={i} className="pr-20">{POPULAR.map((a) => a.title).join('      •      ')}</span>
            ))}
          </div>
        </div>
        <PageHero
          eyebrow="Mynt Guides & Help Centre"
          title={
            <>
              Every screen in Mynt, <span className="text-gradient">explained.</span>
            </>
          }
          lede="Set-up, Gmail connection, outlet mapping, every dashboard metric, reports, tokens and billing — the same guides that live inside the Mynt app."
        >
          <div className="relative mx-auto max-w-2xl">
            <div className="relative flex items-center">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search guides — e.g. token balance, Gmail permissions, outlet mapping…"
                aria-label="Search guides"
                className="w-full rounded-2xl border border-line bg-surface/90 px-5 py-4 pl-12 font-sans text-sm text-ink placeholder:text-mute/60 outline-none transition-all duration-300 focus:border-mint focus:shadow-[0_0_30px_rgba(47,211,154,0.2)]"
              />
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 h-5 w-5 text-mute" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              {q && (
                <button type="button" onClick={() => setQ('')} className="absolute right-4 font-mono text-xs text-mute hover:text-ink">
                  CLEAR
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-mute">
              {query ? (
                <span>
                  <span className="text-mint">{list.length}</span> {list.length === 1 ? 'guide matches' : 'guides match'}
                </span>
              ) : (
                <>
                  <span><span className="text-mint">{ARTICLES.length}</span> guides</span>
                  <span><span className="text-mint">{CATEGORIES.length}</span> topics</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint/60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                    </span>
                    Synced from the Mynt app
                  </span>
                </>
              )}
            </div>
          </div>
        </PageHero>
      </div>

      {!query && (
        <Section tight className="relative pt-0 md:pt-0">
          <GlowOrbs />
          <div className="relative">
            <SectionHead eyebrow="Browse by topic" title="Nine topics. Start where you are." lede="From a brand-new account to reading net margin — pick the part of Mynt you are working in." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.04}>
                  <InteractiveCard as="button" type="button" onClick={() => jump(c.id)} className="flex h-full w-full items-start gap-4 text-left">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-mint/30 bg-mint/10 text-mint shadow-[0_0_24px_rgba(47,211,154,0.18)] transition-transform group-hover:scale-110">
                      <Icon id={c.id} className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-ink transition-colors group-hover:text-mint">{c.label}</span>
                        <span className="rounded-full bg-bg/80 px-2 py-0.5 font-mono text-[10px] text-mute">{c.count} {c.count === 1 ? 'guide' : 'guides'}</span>
                      </span>
                      <span className="mt-1 block text-sm text-mute">{c.description}</span>
                    </span>
                  </InteractiveCard>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      )}

      {!query && (
        <Section tight className="pt-0 md:pt-0">
          <SectionHead eyebrow="Most read" title="Popular guides" lede="The questions operators ask first." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.04} className="h-full">
                <ArticleCard a={a} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <div ref={listRef}>
        <Section id="all-guides" tight className="pt-0 md:pt-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-6" role="tablist" aria-label="Guide topics">
            {TABS.map((t) => {
              const isSelected = cat === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setCat(t.id)}
                  className={cn(
                    'relative rounded-full border border-transparent px-4 py-2 text-xs font-medium transition-all duration-200',
                    isSelected ? 'font-semibold text-mint' : 'text-mute hover:text-ink',
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="activeGuideCat"
                      aria-hidden
                      style={{ position: 'absolute' }}
                      className="lq lq-pill inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                  <span className="relative z-10 ml-2 rounded-full bg-bg/80 px-1.5 py-0.5 font-mono text-[10px] text-mute">{t.count}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="guide-list">
            {list.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
            {list.length === 0 && (
              <div className="rounded-3xl border border-dashed border-line/80 p-12 text-center text-sm text-mute md:col-span-2 lg:col-span-3">
                <p className="text-base font-semibold text-ink">No guides match “{q}”</p>
                <p className="mt-2 text-xs">Try a shorter term — “tokens”, “Gmail”, “mapping”, “invoice”.</p>
                <Button to={CTA.expert} variant="ghost" size="sm" className="mt-5">
                  Ask an expert instead →
                </Button>
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section tight className="pb-28">
        <Reveal>
          <GlowCard className="flex flex-col items-start justify-between gap-6 border-mint/40 bg-gradient-to-r from-card/90 to-surface/90 p-8 md:flex-row md:items-center">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-mint">Still stuck?</span>
              <h2 className="mt-1 text-2xl font-bold text-ink">Talk to someone who has set up Mynt a hundred times.</h2>
              <p className="mt-2 max-w-xl text-sm text-mute">
                Write to <a href={`mailto:${CONTACT.email}`} className="text-mint hover:underline">{CONTACT.email}</a>, or raise a ticket from Help &amp; Support inside Mynt.
              </p>
            </div>
            <Button to={CTA.expert} size="lg" className="shrink-0">
              Talk to an expert
            </Button>
          </GlowCard>
        </Reveal>
      </Section>
    </>
  )
}
