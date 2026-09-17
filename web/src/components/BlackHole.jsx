import { useEffect, useRef, useCallback } from 'react'

const PARTICLE_COUNT = 280
const RING_PARTICLES = 180

function randBetween(a, b) {
  return a + Math.random() * (b - a)
}

function initParticle(cx, cy, forRing = false) {
  if (forRing) {
    const angle = Math.random() * Math.PI * 2
    const radius = randBetween(90, 160)
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius * 0.35,
      angle,
      radius,
      speed: randBetween(0.004, 0.012),
      opacity: randBetween(0.4, 1),
      size: randBetween(1, 2.5),
      hue: randBetween(250, 280),
      inward: false,
      phase: Math.random() * Math.PI * 2,
    }
  }
  const angle = Math.random() * Math.PI * 2
  const radius = randBetween(170, 340)
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius * 0.5,
    angle,
    radius,
    speed: randBetween(0.002, 0.007),
    opacity: randBetween(0.1, 0.6),
    size: randBetween(0.5, 1.5),
    hue: randBetween(200, 270),
    inward: true,
    phase: Math.random() * Math.PI * 2,
    decayRate: randBetween(0.2, 0.6),
  }
}

export default function BlackHole({ className = '' }) {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: 0.5, y: 0.5 })
  const animRef = useRef(null)
  const particles = useRef([])
  const ringParticles = useRef([])
  const rotation = useRef(0)

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    mouse.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      const cx = canvas.offsetWidth / 2
      const cy = canvas.offsetHeight / 2
      particles.current = Array.from({ length: PARTICLE_COUNT }, () =>
        initParticle(cx, cy, false)
      )
      ringParticles.current = Array.from({ length: RING_PARTICLES }, () =>
        initParticle(cx, cy, true)
      )
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2

      // Mouse influence
      const mx = (mouse.current.x - 0.5) * 0.3
      const my = (mouse.current.y - 0.5) * 0.15

      ctx.clearRect(0, 0, w, h)

      // Deep void background gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6)
      bgGrad.addColorStop(0, 'rgba(5,5,8,0)')
      bgGrad.addColorStop(0.4, 'rgba(5,5,8,0)')
      bgGrad.addColorStop(1, 'rgba(5,5,8,0.95)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      rotation.current += 0.003

      // ── outer drifting particles ────────────────────────────────────────
      for (const p of particles.current) {
        p.angle += p.speed
        p.radius -= p.decayRate * 0.08
        if (p.radius < 60) {
          Object.assign(p, initParticle(cx, cy, false))
          continue
        }
        const wobble = Math.sin(p.phase + rotation.current * 3) * 0.04
        const px = cx + Math.cos(p.angle + mx + wobble) * p.radius
        const py = cy + Math.sin(p.angle + my + wobble) * p.radius * 0.45
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity * (p.radius / 200)})`
        ctx.fill()
      }

      // ── accretion ring ──────────────────────────────────────────────────
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation.current * 0.5 + mx * 0.5)
      ctx.scale(1 + mx * 0.08, 0.35 + my * 0.05)
      ctx.translate(-cx, -cy)

      // ring glow
      for (let pass = 0; pass < 3; pass++) {
        const grad = ctx.createRadialGradient(cx, cy, 75 - pass * 5, cx, cy, 170 + pass * 10)
        grad.addColorStop(0, `rgba(109,40,217,${0.05 - pass * 0.01})`)
        grad.addColorStop(0.4, `rgba(139,92,246,${0.18 - pass * 0.04})`)
        grad.addColorStop(0.7, `rgba(59,130,246,${0.12 - pass * 0.03})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(cx, cy, 170 + pass * 10, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      // ring particles
      for (const p of ringParticles.current) {
        p.angle += p.speed * (1 + mx * 0.3)
        const wobble = Math.sin(p.phase + rotation.current * 6) * 3
        const r = p.radius + wobble
        const px = cx + Math.cos(p.angle) * r
        const py = cy + Math.sin(p.angle) * r
        const bright = 50 + Math.abs(Math.cos(p.angle)) * 40
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 90%, ${bright}%, ${p.opacity})`
        ctx.fill()
      }

      ctx.restore()

      // ── event horizon — the singularity ────────────────────────────────
      const horizonGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 72)
      horizonGrad.addColorStop(0, '#000000')
      horizonGrad.addColorStop(0.75, '#000000')
      horizonGrad.addColorStop(0.85, 'rgba(15,0,30,0.95)')
      horizonGrad.addColorStop(0.95, 'rgba(40,0,80,0.6)')
      horizonGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 72, 0, Math.PI * 2)
      ctx.fillStyle = horizonGrad
      ctx.fill()

      // inner purple rim
      const rimGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 78)
      rimGrad.addColorStop(0, 'rgba(109,40,217,0)')
      rimGrad.addColorStop(0.6, 'rgba(139,92,246,0.35)')
      rimGrad.addColorStop(1, 'rgba(109,40,217,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 78, 0, Math.PI * 2)
      ctx.fillStyle = rimGrad
      ctx.fill()

      // photon ring highlight
      ctx.beginPath()
      ctx.arc(cx, cy, 70, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(167,139,250,0.25)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  )
}
