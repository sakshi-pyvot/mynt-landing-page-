import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'motion/react'
import { getLenis } from '@/lib/scroll'
import { cn } from '@/lib/utils'

// slugs match /public/testimonials/{full,preview,poster}/<slug>.*
// `about` copy comes from the Brand Testimonial doc — keep it verbatim.
const VOICES = [
  {
    slug: 'og-by-the-lake', brand: 'OG by the Lake', logo: 'og-by-the-lake.jpg', hook: '136% revenue uplift', tag: 'Growth',
    about: 'Founded by Kamran Ahmed Khan and curated by Sneha Singhi Upadhaya (BBC Pastry Chef of the Year - 2018), OG by the Lake emerged as a contemporary destination restaurant in Kolkata. Famous primarily for its scenic lakeside dining experience, rather than for one specific cuisine or dish. Its large waterfront setting, outdoor decks, greenery and broad multi-cuisine menu make ambience central to the brand experience.',
  },
  {
    slug: 'bhikharam-chandmal', brand: 'Bhikharam Chandmal', logo: 'bhikharam-chandmal.jpg', hook: 'Legacy brand, marketplace-first', tag: 'Marketplace',
    about: 'The brand traces its heritage to Bikaner in 1923, later establishing a long-standing presence in Kolkata. Famous for traditional Rajasthani namkeen, sweets and vegetarian snacks rooted in Bikaneri food culture. It combines packaged savouries and mithai with street food and vegetarian meals, extending its traditional snacking identity. Bikaneri Bhujia is the product most closely associated with the brand’s origins and identity.',
  },
  {
    slug: 'nepal-sweets', brand: 'Nepal Sweets', logo: 'nepal-sweets.jpg', hook: 'Discount burn under control', tag: 'Profitability',
    about: 'Nepal Sweets was established in 1891. A sweet brand with strong recognition across generations, famous especially for its wide variety of Bengali sandesh and traditional mithai. Its differentiation comes from experimenting with sandesh through nolen gur, rose, caramel, chocolate and seasonal flavours. Gulab Patti Sandesh is one of the brand’s most distinctive and recognisable products.',
  },
  {
    slug: 'bunaphile', brand: 'Bunaphile', logo: 'bunaphile.png', hook: 'Café growth on Zomato & Swiggy', tag: 'Growth',
    about: 'Founded by Sonika Dey in 2021, Bunaphile began inside Bhalo-Basha, the former home of noted Bengali writer Nabaneeta Dev Sen. Famous as a modern Kolkata café centred around coffee, bakery offerings and all-day café dining. Its strongest differentiation is the use of heritage spaces and Bengali design cues, creating a café identity rooted specifically in Kolkata.',
  },
  {
    slug: 'golbari', brand: 'Golbari', logo: 'golbari.jpg', hook: 'Heritage kitchen, modern ops', tag: 'Operations',
    about: 'Established in the early 1920s in Shyambazar, Golbari has become one of Kolkata’s most enduring old-school food institutions for more than 100 years. Famous almost entirely for its intensely flavoured, dark and slow-cooked mutton kosha. Its distinctive preparation-rich spices, long cooking and traditionally paired paratha or roti has made “Golbari mangsho” a recognisable Kolkata reference. Kosha Mangsho is unquestionably the product that defines the brand.',
  },
  {
    slug: 'pabrai', brand: "Pabrai's", logo: 'pabrais.jpg', hook: 'Multi-outlet visibility', tag: 'Multi-outlet',
    about: 'Pabrai’s was started with Mr. Anuvrat Pabrai the founder of Tulika’s Ice Cream Pvt. Ltd. in 1985, known for premium artisanal ice creams built around distinctive Indian, regional and seasonal flavours. Differentiates itself through flavours such as paan, filter coffee and ingredient-led Indian creations rather than a conventional flavour portfolio. Nolen Gur Ice Cream is the brand’s strongest signature and most recognisable bestseller.',
  },
  {
    slug: 'kaligodam', brand: 'Kaligodam', logo: 'kaligodam.jpg', hook: 'From data to decisions', tag: 'Intelligence',
    about: 'Kaligodam is a Kolkata heritage sweets-and-snacks brand now carried forward by the fourth generation. Famous for traditional mithai alongside freshly prepared hot snacks and savouries. Its identity combines sweets with favourites such as jalebi, bhujia and kachori, giving it a strong everyday-snacking association. Boondia-Bhujia is the signature product most strongly associated with Kaligodam.',
  },
  {
    slug: 'haji', brand: 'Haji Saheb', logo: 'haji-saheb.jpg', hook: 'Payout clarity every week', tag: 'Payouts',
    about: 'Haji Saheb grew from its established Behala presence into a recognised Kolkata name for traditional Mughlai food. Famous for biryani, chaap, kebabs and rich Mughlai curries served in an accessible family-dining format. The brand is particularly associated with generous portions, familiar Mughlai flavours and a broad traditional menu. Mutton Biryani is its strongest signature, with Chicken Chaap another highly associated favourite.',
  },
  {
    slug: 'biryani-babu', brand: 'Biryani Babu', logo: null, hook: 'Ads that actually return', tag: 'Ads',
    about: 'Founded in 2024, Biryani Babu is a young Kolkata brand built as a modern, technology- and SOP-driven biryani QSR. Famous for bold Barrackpore-style biryani, distinguished from the lighter traditional Kolkata-style preparation. Its positioning centres on consistent preparation, generous meat portions and strong value across a scalable QSR format. Barrackpore Chicken Biryani and Mutton Biryani are the products that most strongly define the brand.',
  },
  {
    slug: 'balaram-mullick', brand: 'Balaram Mullick', logo: null, hook: 'Sweets, scaled with data', tag: 'Growth',
    about: 'Founded in 1885, the brand has remained part of Kolkata’s Bengali mishti culture for more than a century and is now run by the fourth generation. Famous for combining traditional Bengali sweets with continuous experimentation and contemporary formats. The brand has built a distinctive identity through baked, flavoured and innovative versions of classic mishti while retaining traditional foundations. Baked Rosogolla is one of its most recognisable innovations and signature products from the house of Balaram Mullick & Radharaman Mullick.',
  },
]

