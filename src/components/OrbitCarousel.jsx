import { useEffect, useRef } from 'react'
import { cn, reducedMotion } from '@/lib/utils'

// Billboard orbit of post cards (ref: Orbit-Carousel-4x5.mp4): cards circle an
// ellipse always facing the viewer — front cards sit lower, larger and brighter.
// No CSS 3D ring so there are no mirrored backfaces. Pauses on hover.
export default function OrbitCarousel({
  images,
  className,
  radiusX = 250,
  radiusY = 95,
  cardWidth = 150,
  speed = 0.05, // revolutions per second
}) {
  const ring = useRef(null)
  const paused = useRef(false)

  useEffect(() => {
    const el = ring.current
    if (!el) return undefined
    const still = reducedMotion()
    let t = 0.13 // start slightly rotated so no card hides exactly behind
    let last = performance.now()
    let raf = 0

    const layout = () => {
      // scale the orbit down with the container so it survives mobile widths
      const k = Math.min(1, el.clientWidth / (radiusX * 2 + cardWidth))
      const cards = el.children
      const sec = t / speed // wall-clock seconds, so bob speed is speed-independent
      for (let i = 0; i < cards.length; i += 1) {
        const a = t * Math.PI * 2 + (i / cards.length) * Math.PI * 2
        const depth = (Math.cos(a) + 1) / 2 // 0 = back, 1 = front
        const x = Math.sin(a) * radiusX * k
        const y = Math.cos(a) * radiusY + Math.sin(sec * 1.3 + i * 1.7) * 5 // per-card bob
        const lean = Math.sin(a) * 5 // tilt into the direction of travel
        const c = cards[i]
        // real translateZ depth: the browser composites the parallel planes
        // continuously, so passing cards glide over each other instead of the
        // one-frame z-index pop. The card carries ONLY the transform — opacity
        // or filter here would flatten it out of the parent's 3D space — so
        // brightness/shadow/opacity live on the inner img.
        c.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${(Math.cos(a) * 260 - 40) * k}px) rotate(${lean}deg) scale(${k})`
        const img = c.firstElementChild
        if (img) {
          img.style.opacity = String(0.4 + depth * 0.6)
          img.style.filter = `brightness(${0.55 + depth * 0.45}) drop-shadow(0 ${8 + depth * 16}px ${14 + depth * 22}px rgba(0,0,0,${0.25 + depth * 0.3}))`
        }
      }
    }

    const tick = (now) => {
      if (!paused.current) t += ((now - last) / 1000) * speed
      last = now
      layout()
      raf = requestAnimationFrame(tick)
    }

    layout()
    if (!still) raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [radiusX, radiusY, cardWidth, speed])

  return (
    <div
      ref={ring}
      onMouseEnter={() => {
        paused.current = true
      }}
      onMouseLeave={() => {
        paused.current = false
      }}
      className={cn('relative', className)}
      style={{ height: radiusY * 2 + cardWidth * (16 / 9) * 1.15, perspective: '900px', transformStyle: 'preserve-3d' }}
      aria-label="Pyvot Instagram posts"
    >
      {images.map((img) => (
        <a
          key={img.src}
          href={img.href || 'https://www.instagram.com/pyvot.in/'}
          target="_blank"
          rel="noreferrer"
          className="group absolute left-1/2 top-1/2 block overflow-hidden rounded-xl border border-white/10 transition-[border-color] hover:border-mint/50"
          style={{ width: cardWidth, willChange: 'transform' }}
        >
          <img
            src={img.src}
            alt={img.alt || 'Pyvot Instagram post'}
            loading="lazy"
            draggable={false}
            className="block aspect-[9/16] w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        </a>
      ))}
    </div>
  )
}
