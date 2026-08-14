import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { reducedMotion } from './utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// module-level handle — one lenis per page, consumers only need stop/start
let lenis = null
// eslint-disable-next-line react-refresh/only-export-components
export const getLenis = () => lenis

export function ScrollProvider({ children }) {
  useEffect(() => {
    if (reducedMotion()) return undefined // native scroll; scrub animations bail too

    const l = new Lenis({ lerp: 0.1, anchors: { offset: -72 } })
    l.stop() // preloader releases it
    l.on('scroll', ScrollTrigger.update)
    const raf = (t) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    lenis = l
    window.__lenis = l // debugging/E2E handle

    return () => {
      gsap.ticker.remove(raf)
      l.destroy()
      lenis = null
    }
  }, [])

  return children
}
