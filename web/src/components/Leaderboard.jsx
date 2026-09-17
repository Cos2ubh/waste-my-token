import { Link } from 'react-router-dom'
import BadgeDisplay from './BadgeDisplay'

function formatTokens(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export default function Leaderboard({ rows = [], loading = false, preview = false }) {
  if (loading) {
    return (
      <div className="space-y-2">
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
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-white/10">
            <th className="pb-3 pr-4 font-semibold w-10">#</th>
            <th className="pb-3 pr-4 font-semibold">User</th>
            <th className="pb-3 pr-4 font-semibold text-right">Tokens Wasted</th>
            {!preview && <th className="pb-3 pr-4 font-semibold hidden md:table-cell">Top Agent</th>}
            {!preview && <th className="pb-3 font-semibold hidden lg:table-cell">Badges</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.username}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 pr-4">
                <span className={`font-black ${RANK_COLORS[row.rank - 1] ?? 'text-slate-400'}`}>
                  {row.rank}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Link
                  to={`/u/${row.username}`}
                  className="font-semibold text-slate-100 hover:text-violet-400 transition-colors"
                >
                  {row.username}
                </Link>
              </td>
              <td className="py-3 pr-4 text-right font-mono text-blue-400 font-bold">
                {formatTokens(row.total_tokens_wasted)}
              </td>
              {!preview && (
                <td className="py-3 pr-4 text-slate-400 hidden md:table-cell text-xs font-mono">
                  {row.top_agent}
                </td>
              )}
              {!preview && (
                <td className="py-3 hidden lg:table-cell">
                  <BadgeDisplay badges={row.badges} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
