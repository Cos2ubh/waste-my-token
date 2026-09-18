import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EXPO = [0.22, 1, 0.36, 1]

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toLocaleString()
}

// Animated flame particles
function Flames() {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          animate={{
            y: [-10, -40 - i * 6, -10],
            x: [0, (i % 2 === 0 ? 1 : -1) * (4 + i * 2), 0],
            opacity: [0.9, 0.3, 0.9],
            scale: [1, 0.6, 1],
          }}
          transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 28 - i * 3,
            height: 28 - i * 3,
            borderRadius: '50% 50% 40% 40%',
            background: [
              '#ff6b00', '#ff4500', '#ff8c00', '#ffaa00', '#ff6b00', '#ff3300'
            ][i],
            filter: 'blur(1px)',
          }}
        />
      ))}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 40, borderRadius: '50%',
        background: 'radial-gradient(circle, #ffcc00 0%, #ff6b00 60%, transparent 100%)',
        filter: 'blur(2px)',
      }} />
    </div>
  )
}

// Animated token counter that counts up
function BurnCounter({ target }) {
  const [displayed, setDisplayed] = useState(0)
  const startRef = useRef(performance.now())
  const frameRef = useRef(null)

  useEffect(() => {
    startRef.current = performance.now()
    const duration = 1600
    const step = () => {
      const t = Math.min((performance.now() - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplayed(Math.round(target * eased))
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target])

  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <span style={{
        fontSize: 'clamp(2.8rem, 8vw, 4rem)', fontWeight: 900, color: '#ff6b00',
        textShadow: '0 0 30px rgba(255,107,0,0.6), 0 0 60px rgba(255,107,0,0.3)',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {fmt(displayed)}
      </span>
      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 6 }}>tokens burned</div>
    </div>
  )
}

function Input({ type, placeholder, value, onChange, required, minLength, maxLength, pattern, title }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      required={required} minLength={minLength} maxLength={maxLength}
      pattern={pattern} title={title}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10,
        fontSize: '0.875rem', color: '#fff', outline: 'none',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${focused ? 'rgba(255,107,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(255,107,0,0.1)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    />
  )
}

export default function BurnCaptureModal({ voidId, totalTokens, onClose, onClaimed }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function handleGoogleSignIn() {
    // Store voidId so we can claim it after OAuth redirect
    if (voidId) localStorage.setItem('pending_void_claim', voidId)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // check username
      const { data: taken } = await supabase.from('users')
        .select('id').eq('username', username.trim().toLowerCase()).maybeSingle()
      if (taken) { setError('Username taken — try another.'); setLoading(false); return }

      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) throw signUpErr

      const uid = data.user.id
      await supabase.from('users').insert({ id: uid, username: username.trim().toLowerCase() })

      // claim the void session
      await fetch(`/api/claim/${voidId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      })

      setDone(true)
      setTimeout(() => { onClaimed?.(); window.location.href = '/dashboard' }, 1800)
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {/* backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 16px 24px',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* card — slides up from bottom */}
        <motion.div
          key="card"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: EXPO }}
          style={{
            width: '100%', maxWidth: 460,
            borderRadius: '24px 24px 20px 20px',
            background: 'linear-gradient(160deg, #0f0a00 0%, #080810 60%)',
            border: '1px solid rgba(255,107,0,0.3)',
            boxShadow: '0 -20px 60px rgba(255,107,0,0.15), 0 0 0 1px rgba(255,107,0,0.1)',
            padding: 'clamp(24px, 4vw, 36px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* top glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 100, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,107,0,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {done ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
              <h2 style={{ fontWeight: 900, color: '#fff', fontSize: '1.4rem', marginBottom: 8 }}>
                Score saved!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Taking you to your dashboard…
              </p>
            </motion.div>
          ) : (
            <>
              <Flames />
              <BurnCounter target={totalTokens} />

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{
                  fontWeight: 900, color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  marginBottom: 6, letterSpacing: '-0.02em',
                }}>
                  Your AI just burned tokens.
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Sign up to lock in your rank. Walk away and this score disappears.
                </p>
              </div>

              {error && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                  fontSize: '0.82rem', color: '#fca5a5', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Google sign-in */}
              <motion.button type="button" onClick={handleGoogleSignIn}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, marginBottom: 12,
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continue with Google
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: '#334155', fontSize: '0.75rem' }}>or sign up with email</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input type="text" placeholder="username" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_-]+"
                  title="Letters, numbers, underscores, hyphens" />
                <Input type="email" placeholder="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
                <Input type="password" placeholder="password (min 8 chars)" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8} />

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    fontSize: '0.95rem', fontWeight: 800, color: '#fff',
                    border: 'none', cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1, marginTop: 4,
                    background: 'linear-gradient(135deg, #ff6b00, #ff3300)',
                    boxShadow: '0 0 30px rgba(255,107,0,0.4)',
                  }}>
                  {loading ? 'Saving…' : '🔥 Lock in my score'}
                </motion.button>
              </form>

              <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
                display: 'block', width: '100%', marginTop: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', color: '#334155', textAlign: 'center',
                position: 'relative', zIndex: 10,
              }}
              onMouseEnter={e => e.target.style.color = '#64748b'}
              onMouseLeave={e => e.target.style.color = '#334155'}>
                Skip for now — score will be lost
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
