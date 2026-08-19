import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const VIDEO_SRC = '/videos/3.mp4'

export default function ContactHeroVideo() {
  const videoRef = useRef(null)
  const [still] = useState(() => reducedMotion())

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (still) {
      video.pause()
      return undefined
    }

    video.play().catch(() => {})
    return undefined
  }, [still])

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div
        className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.22),transparent_65%)] blur-2xl"
        aria-hidden
      />

      <motion.div
        animate={still ? undefined : { y: [0, -10, 0] }}
        transition={still ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-[#0a0a0a] p-[3px] shadow-[0_32px_100px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[2.5rem]">
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay={!still}
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Pyvot contact — restaurant team on call"
            />
          </div>
        </div>

        <div
          className="pointer-events-none mx-auto mt-3 h-8 w-[70%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.15),transparent_70%)] blur-md"
          aria-hidden
        />
      </motion.div>
    </div>
  )
}
