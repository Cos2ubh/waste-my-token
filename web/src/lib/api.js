import { supabase } from './supabase'

// ── leaderboard (reads from server — joins burns → void_sessions → users) ─────
export async function fetchLeaderboard(period = 'alltime', limit = 50) {
  const res = await fetch(`/api/leaderboard?period=${period}&limit=${limit}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── live counter (all burns today, attributed + anonymous) ────────────────────
export async function fetchTodayTotal() {
  const res = await fetch('/api/stats/total')
  if (!res.ok) throw new Error(await res.text())
  const { tokens_wasted_today } = await res.json()
  return tokens_wasted_today ?? 0
}

// ── burn status for a void session ────────────────────────────────────────────
export async function fetchBurnStatus(voidId) {
  const res = await fetch(`/api/burn-status/${voidId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json() // { burned, total_tokens, burn_count }
}

// ── create void session ───────────────────────────────────────────────────────
export async function createSession(id) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── claim void session after signup ──────────────────────────────────────────
export async function claimSession(voidId, userId) {
  const res = await fetch(`/api/claim/${voidId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── public profile ────────────────────────────────────────────────────────────
export async function fetchProfile(username) {
  const { data: user, error: uErr } = await supabase
    .from('users').select('id, username, created_at').eq('username', username).single()
  if (uErr) throw uErr

  const { data: sessions } = await supabase
    .from('void_sessions').select('id').eq('user_id', user.id)

  const sessionIds = (sessions ?? []).map(s => s.id)
  let burns = [], total = 0, agents = {}

  if (sessionIds.length) {
    const { data: b } = await supabase
      .from('burns').select('tokens_burned, agent_name').in('void_id', sessionIds)
    for (const row of b ?? []) {
      total += Number(row.tokens_burned)
      agents[row.agent_name] = (agents[row.agent_name] ?? 0) + Number(row.tokens_burned)
    }
    burns = b ?? []
  }

  const badges = []
  if (total >= 1e9) badges.push('1B Club')
  if (total < 1e6) badges.push('Newcomer')
  if (burns.length >= 10) badges.push('Bot Graveyard')
  if (!badges.length) badges.push('Waster')

  return {
    username: user.username,
    created_at: user.created_at,
    total_tokens_wasted: total,
    agents,
    badges,
  }
}
