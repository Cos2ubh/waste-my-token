import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import BadgeDisplay from '../components/BadgeDisplay'
import { fetchLeaderboard } from '../lib/api'

function formatTokens(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function since(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}

function StatCard({ label, value, sub }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-3xl font-black text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function CodeSnippet({ apiKey }) {
  const [copied, setCopied] = useState(false)
  const code = `# Add to your proxy .env\nWMT_API_KEY=${apiKey}\nWMT_REPORT_URL=https://wastemy.token/api/report`

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ background: '#0a0a0f' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-slate-500 font-mono">.env</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  )
}

function DomainRow({ domain, onDelete }) {
  const [copied, setCopied] = useState(false)

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 pr-4 text-slate-200 font-medium">{domain.domain_url}</td>
      <td className="py-3 pr-4">
        <span className="font-mono text-xs text-slate-400">
          {domain.api_key.slice(0, 8)}…
        </span>
        <button
          onClick={() => { navigator.clipboard.writeText(domain.api_key); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="ml-2 text-xs text-violet-400 hover:text-violet-300"
        >
          {copied ? '✓' : 'copy'}
        </button>
      </td>
      <td className="py-3 pr-4 text-slate-400 text-sm">{formatTokens(domain.tokens_total ?? 0)}</td>
      <td className="py-3 pr-4 text-slate-400 text-xs">{domain.top_agent ?? '—'}</td>
      <td className="py-3">
        <button
          onClick={() => onDelete(domain.id)}
          className="text-xs text-red-500/60 hover:text-red-400 transition-colors"
        >
          remove
        </button>
      </td>
    </tr>
  )
}

export default function Dashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [domains, setDomains] = useState([])
  const [stats, setStats] = useState({ allTime: 0, weekly: 0 })
  const [rank, setRank] = useState('—')
  const [badges, setBadges] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)

    // get profile
    const { data: p } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(p)

    // get domains
    const { data: doms } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const enriched = await Promise.all(
      (doms ?? []).map(async (d) => {
        const { data: s } = await supabase
          .from('stats')
          .select('tokens_wasted, agent_name')
          .eq('domain_id', d.id)
        const total = (s ?? []).reduce((sum, r) => sum + Number(r.tokens_wasted), 0)
        const topAgent = (s ?? []).reduce((best, r) => {
          const n = Number(r.tokens_wasted)
          return n > (best?.n ?? 0) ? { name: r.agent_name, n } : best
        }, null)?.name ?? null
        return { ...d, tokens_total: total, top_agent: topAgent }
      })
    )

    setDomains(enriched)
    if (enriched.length > 0) setSelectedDomain(enriched[0])

    // aggregate stats
    const allTime = enriched.reduce((sum, d) => sum + (d.tokens_total ?? 0), 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const domIds = enriched.map((d) => d.id)
    let weekly = 0
    if (domIds.length > 0) {
      const { data: ws } = await supabase
        .from('stats')
        .select('tokens_wasted')
        .in('domain_id', domIds)
        .gte('recorded_at', weekAgo)
      weekly = (ws ?? []).reduce((sum, r) => sum + Number(r.tokens_wasted), 0)
    }
    setStats({ allTime, weekly })

    // rank + badges
    if (p?.username) {
      try {
        const lb = await fetchLeaderboard('alltime', 500)
        const me = lb.find((r) => r.username === p.username)
        if (me) { setRank(me.rank); setBadges(me.badges) }
      } catch { /* skip */ }
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  async function addDomain(e) {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    try {
      let url = newDomain.trim().toLowerCase()
      if (!/^https?:\/\//.test(url)) url = 'https://' + url
      const { data, error } = await supabase
        .from('domains')
        .insert({ user_id: user.id, domain_url: url })
        .select()
        .single()
      if (error) throw error
      setNewDomain('')
      await load()
      setSelectedDomain({ ...data, tokens_total: 0, top_agent: null })
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddLoading(false)
    }
  }

  async function deleteDomain(id) {
    if (!window.confirm('Remove this domain and all its stats? This cannot be undone.')) return
    await supabase.from('stats').delete().eq('domain_id', id)
    await supabase.from('domains').delete().eq('id', id)
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
        <div className="text-slate-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto" style={{ background: '#050508' }}>

      {/* header */}
      <div className="flex items-center justify-between mb-10">
        <a href="/" className="font-black text-lg tracking-tight text-white">
          waste<span className="text-violet-500">my</span>tokens
        </a>
        <div className="flex items-center gap-4">
          <a href="/leaderboard" className="text-sm text-slate-400 hover:text-white">Leaderboard</a>
          {profile?.username && (
            <a href={`/u/${profile.username}`} className="text-sm text-slate-400 hover:text-white">
              My profile
            </a>
          )}
          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-red-400 transition-colors">
            Log out
          </button>
        </div>
      </div>

      {/* rank hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-2xl border border-violet-500/30 flex items-start justify-between flex-wrap gap-4"
        style={{ background: 'radial-gradient(circle at 0% 50%, rgba(109,40,217,0.15) 0%, rgba(5,5,8,0) 70%)' }}
      >
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Global Rank</p>
          <p className="text-6xl font-black text-white mt-1">#{rank}</p>
          <p className="text-sm text-slate-400 mt-1">@{profile?.username ?? '—'}</p>
        </div>
        <BadgeDisplay badges={badges} size="lg" />
      </motion.div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="All-time wasted" value={formatTokens(stats.allTime)} />
        <StatCard label="This week" value={formatTokens(stats.weekly)} />
        <StatCard label="Domains" value={domains.length} />
        <StatCard label="Member since" value={profile ? since(profile.created_at) : '—'} />
      </div>

      {/* domains section */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-white mb-4">Your Domains</h2>

        {/* add domain */}
        <form onSubmit={addDomain} className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="yourdomain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-violet-500 min-w-48"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            type="submit"
            disabled={addLoading}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)' }}
          >
            {addLoading ? 'Adding…' : '+ Add domain'}
          </button>
        </form>

        {addError && (
          <p className="text-sm text-red-400 mb-4">{addError}</p>
        )}

        {domains.length > 0 ? (
          <div className="rounded-2xl border border-white/10 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Domain</th>
                  <th className="px-5 py-3 font-semibold">API Key</th>
                  <th className="px-5 py-3 font-semibold">Tokens Wasted</th>
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Top Agent</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <DomainRow key={d.id} domain={d} onDelete={deleteDomain} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-6">No domains yet. Add one above to get your API key.</p>
        )}
      </div>

      {/* integration snippet */}
      {selectedDomain && (
        <div className="mb-10">
          <h2 className="text-lg font-black text-white mb-2">Proxy integration</h2>
          <p className="text-sm text-slate-400 mb-4">
            Add these env vars to your proxy deployment for{' '}
            <span className="text-violet-400 font-mono text-xs">{selectedDomain.domain_url}</span>.
            Showing key for the most recently added domain — click a row to change.
          </p>
          <div className="flex gap-2 mb-3 flex-wrap">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  selectedDomain.id === d.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {d.domain_url.replace(/https?:\/\//, '')}
              </button>
            ))}
          </div>
          <CodeSnippet apiKey={selectedDomain.api_key} />
        </div>
      )}

    </div>
  )
}
