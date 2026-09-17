import { supabase } from './supabase'

// ── leaderboard ──────────────────────────────────────────────────────────────

export async function fetchLeaderboard(period = 'alltime', limit = 50) {
  const since =
    period === 'weekly'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      : null

  let query = supabase
    .from('stats')
    .select(`
      tokens_wasted,
      agent_name,
      recorded_at,
      domains (
        domain_url,
        users ( username )
      )
    `)

  if (since) query = query.gte('recorded_at', since)

  const { data, error } = await query
  if (error) throw error

  // Aggregate by username
  const map = {}
  for (const row of data ?? []) {
    const username = row.domains?.users?.username
    if (!username) continue
    if (!map[username]) map[username] = { username, total: 0, agents: {} }
    map[username].total += Number(row.tokens_wasted)
    map[username].agents[row.agent_name] =
      (map[username].agents[row.agent_name] ?? 0) + Number(row.tokens_wasted)
  }

  const ranked = Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      username: u.username,
      total_tokens_wasted: u.total,
      top_agent: topKey(u.agents),
      badges: computeBadges(u),
    }))

  return ranked
}

function topKey(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

function computeBadges({ total, agents }) {
  const badges = []
  if (total >= 1_000_000_000) badges.push('1B Club')
  if (total < 1_000_000) badges.push('Newcomer')
  const tarpitTokens = agents['TarpitMode'] ?? 0
  if (tarpitTokens > 0) badges.push('Tarpit King')
  const totalAgents = Object.keys(agents).length
  if (totalAgents >= 5) badges.push('Bot Graveyard')
  if (badges.length === 0) badges.push('Waster')
  return badges
}

// ── live counter ─────────────────────────────────────────────────────────────

export async function fetchTodayTotal() {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('stats')
    .select('tokens_wasted')
    .gte('recorded_at', since.toISOString())

  if (error) throw error

  return (data ?? []).reduce((sum, r) => sum + Number(r.tokens_wasted), 0)
}

// ── public profile ────────────────────────────────────────────────────────────

export async function fetchProfile(username) {
  const { data: user, error: uErr } = await supabase
    .from('users')
    .select('id, username, created_at')
    .eq('username', username)
    .single()

  if (uErr) throw uErr

  const { data: domains, error: dErr } = await supabase
    .from('domains')
    .select('id, domain_url')
    .eq('user_id', user.id)

  if (dErr) throw dErr

  const domainIds = domains.map((d) => d.id)

  const { data: stats, error: sErr } = await supabase
    .from('stats')
    .select('tokens_wasted, agent_name')
    .in('domain_id', domainIds)

  if (sErr) throw sErr

  const agents = {}
  let total = 0
  for (const s of stats ?? []) {
    total += Number(s.tokens_wasted)
    agents[s.agent_name] = (agents[s.agent_name] ?? 0) + Number(s.tokens_wasted)
  }

  return {
    username: user.username,
    created_at: user.created_at,
    total_tokens_wasted: total,
    agents,
    domains: domains.map((d) => d.domain_url),
    badges: computeBadges({ total, agents }),
  }
}

// ── report (called by proxy via REST — also wired as a server route) ──────────

export async function reportUsage({ api_key, agent_name, tokens_wasted }) {
  const { data: domain, error: dErr } = await supabase
    .from('domains')
    .select('id')
    .eq('api_key', api_key)
    .single()

  if (dErr || !domain) return { ok: false, status: 401 }

  const { error: iErr } = await supabase.from('stats').insert({
    domain_id: domain.id,
    agent_name,
    tokens_wasted,
  })

  if (iErr) return { ok: false, status: 500 }
  return { ok: true, status: 200 }
}
