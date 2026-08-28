import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Eyebrow, Reveal } from '@/components/ui'
import { ARTICLES, CATEGORIES } from '@/help/catalog'
import { CTA } from '@/lib/site'
import { HOVER_SELECTOR, cn } from '@/lib/utils'
import NotFound from './NotFound'

// Reader for one help article. The body is the article's own HTML from
// public/help-articles (synced from the Mynt app) in its ?embed=1 mode — its
// CSS, screenshots and videos render untouched inside a same-origin iframe.
const ID_BY_PATH = new Map(ARTICLES.map((a) => [a.htmlPath, a.id]))

export default function Guide() {
  const { id } = useParams()
  const navigate = useNavigate()
  const article = ARTICLES.find((a) => a.id === id)
  if (!article) return <NotFound />

  const cat = CATEGORIES.find((c) => c.id === article.category)
  const siblings = ARTICLES.filter((a) => a.category === article.category)
  const idx = ARTICLES.indexOf(article)
  const prev = ARTICLES[idx - 1]
  const next = ARTICLES[idx + 1]

  // size the frame to its content (page scrolls, not the frame) and route the
  // article's own cross-links through the SPA instead of navigating the frame
  const onLoad = (e) => {
    const el = e.currentTarget
    const doc = el.contentDocument
    if (!doc) return
    const fit = () => {
      el.style.height = `${doc.documentElement.scrollHeight}px`
    }
    fit()
    new ResizeObserver(fit).observe(doc.body)
    // custom-cursor bridge: the iframe is its own document, so the site's
    // `cursor: none` and the lens's window mousemove tracking stop at its edge.
    // Hide the native cursor inside and forward pointer events out, translated
    // into parent coordinates, so the lens glides across the article.
    if (document.body.classList.contains('custom-cursor')) {
      doc.head.appendChild(Object.assign(doc.createElement('style'), { textContent: '* { cursor: none !important }' }))
      doc.addEventListener(
        'mousemove',
        (ev) => {
          const r = el.getBoundingClientRect()
          window.dispatchEvent(new MouseEvent('mousemove', { clientX: ev.clientX + r.left, clientY: ev.clientY + r.top }))
        },
        { passive: true },
      )
      doc.addEventListener('mousedown', () => document.dispatchEvent(new MouseEvent('mousedown')))
      doc.addEventListener('mouseup', () => document.dispatchEvent(new MouseEvent('mouseup')))
      doc.addEventListener('mouseover', (ev) => ev.target.closest?.(HOVER_SELECTOR) && window.dispatchEvent(new CustomEvent('cursor:hover', { detail: true })))
      doc.addEventListener('mouseout', (ev) => ev.target.closest?.(HOVER_SELECTOR) && window.dispatchEvent(new CustomEvent('cursor:hover', { detail: false })))
    }
    doc.addEventListener('click', (ev) => {
      const a = ev.target.closest?.('a[href]')
      if (!a) return
      const url = new URL(a.getAttribute('href'), el.src)
      const target = ID_BY_PATH.get(url.pathname)
      if (target) {
        ev.preventDefault()
        navigate(`/mynt/guides/${target}`)
      } else if (url.origin !== location.origin) {
        a.target = '_blank'
        a.rel = 'noopener'
      }
    })
  }

  const crumb = 'text-mute transition-colors hover:text-mint'

  return (
    <div className="relative overflow-hidden pt-32 pb-24 md:pt-40">
      <div className="mint-glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Link to="/mynt/guides" className={cn('text-sm font-medium', crumb)}>← All guides</Link>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-mute">
              {cat.label} · {siblings.length}
            </div>
            <ul className="mt-3 space-y-1 border-l border-line/60" role="list">
              {siblings.map((a) => {
                const active = a.id === article.id
                return (
                  <li key={a.id}>
                    <Link
                      to={`/mynt/guides/${a.id}`}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        '-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors',
                        active ? 'border-mint font-semibold text-mint' : 'border-transparent text-mute hover:border-line hover:text-ink',
                      )}
                    >
                      {a.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <Reveal>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
              <Link to="/mynt/guides" className={crumb}>Guides</Link>
              <span className="text-mute/50">/</span>
              <button type="button" onClick={() => navigate('/mynt/guides')} className={crumb}>{cat.label}</button>
            </nav>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Eyebrow>{cat.label}</Eyebrow>
              {article.popular && (
                <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-mint">Popular</span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
                Guide {siblings.indexOf(article) + 1} of {siblings.length}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="mt-6">
            <div className="overflow-hidden rounded-3xl border border-line/70 bg-[#0f1419] shadow-[0_0_90px_-30px_rgba(47,211,154,0.35)]">
              <iframe
                key={article.id}
                title={article.title}
                src={`${article.htmlPath}?embed=1`}
                onLoad={onLoad}
                scrolling="no"
                className="block min-h-[60vh] w-full"
              />
            </div>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link to={`/mynt/guides/${prev.id}`} className="lq-card group rounded-2xl border border-line/70 bg-card/70 p-5 transition-colors hover:border-mint/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mute">← Previous</span>
                <span className="mt-1 block text-sm font-semibold text-ink group-hover:text-mint">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/mynt/guides/${next.id}`} className="lq-card group rounded-2xl border border-line/70 bg-card/70 p-5 text-right transition-colors hover:border-mint/40">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mute">Next →</span>
                <span className="mt-1 block text-sm font-semibold text-ink group-hover:text-mint">{next.title}</span>
              </Link>
            )}
          </div>

          <div className="mt-8 lg:hidden">
            <div className="font-mono text-[10px] uppercase tracking-widest text-mute">More in {cat.label}</div>
            <ul className="mt-3 space-y-2" role="list">
              {siblings.filter((a) => a.id !== article.id).map((a) => (
                <li key={a.id}>
                  <Link to={`/mynt/guides/${a.id}`} className="text-sm text-mute hover:text-mint">{a.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/60 p-6">
            <p className="text-sm text-mute">Did not find the answer? Raise a ticket from Help &amp; Support inside Mynt, or talk to us.</p>
            <Button to={CTA.expert} size="sm" variant="ghost">Talk to an expert</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
