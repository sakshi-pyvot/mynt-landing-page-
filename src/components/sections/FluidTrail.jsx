import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// GPU fluid trail (stable-fluids lite): the cursor splats velocity + density into
// low-res ping-pong targets; each frame advects and dissipates them. The result is
// drawn as a full-screen refractive "liquid glass" ribbon with an RGB-split edge,
// and the velocity texture is shared so the particle field can be swept by it.

const SIM = 192 // sim resolution (square). ~200 lines of GLSL beats a dependency.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// advect a field along velocity, then dissipate
const ADVECT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVel;
  uniform sampler2D uSrc;
  uniform float uDt;
  uniform float uDissipate;
  uniform vec2 uTexel;
  void main(){
    vec2 v = texture2D(uVel, vUv).xy;
    vec2 back = vUv - v * uDt * uTexel * 60.0;
    gl_FragColor = texture2D(uSrc, back) * uDissipate;
  }
`

// gaussian splat of a value at a point
const SPLAT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uSrc;
  uniform vec2 uPoint;
  uniform vec3 uValue;
  uniform float uRadius;
  uniform float uAspect;
  void main(){
    vec2 d = vUv - uPoint;
    d.x *= uAspect;
    float g = exp(-dot(d,d) / uRadius);
    vec3 base = texture2D(uSrc, vUv).xyz;
    gl_FragColor = vec4(base + uValue * g, 1.0);
  }
`

// display: a clear liquid-glass ribbon. Whatever the canvas drew behind it (particle
// field, ambient glow) is looked up through a displacement built from velocity + density
// gradient, split slightly per channel, with a specular streak and a bright fresnel rim.
const DISPLAY = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVel;
  uniform sampler2D uDen;
  uniform sampler2D uScene;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform vec3 uTint;

  void main(){
    vec2 v = texture2D(uVel, vUv).xy;
    float d = texture2D(uDen, vUv).x;

    float dl = texture2D(uDen, vUv - vec2(uTexel.x,0.)).x;
    float dr = texture2D(uDen, vUv + vec2(uTexel.x,0.)).x;
    float db = texture2D(uDen, vUv - vec2(0.,uTexel.y)).x;
    float dt = texture2D(uDen, vUv + vec2(0.,uTexel.y)).x;
    vec2 grad = vec2(dr - dl, dt - db);

    // clear liquid: almost no body colour — the effect is what bends through it
    float body = smoothstep(0.01, 0.4, d);
    if (body < 0.002) { gl_FragColor = vec4(0.0); return; }
    vec3 n = normalize(vec3(-grad * 7.0, 1.0));
    float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
    vec3 l = normalize(vec3(-0.55, 0.85, 0.75));
    float spec = pow(max(dot(n, l), 0.0), 40.0);

    vec2 offs = grad * 1.1 + v * 0.02;
    vec4 sc = texture2D(uScene, vUv + offs);
    float r = texture2D(uScene, vUv + offs * 1.3).r;
    float bch = texture2D(uScene, vUv + offs * 0.7).b;
    vec3 refr = vec3(r, sc.g, bch) * 1.1;

    // thin iridescent skin: hue drifts with the flow direction
    float ang = atan(v.y, v.x + 1e-4);
    vec3 irid = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ang + uTime * 0.6);
    vec3 col = refr * body
             + mix(vec3(0.9, 1.0, 0.96), irid, 0.5) * (0.10 * fres * body)
             + vec3(1.0) * (0.08 * spec * body);
    float alpha = clamp(sc.a * body * 1.2 + 0.015 * body + 0.14 * fres * body + 0.08 * spec * body, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`

// displacement map for the DOM warp overlay: R/G encode the offset (128 = none),
// rows flipped so a GPU readback comes out top-down like a 2D canvas
const MAP = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVel;
  uniform sampler2D uDen;
  uniform vec2 uTexel;
  void main(){
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 v = texture2D(uVel, uv).xy;
    float dl = texture2D(uDen, uv - vec2(uTexel.x,0.)).x;
    float dr = texture2D(uDen, uv + vec2(uTexel.x,0.)).x;
    float db = texture2D(uDen, uv - vec2(0.,uTexel.y)).x;
    float dt = texture2D(uDen, uv + vec2(0.,uTexel.y)).x;
    vec2 grad = vec2(dr - dl, dt - db);
    float d = texture2D(uDen, uv).x;
    vec2 disp = clamp((grad * 3.0 + v * 0.05) * smoothstep(0.005, 0.2, d), -1.0, 1.0);
    // screen y is down; flip the y component to match
    gl_FragColor = vec4(disp.x * 0.5 + 0.5, -disp.y * 0.5 + 0.5, 0.0, 1.0);
  }
`
const MAP_RES = 256

function makeTarget() {
  return new THREE.WebGLRenderTarget(SIM, SIM, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  })
}

