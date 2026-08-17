import { motion } from 'motion/react'
import CtaPair from '@/components/CtaPair'
import NetworkCanvas from './NetworkCanvas'

function PulseRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-mint/30"
          initial={{ width: 120, height: 120, opacity: 0 }}
          animate={{ width: 620, height: 620, opacity: [0, 0.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: i * 1.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function FinalCTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-36 md:py-48">
      {/* interactive network: outlets + platforms connecting into Mynt */}
      <NetworkCanvas />
      <div className="mint-glow pointer-events-none absolute inset-0" />
      <PulseRings />

      <div className="pointer-events-none relative mx-auto max-w-3xl px-6 text-center">
        <div className="text-3xl font-bold">
          mynt<span className="text-mint">.</span>
        </div>
        <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight md:text-6xl">
          Your restaurant already has the answers.
          <span className="text-gradient block">Mynt helps you see them.</span>
        </h2>
        <CtaPair size="lg" className="pointer-events-auto mt-10 justify-center" />
        <p className="mt-6 text-xs uppercase tracking-[0.25em] text-mute">
          Built from real restaurant operations · move your cursor
        </p>
      </div>
    </section>
  )
}
