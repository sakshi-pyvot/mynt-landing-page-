import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const LOGOS = [
  'chai-break.png', 'kfc.jpg', 'mio-amore.png', 'koshe-kosha.jpg',
  'og-by-the-lake.jpg', 'idly-go.png', 'soda-bottle-opener-wala.jpg', 'pa-pa-ya.jpg',
  'hanglaatherium.png', 'carpe-diem.png', 'oro-cafe.jpg', 'the-tavern.jpg',
  'dunkel-braun.png', 'tao-bao.png', 'malt.png', 'dugout.png',
  'papyrus.jpg', 'romaania.jpg', 'casa-miami.jpg', 'tall-tales.jpg',
  'bhikharam-chandmal.jpg', 'the-south-island.jpg', 'charcoal-kebaberie.jpg', 'berlin-burger.png',
  'vintage-asia.jpg', 'junglee-cafe.jpg', 'fat-little-penguin.jpg', 'splash-luxorant.jpg',
  'denzong-kitchen.jpg', 'urban-tadka.jpg', 'the-biryani-bari.jpg', 'nepal-sweets.jpg',
]

const rowA = LOGOS.slice(0, 16)
const rowB = LOGOS.slice(16)

// Each row renders its set 3× so a full set-width can scroll by before the
// tween wraps — no visible gap at the seam.
function Row({ logos, reverse }) {
  return (
    <div className="marquee-row flex w-max items-center gap-6" data-reverse={reverse ? '1' : '0'}>
      {[0, 1, 2].map((rep) => (
        <div key={rep} className="marquee-set flex shrink-0 items-center gap-6">
          {logos.map((file) => (
            <div
              key={file}
              className="flex h-24 w-44 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1"
            >
              <img
                src={`/brand/curated/${file}`}
                alt={file.replace(/\.(png|jpe?g)$/, '').replaceAll('-', ' ')}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function TrustMarquee() {
  const root = useRef(null)

  useGSAP(
    () => {
      const rows = gsap.utils.toArray('.marquee-row')
      const tweens = rows.map((row) => {
        const set = row.querySelector('.marquee-set')
        const gap = 24 // matches gap-6
        const dist = set.offsetWidth + gap
        const reverse = row.dataset.reverse === '1'
        // reverse row starts one set in so it can travel "backwards" and wrap cleanly
        gsap.set(row, { x: reverse ? -dist : 0 })
        return gsap.to(row, {
          x: reverse ? 0 : -dist,
          duration: 46,
          ease: 'none',
          repeat: -1,
        })
      })
      // scroll velocity nudges marquee speed
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 3)
          tweens.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.3, overwrite: true }))
        },
      })
      // recompute widths on resize/refresh
      ScrollTrigger.addEventListener('refreshInit', () => tweens.forEach((t) => t.invalidate()))
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative overflow-hidden border-y border-line/60 py-16">
      <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.3em] text-mute">
        Built from real restaurant operations · 100+ brands
      </p>
      <div className="flex flex-col gap-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <Row logos={rowA} />
        <Row logos={rowB} reverse />
      </div>
    </section>
  )
}
