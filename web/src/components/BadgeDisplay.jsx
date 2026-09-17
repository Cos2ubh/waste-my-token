const BADGE_STYLES = {
  '1B Club': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  'Tarpit King': 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  'Bot Graveyard': 'bg-red-500/20 text-red-300 border border-red-500/40',
  Newcomer: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  Waster: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
}

const BADGE_ICONS = {
  '1B Club': '💀',
  'Tarpit King': '🕳️',
  'Bot Graveyard': '☠️',
  Newcomer: '🌱',
  Waster: '⚡',
}

export default function BadgeDisplay({ badges = [], size = 'sm' }) {
  const textClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-0.5'
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b}
          className={`rounded-full font-semibold ${textClass} ${BADGE_STYLES[b] ?? BADGE_STYLES.Waster}`}
        >
          {BADGE_ICONS[b] ?? '⚡'} {b}
        </span>
      ))}
    </div>
  )
}
