type SessionPoint = { created_at: string; score: number; total_questions: number }

const WIDTH = 300
const HEIGHT = 110
const PADDING = 10
const MAX_POINTS = 20

/** Courbe d'évolution du score (%) au fil des QCM réalisés, sans dépendance externe (petit SVG inline). */
export default function PerformanceChart({ sessions }: { sessions: SessionPoint[] }) {
  const ordered = [...sessions]
    .filter((s) => s.total_questions > 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-MAX_POINTS)
    .map((s) => Math.round((s.score / s.total_questions) * 100))

  if (ordered.length < 2) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">Évolution de vos résultats</p>
        <p className="mt-2 text-xs text-gray-500">
          Réalisez au moins deux QCM pour voir apparaître votre courbe de progression.
        </p>
      </div>
    )
  }

  const stepX = (WIDTH - PADDING * 2) / (ordered.length - 1)
  const toY = (v: number) => HEIGHT - PADDING - (v / 100) * (HEIGHT - PADDING * 2)
  const coords = ordered.map((v, i) => ({ x: PADDING + i * stepX, y: toY(v), v }))

  const first = ordered[0]
  const last = ordered[ordered.length - 1]
  const trendUp = last >= first

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Évolution de vos résultats</p>
        <p className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↗' : '↘'} {last}%
        </p>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-3 w-full" preserveAspectRatio="none">
        <polyline
          points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="#2563eb" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>Plus ancien</span>
        <span>Plus récent</span>
      </div>
    </div>
  )
}
