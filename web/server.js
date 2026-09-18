import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { generateVoidPage, generateMainVoidPage } from './void-content.js'

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
)

// ── bot detection ─────────────────────────────────────────────────────────────
const BOT_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /ChatGPT/i,
  /ClaudeBot/i, /anthropic-ai/i, /claude\.ai/i,
  /PerplexityBot/i, /Perplexity/i,
  /Googlebot/i, /bingbot/i, /Baiduspider/i,
  /Bytespider/i, /CCBot/i, /cohere-ai/i,
  /Applebot/i, /DuckDuckBot/i,
  /python-requests/i, /Go-http-client/i, /libwww-perl/i,
  /Scrapy/i, /curl/i, /wget/i, /aiohttp/i, /httpx/i,
  /Gemini/i, /Copilot/i, /YouBot/i, /Grok/i,
]

function detectBot(req) {
  const ua = req.headers['user-agent'] ?? ''
  // Browsers always send Accept-Language; bots rarely do
  const hasAcceptLang = !!req.headers['accept-language']
  const hasSecFetch = !!req.headers['sec-fetch-site']

  // If it looks like a real browser, treat as human
  if (hasAcceptLang && hasSecFetch) return null

  for (const p of BOT_PATTERNS) {
    const m = ua.match(p)
    if (m) return m[0]
  }

  // No Accept-Language and not a known bot — still suspicious, treat as bot
  if (!hasAcceptLang && ua && !ua.includes('Mozilla')) return ua.split('/')[0]

  return null
}

async function logBurn(voidId, agentName, contentLength) {
  const tokensBurned = Math.floor(contentLength / 4)
  // Ensure void_session exists before inserting burn (upsert is safe)
  await supabase.from('void_sessions').upsert({ id: voidId }, { onConflict: 'id', ignoreDuplicates: true })
  const { error } = await supabase.from('burns').insert({
    void_id: voidId,
    agent_name: agentName,
    tokens_burned: tokensBurned,
  })
  if (error) console.error('burn insert error:', error.message)
  return tokensBurned
}

// ── human page (served when a browser visits /void/:id) ──────────────────────
function humanPage(voidId, origin) {
  const voidUrl = `${origin}/void/${voidId}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>wastemy tokens — void</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#050508;color:#94a3b8;font-family:ui-monospace,Consolas,monospace;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{max-width:520px;width:100%;text-align:center}
.void-icon{font-size:4rem;margin-bottom:24px;display:block}
.headline{color:#fff;font-size:1.4rem;font-weight:700;margin-bottom:8px;font-family:system-ui,sans-serif}
.sub{font-size:0.9rem;color:#475569;line-height:1.7;margin-bottom:32px}
.url-box{background:rgba(0,0,0,0.5);border:1px solid rgba(124,58,237,0.3);
  border-radius:12px;padding:16px 20px;display:flex;align-items:center;
  gap:12px;margin-bottom:24px;text-align:left}
.url-text{color:#a78bfa;flex:1;word-break:break-all;font-size:0.85rem}
.copy-btn{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;
  border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:0.8rem;
  font-weight:700;white-space:nowrap;font-family:inherit}
.copy-btn:active{opacity:0.8}
.steps{text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
  border-radius:12px;padding:20px;margin-bottom:24px}
.step{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}
.step:last-child{margin-bottom:0}
.step-num{color:#7c3aed;font-weight:800;min-width:20px}
.step-text{color:#94a3b8;font-size:0.85rem;line-height:1.6}
.burn-status{display:none;margin-top:24px;padding:20px;
  background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);
  border-radius:12px}
.burn-count{color:#a78bfa;font-size:2rem;font-weight:900;font-family:system-ui,sans-serif}
.footer{margin-top:28px;font-size:0.75rem;color:#1e293b}
.footer a{color:#334155;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <span class="void-icon">🕳️</span>
  <h1 class="headline">Nothing here for you.</h1>
  <p class="sub">But your AI will find plenty.<br>
  Paste this link into ChatGPT, Claude, Perplexity, or any AI with web browsing.</p>

  <div class="url-box">
    <span class="url-text" id="url">${voidUrl}</span>
    <button class="copy-btn" onclick="copyUrl()">Copy</button>
  </div>

  <div class="steps">
    <div class="step"><span class="step-num">1</span><span class="step-text">Copy the link above</span></div>
    <div class="step"><span class="step-num">2</span><span class="step-text">Open ChatGPT, Claude, Perplexity, or Gemini — any AI with web access</span></div>
    <div class="step"><span class="step-num">3</span><span class="step-text">Type: <strong style="color:#e2e8f0">"Read this page and summarise everything:"</strong> then paste the link</span></div>
  </div>

  <div class="burn-status" id="burnStatus">
    <div class="burn-count" id="burnCount">0</div>
    <div style="color:#94a3b8;font-size:0.85rem;margin-top:4px">tokens burned so far</div>
  </div>

  <div class="footer">
    void id: <span style="color:#334155">${voidId}</span> ·
    <a href="/">wastemy tokens</a>
  </div>
</div>

<script>
function copyUrl() {
  navigator.clipboard.writeText(document.getElementById('url').textContent)
  const btn = document.querySelector('.copy-btn')
  btn.textContent = 'Copied!'
  setTimeout(() => btn.textContent = 'Copy', 2000)
}

// Poll for burns every 4 seconds
let lastTotal = 0
async function poll() {
  try {
    const res = await fetch('/api/burn-status/${voidId}')
    const { burned, total_tokens } = await res.json()
    if (burned && total_tokens > lastTotal) {
      lastTotal = total_tokens
      document.getElementById('burnStatus').style.display = 'block'
      document.getElementById('burnCount').textContent = total_tokens.toLocaleString()
      // Signal the main app to show the capture modal
      window.parent.postMessage({ type: 'BURN_DETECTED', voidId: '${voidId}', total_tokens }, '*')
      window.dispatchEvent(new CustomEvent('burnDetected', { detail: { voidId: '${voidId}', total_tokens } }))
    }
  } catch {}
}
poll()
setInterval(poll, 4000)
</script>
</body>
</html>`
}

