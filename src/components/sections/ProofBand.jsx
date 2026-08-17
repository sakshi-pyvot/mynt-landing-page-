import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const STATS = [
  { value: 250, suffix: '+', label: 'restaurant brands' },
  { value: 2000, suffix: '+', label: 'outlets' },
  { value: 1.3, suffix: ' Cr+', decimals: 1, label: 'orders tracked' },
  { value: 0, suffix: '%', label: 'data error' },
]

export default function ProofBand() {
  const root = useRef(null)

  useGSAP(
    () => {
      gsap.utils.toArray('.stat-num').forEach((el, i) => {
        const s = STATS[i]
        const o = { v: 0 }
        gsap.to(o, {
          v: s.value,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
          onUpdate: () => {
            const n = s.decimals ? o.v.toFixed(s.decimals) : Math.round(o.v).toLocaleString('en-IN')
            el.textContent = `${s.prefix || ''}${n}${s.suffix}`
          },
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="border-y border-line/60 bg-surface/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="border-line/60 px-6 py-14 text-center [&:not(:first-child)]:border-l max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(n+3)]:border-t"
          >
            <div className="stat-num text-4xl font-bold tracking-tight text-ink md:text-6xl">
              0
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-mute">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
