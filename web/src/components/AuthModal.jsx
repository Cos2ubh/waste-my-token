import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const EXPO = [0.22, 1, 0.36, 1]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function Input({ type, placeholder, value, onChange, required, minLength, maxLength, pattern, title, autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      pattern={pattern}
      title={title}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '13px 16px',
        borderRadius: 12,
        fontSize: '0.9rem',
        color: '#fff',
        outline: 'none',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    />
  )
}

export default function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode ?? 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
      // page will redirect — no further action needed
    } catch (err) {
      setError(err.message ?? 'Google sign-in failed.')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data: existing } = await supabase
          .from('users').select('id').eq('username', username.trim()).maybeSingle()
        if (existing) { setError('Username taken — try another.'); setLoading(false); return }

        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr

        const { error: insertErr } = await supabase.from('users').insert({
          id: data.user.id,
          username: username.trim().toLowerCase(),
        })
        if (insertErr) throw insertErr

        setDone(true)
        onSuccess?.(data.user)
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
        onSuccess?.(data.user)
        onClose()
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }

  return (
    <AnimatePresence>
      {/* backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* card */}
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.3, ease: EXPO }}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 420,
            borderRadius: 24,
            background: 'linear-gradient(160deg, #0e0b1a 0%, #080810 100%)',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 0 80px rgba(109,40,217,0.2), 0 32px 64px rgba(0,0,0,0.6)',
            padding: 'clamp(28px, 5vw, 40px)',
            overflow: 'hidden',
          }}
        >
          {/* background glow */}
          <div style={{
            position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#64748b', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >✕</button>

          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontWeight: 900, color: '#fff', fontSize: '1.3rem', margin: '0 0 10px' }}>Check your email</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Confirmation link sent to{' '}
                <span style={{ color: '#a78bfa' }}>{email}</span>.<br />
                Click it then log in.
              </p>
              <button onClick={switchMode}
                style={{ marginTop: 24, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>
                Back to log in
              </button>
            </div>
          ) : (
            <>
              {/* heading */}
              <div style={{ marginBottom: 28, position: 'relative' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                  wastemy<span style={{ color: '#a78bfa' }}>tokens</span>
                </p>
                <h2 style={{ fontWeight: 900, color: '#fff', fontSize: '1.5rem', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {mode === 'login' ? 'Welcome back.' : 'Start wasting.'}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                  {mode === 'login' ? 'Log in and check your rank.' : 'Create your account. Climb the leaderboard.'}
                </p>
              </div>

              {/* Google button */}
              <button onClick={handleGoogle} disabled={googleLoading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '12px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600,
                  cursor: googleLoading ? 'wait' : 'pointer',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: googleLoading ? 'rgba(255,255,255,0.04)' : '#fff',
                  color: googleLoading ? '#64748b' : '#1e1e1e',
                  transition: 'opacity 0.2s, transform 0.15s',
                  marginBottom: 20,
                  opacity: googleLoading ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                {googleLoading ? (
                  <span style={{ width: 18, height: 18, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : <GoogleIcon />}
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              {/* divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* error */}
              {error && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* email/password form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mode === 'signup' && (
                  <Input type="text" placeholder="username" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required minLength={3} maxLength={24}
                    pattern="[a-zA-Z0-9_-]+" title="Letters, numbers, underscores, hyphens"
                    autoFocus
                  />
                )}
                <Input type="email" placeholder="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
                <Input type="password" placeholder="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8} />

                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700,
                    color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 0 24px rgba(124,58,237,0.35)',
                    marginTop: 4,
                    transition: 'opacity 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => e.target.style.transform = ''}
                >
                  {loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#334155' }}>
                {mode === 'login' ? "No account? " : "Already have one? "}
                <button onClick={switchMode}
                  style={{ color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                  onMouseEnter={e => e.target.style.color = '#a78bfa'}
                  onMouseLeave={e => e.target.style.color = '#8b5cf6'}
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
