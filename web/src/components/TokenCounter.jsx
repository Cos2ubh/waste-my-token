import { useEffect, useRef, useState } from 'react'
import { fetchTodayTotal } from '../lib/api'

function formatTokens(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export default function TokenCounter() {
  const [display, setDisplay] = useState(0)
  const [raw, setRaw] = useState(0)
  const animRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  const animateTo = (target) => {
    cancelAnimationFrame(animRef.current)
    fromRef.current = display
    startRef.current = performance.now()
    const duration = 1200

    const step = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (t < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    let mounted = true

    const poll = async () => {
      try {
        const total = await fetchTodayTotal()
        if (mounted) {
          setRaw(total)
          animateTo(total)
        }
      } catch {
        // silently degrade — counter shows last known value
      }
    }

    poll()
    const id = setInterval(poll, 10_000)
    return () => {
      mounted = false
      clearInterval(id)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="text-6xl md:text-8xl font-black tracking-tight glow-blue"
        style={{ color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTokens(display)}
      </div>
      <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold">
        tokens wasted today
      </p>
    </div>
  )
}
