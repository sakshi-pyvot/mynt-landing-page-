import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { HOVER_SELECTOR, reducedMotion } from '@/lib/utils'

// static radial lens map for the cursor's refraction: R/G encode an offset that
// pulls samples toward the centre (magnify), zero at centre and rim so the
// distortion blends out cleanly. Generated once, used as the filter's feImage.
const makeLensMap = (n = 64) => {
  const c = document.createElement('canvas')
  c.width = c.height = n
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(n, n)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = (x + 0.5) / n - 0.5
      const dy = (y + 0.5) / n - 0.5
      const r = Math.hypot(dx, dy) * 2
      const s = r < 1 ? Math.sin(r * Math.PI) : 0
      const i = (y * n + x) * 4
      img.data[i] = Math.round(-dx * s * 127 + 128)
      img.data[i + 1] = Math.round(-dy * s * 127 + 128)
      img.data[i + 2] = 0
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

// Liquid-glass cursor: a small clear lens that follows the pointer and refracts the
// page under it (backdrop-filter + SVG displacement in Chromium; soft glass blur
// elsewhere), stretches with speed and grows over links. A 4px mint dot keeps precision.

const SIZE = 36
const HOVER_SCALE = 1.5

export default function CustomCursor() {
  const lensRef = useRef(null)
  const dotRef = useRef(null)
  const [lensMap] = useState(() => makeLensMap())

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
    // the Guide reader forwards hover state from inside its article iframe
    const onHoverEvt = (e) => setHover(!!e.detail)
    const onOver = (e) => e.target.closest(HOVER_SELECTOR) && setHover(true)
    const onOut = (e) => e.target.closest(HOVER_SELECTOR) && setHover(false)
    const onLeave = () => gsap.to([lens, dot], { opacity: 0, duration: 0.2 })
    const onDown = () => gsap.to(lens, { scale: 0.9, duration: 0.12 })
    const onUp = () => gsap.to(lens, { scale: hover ? HOVER_SCALE : 1, duration: 0.25, ease: 'back.out(2)' })

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('cursor:hover', onHoverEvt)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      document.body.classList.remove('custom-cursor')
      clearTimeout(relaxTimer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('cursor:hover', onHoverEvt)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block" aria-hidden>
      <svg width="0" height="0" className="absolute">
        <filter id="cursor-lens-warp" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={lensMap} preserveAspectRatio="none" result="m" />
          <feDisplacementMap in="SourceGraphic" in2="m" scale="14" xChannelSelector="R" yChannelSelector="G" />
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
