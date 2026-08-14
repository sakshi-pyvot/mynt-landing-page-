import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function ProgressBar() {
  const bar = useRef(null)

  useGSAP(() => {
    gsap.to(bar.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    })
  }, [])

  return (
    <div
      ref={bar}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left scale-x-0 bg-mint"
    />
  )
}
