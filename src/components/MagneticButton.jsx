import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { reducedMotion } from '@/lib/utils'

// Wraps a single child; pulls it toward the pointer within its own bounds.
export default function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return undefined
    const el = ref.current
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return (
    <div ref={ref} data-magnetic className={`inline-block ${className}`}>
      {children}
    </div>
  )
}
