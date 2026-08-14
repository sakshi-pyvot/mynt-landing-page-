import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function Preloader({ onDone }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ onComplete: onDone })
      tl.from('.pl-letter', {
        yPercent: 120,
        stagger: 0.06,
        duration: 0.55,
        ease: 'power3.out',
      })
        .to(
          '.pl-count',
          {
            textContent: 100,
            duration: 1.1,
            snap: { textContent: 1 },
            ease: 'power2.inOut',
          },
          0,
        )
        .to('.pl-bar', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
        .to(root.current, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.7,
          ease: 'power3.inOut',
          delay: 0.2,
        })
    },
    { scope: root },
  )

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <div className="overflow-hidden text-5xl font-bold tracking-tight md:text-7xl">
        {['m', 'y', 'n', 't', '.'].map((c, i) => (
          <span
            key={i}
            className={`pl-letter inline-block ${c === '.' ? 'text-mint' : 'text-ink'}`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-8 h-px w-40 overflow-hidden bg-line">
        <div className="pl-bar h-full w-full origin-left scale-x-0 bg-mint" />
      </div>
      <div className="mt-3 font-mono text-xs text-mute">
        <span className="pl-count">0</span>%
      </div>
    </div>
  )
}
