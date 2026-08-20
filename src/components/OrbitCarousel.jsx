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
        // billboard model: manual scale keeps cards inside the container (a
        // perspective projection inflated front cards over the section text).
        // Cards stay fully OPAQUE — the crossover "flap" was translucent cards
        // blending during the z-index swap; two similarly-dark opaque cards
        // trade layers invisibly, and emerging cards read solid, not flickery.
        c.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${lean}deg) scale(${(0.55 + depth * 0.5) * k})`
        c.style.zIndex = String(Math.round(depth * 100))
        // depth dim via an overlay's opacity (compositor-only) — animating a
        // brightness/drop-shadow filter re-rasterized every card every frame
        const dim = c.lastElementChild
        if (dim) dim.style.opacity = String(0.55 - depth * 0.55)
      }
    }

    const tick = (now) => {
      if (!paused.current) t += ((now - last) / 1000) * speed
      last = now
      layout()
      raf = requestAnimationFrame(tick)
    }

    layout()
    // only animate while the orbit is actually on screen
    let running = false
    const io = new IntersectionObserver(([e]) => {
      if (still) return
      if (e.isIntersecting && !running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!e.isIntersecting && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
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
      style={{ height: radiusY * 2 + cardWidth * (16 / 9) * 1.15 }}
      aria-label="Pyvot Instagram posts"
    >
      {images.map((img) => (
        <a
          key={img.src}
          href={img.href || 'https://www.instagram.com/pyvot.in/'}
          target="_blank"
          rel="noreferrer"
          className="group absolute left-1/2 top-1/2 block overflow-hidden rounded-xl border border-white/10 shadow-[0_16px_30px_rgba(0,0,0,0.4)] transition-[border-color] hover:border-mint/50"
          style={{ width: cardWidth, willChange: 'transform' }}
        >
          <img
            src={img.src}
            alt={img.alt || 'Pyvot Instagram post'}
            loading="lazy"
            draggable={false}
            className="block aspect-[9/16] w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          {/* depth dim layer — must stay lastElementChild, layout() drives its opacity */}
          <div className="pointer-events-none absolute inset-0 bg-black" aria-hidden />
        </a>
      ))}
    </div>
  )
}
