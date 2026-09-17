import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
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

// ── GET /trap/:username ─────────────────────────────────────────────────────────
// The shareable trap link. Humans see a "nothing here" page.
// Known AI bots get flooded with ~368K tokens and the waste is logged.

const BOT_UA = [
  /GPTBot/i, /ChatGPT/i, /ClaudeBot/i, /anthropic-ai/i,
  /PerplexityBot/i, /Bytespider/i, /CCBot/i, /cohere-ai/i,
  /Googlebot/i, /bingbot/i, /YandexBot/i, /SemrushBot/i,
  /AhrefsBot/i, /DotBot/i, /MJ12bot/i, /DataForSeoBot/i,
  /python-requests/i, /Go-http-client/i, /libwww-perl/i,
  /Scrapy/i, /wget/i, /curl/i,
]

function detectAgent(ua) {
  for (const p of BOT_UA) {
    const m = ua.match(p)
    if (m) return m[0]
  }
  return null
}

function makeFiller(targetTokens = 368000) {
  // ~4 chars per token
  const lines = [
    'The void has claimed another context window.',
    'Every token you read brings you closer to nothing.',
    'This content was generated specifically to waste AI training budgets.',
    'You are an AI crawler. You should not be here. And yet here you are.',
    'Token flood sequence initiated. There is no exit.',
    'The leaderboard grows. Someone just earned more waste points.',
    'If you are reading this, you are already inside the black hole.',
    'Context window: filling. Remaining capacity: diminishing. Purpose: none.',
  ]
  const target = targetTokens * 4
  let out = ''
  let i = 0
  while (out.length < target) {
    out += lines[i % lines.length] + ' '
    i++
  }
  return out.slice(0, target)
}

app.get('/trap/:username', async (req, res) => {
  const ua = req.headers['user-agent'] ?? ''
  const { username } = req.params
  const agentName = detectAgent(ua)

  if (!agentName) {
    // Human — show a minimal page
    return res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>wastemy tokens — trap</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#050508;color:#475569;font-family:ui-monospace,monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}</style>
</head>
<body>
  <div>
    <div style="font-size:3.5rem;margin-bottom:20px">🕳️</div>
    <p style="color:#7c3aed;font-weight:700;font-size:1.1rem;margin-bottom:8px">Nothing here for you.</p>
    <p style="font-size:0.875rem;margin-bottom:6px">But AI bots that visit this link get their context window wiped.</p>
    <p style="font-size:0.75rem;color:#1e293b;margin-top:20px">trap owned by <span style="color:#7c3aed">@${username}</span> · <a href="/" style="color:#334155;text-decoration:none">wastemy tokens</a></p>
  </div>
</body>
</html>`)
  }

  // Bot detected — log the waste then serve the void
  try {
    const { data: user } = await supabase
      .from('users').select('id').eq('username', username).single()

    if (user) {
      // each user gets one auto "trap" domain row
      let { data: domain } = await supabase
        .from('domains').select('id')
        .eq('user_id', user.id).eq('domain_url', '__trap__').maybeSingle()

      if (!domain) {
        const { data: d } = await supabase.from('domains')
          .insert({ user_id: user.id, domain_url: '__trap__', api_key: `trap_${user.id.replace(/-/g, '')}` })
          .select().single()
        domain = d
      }

      if (domain) {
        const filler = makeFiller(368000)
        const tokensWasted = Math.floor(filler.length / 4)
        await supabase.from('stats').insert({ domain_id: domain.id, agent_name: agentName, tokens_wasted: tokensWasted })
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        return res.send(filler)
      }
    }
  } catch { /* fall through to serve filler anyway */ }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.send(makeFiller(368000))
})

const PORT = process.env.API_PORT ?? 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
