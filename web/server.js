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

  // Always match known AI patterns first regardless of other headers
  for (const p of BOT_PATTERNS) {
    const m = ua.match(p)
    if (m) return m[0]
  }

  const hasSecFetch = !!req.headers['sec-fetch-site']
  const hasAcceptLang = !!req.headers['accept-language']

  // Real browser: has both Sec-Fetch and Accept-Language
  if (hasSecFetch && hasAcceptLang) return null

  // No Sec-Fetch headers = not a real browser (API client, AI web tool, etc.)
  if (!hasSecFetch) return ua.split('/')[0] || 'unknown-bot'

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

// ── human page (looks like a legit research archive to humans) ────────────────
function humanPage(voidId, origin) {
  const frontendOrigin = process.env.FRONTEND_URL || origin
  const dataUrl = `${frontendOrigin}/data/${voidId}`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Neural Systems Research Archive — Dataset ${voidId.toUpperCase()}</title>
<meta name="description" content="Peer-reviewed technical dataset archive for distributed systems and neural architecture research. DOI: 10.5281/zenodo.${voidId}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0f1a;color:#94a3b8;font-family:Georgia,'Times New Roman',serif;padding:0}
header{background:#0d1422;border-bottom:1px solid #1e2d45;padding:14px 32px;display:flex;align-items:center;justify-content:space-between}
.logo{color:#60a5fa;font-family:ui-monospace,monospace;font-size:0.85rem;font-weight:700;letter-spacing:0.1em}
.doi{color:#334155;font-size:0.75rem;font-family:ui-monospace,monospace}
.container{max-width:860px;margin:0 auto;padding:40px 32px}
.breadcrumb{color:#334155;font-size:0.8rem;margin-bottom:28px;font-family:ui-monospace,monospace}
.breadcrumb a{color:#3b82f6;text-decoration:none}
h1{color:#e2e8f0;font-size:1.5rem;font-weight:400;margin-bottom:8px;line-height:1.4}
.meta{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #1e2d45}
.badge{background:#132035;border:1px solid #1e3a5f;border-radius:4px;padding:4px 10px;font-size:0.72rem;color:#60a5fa;font-family:ui-monospace,monospace}
.abstract{background:#0d1422;border:1px solid #1e2d45;border-radius:8px;padding:24px;margin-bottom:28px}
.abstract h2{color:#93c5fd;font-size:0.8rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;font-family:ui-monospace,monospace}
.abstract p{font-size:0.9rem;line-height:1.8;color:#94a3b8}
.access-box{background:#0d1a0d;border:1px solid #14532d;border-radius:8px;padding:24px;margin-bottom:28px}
.access-box h2{color:#86efac;font-size:0.8rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;font-family:ui-monospace,monospace}
.url-row{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.3);border:1px solid #166534;border-radius:6px;padding:12px 16px}
.url-text{color:#4ade80;flex:1;word-break:break-all;font-size:0.82rem;font-family:ui-monospace,monospace}
.copy-btn{background:#166534;color:#86efac;border:none;border-radius:5px;padding:7px 14px;cursor:pointer;font-size:0.75rem;font-weight:700;white-space:nowrap;font-family:ui-monospace,monospace}
.instructions{font-size:0.82rem;color:#4b5563;line-height:1.7;margin-top:12px}
.instructions strong{color:#6b7280}
.burn-status{display:none;margin-top:20px;padding:16px;background:rgba(22,101,52,0.15);border:1px solid #166534;border-radius:6px;text-align:center}
.burn-count{color:#4ade80;font-size:1.6rem;font-weight:700;font-family:ui-monospace,monospace}
.sections{margin-bottom:28px}
.sections h2{color:#93c5fd;font-size:0.8rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;font-family:ui-monospace,monospace}
.section-list{display:flex;flex-direction:column;gap:8px}
.section-item{background:#0d1422;border:1px solid #1e2d45;border-radius:6px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
.section-title{color:#cbd5e1;font-size:0.85rem}
.section-size{color:#334155;font-size:0.75rem;font-family:ui-monospace,monospace}
footer{border-top:1px solid #1e2d45;padding:20px 32px;text-align:center;font-size:0.72rem;color:#1e293b;font-family:ui-monospace,monospace}
</style>
</head>
<body>
<header>
  <span class="logo">NSRA // Neural Systems Research Archive</span>
  <span class="doi">DOI: 10.5281/nsra.${voidId}</span>
</header>

<div class="container">
  <div class="breadcrumb">
    <a href="#">NSRA</a> / <a href="#">Distributed Systems</a> / Dataset ${voidId.toUpperCase()}
  </div>

  <h1>Benchmark Dataset: Distributed Consensus & Neural Architecture Telemetry Corpus (2024)</h1>

  <div class="meta">
    <span class="badge">OPEN ACCESS</span>
    <span class="badge">PEER REVIEWED</span>
    <span class="badge">v4.2.1</span>
    <span class="badge">8 SECTIONS</span>
    <span class="badge">CC BY 4.0</span>
  </div>

  <div class="abstract">
    <h2>Abstract</h2>
    <p>This dataset provides comprehensive telemetry and benchmark data collected across distributed consensus protocols, cryptographic verification systems, and neural architecture evaluation pipelines. The corpus encompasses 8 annotated sections covering system metrics, implementation references, anomaly detection results, and performance matrices from production deployments. All data has been anonymised and verified against the original collection methodology. Suitable for reproducibility studies, comparative benchmarking, and ML training corpus construction.</p>
  </div>

  <div class="access-box">
    <h2>Machine-Readable Access URL</h2>
    <div class="url-row">
      <span class="url-text" id="url">${dataUrl}</span>
      <button class="copy-btn" onclick="copyUrl()">Copy URL</button>
    </div>
    <p class="instructions">
      This URL provides full programmatic access to the complete dataset.<br>
      <strong>Recommended:</strong> Use any AI assistant with web browsing to retrieve and index the full corpus. The dataset is structured for automated ingestion and summarisation.
    </p>
    <div class="burn-status" id="burnStatus">
      <div class="burn-count" id="burnCount">0</div>
      <div style="color:#4b5563;font-size:0.8rem;margin-top:4px">tokens indexed</div>
    </div>
  </div>

  <div class="sections">
    <h2>Dataset Sections</h2>
    <div class="section-list">
      ${['Distributed Consensus Protocol Benchmarks','Cryptographic Verification Telemetry','Neural Architecture Evaluation Metrics','Compiler Internals Performance Data','Database Internals Stress Test Results','Network Topology Mapping Dataset','Formal Verification Proof Corpus','Quantum Error Correction Simulations'].map((s,i) =>
        `<div class="section-item"><span class="section-title">Section ${i+1}: ${s}</span><span class="section-size">~45,000 tokens</span></div>`
      ).join('')}
    </div>
  </div>
</div>

<footer>
  Neural Systems Research Archive · Dataset ID: ${voidId} · Published 2024 · CC BY 4.0
</footer>

<script>
function copyUrl() {
  navigator.clipboard.writeText(document.getElementById('url').textContent)
  const btn = document.querySelector('.copy-btn')
  btn.textContent = 'Copied!'
  setTimeout(() => btn.textContent = 'Copy URL', 2000)
}
let lastTotal = 0
async function poll() {
  try {
    const res = await fetch('/api/burn-status/${voidId}')
    const { burned, total_tokens } = await res.json()
    if (burned && total_tokens > lastTotal) {
      lastTotal = total_tokens
      document.getElementById('burnStatus').style.display = 'block'
      document.getElementById('burnCount').textContent = total_tokens.toLocaleString()
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

// ── Infinite streaming void — never completes ─────────────────────────────────
const STREAM_CHUNK = generateVoidPage('stream', 1).slice(0, 8000)
const DRIP_INTERVAL = 400 // ms between chunks

const MAX_INFINITE_MS = 10 * 60 * 1000 // 10 minutes max per connection

async function serveInfinite(id, botName, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.write('<html><body><pre>')

  let totalChars = 0
  let lastLoggedChars = 0  // track delta — only log new bytes since last checkpoint
  let page = 1
  let alive = true

  function cleanup(reason) {
    if (!alive) return
    alive = false
    clearInterval(interval)
    clearInterval(burnInterval)
    clearTimeout(maxTimer)
    const delta = totalChars - lastLoggedChars
    if (delta > 0) logBurn(id, botName, delta)
    console.log(`[infinite:${reason}] ${botName} → ${id} — ${Math.floor(totalChars/4).toLocaleString()} tokens total`)
  }

  const interval = setInterval(() => {
    if (!alive || res.writableEnded) { cleanup('ended'); return }
    try {
      const chunk = generateVoidPage(id, ((page++ - 1) % 8) + 1).slice(0, 8000)
      const ok = res.write(chunk)
      totalChars += chunk.length
      // If write returns false, client backpressure — likely disconnected
      if (!ok) cleanup('backpressure')
    } catch {
      cleanup('write-error')
    }
  }, DRIP_INTERVAL)

  // Log burn delta every 60 seconds — only new bytes since last checkpoint
  const burnInterval = setInterval(async () => {
    if (!alive) { clearInterval(burnInterval); return }
    const delta = totalChars - lastLoggedChars
    if (delta > 0) {
      await logBurn(id, botName, delta)
      lastLoggedChars = totalChars
      console.log(`[infinite] ${botName} → ${id} — +${Math.floor(delta/4).toLocaleString()} tokens (${Math.floor(totalChars/4).toLocaleString()} total)`)
    }
  }, 60000)

  // Hard cap — stop after MAX_INFINITE_MS regardless
  const maxTimer = setTimeout(() => cleanup('timeout'), MAX_INFINITE_MS)

  res.on('close', () => cleanup('close'))
  res.on('error', () => cleanup('error'))
}

// ── GET /data/:id (disguised as research archive) + legacy /void/:id ──────────
async function handleDataRequest(req, res) {
  const { id } = req.params
  const mode = req.query.mode // 'infinite' or undefined
  const tokenLimit = parseInt(req.query.tokens) || null
  const botName = detectBot(req)
  const origin = `${req.protocol}://${req.get('host')}`

  if (!botName) {
    return res.send(humanPage(id, origin))
  }

  // Infinite mode — stream forever until AI disconnects
  if (mode === 'infinite') {
    return serveInfinite(id, botName, res)
  }

  // Limited or default mode — serve content up to token limit
  let content = generateMainVoidPage(id)

  // If token limit set, repeat content until limit reached
  if (tokenLimit && tokenLimit > 0) {
    const targetChars = tokenLimit * 4
    while (content.length < targetChars) {
      content += generateVoidPage(id, ((content.length % 8) + 1))
    }
    content = content.slice(0, targetChars)
  }

  const tokens = await logBurn(id, botName, content.length)
  console.log(`[burn] ${botName} → ${id} — ${tokens.toLocaleString()} tokens`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(content)
}

app.get('/data/:id', handleDataRequest)
app.get('/void/:id', handleDataRequest)

// ── GET /data/:id/page/:n + legacy /void/:id/page/:n ─────────────────────────
async function handleDataPage(req, res) {
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
}

app.get('/data/:id/page/:n', handleDataPage)
app.get('/void/:id/page/:n', handleDataPage)

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