export default function FluidTrail({ velocityRef }) {
  const { gl, size, scene, camera } = useThree()
  const meshRef = useRef()

  const build = () => {
    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geo = new THREE.PlaneGeometry(2, 2)
    const quad = new THREE.Mesh(geo)
    scene.add(quad)
    const texel = new THREE.Vector2(1 / SIM, 1 / SIM)
    const advect = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: ADVECT,
      uniforms: { uVel: { value: null }, uSrc: { value: null }, uDt: { value: 0.016 }, uDissipate: { value: 0.98 }, uTexel: { value: texel } },
      depthTest: false,
      depthWrite: false,
    })
    const splat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: SPLAT,
      uniforms: { uSrc: { value: null }, uPoint: { value: new THREE.Vector2(0.5, 0.5) }, uValue: { value: new THREE.Vector3() }, uRadius: { value: 0.0009 }, uAspect: { value: 1 } },
      depthTest: false,
      depthWrite: false,
    })
    const map = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: MAP,
      uniforms: { uVel: { value: null }, uDen: { value: null }, uTexel: { value: texel } },
      depthTest: false,
      depthWrite: false,
    })
    const mapRT = new THREE.WebGLRenderTarget(MAP_RES, MAP_RES, { depthBuffer: false, stencilBuffer: false })
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = MAP_RES
    mapCanvas.height = MAP_RES
    return {
      scene, cam, quad, advect, splat, texel,
      vel: [makeTarget(), makeTarget()],
      den: [makeTarget(), makeTarget()],
      last: new THREE.Vector2(-1, -1),
      hasLast: false,
      map, mapRT, mapCanvas,
      mapCtx: mapCanvas.getContext('2d'),
      mapPixels: new Uint8Array(MAP_RES * MAP_RES * 4),
      mapImage: null, // ImageData, created lazily
      mapTick: 0,
      quiet: 0,
    }
  }
  const makeDisplay = () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: DISPLAY,
        uniforms: {
          uVel: { value: null },
          uDen: { value: null },
          uScene: { value: null },
          uTexel: { value: new THREE.Vector2(1 / SIM, 1 / SIM) },
          uTime: { value: 0 },
          uTint: { value: new THREE.Color('#2fd39a') },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })
  // sim + material are built lazily inside the frame loop and live on a ref
  // (react-compiler: render never reads or writes them)
  const stateRef = useRef(null)

  useFrame(({ pointer, clock }, dt) => {
    const d = Math.min(dt, 0.033)
    if (!stateRef.current) {
      const display = makeDisplay()
      stateRef.current = { sim: build(), display, sceneRT: null, sceneSize: new THREE.Vector2() }
      if (meshRef.current) meshRef.current.material = display
    }
    const st = stateRef.current
    const { sim: s, display } = st
    const aspect = size.width / size.height
    const px = pointer.x * 0.5 + 0.5
    const py = pointer.y * 0.5 + 0.5

    const run = (mat, target) => {
      s.quad.material = mat
      gl.setRenderTarget(target)
      gl.render(s.scene, s.cam)
    }

    // 1) splat pointer velocity + density (only while moving)
    if (s.hasLast) {
      const dx = px - s.last.x
      const dy = py - s.last.y
      const speed = Math.hypot(dx * aspect, dy)
      if (speed > 0.0005) {
        // deposit per unit *distance*, not per frame — 120 Hz and 60 Hz screens draw the same trail
        const vel = speed / d // uv units per second
        s.splat.uniforms.uPoint.value.set(px, py)
        s.splat.uniforms.uAspect.value = aspect
        s.splat.uniforms.uRadius.value = 0.00028 + Math.min(vel, 3) * 0.00012
        // velocity
        s.splat.uniforms.uSrc.value = s.vel[0].texture
        s.splat.uniforms.uValue.value.set(dx * 120, dy * 120, 0)
        run(s.splat, s.vel[1]); [s.vel[0], s.vel[1]] = [s.vel[1], s.vel[0]]
        // density
        s.splat.uniforms.uSrc.value = s.den[0].texture
        s.splat.uniforms.uValue.value.set(Math.min(speed * 28, 0.9), 0, 0)
        run(s.splat, s.den[1]); [s.den[0], s.den[1]] = [s.den[1], s.den[0]]
      }
    }
    s.last.set(px, py)
    s.hasLast = true

    // 2) advect velocity by itself, then density by velocity
    const frames = d * 60 // dissipation tuned at 60 Hz, scaled to real frame time
    s.advect.uniforms.uDt.value = d
    s.advect.uniforms.uVel.value = s.vel[0].texture
    s.advect.uniforms.uSrc.value = s.vel[0].texture
    s.advect.uniforms.uDissipate.value = Math.pow(0.975, frames)
    run(s.advect, s.vel[1]); [s.vel[0], s.vel[1]] = [s.vel[1], s.vel[0]]

    s.advect.uniforms.uVel.value = s.vel[0].texture
    s.advect.uniforms.uSrc.value = s.den[0].texture
    s.advect.uniforms.uDissipate.value = Math.pow(0.975, frames)
    run(s.advect, s.den[1]); [s.den[0], s.den[1]] = [s.den[1], s.den[0]]

    // 3) DOM warp: push the displacement map into the hero overlay's SVG filter (every 2nd frame)
    const feImage = document.getElementById('hero-warp-image')
    if (feImage && (s.mapTick++ & 1) === 0) {
      s.map.uniforms.uVel.value = s.vel[0].texture
      s.map.uniforms.uDen.value = s.den[0].texture
      run(s.map, s.mapRT)
      gl.readRenderTargetPixels(s.mapRT, 0, 0, MAP_RES, MAP_RES, s.mapPixels)
      // skip the (comparatively costly) upload while the field is flat
      let active = false
      for (let i = 0; i < s.mapPixels.length; i += 64) if (Math.abs(s.mapPixels[i] - 128) > 2 || Math.abs(s.mapPixels[i + 1] - 128) > 2) { active = true; break }
      if (active || s.quiet < 3) {
        s.quiet = active ? 0 : s.quiet + 1
        if (!s.mapImage) s.mapImage = s.mapCtx.createImageData(MAP_RES, MAP_RES)
        s.mapImage.data.set(s.mapPixels)
        s.mapCtx.putImageData(s.mapImage, 0, 0)
        feImage.setAttribute('href', s.mapCanvas.toDataURL('image/png'))
      }
    }

    // 4) snapshot the rest of the scene (particles) so the ribbon can refract it
    gl.getDrawingBufferSize(st.sceneSize)
    if (!st.sceneRT || st.sceneRT.width !== st.sceneSize.x || st.sceneRT.height !== st.sceneSize.y) {
      st.sceneRT?.dispose()
      st.sceneRT = new THREE.WebGLRenderTarget(st.sceneSize.x, st.sceneSize.y, { depthBuffer: false, stencilBuffer: false })
    }
    const quadMesh = meshRef.current
    if (quadMesh) quadMesh.visible = false
    gl.setRenderTarget(st.sceneRT)
    gl.clear()
    gl.render(scene, camera)
    if (quadMesh) quadMesh.visible = true
    gl.setRenderTarget(null)

    // 5) publish + display
    if (velocityRef) velocityRef.current = { vel: s.vel[0].texture, den: s.den[0].texture }
    const u = display.uniforms
    u.uVel.value = s.vel[0].texture
    u.uDen.value = s.den[0].texture
    u.uScene.value = st.sceneRT.texture
    u.uTime.value = clock.elapsedTime
  }, -1) // run before other frame callbacks so particles see this frame's field

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}
