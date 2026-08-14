import { useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Dashboard screenshot as a floating "glass slab" that tilts toward the pointer.
function DashboardCard() {
  const group = useRef()
  const texture = useLoader(THREE.TextureLoader, '/shots/overview.jpg')

  useFrame(({ pointer }) => {
    if (!group.current) return
    // clamp tilt to ±6°
    const rx = THREE.MathUtils.degToRad(-pointer.y * 6)
    const ry = THREE.MathUtils.degToRad(pointer.x * 6)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, rx, 0.06)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, ry, 0.06)
  })

  // screenshot is 1280x743 → aspect ~1.722
  const w = 4.4
  const h = w / 1.722

  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.35}>
      <group ref={group}>
        {/* green rim glow behind the card */}
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
    </Float>
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
      <DashboardCard />
      <Sparkles count={60} scale={[9, 5, 3]} size={1.6} speed={0.25} color="#2fd39a" opacity={0.5} />
    </Canvas>
  )
}
