import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import BadgeDisplay from '../components/BadgeDisplay'
import { fetchLeaderboard } from '../lib/api'

const EXPO = [0.22, 1, 0.36, 1]

function TrapLink({ username }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/trap/${username}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EXPO }}
      style={{
        marginBottom: 28,
        padding: 'clamp(24px, 3vw, 36px)',
        borderRadius: 20,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, rgba(5,5,8,0) 70%)',
        border: '1px solid rgba(124,58,237,0.35)',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
        Your Trap Link
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.7, maxWidth: 560 }}>
        Paste this link anywhere — a chat, a tweet, a blog post, a forum comment.
        Any AI bot that follows it gets their context window wiped.
        Every token they waste goes on your score.
      </p>

      {/* the link */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 14,
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 16,
      }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.95rem', color: '#e2e8f0', flex: 1, wordBreak: 'break-all' }}>
          {url}
        </span>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={copy}
          style={{
            padding: '9px 20px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', border: 'none', flexShrink: 0,
            background: copied ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: copied ? '#22c55e' : '#fff',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </motion.button>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#334155' }}>
        Share it on{' '}
        {['Twitter/X', 'Reddit', 'WhatsApp', 'your blog', 'GitHub'].map((p, i, arr) => (
          <span key={p}><span style={{ color: '#475569' }}>{p}</span>{i < arr.length - 1 ? ', ' : ''}</span>
        ))}
        {' '}— anywhere bots crawl.
      </p>
    </motion.div>
  )
}

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function since(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div style={{
      padding: 'clamp(18px, 2vw, 24px)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, color: '#fff', margin: 0 }}>{value}</p>
    </div>
  )
}

function CodeSnippet({ apiKey }) {
  const [copied, setCopied] = useState(false)
  const code = `# Add to your proxy .env\nWMT_API_KEY=${apiKey}\nWMT_REPORT_URL=https://wastemy.tokens/api/report`
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#08080f' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>.env</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          style={{ fontSize: '0.75rem', fontWeight: 700, color: copied ? '#22c55e' : '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{ padding: '16px', margin: 0, fontSize: '0.85rem', fontFamily: 'ui-monospace, monospace', color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre' }}>
        {code}
      </pre>
    </div>
  )
}

function DomainRow({ domain, onDelete }) {
  const [copied, setCopied] = useState(false)
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '12px 16px 12px 0', color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem' }}>{domain.domain_url}</td>
      <td style={{ padding: '12px 16px 12px 0' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{domain.api_key.slice(0, 8)}…</span>
        <button onClick={() => { navigator.clipboard.writeText(domain.api_key); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: copied ? '#22c55e' : '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}>
          {copied ? '✓' : 'copy'}
        </button>
      </td>
      <td style={{ padding: '12px 16px 12px 0', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{fmt(domain.tokens_total ?? 0)}</td>
      <td style={{ padding: '12px 16px 12px 0', color: '#475569', fontSize: '0.8rem' }}>{domain.top_agent ?? '—'}</td>
      <td style={{ padding: '12px 0' }}>
        <button onClick={() => onDelete(domain.id)}
          style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = 'rgba(239,68,68,0.5)'}>
          remove
        </button>
      </td>
    </tr>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────

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

    const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data: doms } = await supabase.from('domains').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    const enriched = await Promise.all(
      (doms ?? []).map(async (d) => {
        const { data: s } = await supabase.from('stats').select('tokens_wasted, agent_name').eq('domain_id', d.id)
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

    const allTime = enriched.reduce((sum, d) => sum + (d.tokens_total ?? 0), 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const domIds = enriched.map((d) => d.id)
    let weekly = 0
    if (domIds.length > 0) {
      const { data: ws } = await supabase.from('stats').select('tokens_wasted').in('domain_id', domIds).gte('recorded_at', weekAgo)
      weekly = (ws ?? []).reduce((sum, r) => sum + Number(r.tokens_wasted), 0)
    }
    setStats({ allTime, weekly })

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
      const { data, error } = await supabase.from('domains').insert({ user_id: user.id, domain_url: url }).select().single()
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
      <div style={{ width: '100%', minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#050508' }}>

      {/* nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)', height: 64,
        background: 'rgba(5,5,8,0.9)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <a href="/" style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/leaderboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 12px' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            Leaderboard
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

      {/* page body */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(40px, 5vh, 64px) clamp(24px, 5vw, 56px)' }}>

        {/* ── trap link — primary CTA ── */}
        {profile?.username && <TrapLink username={profile.username} />}

        {/* rank hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EXPO }}
          style={{
            marginBottom: 28, padding: 'clamp(24px, 3vw, 36px)',
            borderRadius: 20, border: '1px solid rgba(124,58,237,0.3)',
            background: 'radial-gradient(ellipse at 0% 60%, rgba(109,40,217,0.18) 0%, rgba(5,5,8,0) 65%)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Global Rank</p>
            <p style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>#{rank}</p>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>@{profile?.username ?? '—'}</p>
          </div>
          <BadgeDisplay badges={badges} size="lg" />
        </motion.div>

        {/* stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EXPO }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(10px, 1.5vw, 16px)', marginBottom: 40 }}
        >
          <StatCard label="All-time wasted" value={fmt(stats.allTime)} />
          <StatCard label="This week" value={fmt(stats.weekly)} />
          <StatCard label="Domains" value={domains.length} />
          <StatCard label="Member since" value={profile ? since(profile.created_at) : '—'} />
        </motion.div>

        {/* domains */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18, ease: EXPO }}
          style={{ marginBottom: 36 }}
        >
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: 16 }}>Your Domains</h2>

          {/* add domain form */}
          <form onSubmit={addDomain} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="yourdomain.com"
              value={newDomain} onChange={(e) => setNewDomain(e.target.value)} required
              style={{
                flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem',
                color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="submit" disabled={addLoading}
              style={{
                padding: '12px 22px', borderRadius: 12, fontSize: '0.875rem', fontWeight: 700,
                color: '#fff', border: 'none', cursor: 'pointer', opacity: addLoading ? 0.5 : 1,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              }}>
              {addLoading ? 'Adding…' : '+ Add domain'}
            </button>
          </form>

          {addError && <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: 12 }}>{addError}</p>}

          {domains.length > 0 ? (
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Domain', 'API Key', 'Tokens Wasted', 'Top Agent', ''].map((h) => (
                      <th key={h} style={{ padding: '12px 16px 12px 0', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => <DomainRow key={d.id} domain={d} onDelete={deleteDomain} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#334155', fontSize: '0.875rem', padding: '24px 0' }}>No domains yet. Add one above to get your API key.</p>
          )}
        </motion.section>

        {/* integration snippet */}
        {selectedDomain && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease: EXPO }}
          >
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: 6 }}>Proxy integration</h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 14 }}>
              Add these env vars for{' '}
              <span style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedDomain.domain_url}</span>.
            </p>
            {domains.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {domains.map((d) => (
                  <button key={d.id} onClick={() => setSelectedDomain(d)}
                    style={{
                      fontSize: '0.75rem', padding: '5px 12px', borderRadius: 20, fontWeight: 700,
                      cursor: 'pointer', border: 'none',
                      background: selectedDomain.id === d.id ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                      color: selectedDomain.id === d.id ? '#fff' : '#64748b',
                    }}>
                    {d.domain_url.replace(/https?:\/\//, '')}
                  </button>
                ))}
              </div>
            )}
            <CodeSnippet apiKey={selectedDomain.api_key} />
          </motion.section>
        )}

      </main>
    </div>
  )
}
