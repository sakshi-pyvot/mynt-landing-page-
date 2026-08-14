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

function Row({ logos, className }) {
  return (
    <div className={`marquee-row flex w-max items-center gap-6 ${className}`}>
      {[...logos, ...logos].map((file, i) => (
        <div
          key={i}
          className="flex h-16 w-32 shrink-0 items-center justify-center rounded-xl bg-white/[0.92] p-3 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
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
  )
}

export default function TrustMarquee() {
  const root = useRef(null)

  useGSAP(
    () => {
      const rows = gsap.utils.toArray('.marquee-row')
      const tweens = rows.map((row, i) =>
        gsap.to(row, {
          xPercent: i % 2 ? 50 : -50,
          duration: 42,
          ease: 'none',
          repeat: -1,
        }),
      )
      // scroll velocity nudges marquee speed (lusion touch)
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1200, 3)
          tweens.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.3, overwrite: true }))
        },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative overflow-hidden border-y border-line/60 py-14">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-mute">
        Built from real restaurant operations · 100+ brands
      </p>
      <div className="flex flex-col gap-5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <Row logos={rowA} />
        <Row logos={rowB} className="-translate-x-1/4" />
      </div>
    </section>
  )
}
