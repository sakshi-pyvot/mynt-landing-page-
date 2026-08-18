import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { reducedMotion } from '@/lib/utils'

// Liquid-glass cursor: a small clear lens that follows the pointer and refracts the
// page under it (backdrop-filter + SVG displacement in Chromium; soft glass blur
// elsewhere), stretches with speed and grows over links. A 4px mint dot keeps precision.

const HOVER_SELECTOR = 'a, button, [data-magnetic], input, select, textarea, [role=button]'
const SIZE = 36
const HOVER_SCALE = 1.5

export default function CustomCursor() {
  const lensRef = useRef(null)
  const dotRef = useRef(null)
  const turbRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined

    document.body.classList.add('custom-cursor')
    const lens = lensRef.current
    const dot = dotRef.current

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' })
    const lensX = gsap.quickTo(lens, 'x', { duration: 0.28, ease: 'power3.out' })
    const lensY = gsap.quickTo(lens, 'y', { duration: 0.28, ease: 'power3.out' })
    const rot = gsap.quickTo(lens, 'rotation', { duration: 0.3, ease: 'power2.out' })
    const sx = gsap.quickTo(lens, 'scaleX', { duration: 0.35, ease: 'power3.out' })
    const sy = gsap.quickTo(lens, 'scaleY', { duration: 0.35, ease: 'power3.out' })

    let hover = false
    let last = { x: 0, y: 0, t: performance.now() }
    let relaxTimer

    const onMove = (e) => {
      const now = performance.now()
      const dt = Math.max(now - last.t, 8)
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      const speed = Math.hypot(dx, dy) / dt // px per ms
      last = { x: e.clientX, y: e.clientY, t: now }

      dotX(e.clientX)
      dotY(e.clientY)
      lensX(e.clientX)
      lensY(e.clientY)

      // stretch along the direction of travel, like a drop of liquid
      const base = hover ? HOVER_SCALE : 1
      const k = Math.min(speed * 0.35, 0.42)
      if (speed > 0.15) rot((Math.atan2(dy, dx) * 180) / Math.PI)
      sx(base * (1 + k))
      sy(base * (1 - k * 0.55))
      clearTimeout(relaxTimer)
      relaxTimer = setTimeout(() => {
        sx(hover ? HOVER_SCALE : 1)
        sy(hover ? HOVER_SCALE : 1)
      }, 90)

      if (lens.style.opacity !== '1') gsap.to([lens, dot], { opacity: 1, duration: 0.25 })
    }
    const setHover = (on) => {
      hover = on
      lens.classList.toggle('is-hover', on)
      sx(on ? HOVER_SCALE : 1)
      sy(on ? HOVER_SCALE : 1)
      gsap.to(dot, { scale: on ? 0 : 1, duration: 0.2 })
    }
    const onOver = (e) => e.target.closest(HOVER_SELECTOR) && setHover(true)
    const onOut = (e) => e.target.closest(HOVER_SELECTOR) && setHover(false)
    const onLeave = () => gsap.to([lens, dot], { opacity: 0, duration: 0.2 })
    const onDown = () => gsap.to(lens, { scale: 0.9, duration: 0.12 })
    const onUp = () => gsap.to(lens, { scale: hover ? HOVER_SCALE : 1, duration: 0.25, ease: 'back.out(2)' })

    // slow shimmer: drift the displacement noise so the glass reads as liquid, not static
    const turb = turbRef.current
    let t = 0
    const shimmer = () => {
      t += 0.012
      turb?.setAttribute('baseFrequency', `${(0.012 + Math.sin(t) * 0.003).toFixed(4)} ${(0.016 + Math.cos(t * 0.8) * 0.004).toFixed(4)}`)
    }
    const shimmerId = setInterval(shimmer, 60)

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      document.body.classList.remove('custom-cursor')
      clearInterval(shimmerId)
      clearTimeout(relaxTimer)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block" aria-hidden>
      {/* displacement map for the lens (Chromium honours url() in backdrop-filter) */}
      <svg width="0" height="0" className="absolute">
        <filter id="cursor-lens" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.012 0.016" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        ref={lensRef}
        className="cursor-lens absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{ width: SIZE, height: SIZE }}
      >
        <span className="cursor-lens-spec" />
      </div>
      <div ref={dotRef} className="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint opacity-0 shadow-[0_0_8px_rgba(47,211,154,0.9)]" />
    </div>
  )
}
