import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

// `paused` — true while the intro loader is up; lenis starts once it drops
export function ScrollProvider({ children, paused = false }) {
  useEffect(() => {
    if (reducedMotion()) return undefined // native scroll; scrub animations bail too

    const l = new Lenis({ lerp: 0.1, anchors: { offset: -72 } })
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

  useEffect(() => {
    if (paused) lenis?.stop()
    else lenis?.start()
  }, [paused])

  return children
}

const NAV_H = 96 // 72px bar + breathing room

// scroll to `target` (number or element) through lenis when present
// eslint-disable-next-line react-refresh/only-export-components
export function scrollTo(target, { immediate = false } = {}) {
  const l = lenis
  if (l) {
    l.resize() // page height may have just changed (route swap) — refresh lenis' limit first
    l.scrollTo(target, { immediate, offset: typeof target === 'number' ? 0 : -NAV_H, force: true })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_H, behavior: immediate ? 'auto' : 'smooth' })
}

// Route change → top of page; hash → its anchor once the new page has laid out
// (pinned sections need a beat to register their spacers).
export function RouteScroll() {
  const { pathname, hash } = useLocation()
  const prevPath = useRef(null)
  useEffect(() => {
    const samePage = prevPath.current === pathname
    prevPath.current = pathname
    const timers = []
    if (hash) {
      // new page: jump straight there once pins/spacers exist; same page: glide
      const go = (immediate) => {
        ScrollTrigger.refresh()
        const el = document.getElementById(hash.slice(1))
        if (el) scrollTo(el, { immediate })
      }
      timers.push(setTimeout(() => go(!samePage), samePage ? 0 : 200))
      // pinned sections can still shift layout after first paint — settle once more
      if (!samePage) timers.push(setTimeout(() => go(true), 700))
    } else {
      scrollTo(0, { immediate: true })
      timers.push(setTimeout(() => ScrollTrigger.refresh(), 120))
    }
    return () => timers.forEach(clearTimeout)
  }, [pathname, hash])
  return null
}
