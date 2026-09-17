import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import BadgeDisplay from '../components/BadgeDisplay'

const EXPO = [0.22, 1, 0.36, 1]
const VOID_KEY = 'wmt_void_id'

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div style={{ padding: 'clamp(18px, 2vw, 24px)', borderRadius: 16,
      border: highlight ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.08)',
      background: highlight ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.03)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, color: highlight ? '#a78bfa' : '#fff', margin: 0 }}>{value}</p>
    </div>
  )
}

function VoidLinkCard({ voidId }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/void/${voidId}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
        Your Void Link
      </p>
      <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.7, maxWidth: 540 }}>
        Paste this into any AI with web browsing — ChatGPT, Claude, Perplexity, Gemini.
        Say "read this page" and watch them burn tokens on your behalf.
      </p>
      <div style={{ background: '#000', border: '1px solid rgba(124,58,237,0.45)', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 0 24px rgba(124,58,237,0.15)' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.02)' }}>
          {['#ff5f57','#ffbd2e','#28ca41'].map((c, i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 6, fontFamily: 'ui-monospace,monospace' }}>void link — share this anywhere</span>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#a78bfa', fontFamily: 'ui-monospace,monospace', fontSize: '0.9rem', flex: 1, wordBreak: 'break-all', userSelect: 'all' }}>
            {url}
          </span>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={copy}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', border: 'none', flexShrink: 0, whiteSpace: 'nowrap',
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.2)',
              color: copied ? '#22c55e' : '#a78bfa',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [voidId, setVoidId] = useState(null)
  const [burns, setBurns] = useState([])
  const [stats, setStats] = useState({ allTime: 0, weekly: 0, burnCount: 0 })
  const [rank, setRank] = useState('—')
  const [badges, setBadges] = useState(['Newcomer'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      // profile
      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(p)

      // get void session for this user
      const { data: sessions } = await supabase
        .from('void_sessions').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

      // also check localStorage for an unclaimed session
      const localId = localStorage.getItem(VOID_KEY)
      const resolvedId = sessions?.[0]?.id ?? localId ?? null
      setVoidId(resolvedId)

      if (resolvedId) {
        // get burns
        const { data: b } = await supabase
          .from('burns').select('*').eq('void_id', resolvedId).order('recorded_at', { ascending: false }).limit(50)
        setBurns(b ?? [])

        const allTime = (b ?? []).reduce((s, r) => s + Number(r.tokens_burned), 0)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const weekly = (b ?? []).filter(r => r.recorded_at > weekAgo).reduce((s, r) => s + Number(r.tokens_burned), 0)
        setBurns(b ?? [])
        setStats({ allTime, weekly, burnCount: (b ?? []).length })

        // badges
        const b2 = []
        if (allTime >= 1e9) b2.push('1B Club')
        if (allTime < 1e6) b2.push('Newcomer')
        if ((b ?? []).length >= 10) b2.push('Bot Graveyard')
        if (!b2.length) b2.push('Waster')
        setBadges(b2)
      }

      // rank from leaderboard
      if (p?.username) {
        try {
          const lb = await fetch('/api/leaderboard?period=alltime&limit=500').then(r => r.json())
          const me = lb.find(r => r.username === p.username)
          if (me) setRank(me.rank)
        } catch {}
      }

      setLoading(false)
    })()
  }, [user])

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#050508' }}>

      {/* nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)', height: 64,
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="/" style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/leaderboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 12px' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            The Void
          </a>
          {profile?.username && (
            <a href={`/u/${profile.username}`} style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 12px' }}
              onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
              My profile
            </a>
          )}
          <button onClick={onLogout} style={{ fontSize: '0.875rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}
            onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#475569'}>
            Log out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(40px, 5vh, 64px) clamp(24px, 5vw, 56px)' }}>

        {/* rank banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EXPO }}
          style={{ marginBottom: 28, padding: 'clamp(24px, 3vw, 36px)', borderRadius: 20,
            border: '1px solid rgba(124,58,237,0.28)',
            background: 'radial-gradient(ellipse at 0% 60%, rgba(109,40,217,0.18) 0%, rgba(5,5,8,0) 65%)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Global Rank</p>
            <p style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>#{rank}</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>@{profile?.username ?? '—'}</p>
          </div>
          <BadgeDisplay badges={badges} size="lg" />
        </motion.div>

        {/* stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EXPO }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(10px, 1.5vw, 16px)', marginBottom: 36 }}>
          <StatCard label="All-time burned" value={fmt(stats.allTime)} highlight />
          <StatCard label="This week" value={fmt(stats.weekly)} />
          <StatCard label="AI visits" value={stats.burnCount} />
        </motion.div>

        {/* void link */}
        {voidId && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18, ease: EXPO }}>
            <VoidLinkCard voidId={voidId} />
          </motion.div>
        )}

        {/* recent burns */}
        {burns.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease: EXPO }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 16 }}>Recent Burns</h2>
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Time', 'AI Agent', 'Tokens Burned'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {burns.slice(0, 20).map((b, i) => (
                    <motion.tr key={b.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, ease: EXPO }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '11px 16px', color: '#475569', fontFamily: 'ui-monospace,monospace', fontSize: '0.8rem' }}>
                        {new Date(b.recorded_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#94a3b8', fontFamily: 'ui-monospace,monospace', fontSize: '0.82rem' }}>
                        {b.agent_name}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#60a5fa', fontWeight: 800, fontFamily: 'ui-monospace,monospace' }}>
                        {Number(b.tokens_burned).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {!voidId && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#334155' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>🕳️</p>
            <p>No void link yet. <a href="/" style={{ color: '#7c3aed', textDecoration: 'none' }}>Generate one from the home page.</a></p>
          </div>
        )}

      </main>
    </div>
  )
}
