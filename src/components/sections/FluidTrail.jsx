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

// display: refract a soft nebula backdrop through the fluid, tint the ribbon,
// split RGB along the flow direction, add a bright edge where density gradients are steep
const DISPLAY = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVel;
  uniform sampler2D uDen;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform vec3 uTint;

  // cheap value noise for the nebula backdrop so refraction has something to bend
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }

  void main(){
    vec2 v = texture2D(uVel, vUv).xy;
    float d = texture2D(uDen, vUv).x;

    // refraction: bend the backdrop lookup by velocity + density gradient
    float dl = texture2D(uDen, vUv - vec2(uTexel.x,0.)).x;
    float dr = texture2D(uDen, vUv + vec2(uTexel.x,0.)).x;
    float db = texture2D(uDen, vUv - vec2(0.,uTexel.y)).x;
    float dt = texture2D(uDen, vUv + vec2(0.,uTexel.y)).x;
    vec2 grad = vec2(dr - dl, dt - db);
    vec2 offs = v * 0.012 + grad * 0.35;

    // backdrop nebula (dark, faint mint) sampled with the offset
    vec2 p = (vUv + offs) * 3.0;
    float n = fbm(p + uTime * 0.03);
    vec3 back = mix(vec3(0.0), uTint * 0.10, smoothstep(0.35, 0.8, n));

    // rgb split along the flow direction, strength ∝ density
    vec2 dir = normalize(v + 1e-4) * uTexel * 6.0 * clamp(d, 0.0, 1.0);
    float rr = texture2D(uDen, vUv + dir).x;
    float bb = texture2D(uDen, vUv - dir).x;

    // ribbon body: translucent mint glass; edge: bright fresnel-ish rim
    float body = smoothstep(0.02, 0.6, d);
    float edge = smoothstep(0.02, 0.35, length(grad)) * body;
    vec3 glass = uTint * (0.18 * body) + vec3(0.7, 0.95, 0.88) * (0.55 * edge);
    vec3 split = (vec3(0.35,1.0,0.75) * rr + vec3(0.45,0.85,1.0) * bb) * 0.16 * body;

    vec3 col = back + glass + split;
    float alpha = clamp(smoothstep(0.3, 0.8, n) * 0.35 + body * 0.75 + edge * 0.6, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`

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
  const { gl, size } = useThree()
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
    return {
      scene, cam, quad, advect, splat, texel,
      vel: [makeTarget(), makeTarget()],
      den: [makeTarget(), makeTarget()],
      last: new THREE.Vector2(-1, -1),
      hasLast: false,
    }
  }
  const makeDisplay = () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: DISPLAY,
        uniforms: {
          uVel: { value: null },
          uDen: { value: null },
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
      stateRef.current = { sim: build(), display }
      if (meshRef.current) meshRef.current.material = display
    }
    const { sim: s, display } = stateRef.current
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
        s.splat.uniforms.uPoint.value.set(px, py)
        s.splat.uniforms.uAspect.value = aspect
        s.splat.uniforms.uRadius.value = 0.0012 + Math.min(speed, 0.08) * 0.03
        // velocity
        s.splat.uniforms.uSrc.value = s.vel[0].texture
        s.splat.uniforms.uValue.value.set(dx * 260, dy * 260, 0)
        run(s.splat, s.vel[1]); [s.vel[0], s.vel[1]] = [s.vel[1], s.vel[0]]
        // density
        s.splat.uniforms.uSrc.value = s.den[0].texture
        s.splat.uniforms.uValue.value.set(Math.min(0.5 + speed * 10, 1.6), 0, 0)
        run(s.splat, s.den[1]); [s.den[0], s.den[1]] = [s.den[1], s.den[0]]
      }
    }
    s.last.set(px, py)
    s.hasLast = true

    // 2) advect velocity by itself, then density by velocity
    s.advect.uniforms.uDt.value = d
    s.advect.uniforms.uVel.value = s.vel[0].texture
    s.advect.uniforms.uSrc.value = s.vel[0].texture
    s.advect.uniforms.uDissipate.value = 0.975
    run(s.advect, s.vel[1]); [s.vel[0], s.vel[1]] = [s.vel[1], s.vel[0]]

    s.advect.uniforms.uVel.value = s.vel[0].texture
    s.advect.uniforms.uSrc.value = s.den[0].texture
    s.advect.uniforms.uDissipate.value = 0.982
    run(s.advect, s.den[1]); [s.den[0], s.den[1]] = [s.den[1], s.den[0]]

    gl.setRenderTarget(null)

    // 3) publish + display
    if (velocityRef) velocityRef.current = { vel: s.vel[0].texture, den: s.den[0].texture }
    const u = display.uniforms
    u.uVel.value = s.vel[0].texture
    u.uDen.value = s.den[0].texture
    u.uTime.value = clock.elapsedTime
  }, -1) // run before other frame callbacks so particles see this frame's field

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}
