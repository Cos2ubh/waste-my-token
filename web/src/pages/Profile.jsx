import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchProfile } from '../lib/api'
import BadgeDisplay from '../components/BadgeDisplay'

function formatTokens(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function AgentChart({ agents }) {
  const entries = Object.entries(agents).sort((a, b) => b[1] - a[1]).slice(0, 8)
  if (!entries.length) return <p className="text-slate-500 text-sm">No agents caught yet.</p>

  const max = entries[0][1]

  return (
    <div className="space-y-3">
      {entries.map(([name, count]) => (
        <div key={name}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono">{name}</span>
            <span className="font-bold text-blue-400">{formatTokens(count)}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #6d28d9, #3b82f6)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchProfile(username)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-slate-500">Loading…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: '#050508' }}>
        <p className="text-6xl mb-4">🕳️</p>
        <h1 className="text-2xl font-black text-white">User not found</h1>
        <p className="text-slate-400 mt-2">They may have been consumed by the void.</p>
        <a href="/" className="mt-6 text-violet-400 hover:text-violet-300 text-sm font-semibold">
          ← Back home
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>

      {/* nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <a href="/" className="font-black text-lg tracking-tight text-white">
          waste<span className="text-violet-500">my</span>tokens
        </a>
        <a href="/leaderboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          Leaderboard
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* profile header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl border border-violet-500/25 mb-8 relative"
          style={{ background: 'radial-gradient(circle at 30% 0%, rgba(109,40,217,0.18) 0%, rgba(5,5,8,0) 70%)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Token Waster</p>
              <h1 className="text-4xl font-black text-white">@{profile.username}</h1>
              <p className="mt-3 text-3xl font-black glow-blue" style={{ color: '#60a5fa' }}>
                {formatTokens(profile.total_tokens_wasted)}
                <span className="text-sm text-slate-400 font-normal ml-2">tokens wasted</span>
              </p>
              <div className="mt-4">
                <BadgeDisplay badges={profile.badges} size="lg" />
              </div>
            </div>
            <button
              onClick={handleShare}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:border-violet-500/40 hover:text-white transition-all"
            >
              {copied ? '✓ Link copied' : '↗ Share profile'}
            </button>
          </div>
        </motion.div>

        {/* agent breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl border border-white/10 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h2 className="text-base font-black text-white mb-5">Agent Breakdown</h2>
          <AgentChart agents={profile.agents} />
        </motion.div>

        {/* domains */}
        {profile.domains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-2xl border border-white/10"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <h2 className="text-base font-black text-white mb-4">Protected Domains</h2>
            <div className="space-y-2">
              {profile.domains.map((d) => (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-slate-300 font-mono">{d.replace(/https?:\/\//, '')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
