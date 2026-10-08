import { useEffect, useRef, useState } from 'react'
import { createBlackHole } from './blackhole/scene'

// Hero background: a ray-traced Schwarzschild black hole (see blackhole/shader.js).
export default function GravitationalLens({ style }) {
  const mountRef = useRef(null)
  const [noWebGL, setNoWebGL] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // no WebGL (old GPU, hardware accel off, sandboxed browser) used to throw here and
    // take the whole app down to a black screen — fall back to a static CSS hole instead
    let hole
    try {
      hole = createBlackHole(mount, {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    } catch {
      setNoWebGL(true)
      return
    }

    // the GPU can drop the context later (driver reset, too many tabs) — same fallback
    const onLost = (e) => { e.preventDefault(); hole.destroy(); setNoWebGL(true) }
    hole.canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      hole.canvas.removeEventListener('webglcontextlost', onLost)
      hole.destroy()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: noWebGL
          ? 'radial-gradient(circle at 50% 46%, #050508 0 9vmin, rgba(167,139,250,0.55) 9.6vmin, rgba(124,58,237,0.25) 13vmin, rgba(59,7,100,0.12) 24vmin, #050508 42vmin)'
          : '#050508',
        ...style,
      }}
    />
  )
}
