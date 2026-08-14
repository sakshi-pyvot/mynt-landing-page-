import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { reducedMotion } from '@/lib/utils'

const HOVER_SELECTOR = 'a, button, [data-magnetic]'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined

    document.body.classList.add('custom-cursor')
    const dot = dotRef.current
    const ring = ringRef.current

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' })

    const onMove = (e) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
      if (dot.style.opacity !== '1') gsap.to([dot, ring], { opacity: 1, duration: 0.2 })
    }
    const onOver = (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        gsap.to(ring, { scale: 1.8, backgroundColor: 'rgba(47,211,154,0.08)', duration: 0.25 })
        gsap.to(dot, { scale: 0.4, duration: 0.25 })
      }
    }
    const onOut = (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        gsap.to(ring, { scale: 1, backgroundColor: 'rgba(47,211,154,0)', duration: 0.25 })
        gsap.to(dot, { scale: 1, duration: 0.25 })
      }
    }
    const onLeave = () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 })

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      document.body.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block">
      <div
        ref={ringRef}
        className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/50 opacity-0"
      />
      <div
        ref={dotRef}
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint opacity-0"
      />
    </div>
  )
}
