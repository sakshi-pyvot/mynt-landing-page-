import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { reducedMotion } from './utils'
import { onLoaded } from './loaded'

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
    window.__ST = ScrollTrigger

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
  // pinned sections: land exactly on the pin start so their scrub is at progress 0
  if (typeof target !== 'number') {
    const pinned = ScrollTrigger.getAll().find((t) => t.trigger === target && t.pin)
    if (pinned) target = pinned.start
  }
  const l = lenis
  if (l) {
    l.resize() // page height may have just changed (route swap) — refresh lenis' limit first
    l.scrollTo(target, { immediate, offset: typeof target === 'number' ? 0 : -NAV_H, force: true })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' })
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_H, behavior: immediate ? 'auto' : 'smooth' })
}

// after landing on a pinned section, nudge back so its scrub sits at progress 0
// (ScrollTrigger's reported start can be transiently off right after a refresh)
function settlePinned(el) {
  const st = ScrollTrigger.getAll().find((t) => t.trigger === el && t.pin)
  if (!st || st.progress < 0.002) return
  if (lenis) lenis.scrollTo(st.start, { immediate: true, force: true })
  else window.scrollTo(0, st.start)
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
    let off = () => {}
    if (hash) {
      // new page: jump straight there once pins/spacers exist; same page: glide.
      // On a cold start the intro loader still covers the page — wait for it to lift.
      const go = (immediate) => {
        ScrollTrigger.refresh()
        const el = document.getElementById(hash.slice(1))
        if (el) scrollTo(el, { immediate })
      }
      off = onLoaded(() => {
        timers.push(setTimeout(() => go(!samePage), samePage ? 0 : 250))
        // pinned sections can still shift after first paint — settle to progress 0
        const settle = () => {
          const el = document.getElementById(hash.slice(1))
          if (el) settlePinned(el)
        }
        timers.push(setTimeout(settle, samePage ? 1400 : 900), setTimeout(settle, 1700), setTimeout(settle, 2600))
      })
    } else {
      scrollTo(0, { immediate: true })
      timers.push(setTimeout(() => ScrollTrigger.refresh(), 120))
    }
    return () => {
      off()
      timers.forEach(clearTimeout)
    }
  }, [pathname, hash])
  return null
}
