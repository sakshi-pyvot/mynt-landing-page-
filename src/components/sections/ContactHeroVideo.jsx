import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const VIDEO_SRC = '/videos/3.mp4'

// Contact hero video inside the real iPhone 17 Pro Max frame (public/iphone17-frame.png,
// transparent screen + surround), floating over an animated mint/teal glow.
// Screen cutout in the frame: 4.2% left/right, 1.72% top/bottom of the image.
// The device tracks the cursor in 3D (rotateX/rotateY toward the pointer, shadow
// swinging the opposite way) and sways gently on its own when the pointer leaves.
export default function ContactHeroVideo() {
  const videoRef = useRef(null)
  const [still] = useState(() => reducedMotion())
  const [fine] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, on: 0 })

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

  const onMove =
    fine && !still
      ? (e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          setTilt({ rx: (0.5 - py) * 12, ry: (px - 0.5) * 20, on: 1 })
        }
      : undefined
  const onLeave = fine && !still ? () => setTilt({ rx: 0, ry: 0, on: 0 }) : undefined

  return (
    <div className="relative mx-auto w-full max-w-[360px] [perspective:1200px]" onMouseMove={onMove} onMouseLeave={onLeave}>
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
        {/* cursor tilt layer: springs toward the pointer, releases to the sway below */}
        <motion.div
          animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          className="[transform-style:preserve-3d]"
        >
          {/* idle sway: only carries the phone while the cursor is away */}
          <motion.div
            animate={
              still || tilt.on
                ? { y: 0, rotate: 0, rotateY: 0 }
                : { y: [0, -10, 0], rotate: [-0.6, 0.6, -0.6], rotateY: [-4, 4, -4] }
            }
            transition={still || tilt.on ? { duration: 0.5 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative aspect-[452/932] w-full [transform-style:preserve-3d]"
            style={{
              filter: `drop-shadow(${tilt.ry * -1.6}px ${28 + tilt.rx * 1.5}px 60px rgba(0,0,0,0.55))`,
            }}
          >
            {/* screen: exact cutout, clipped to the bezel radius — video can't bleed */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: '4.2%',
                right: '4.2%',
                top: '1.72%',
                bottom: '1.72%',
                borderRadius: '14% / 6.8%',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.55)',
              }}
            >
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                className="h-full w-full object-cover"
                autoPlay={!still}
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Pyvot contact — restaurant team on call"
              />
              {/* glare: slides opposite the tilt so the light source stays put */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(${118 - tilt.ry * 1.5}deg, rgba(255,255,255,${0.09 + tilt.on * 0.04}) 0%, transparent 38%, transparent 72%, rgba(47,211,154,0.05) 100%)`,
                }}
              />
              {/* screen-edge vignette so the panel sinks into the bezel */}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }} />
            </div>
            <img
              src="/iphone17-frame.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        <div
          className="pointer-events-none mx-auto mt-4 h-8 w-[70%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(47,211,154,0.2),transparent_70%)] blur-md"
          aria-hidden
        />
      </motion.div>
    </div>
  )
}
