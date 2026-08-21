import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { reducedMotion } from '@/lib/utils'

const VIDEO_SRC = '/videos/3.mp4'

// notifications typed over the footage (crisp HTML, not baked into the video);
// each arrival buzzes the whole device
const MESSAGES = [
  { from: 'general managers:', text: 'how to get my menu fixed.' },
  { from: 'finance head:', text: 'Hey team — our payouts don’t add up' },
  { from: 'restaurant owner:', text: 'We want to grow on food delivery platforms.' },
]

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
  // reduced motion: all three visible, no loop, no buzz
  const [msgN, setMsgN] = useState(() => (reducedMotion() ? MESSAGES.length : 0))
  const [shakeN, setShakeN] = useState(0) // increments per arrival → one buzz each

  // notification loop: three arrivals ~2.2s apart, hold, clear, repeat
  useEffect(() => {
    if (still) return undefined
    let alive = true
    const timers = []
    const arm = () => {
      MESSAGES.forEach((_, i) =>
        timers.push(
          setTimeout(() => {
            if (!alive) return
            setMsgN(i + 1)
            setShakeN((n) => n + 1)
          }, 1400 + i * 2200),
        ),
      )
      timers.push(
        setTimeout(() => {
          if (!alive) return
          setMsgN(0)
          arm()
        }, 9800),
      )
    }
    arm()
    return () => {
      alive = false
      timers.forEach(clearTimeout)
    }
  }, [still])

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
      {/* glow: bright mint halo hugging the phone + two drifting blobs behind it */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[40%] bg-[radial-gradient(ellipse_at_50%_45%,rgba(47,211,154,0.35),transparent_70%)] blur-2xl"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-full bg-[radial-gradient(ellipse_at_35%_30%,rgba(47,211,154,0.4),transparent_60%)] blur-3xl"
        animate={still ? undefined : { rotate: [0, 30, 0], scale: [1, 1.12, 1] }}
        transition={still ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-full bg-[radial-gradient(ellipse_at_70%_70%,rgba(56,189,248,0.25),transparent_60%)] blur-3xl"
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
        {/* float: always-on bob, keeps running even while the cursor tilts the phone */}
        <motion.div
          animate={still ? undefined : { y: [0, -12, 0] }}
          transition={still ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="[transform-style:preserve-3d]"
        >
        {/* cursor tilt layer: springs toward the pointer, releases to the sway below */}
        <motion.div
          animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          className="[transform-style:preserve-3d]"
        >
        {/* buzz: one quick rattle per notification arrival (keyframes re-run as
            shakeN flips the array identity) */}
        <motion.div
          animate={
            shakeN
              ? {
                  x: shakeN % 2 ? [0, -3, 3, -2, 2, 0] : [0, 3, -3, 2, -2, 0],
                  rotate: shakeN % 2 ? [0, -0.5, 0.5, -0.3, 0] : [0, 0.5, -0.5, 0.3, 0],
                }
              : undefined
          }
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="[transform-style:preserve-3d]"
        >
          {/* idle sway: only turns the phone while the cursor is away */}
          <motion.div
            animate={
              still || tilt.on
                ? { rotate: 0, rotateY: 0 }
                : { rotate: [-0.6, 0.6, -0.6], rotateY: [-4, 4, -4] }
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
              {/* incoming notifications — crisp HTML, springs in, buzzes the phone */}
              <div className="pointer-events-none absolute inset-x-[6%] top-[22%] space-y-2.5">
                <AnimatePresence>
                  {MESSAGES.slice(0, msgN).map((m) => (
                    <motion.div
                      key={m.from}
                      initial={{ opacity: 0, y: -18, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                      className="flex items-start gap-2.5 rounded-2xl bg-[#f6f3ee]/95 px-3 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-gradient-to-b from-[#67e26f] to-[#2fbf49]">
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="#fff" aria-hidden>
                          <path d="M12 4C7 4 3 7.3 3 11.4c0 2.3 1.3 4.4 3.4 5.7-.1.9-.5 2-1.3 2.9 1.6-.2 2.9-.8 3.8-1.4.98.25 2 .4 3.1.4 5 0 9-3.3 9-7.6S17 4 12 4z" />
                        </svg>
                      </span>
                      <span className="min-w-0 text-left leading-snug">
                        <span className="block text-[11px] font-bold text-[#3b3b3b]">{m.from}</span>
                        <span className="block text-[11px] text-[#4a4a4a]">{m.text}</span>
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
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
