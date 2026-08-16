import { useEffect, useRef } from 'react'
import { reducedMotion } from '@/lib/utils'

// Interactive node network on a 2D canvas: nodes drift, link when close,
// get pulled toward the cursor with spring physics, and ripple outward on click.
const LINK_DIST = 130
const CURSOR_R = 190

export default function NetworkCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const isFine = window.matchMedia('(pointer: fine)').matches
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const still = reducedMotion()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    let w = 0
    let h = 0
    let nodes = []
    let raf = 0
    let visible = false
    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = isDesktop ? Math.round((w * h) / 14000) : 40
      nodes = Array.from({ length: Math.min(count, 140) }, () => {
        const x = Math.random() * w
        const y = Math.random() * h
        return {
          x,
          y,
          hx: x,
          hy: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.2 + Math.random() * 1.6,
          d: 0.35 + Math.random() * 0.65, // depth → alpha
        }
      })
    }

    const step = () => {
      ctx.clearRect(0, 0, w, h)
      const dt = 1

      for (const n of nodes) {
        if (!still) {
          // ambient drift of the home point
          n.hx += n.vx * dt
          n.hy += n.vy * dt
          if (n.hx < -20) n.hx = w + 20
          if (n.hx > w + 20) n.hx = -20
          if (n.hy < -20) n.hy = h + 20
          if (n.hy > h + 20) n.hy = -20

          // spring toward home, damped
          let ax = (n.hx - n.x) * 0.02
          let ay = (n.hy - n.y) * 0.02

          // cursor attraction within radius
          if (mouse.active) {
            const dx = mouse.x - n.x
            const dy = mouse.y - n.y
            const d2 = dx * dx + dy * dy
            if (d2 < CURSOR_R * CURSOR_R) {
              const d = Math.sqrt(d2) || 1
              const f = (1 - d / CURSOR_R) * 0.09
              ax += (dx / d) * f * 6
              ay += (dy / d) * f * 6
            }
          }
          n.px = (n.px || 0) * 0.86 + ax
          n.py = (n.py || 0) * 0.86 + ay
          n.x += n.px
          n.y += n.py
        }
      }

      // links
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.28 * Math.min(a.d, b.d)
            ctx.strokeStyle = `rgba(47,211,154,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        // cursor links
        if (mouse.active) {
          const dx = a.x - mouse.x
          const dy = a.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < CURSOR_R * CURSOR_R) {
            const alpha = (1 - Math.sqrt(d2) / CURSOR_R) * 0.55
            ctx.strokeStyle = `rgba(89,224,184,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgba(47,211,154,${0.35 + n.d * 0.5})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!still && visible) raf = requestAnimationFrame(step)
    }

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
      mouse.active = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= w && mouse.y <= h
    }
    const onLeave = () => {
      mouse.active = false
    }
    const onClick = (e) => {
      const r = canvas.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      // ripple: kick nodes outward, springs bring them back
      for (const n of nodes) {
        const dx = n.x - cx
        const dy = n.y - cy
        const d = Math.hypot(dx, dy) || 1
        if (d < 320) {
          const k = (1 - d / 320) * 26
          n.px = (n.px || 0) + (dx / d) * k
          n.py = (n.py || 0) + (dy / d) * k
        }
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        cancelAnimationFrame(raf)
        if (visible) raf = requestAnimationFrame(step)
      },
      { threshold: 0.05 },
    )

    resize()
    io.observe(canvas)
    if (still) step() // single static frame
    window.addEventListener('resize', resize)
    if (isFine) {
      window.addEventListener('mousemove', onMove)
      canvas.parentElement.addEventListener('mouseleave', onLeave)
      canvas.parentElement.addEventListener('click', onClick)
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      canvas.parentElement?.removeEventListener('mouseleave', onLeave)
      canvas.parentElement?.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
}