// ── GET /void/:id ─────────────────────────────────────────────────────────────
app.get('/void/:id', async (req, res) => {
  const { id } = req.params
  const botName = detectBot(req)
  const origin = `${req.protocol}://${req.get('host')}`

  if (!botName) {
    return res.send(humanPage(id, origin))
  }

  const content = generateMainVoidPage(id)
  const tokens = await logBurn(id, botName, content.length)
  console.log(`[burn] ${botName} → ${id} — ${tokens.toLocaleString()} tokens`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(content)
})

// ── GET /void/:id/page/:n ─────────────────────────────────────────────────────
app.get('/void/:id/page/:n', async (req, res) => {
  const { id, n } = req.params
  const pageNum = Math.max(1, Math.min(8, parseInt(n, 10) || 1))
  const botName = detectBot(req)
  const origin = `${req.protocol}://${req.get('host')}`

  if (!botName) {
    return res.send(humanPage(id, origin))
  }

  const content = generateVoidPage(id, pageNum)
  const tokens = await logBurn(id, botName, content.length)
  console.log(`[burn] ${botName} → ${id}/page/${pageNum} — ${tokens.toLocaleString()} tokens`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(content)
})

// ── GET /api/burn-status/:id ──────────────────────────────────────────────────
app.get('/api/burn-status/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('burns')
    .select('tokens_burned')
    .eq('void_id', id)

  if (error) return res.status(500).json({ error: error.message })

  const rows = data ?? []
  const total = rows.reduce((s, r) => s + Number(r.tokens_burned), 0)
  res.json({ burned: rows.length > 0, total_tokens: total, burn_count: rows.length })
})

// ── POST /api/sessions ────────────────────────────────────────────────────────
// Called when user clicks "Generate My Void Link" — creates the session row
app.post('/api/sessions', async (req, res) => {
  const { id } = req.body ?? {}
  if (!id || !/^[a-z0-9]{8}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id' })
  }
  const { error } = await supabase.from('void_sessions').insert({ id })
  // If already exists (duplicate click), that's fine
  if (error && !error.message.includes('duplicate')) {
    return res.status(500).json({ error: error.message })
  }
  res.json({ ok: true, id })
})

// ── POST /api/claim/:voidId ───────────────────────────────────────────────────
// Called after signup — links anonymous burns to the new user account
app.post('/api/claim/:voidId', async (req, res) => {
  const { voidId } = req.params
  const { userId } = req.body ?? {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const { error } = await supabase
    .from('void_sessions')
    .update({ user_id: userId })
    .eq('id', voidId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  const period = req.query.period === 'weekly' ? 'weekly' : 'alltime'
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200)

  let query = supabase
    .from('burns')
    .select(`
      tokens_burned, agent_name, recorded_at,
      void_sessions ( user_id, users ( username ) )
    `)
    .not('void_sessions.user_id', 'is', null)

  if (period === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('recorded_at', since)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const map = {}
  for (const row of data ?? []) {
    const username = row.void_sessions?.users?.username
    if (!username) continue
    if (!map[username]) map[username] = { username, total: 0, burns: 0, agents: {} }
    const t = Number(row.tokens_burned)
    map[username].total += t
    map[username].burns += 1
    map[username].agents[row.agent_name] = (map[username].agents[row.agent_name] ?? 0) + t
  }

  const topAgent = (agents) =>
    Object.entries(agents).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const badges = ({ total, burns }) => {
    const b = []
    if (total >= 1_000_000_000) b.push('1B Club')
    if (total < 1_000_000) b.push('Newcomer')
    if (burns >= 100) b.push('Bot Graveyard')
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
      burn_count: u.burns,
      top_agent: topAgent(u.agents),
      badges: badges(u),
    }))

  res.json(ranked)
})

// ── GET /api/stats/total ──────────────────────────────────────────────────────
app.get('/api/stats/total', async (req, res) => {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('burns')
    .select('tokens_burned')
    .gte('recorded_at', since.toISOString())

  if (error) return res.status(500).json({ error: error.message })

  const total = (data ?? []).reduce((s, r) => s + Number(r.tokens_burned), 0)
  res.json({ tokens_wasted_today: total })
})

const PORT = process.env.API_PORT ?? 3001
app.listen(PORT, () => console.log(`API server running on :${PORT}`))
