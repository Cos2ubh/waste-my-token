import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode ?? 'login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        // check username available
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.trim())
          .maybeSingle()

        if (existing) {
          setError('Username already taken — pick another.')
          setLoading(false)
          return
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr

        // insert into public users table
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

  const inputClass =
    'w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500 transition-all'
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-2xl p-8"
          style={{ background: '#0d0d14', border: '1px solid rgba(109,40,217,0.35)', boxShadow: '0 0 60px rgba(109,40,217,0.2)' }}
        >
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-black text-white">Check your email</h2>
              <p className="mt-2 text-slate-400 text-sm">
                We sent a confirmation link to <span className="text-violet-400">{email}</span>.
                Click it to activate your account, then log in.
              </p>
              <button
                onClick={() => { setMode('login'); setDone(false) }}
                className="mt-6 text-sm text-violet-400 hover:text-violet-300 font-semibold"
              >
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-black text-white">
                  {mode === 'login' ? 'Welcome back' : 'Start wasting'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'login' ? 'Log in to your dashboard.' : 'Create your account. Climb the leaderboard.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-300 bg-red-500/10 border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={24}
                    pattern="[a-zA-Z0-9_-]+"
                    title="Letters, numbers, underscores, hyphens"
                    className={inputClass}
                    style={inputStyle}
                  />
                )}
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  style={inputStyle}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-sm text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', boxShadow: '0 0 20px rgba(109,40,217,0.3)' }}
                >
                  {loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                  className="text-violet-400 hover:text-violet-300 font-semibold"
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg transition-colors"
            style={{ position: 'absolute' }}
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
