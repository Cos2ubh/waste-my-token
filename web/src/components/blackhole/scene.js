import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { vertexShader, fragmentShader } from './shader.js'

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

// Mounts the black hole into `mount` and runs it until destroy() is called.
// Throws if WebGL can't be created — callers fall back to something static.
//
// opts.time        — render a fixed moment instead of animating (screenshots, tests)
// opts.quality     — starting render scale (0.35–1); adapts to frame time after that
// opts.reducedMotion
export function createBlackHole(mount, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setClearColor(0x050508, 1)
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  mount.appendChild(renderer.domElement)

  const uniforms = {
    uTime:     { value: 0 },
    uAspect:   { value: 1 },
    uCamPos:   { value: new THREE.Vector3() },
    uCamBasis: { value: new THREE.Matrix3() },
    uFov:      { value: Math.tan(THREE.MathUtils.degToRad(17)) },
    uShift:    { value: 0.14 },
    uDiskTemp: { value: 6200 },
    uBeaming:  { value: 0.6 },
    uExposure: { value: 0.75 },
  }

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) // unused by the shader, required by RenderPass
  const geo = new THREE.PlaneGeometry(2, 2)
  const mat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false })
  scene.add(new THREE.Mesh(geo, mat))

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.55, 0.92)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // ── sizing + adaptive resolution ────────────────────────────────────────
  // the geodesic march is ~100–280 steps a pixel, so render below native and let
  // the bloom hide the upscale; frame time nudges the scale up or down
  const maxScale = Math.min(window.devicePixelRatio || 1, 1.5)
  let scale = Math.min(maxScale, opts.quality ?? 0.7)

  function resize() {
    const w = Math.max(1, mount.clientWidth)
    const h = Math.max(1, mount.clientHeight)
    renderer.setPixelRatio(scale)
    composer.setPixelRatio(scale)
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    uniforms.uAspect.value = w / h
    // portrait screens: widen the view so the disk still fits across
    const portrait = h > w
    uniforms.uFov.value = Math.tan(THREE.MathUtils.degToRad(portrait ? 17 * Math.min(1.9, h / w) : 17))
  }
  resize()

  // ── camera ──────────────────────────────────────────────────────────────
  // a slow dolly-in on load, then a long breathing drift in elevation and azimuth,
  // plus a little pointer parallax. Elevation stays low so the lensed back of the
  // disk arches over the shadow.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const onPointer = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3()
  const worldUp = new THREE.Vector3(0, 1, 0)
  function placeCamera(t) {
    const motion = opts.reducedMotion ? 0 : 1
    const intro = easeOutExpo(Math.min(1, t / 4.5))
    const dist = THREE.MathUtils.lerp(42, 27, opts.time != null ? 1 : intro)
    pointer.sx += (pointer.x - pointer.sx) * 0.03
    pointer.sy += (pointer.y - pointer.sy) * 0.03
    const elev = THREE.MathUtils.degToRad(4.5 + motion * (1.6 * Math.sin(t * 0.07) - pointer.sy * 1.5))
    const azim = THREE.MathUtils.degToRad(-90 + motion * (6 * Math.sin(t * 0.045) + pointer.sx * 3.5))
    const roll = THREE.MathUtils.degToRad(motion * 1.2 * Math.sin(t * 0.05) - 4)

    const pos = uniforms.uCamPos.value.set(
      dist * Math.cos(elev) * Math.cos(azim),
      dist * Math.sin(elev),
      dist * Math.cos(elev) * Math.sin(azim),
    )
    fwd.copy(pos).negate().normalize()
    right.crossVectors(fwd, worldUp).normalize()
    up.crossVectors(right, fwd)
    right.applyAxisAngle(fwd, roll)
    up.applyAxisAngle(fwd, roll)
    uniforms.uCamBasis.value.set(
      right.x, up.x, fwd.x,
      right.y, up.y, fwd.y,
      right.z, up.z, fwd.z,
    )
  }

  // ── loop ────────────────────────────────────────────────────────────────
  let frameId = 0
  let running = true
  let last = performance.now()
  let elapsed = 0
  let frameMs = 16, frames = 0
  const timeScale = opts.reducedMotion ? 0.15 : 1

  function frame(now) {
    if (!running) return
    frameId = requestAnimationFrame(frame)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    if (document.hidden || window.scrollY > window.innerHeight * 1.1) return // hero is gone, save the GPU

    elapsed += dt
    uniforms.uTime.value = elapsed * timeScale
    placeCamera(elapsed)
    composer.render()

    frameMs = frameMs * 0.92 + dt * 1000 * 0.08
    if (++frames % 90 === 0) {
      const next = frameMs > 24 ? scale - 0.1 : frameMs < 13 ? scale + 0.05 : scale
      const clamped = THREE.MathUtils.clamp(next, 0.35, maxScale)
      if (Math.abs(clamped - scale) > 0.01) { scale = clamped; resize() }
    }
  }

  if (opts.time != null) {
    uniforms.uTime.value = opts.time
    placeCamera(opts.time)
    composer.render()
  } else {
    frameId = requestAnimationFrame(frame)
  }

  window.addEventListener('resize', resize)

  return {
    canvas: renderer.domElement,
    destroy() {
      running = false
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      composer.dispose()
      bloom.dispose()
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
