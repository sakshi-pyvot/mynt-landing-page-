import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import FluidTrail from './FluidTrail'

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

// particles fade out under the glass ribbon so the refracted copy reads as *the*
// particles bending through the lens, not a double image
const DEN_UNIFORM = { uDen: { value: null } }
function fadeUnderRibbon(shader) {
  shader.uniforms.uDen = DEN_UNIFORM.uDen
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec2 vScr;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvScr = gl_Position.xy / gl_Position.w * 0.5 + 0.5;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform sampler2D uDen;\nvarying vec2 vScr;')
    .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(0.015, 0.45, texture2D(uDen, vScr).x) * 0.9;')
}

function ParticleField({ count = 1500, field }) {
  const mesh = useRef()
  const sim = useRef(null)

  useFrame(({ pointer, viewport }, dt) => {
    const m = mesh.current
    if (!m) return
    if (!sim.current) sim.current = createSim(count)
    DEN_UNIFORM.uDen.value = field?.current?.den || null
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
        onBeforeCompile={fadeUnderRibbon}
      />
    </instancedMesh>
  )
}

export default function HeroCanvas() {
  const field = useRef(null) // fluid textures shared with the particles
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      // content sits over the canvas; listen on the body so the pointer still tracks
      eventSource={document.body}
      eventPrefix="client"
    >
      <FluidTrail velocityRef={field} />
      <ParticleField field={field} />
    </Canvas>
  )
}
