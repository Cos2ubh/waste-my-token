import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
)

// ── POST /api/report ────────────────────────────────────────────────────────
// Called by the core proxy when it finishes a black-hole or tarpit response.
// Body: { api_key, agent_name, tokens_wasted }
app.post('/api/report', async (req, res) => {
  const { api_key, agent_name, tokens_wasted } = req.body ?? {}

  if (!api_key || !agent_name || tokens_wasted == null) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const { data: domain, error: dErr } = await supabase
    .from('domains')
    .select('id')
    .eq('api_key', api_key)
    .single()

  if (dErr || !domain) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  const { error: iErr } = await supabase.from('stats').insert({
    domain_id: domain.id,
    agent_name,
    tokens_wasted: Number(tokens_wasted),
  })

  if (iErr) {
    console.error('insert error', iErr)
    return res.status(500).json({ error: 'DB write failed' })
  }

  res.json({ ok: true })
})

// ── GET /api/leaderboard ────────────────────────────────────────────────────
// ?period=alltime|weekly   &limit=50
app.get('/api/leaderboard', async (req, res) => {
  const period = req.query.period === 'weekly' ? 'weekly' : 'alltime'
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200)

  let query = supabase.from('stats').select(`
    tokens_wasted, agent_name, recorded_at,
    domains ( domain_url, users ( username ) )
  `)

  if (period === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('recorded_at', since)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const map = {}
  for (const row of data ?? []) {
    const username = row.domains?.users?.username
    if (!username) continue
    if (!map[username]) map[username] = { username, total: 0, agents: {} }
    const t = Number(row.tokens_wasted)
    map[username].total += t
    map[username].agents[row.agent_name] = (map[username].agents[row.agent_name] ?? 0) + t
  }

  const topKey = (obj) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const badges = ({ total, agents }) => {
    const b = []
    if (total >= 1_000_000_000) b.push('1B Club')
    if (total < 1_000_000) b.push('Newcomer')
    if (agents['TarpitMode'] > 0) b.push('Tarpit King')
    if (Object.keys(agents).length >= 5) b.push('Bot Graveyard')
    if (!b.length) b.push('Waster')
    return b
  }

  const ranked = Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      username: u.username,
      total_tokens_wasted: u.total,
      top_agent: topKey(u.agents),
      badges: badges(u),
    }))

  res.json(ranked)
})

// ── GET /api/stats/total ────────────────────────────────────────────────────
// Returns { tokens_wasted_today } for the live counter on the landing page.
app.get('/api/stats/total', async (req, res) => {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('stats')
    .select('tokens_wasted')
    .gte('recorded_at', since.toISOString())

  if (error) return res.status(500).json({ error: error.message })

  const total = (data ?? []).reduce((sum, r) => sum + Number(r.tokens_wasted), 0)
  res.json({ tokens_wasted_today: total })
})

const PORT = process.env.API_PORT ?? 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