const initials = (s) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function BrandChip({ v, size = 'h-8 w-8' }) {
  return v.logo ? (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1', size)}>
      <img src={`/brand/curated/${v.logo}`} alt="" className="max-h-full max-w-full object-contain" />
    </span>
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-mint/15 text-[10px] font-bold text-mint', size)}>
      {initials(v.brand)}
    </span>
  )
}

function VoiceCard({ v, onOpen }) {
  const videoRef = useRef(null)
  const cardRef = useRef(null)

  // fast first paint: poster only until the card is near the viewport, then
  // attach the preview src and autoplay while on screen
  useEffect(() => {
    const vid = videoRef.current
    const src = vid.dataset.src
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!vid.src) {
            vid.src = src
            vid.load()
          }
          vid.play().catch(() => {})
        } else {
          vid.pause()
        }
      },
      // tight margins: every extra margin-px is another video decoding in
      // parallel — only cards genuinely on screen play
      { threshold: 0.35 },
    )
    io.observe(vid)
    return () => io.disconnect()
  }, [])

  const onMove = (e) => {
    const r = cardRef.current.getBoundingClientRect()
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -10
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 10
    gsap.to(cardRef.current, { rotateX: rx, rotateY: ry, duration: 0.5, ease: 'power2.out' })
  }
  const onLeave = () => gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' })

  return (
    <button
      type="button"
      onClick={() => onOpen(v)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="voice-card group relative shrink-0 snap-center text-left [perspective:1200px]"
      style={{ width: 'clamp(200px, 19vw, 260px)' }}
      aria-label={`Play ${v.brand} testimonial`}
    >
      <div
        ref={cardRef}
        className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-white/10 bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.6)] [transform-style:preserve-3d]"
      >
        <video
          ref={videoRef}
          data-src={`/testimonials/preview/${v.slug}.mp4`}
          poster={`/testimonials/poster/${v.slug}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/95 via-bg/20 to-bg/10" />

        {/* top: brand */}
        <div className="absolute left-4 right-4 top-4 flex items-center gap-2.5">
          <BrandChip v={v} />
          <span className="truncate text-sm font-semibold text-ink drop-shadow">{v.brand}</span>
        </div>

        {/* play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-mint/90 text-[#06251a] shadow-[0_0_40px_rgba(47,211,154,0.55)] transition-transform duration-300 group-hover:scale-110">
            <span className="absolute inset-0 animate-ping rounded-full bg-mint/40" />
            <svg viewBox="0 0 24 24" className="relative ml-1 h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </div>

        {/* bottom: hook */}
        <div className="absolute inset-x-4 bottom-4">
          <span className="inline-block rounded-full border border-mint/40 bg-bg/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mint backdrop-blur">
            {v.tag}
          </span>
          <p className="mt-2 text-base font-semibold leading-tight text-ink">{v.hook}</p>
        </div>
      </div>
    </button>
  )
}

function Lightbox({ v, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    getLenis()?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      getLenis()?.start()
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-bg/92 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${v.brand} testimonial`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full border border-line px-4 py-2 text-xs uppercase tracking-widest text-mute hover:text-ink"
      >
        Close · Esc
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line text-ink hover:border-mint md:flex"
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line text-ink hover:border-mint md:flex"
        aria-label="Next"
      >
        ›
      </button>

      <motion.div
        key={v.slug}
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full flex-col items-center gap-4 md:flex-row md:gap-10"
      >
        <div className="relative aspect-[9/16] h-[min(78vh,760px)] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_0_120px_rgba(47,211,154,0.18)]">
          <video
            key={v.slug}
            src={`/testimonials/full/${v.slug}.mp4`}
            poster={`/testimonials/poster/${v.slug}.jpg`}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
        <div className="max-w-xs text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <BrandChip v={v} size="h-11 w-11" />
            <div>
              <div className="text-lg font-bold">{v.brand}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-mint">{v.tag}</div>
            </div>
          </div>
          <p className="mt-5 text-2xl font-semibold leading-tight text-ink">{v.hook}</p>
          <p className="mt-3 max-h-[32vh] overflow-y-auto text-sm leading-relaxed text-mute">{v.about}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ClientVoices() {
  const root = useRef(null)
  const railRef = useRef(null)
  const [openIdx, setOpenIdx] = useState(-1)

  useGSAP(
    () => {
      gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const rail = railRef.current
        // rail is w-max: distance = its full width minus the viewport
        const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth + 48)
        // fromTo: a refresh mid-scroll must not rebase the start x (keeps progress 0 ⇒ x 0)
        gsap.fromTo(rail, { x: 0 }, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${dist() + 300}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        gsap.from('.voice-card', {
          y: 60,
          opacity: 0,
          stagger: 0.06,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        })
      })
    },
    { scope: root },
  )

  const open = openIdx >= 0 ? VOICES[openIdx] : null

  return (
    <section id="voices" ref={root} className="relative overflow-hidden">
      <div className="mint-glow pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 opacity-60" />
      <div className="relative flex flex-col justify-center py-20 md:h-screen md:min-h-[760px] md:py-0">
        <div className="mx-auto w-full max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-mint">Client Voices</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
            Real restaurants. <span className="text-gradient">In their own words.</span>
          </h2>
          <p className="mt-3 max-w-lg text-mute">
            Filmed on the restaurant floor — owners on what changed after Pyvot and Mynt.
            Tap any story to watch with sound.
          </p>
        </div>

        {/* rail: pinned + horizontally scrubbed on desktop, swipe-snap on mobile */}
        <div className="mt-10 overflow-x-auto overflow-y-visible px-6 md:mt-8 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            ref={railRef}
            className="flex w-max snap-x snap-mandatory gap-5 py-6 pr-6 md:gap-7 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
          >
            {VOICES.map((v, i) => (
              <VoiceCard key={v.slug} v={v} onOpen={() => setOpenIdx(i)} />
            ))}
            {/* end card */}
            <Link
              to="/case-studies"
              className="flex aspect-[9/16] shrink-0 snap-center flex-col items-center justify-center rounded-[28px] border border-dashed border-mint/40 text-center transition-colors hover:bg-mint/5"
              style={{ width: 'clamp(200px, 19vw, 260px)' }}
            >
              <span className="text-4xl font-bold text-mint">250+</span>
              <span className="mt-2 text-sm text-mute">restaurant brands</span>
              <span className="mt-6 rounded-full border border-mint/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-mint">
                All case studies
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* portal: the pinned section is transformed, which would trap a fixed dialog */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <Lightbox
              v={open}
              onClose={() => setOpenIdx(-1)}
              onPrev={() => setOpenIdx((i) => (i - 1 + VOICES.length) % VOICES.length)}
              onNext={() => setOpenIdx((i) => (i + 1) % VOICES.length)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
