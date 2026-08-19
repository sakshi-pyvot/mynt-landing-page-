import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const VIDEO_SRC = '/videos/3.mp4'

// The contact hero video presented as an iPhone: titanium bezel, dynamic island,
// side buttons, home indicator — floating over an animated mint/teal glow.
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
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* animated glow: two blurred blobs drifting behind the phone */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-full bg-[radial-gradient(ellipse_at_35%_30%,rgba(47,211,154,0.28),transparent_60%)] blur-3xl"
        animate={still ? undefined : { rotate: [0, 30, 0], scale: [1, 1.12, 1] }}
        transition={still ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-full bg-[radial-gradient(ellipse_at_70%_70%,rgba(56,189,248,0.16),transparent_60%)] blur-3xl"
        animate={still ? undefined : { rotate: [0, -25, 0], scale: [1.1, 1, 1.1] }}
        transition={still ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="relative"
      >
        <motion.div
          animate={still ? undefined : { y: [0, -10, 0] }}
          transition={still ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          {/* titanium bezel */}
          <div className="relative rounded-[3.2rem] bg-gradient-to-b from-[#3a3d42] via-[#17191d] to-[#2c2f34] p-[3px] shadow-[0_40px_120px_rgba(0,0,0,0.6),0_0_60px_rgba(47,211,154,0.12)]">
            {/* side buttons */}
            <span aria-hidden className="absolute -left-[2px] top-[104px] h-7 w-[3px] rounded-l bg-[#3a3d42]" />
            <span aria-hidden className="absolute -left-[2px] top-[148px] h-12 w-[3px] rounded-l bg-[#3a3d42]" />
            <span aria-hidden className="absolute -left-[2px] top-[204px] h-12 w-[3px] rounded-l bg-[#3a3d42]" />
            <span aria-hidden className="absolute -right-[2px] top-[160px] h-16 w-[3px] rounded-r bg-[#3a3d42]" />
            <div className="rounded-[3rem] bg-black p-[8px]">
              <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.55rem]">
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
                {/* dynamic island */}
                <div aria-hidden className="absolute left-1/2 top-2.5 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_2px_rgba(255,255,255,0.15)]">
                  <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#101418] shadow-[inset_0_0_1.5px_rgba(90,120,150,0.8)]" />
                </div>
                {/* screen glass sheen */}
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.55rem] bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,transparent_28%)]" />
                {/* home indicator */}
                <div aria-hidden className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/70" />
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none mx-auto mt-4 h-8 w-[70%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.2),transparent_70%)] blur-md"
            aria-hidden
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
