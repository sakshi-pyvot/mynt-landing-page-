import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import gsap from 'gsap'
import { PATHS, VIEWBOX } from './brand/pyvotPaths'

// 3D wordmark for the loader: each glyph is an extruded mesh built from the
// SVG paths. Letters tumble in from depth one by one and settle flat; the V's
// left stroke starts white and fills to mint on `fill()`. Renders in one small
// canvas centered on the mark; exposes an imperative handle via `apiRef`.

const MINT = new THREE.Color('#33BE86')
const WHITE = new THREE.Color('#ffffff')
const [, , VW, VH] = VIEWBOX.split(' ').map(Number)

function glyphGeometry(d, depth) {
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p))
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 3, curveSegments: 10 })
  // SVG y is down; flip and center on the viewBox
  geo.scale(1, -1, 1)
  geo.translate(-VW / 2, VH / 2, -depth / 2)
  return geo
}

export default function PyvotLoader3D({ apiRef, className }) {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    const w = el.clientWidth
    const h = el.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    // orthographic so the mark reads exactly like the flat logo when settled
    const aspect = w / h
    const viewH = VH * 1.35
    const camera = new THREE.OrthographicCamera((-viewH * aspect) / 2, (viewH * aspect) / 2, viewH / 2, -viewH / 2, 0.1, 500)
    camera.position.set(0, 0, 120)
    camera.lookAt(0, 0, 0)

    // lights: soft key + mint rim so extrusion sides catch colour
    scene.add(new THREE.AmbientLight(0xffffff, 2.2))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(-30, 40, 120)
    scene.add(key)
    // mint rim only grazes the extrusion sides
    const rim = new THREE.DirectionalLight(0x33be86, 1.2)
    rim.position.set(60, -30, -40)
    scene.add(rim)

    const depth = 3.2
    const white = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.55, metalness: 0.0 })
    const vLeftMat = new THREE.MeshStandardMaterial({ color: WHITE.clone(), roughness: 0.55, metalness: 0.0, emissive: new THREE.Color('#000000') })

    const order = ['p', 'y', 'vLeft', 'vRight', 'o', 't']
    const meshes = order.map((k) => {
      const m = new THREE.Mesh(glyphGeometry(PATHS[k], depth), k === 'vLeft' ? vLeftMat : white)
      scene.add(m)
      return m
    })

    // start state: letters back in depth, tilted, invisible
    const group = new THREE.Group()
    meshes.forEach((m) => group.add(m))
    scene.add(group)
    meshes.forEach((m, i) => {
      m.position.z = -90 - i * 12
      m.rotation.x = -1.2
      m.rotation.y = i % 2 ? 0.8 : -0.8
      m.material = m.material.clone()
      m.material.transparent = true
      m.material.opacity = 0
    })

    // idle: the settled group breathes with a slow, subtle tilt toward the pointer
    const target = { rx: 0, ry: 0 }
    const onMove = (e) => {
      target.ry = ((e.clientX / innerWidth) * 2 - 1) * 0.18
      target.rx = -((e.clientY / innerHeight) * 2 - 1) * 0.12
    }
    window.addEventListener('mousemove', onMove)

    let raf = 0
    const clock = new THREE.Clock()
    const loop = () => {
      const t = clock.getElapsedTime()
      group.rotation.x += (target.rx + Math.sin(t * 0.9) * 0.02 - group.rotation.x) * 0.06
      group.rotation.y += (target.ry + Math.cos(t * 0.7) * 0.02 - group.rotation.y) * 0.06
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    // intro: tumble in one by one, settle flat; bar draws
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    meshes.forEach((m, i) => {
      const at = 0.15 + i * 0.11
      tl.to(m.position, { z: 0, duration: 0.9 }, at)
        .to(m.rotation, { x: 0, y: 0, duration: 0.9, ease: 'back.out(1.4)' }, at)
        .to(m.material, { opacity: 1, duration: 0.35 }, at)
    })

    const onResize = () => {
      const nw = el.clientWidth
      const nh = el.clientHeight
      renderer.setSize(nw, nh)
      const a = nw / nh
      camera.left = (-viewH * a) / 2
      camera.right = (viewH * a) / 2
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    if (apiRef) {
      apiRef.current = {
        // white → mint on the V's left stroke with a small lift + settle
        fill: () =>
          gsap
            .timeline()
            .to(meshes[2].material.color, { r: MINT.r, g: MINT.g, b: MINT.b, duration: 0.55, ease: 'power2.inOut' })
            .to(meshes[2].material.emissive, { r: MINT.r * 0.35, g: MINT.g * 0.35, b: MINT.b * 0.35, duration: 0.55, ease: 'power2.inOut' }, 0)
            .to(meshes[2].position, { z: 6, duration: 0.25, ease: 'power2.out' }, 0)
            .to(meshes[2].position, { z: 0, duration: 0.45, ease: 'back.out(2)' }, 0.25),
        // exit: whole mark eases back (ortho camera → scale) and tips away
        exit: () => gsap.timeline().to(group.scale, { x: 0.86, y: 0.86, z: 0.86, duration: 0.6, ease: 'power3.in' }, 0).to(group.rotation, { x: 0.35, duration: 0.6, ease: 'power3.in' }, 0),
      }
    }

    return () => {
      cancelAnimationFrame(raf)
      tl.kill()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      meshes.forEach((m) => {
        m.geometry.dispose()
        m.material.dispose()
      })
      el.removeChild(renderer.domElement)
    }
  }, [apiRef])

  return <div ref={host} className={className} aria-hidden />
}
