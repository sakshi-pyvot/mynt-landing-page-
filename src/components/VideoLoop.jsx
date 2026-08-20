import { useEffect, useRef } from 'react'
import { cn, reducedMotion } from '@/lib/utils'

// Muted looping video that only plays while on screen. Poster shows until then
// (and stays put under prefers-reduced-motion).
export default function VideoLoop({ src, poster, className, videoClass, scrim = false, label }) {
  const ref = useRef(null)

  useEffect(() => {
    const v = ref.current
    if (!v || reducedMotion()) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { rootMargin: '120px' },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        className={cn('h-full w-full object-cover', videoClass)}
      />
      {scrim && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/10" aria-hidden />}
    </div>
  )
}
