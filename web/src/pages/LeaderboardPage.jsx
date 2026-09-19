import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Leaderboard from '../components/Leaderboard'
import { fetchLeaderboard } from '../lib/api'

const NAV = {
  position: 'sticky', top: 0, zIndex: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 clamp(20px, 5vw, 60px)',
  height: 64,
  background: 'rgba(5,5,8,0.9)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}

export default function LeaderboardPage({ onAuthClick, user, onLogout }) {
  const [tab, setTab] = useState('alltime')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(tab, 50)
      setRows(data)
      setLastUpdated(new Date())
    } catch { /* keep last rows */ }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#050508' }}>

      {/* nav */}
      <nav style={NAV}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/" style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
          </a>
          <span style={{ fontSize: '0.75rem', color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            / The Void
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <a href="/dashboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 14px' }}>Dashboard</a>
              <button onClick={onLogout} style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px' }}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => onAuthClick?.('login')}
                style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px' }}>Log in</button>
              <button onClick={() => onAuthClick?.('signup')}
                style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Get started</button>
            </>
          )}
        </div>
      </nav>

      {/* content */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(48px, 6vh, 80px) clamp(24px, 5vw, 56px)' }}>

        {/* heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
            Rankings
          </p>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 16px' }}>
            The <span style={{ color: '#a78bfa', textShadow: '0 0 40px rgba(167,139,250,0.5)' }}>Void</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', maxWidth: 480, lineHeight: 1.7 }}>
            Every token wasted is recorded here — permanently, publicly, without mercy.{' '}
            <span style={{ color: '#64748b' }}>Where do you rank in the void?</span>
          </p>
        </motion.div>

        {/* tab switcher */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.05)', marginBottom: 28 }}>
          {[{ key: 'alltime', label: 'All-time' }, { key: 'weekly', label: 'This week' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 22px', borderRadius: 9, fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: tab === t.key ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                color: tab === t.key ? '#fff' : '#64748b',
              }}
              onMouseEnter={e => { if (tab !== t.key) e.target.style.color = '#fff' }}
              onMouseLeave={e => { if (tab !== t.key) e.target.style.color = '#64748b' }}
            >{t.label}</button>
          ))}
        </motion.div>

        {/* table */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}
          >
            <div style={{ padding: 28 }}>
              <Leaderboard rows={rows} loading={loading} />
            </div>
          </motion.div>
        </AnimatePresence>

        {lastUpdated && (
          <p style={{ fontSize: '0.75rem', color: '#1e293b', marginTop: 16, textAlign: 'right' }}>
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </main>
    </div>
  )
}
