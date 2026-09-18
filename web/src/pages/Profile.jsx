import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchProfile } from '../lib/api'
import { supabase } from '../lib/supabase'
import BadgeDisplay from '../components/BadgeDisplay'

const EXPO = [0.22, 1, 0.36, 1]

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function AgentChart({ agents }) {
  const entries = Object.entries(agents).sort((a, b) => b[1] - a[1]).slice(0, 8)
  if (!entries.length) return <p style={{ color: '#334155', fontSize: '0.875rem' }}>No agents caught yet.</p>
  const max = entries[0][1]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {entries.map(([name, count]) => (
        <div key={name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>{name}</span>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#60a5fa' }}>{fmt(count)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.9, ease: EXPO }}
              style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Card({ children, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: EXPO }}
      style={{
        borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.025)',
        padding: 'clamp(20px, 3vw, 32px)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── inline username editor ─────────────────────────────────────────────────────
function UsernameEditor({ current, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function save() {
    const next = value.trim().toLowerCase()
    if (next === current) { setEditing(false); return }
    if (!/^[a-z0-9_-]{3,24}$/.test(next)) {
      setError('3–24 chars, letters/numbers/underscores only')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // check availability
      const { data: taken } = await supabase
        .from('users').select('id').eq('username', next).maybeSingle()
      if (taken) { setError('Username already taken'); setSaving(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      const { error: updateErr } = await supabase
        .from('users').update({ username: next }).eq('id', user.id)
      if (updateErr) throw updateErr

      setEditing(false)
      onSaved(next)
    } catch (err) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>
          @{current}
        </h1>
        <button
          onClick={() => { setValue(current); setEditing(true) }}
          style={{
            fontSize: '0.75rem', fontWeight: 700, color: '#475569',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        >
          ✎ Edit
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#7c3aed', letterSpacing: '-0.025em' }}>@</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          style={{
            fontWeight: 900, fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)', color: '#fff',
            background: 'transparent', border: 'none', borderBottom: '2px solid rgba(124,58,237,0.6)',
            outline: 'none', letterSpacing: '-0.025em', padding: '2px 4px',
            width: `${Math.max(value.length, 6)}ch`,
          }}
        />
        <button onClick={save} disabled={saving}
          style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', background: '#7c3aed', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => { setEditing(false); setError(null) }}
          style={{ fontSize: '0.8rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: 6 }}>{error}</p>}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchProfile(username)
      .then(async (p) => {
        setProfile(p)
        // check if viewer owns this profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: me } = await supabase.from('users').select('username').eq('id', user.id).single()
          setIsOwner(me?.username === p.username)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  function handleUsernameSaved(newName) {
    setProfile((p) => ({ ...p, username: newName }))
    navigate(`/u/${newName}`, { replace: true })
  }

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <span style={{ fontSize: 64, marginBottom: 20 }}>🕳️</span>
        <h1 style={{ fontWeight: 900, color: '#fff', fontSize: '1.8rem', margin: '0 0 10px' }}>User not found</h1>
        <p style={{ color: '#475569', marginBottom: 28 }}>They may have been consumed by the void.</p>
        <a href="/" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>← Back home</a>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#050508' }}>

      {/* nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)', height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,5,8,0.9)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <a href="/" style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isOwner && (
            <a href="/dashboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
              Dashboard
            </a>
          )}
          <a href="/leaderboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            The Void
          </a>
        </div>
      </nav>

      {/* body */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 5vh, 64px) clamp(24px, 5vw, 56px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EXPO }}
          style={{
            padding: 'clamp(24px, 3vw, 40px)', borderRadius: 22,
            border: '1px solid rgba(124,58,237,0.28)',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(109,40,217,0.22) 0%, rgba(5,5,8,0) 65%)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
                Token Waster
              </p>

              {isOwner ? (
                <UsernameEditor current={profile.username} onSaved={handleUsernameSaved} />
              ) : (
                <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#fff', margin: '0 0 16px', letterSpacing: '-0.025em' }}>
                  @{profile.username}
                </h1>
              )}

              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#60a5fa', textShadow: '0 0 30px rgba(96,165,250,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(profile.total_tokens_wasted)}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#475569', marginLeft: 10 }}>tokens wasted</span>
              </div>
              <BadgeDisplay badges={profile.badges} size="lg" />
            </div>

            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: copied ? '#22c55e' : '#94a3b8', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = copied ? '#22c55e' : '#94a3b8' }}
            >
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
          </div>
        </motion.div>

        {/* agent breakdown */}
        <Card delay={0.12}>
          <h2 style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', marginBottom: 20 }}>Agent Breakdown</h2>
          <AgentChart agents={profile.agents} />
        </Card>

        {/* domains section removed — not returned by fetchProfile */}

      </main>
    </div>
  )
}
