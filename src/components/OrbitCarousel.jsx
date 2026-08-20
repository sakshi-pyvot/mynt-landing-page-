import { useEffect, useRef } from 'react'
import { cn, reducedMotion } from '@/lib/utils'

// Billboard orbit of post cards (ref: Orbit-Carousel-4x5.mp4): cards circle an
// ellipse always facing the viewer — front cards sit lower, larger and brighter.
// No CSS 3D ring so there are no mirrored backfaces. Pauses on hover.
export default function OrbitCarousel({
  images,
  className,
  radiusX = 250,
  radiusY = 70,
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
      for (let i = 0; i < cards.length; i += 1) {
        const a = t * Math.PI * 2 + (i / cards.length) * Math.PI * 2
        const depth = (Math.cos(a) + 1) / 2 // 0 = back, 1 = front
        const x = Math.sin(a) * radiusX * k
        const y = Math.cos(a) * radiusY
        const c = cards[i]
        c.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${(0.55 + depth * 0.5) * k})`
        c.style.zIndex = String(Math.round(depth * 100))
        c.style.opacity = String(0.4 + depth * 0.6)
        c.style.filter = `brightness(${0.55 + depth * 0.45})`
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
      style={{ height: radiusY * 2 + cardWidth * 2 }}
      aria-label="Pyvot Instagram posts"
    >
      {images.map((img) => (
        <a
          key={img.src}
          href={img.href || 'https://www.instagram.com/pyvot.in/'}
          target="_blank"
          rel="noreferrer"
          className="absolute left-1/2 top-1/2 block overflow-hidden rounded-xl border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition-[border-color] hover:border-mint/50"
          style={{ width: cardWidth, willChange: 'transform' }}
        >
          <img src={img.src} alt={img.alt || 'Pyvot Instagram post'} loading="lazy" draggable={false} className="block aspect-[4/5] w-full select-none object-cover" />
        </a>
      ))}
    </div>
  )
}
