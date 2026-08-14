import { useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

const clampDt = (dt) => Math.min(dt, 0.033)

// Dashboard "glass slab" that tracks the cursor with spring physics:
// acceleration = (target - value) * stiffness - velocity * damping
function DashboardCard() {
  const group = useRef()
  const texture = useLoader(THREE.TextureLoader, '/shots/overview.jpg')
  const spring = useRef({ vx: 0, vy: 0, vpx: 0, vpy: 0 })

  useFrame(({ pointer, clock }, dt) => {
    const g = group.current
    if (!g) return
    const d = clampDt(dt)
    const s = spring.current
    const K = 46 // stiffness
    const C = 7.5 // damping — low enough for visible overshoot
    const idle = Math.sin(clock.elapsedTime * 0.9) // gentle float when mouse rests

    const targetRX = -pointer.y * 0.18 + idle * 0.015
    const targetRY = pointer.x * 0.18
    s.vx += ((targetRX - g.rotation.x) * K - s.vx * C) * d
    s.vy += ((targetRY - g.rotation.y) * K - s.vy * C) * d
    g.rotation.x += s.vx * d
    g.rotation.y += s.vy * d

    // positional parallax toward the cursor
    const targetPX = pointer.x * 0.3
    const targetPY = pointer.y * 0.16 + idle * 0.05
    s.vpx += ((targetPX - g.position.x) * K * 0.6 - s.vpx * C) * d
    s.vpy += ((targetPY - g.position.y) * K * 0.6 - s.vpy * C) * d
    g.position.x += s.vpx * d
    g.position.y += s.vpy * d
  })

  // screenshot is 1280x743 → aspect ~1.722
  const w = 4.4
  const h = w / 1.722

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[w + 0.14, h + 0.14]} />
        <meshBasicMaterial color="#2fd39a" transparent opacity={0.32} />
      </mesh>
      <mesh position={[0, 0, -0.028]}>
        <planeGeometry args={[w + 0.05, h + 0.05]} />
        <meshBasicMaterial color="#0a0d13" />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          map={texture}
          map-colorSpace={THREE.SRGBColorSpace}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

// Instanced particle field: cursor repels, springs pull home, damping settles.
// Sim state lives in a ref and is built lazily inside the frame loop so the
// render phase stays pure (react-compiler rules).
function createSim(count) {
  return {
    dummy: new THREE.Object3D(),
    pointer3: new THREE.Vector3(),
    particles: Array.from({ length: count }, () => {
      const home = new THREE.Vector3(
        (Math.random() - 0.5) * 11.5,
        (Math.random() - 0.5) * 6.5,
        (Math.random() - 0.5) * 2.5 - 0.9,
      )
      return { home, pos: home.clone(), vel: new THREE.Vector3(), size: 0.4 + Math.random() }
    }),
  }
}

function ParticleField({ count = 1600 }) {
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
    const REPEL_R2 = 5.5 // squared radius of influence
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
      // stretched slightly by speed for a comet feel
      const speed = Math.min(p.vel.length() * 0.06, 0.9)
      dummy.scale.setScalar(0.02 * p.size * (1 + speed))
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
        opacity={0.5}
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
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // screenshots/capture read the buffer
      }}
    >
      <ParticleField />
      <DashboardCard />
    </Canvas>
  )
}
