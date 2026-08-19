import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const VIDEO_SRC = '/videos/3.mp4'

// Contact hero video inside the real iPhone 17 Pro Max frame (public/iphone17-frame.png,
// transparent screen + surround), floating over an animated mint/teal glow.
// Screen cutout in the frame: 4.2% left/right, 1.72% top/bottom of the image.
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
          className="relative aspect-[452/932] w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
        >
          {/* video sits in the frame's screen cutout */}
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            className="absolute object-cover"
            style={{
              left: '4.2%',
              right: '4.2%',
              top: '1.72%',
              bottom: '1.72%',
              width: '91.6%',
              height: '96.56%',
              borderRadius: '14% / 6.8%',
            }}
            autoPlay={!still}
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Pyvot contact — restaurant team on call"
          />
          <img
            src="/iphone17-frame.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
            draggable={false}
          />
        </motion.div>

        <div
          className="pointer-events-none mx-auto mt-4 h-8 w-[70%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.2),transparent_70%)] blur-md"
          aria-hidden
        />
      </motion.div>
    </div>
  )
}
