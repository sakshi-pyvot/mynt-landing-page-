import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const clampDt = (dt) => Math.min(dt, 0.033)

// Instanced particle field: cursor repels, springs pull home, damping settles.
// Density biased toward the right (where the product stage sits) so the field
// reads as gravity around the product. Sim state lives in a ref and is built
// lazily inside the frame loop so the render phase stays pure.
function createSim(count) {
  return {
    dummy: new THREE.Object3D(),
    pointer3: new THREE.Vector3(),
    particles: Array.from({ length: count }, () => {
      // skew x toward the right: mix uniform with a right-weighted sample
      const u = Math.random()
      const x = (u < 0.55 ? Math.random() * 12 - 6 : Math.random() * 6 + 0.5)
      const home = new THREE.Vector3(x, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2.5 - 0.9)
      return { home, pos: home.clone(), vel: new THREE.Vector3(), size: 0.4 + Math.random() }
    }),
  }
}

function ParticleField({ count = 1500 }) {
  const mesh = useRef()
  const sim = useRef(null)

  useFrame(({ pointer, viewport }, dt) => {
    const m = mesh.current
    if (!m) return
    if (!sim.current) sim.current = createSim(count)
    const { dummy, pointer3, particles } = sim.current
    const d = clampDt(dt)
    pointer3.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0)

    const SPRING = 3.4
    const DAMP = 2.4
    const REPEL_R2 = 5.5
    const REPEL_F = 30

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const dx = p.pos.x - pointer3.x
      const dy = p.pos.y - pointer3.y
      const d2 = dx * dx + dy * dy
      if (d2 < REPEL_R2) {
        const dist = Math.max(Math.sqrt(d2), 0.2)
        const f = ((1 - dist / Math.sqrt(REPEL_R2)) * REPEL_F) / dist
        p.vel.x += dx * f * d
        p.vel.y += dy * f * d
      }
      p.vel.x += ((p.home.x - p.pos.x) * SPRING - p.vel.x * DAMP) * d
      p.vel.y += ((p.home.y - p.pos.y) * SPRING - p.vel.y * DAMP) * d
      p.vel.z += ((p.home.z - p.pos.z) * SPRING - p.vel.z * DAMP) * d
      p.pos.addScaledVector(p.vel, d)

      dummy.position.copy(p.pos)
      const speed = Math.min(p.vel.length() * 0.06, 0.9)
      dummy.scale.setScalar(0.013 * p.size * (1 + speed))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#2fd39a"
        transparent
        opacity={0.42}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

// Cursor trail: a small pool of short-lived particles emitted at the pointer
// while it moves. Emission rate scales with pointer speed; idle emits nothing.
function createTrail(count) {
  return {
    dummy: new THREE.Object3D(),
    last: new THREE.Vector3(),
    hasLast: false,
    head: 0,
    parts: Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0, // seconds remaining; 0 = dead
      max: 1,
    })),
  }
}

function CursorTrail({ count = 220 }) {
  const mesh = useRef()
  const sim = useRef(null)

  useFrame(({ pointer, viewport }, dt) => {
    const m = mesh.current
    if (!m) return
    if (!sim.current) sim.current = createTrail(count)
    const s = sim.current
    const d = clampDt(dt)
    const px = (pointer.x * viewport.width) / 2
    const py = (pointer.y * viewport.height) / 2

    // emit based on distance travelled since last frame; carry the fractional
    // remainder so slow, steady movement still trickles particles
    if (s.hasLast) {
      const dx = px - s.last.x
      const dy = py - s.last.y
      const dist = Math.hypot(dx, dy)
      s.acc = (s.acc || 0) + dist * 60
      const n = Math.min(14, Math.floor(s.acc))
      s.acc -= n
      for (let k = 0; k < n; k++) {
        const p = s.parts[s.head]
        s.head = (s.head + 1) % count
        const t = k / Math.max(n, 1)
        p.pos.set(s.last.x + dx * t, s.last.y + dy * t, 0.3)
        // inherit some pointer velocity + spread
        p.vel.set(
          (dx / d) * 0.12 + (Math.random() - 0.5) * 1.6,
          (dy / d) * 0.12 + (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 0.6,
        )
        p.max = 0.55 + Math.random() * 0.5
        p.life = p.max
      }
    }
    s.last.set(px, py, 0)
    s.hasLast = true

    for (let i = 0; i < count; i++) {
      const p = s.parts[i]
      if (p.life <= 0) {
        s.dummy.scale.setScalar(0)
        s.dummy.position.set(0, 0, -50)
      } else {
        p.life -= d
        p.vel.multiplyScalar(1 - 3.2 * d) // drag
        p.vel.y -= 0.6 * d // slight fall
        p.pos.addScaledVector(p.vel, d)
        const a = Math.max(p.life / p.max, 0)
        s.dummy.position.copy(p.pos)
        s.dummy.scale.setScalar(0.03 * a * a + 0.004)
      }
      s.dummy.updateMatrix()
      m.setMatrixAt(i, s.dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#59e0b8"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      // content sits over the canvas; listen on the body so the pointer still tracks
      eventSource={document.body}
      eventPrefix="client"
    >
      <ParticleField />
      <CursorTrail />
    </Canvas>
  )
}
