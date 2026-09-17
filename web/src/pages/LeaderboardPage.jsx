import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Leaderboard from '../components/Leaderboard'
import { fetchLeaderboard } from '../lib/api'

export default function LeaderboardPage({ onAuthClick }) {
  const [tab, setTab] = useState('alltime')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(tab, 50)
      setRows(data)
      setLastUpdated(new Date())
    } catch {
      /* keep last rows */
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>

      {/* nav */}
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="/" className="font-black text-lg tracking-tight text-white">
          waste<span className="text-violet-500">my</span>token
        </a>
        <div className="flex items-center gap-4">
          <button onClick={() => onAuthClick?.('login')} className="text-sm text-slate-400 hover:text-white">Log in</button>
          <button
            onClick={() => onAuthClick?.('signup')}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black text-white tracking-tight">
            Token Wasters{' '}
            <span className="glow-purple" style={{ color: '#a78bfa' }}>Leaderboard</span>
          </h1>
          <p className="text-slate-400 mt-2">The void keeps score. Updated every 30 seconds.</p>
        </motion.div>

        {/* tabs */}
        <div className="flex gap-2 mb-8 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {[{ key: 'alltime', label: 'All-time' }, { key: 'weekly', label: 'This week' }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* table */}
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-white/10 p-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <Leaderboard rows={rows} loading={loading} />
        </motion.div>

        {lastUpdated && (
          <p className="text-xs text-slate-600 mt-4 text-right">
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}
