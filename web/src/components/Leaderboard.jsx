import { Link } from 'react-router-dom'
import BadgeDisplay from './BadgeDisplay'

function formatTokens(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

const RANK_GLOW = [
  { color: '#facc15', shadow: '0 0 12px rgba(250,204,21,0.7), 0 0 24px rgba(250,204,21,0.3)' },
  { color: '#cbd5e1', shadow: '0 0 10px rgba(203,213,225,0.6), 0 0 20px rgba(203,213,225,0.2)' },
  { color: '#d97706', shadow: '0 0 10px rgba(217,119,6,0.6), 0 0 20px rgba(217,119,6,0.2)' },
]

const ROW_ACCENT = ['#facc15', '#cbd5e1', '#d97706']

export default function Leaderboard({ rows = [], loading = false, preview = false }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: preview ? 5 : 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return (
      <p className="text-center text-slate-500 py-10">
        No data yet — be the first to waste some tokens.
      </p>
    )
  }

  const data = preview ? rows.slice(0, 5) : rows

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full" style={{ fontSize: '0.875rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', width: 64 }}>#</th>
            <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>User</th>
            <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Tokens Wasted</th>
            {!preview && <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }} className="hidden md:table-cell">Top Agent</th>}
            {!preview && <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }} className="hidden lg:table-cell">Badges</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const accentColor = ROW_ACCENT[row.rank - 1] ?? null
            const rankStyle = RANK_GLOW[row.rank - 1] ?? { color: '#475569', shadow: 'none' }
            return (
              <tr
                key={row.username}
                className="lb-row"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td style={{ padding: '16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                      background: accentColor ?? 'transparent',
                      opacity: accentColor ? 0.7 : 0,
                      boxShadow: accentColor ? `0 0 8px ${accentColor}80` : 'none',
                    }} />
                    <span style={{ fontWeight: 900, color: rankStyle.color, textShadow: rankStyle.shadow, fontSize: '0.95rem', minWidth: 20 }}>
                      {row.rank}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px 16px' }}>
                  <Link
                    to={`/u/${row.username}`}
                    className="lb-username"
                    style={{ fontWeight: 600, color: '#e2e8f0', textDecoration: 'none' }}
                  >
                    {row.username}
                  </Link>
                </td>
                <td style={{ padding: '16px 16px', textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', color: 'transparent',
                  }}>
                    {formatTokens(row.total_tokens_wasted)}
                  </span>
                </td>
                {!preview && (
                  <td style={{ padding: '16px 16px' }} className="hidden md:table-cell">
                    <span style={{
                      fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '3px 8px', display: 'inline-block',
                    }}>
                      {row.top_agent}
                    </span>
                  </td>
                )}
                {!preview && (
                  <td style={{ padding: '16px 16px' }} className="hidden lg:table-cell">
                    <BadgeDisplay badges={row.badges} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
