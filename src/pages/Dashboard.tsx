import { Link } from 'react-router-dom'

const ACTIONS = [
  { to: '/resources', label: 'Commencer à réviser', primary: true },
  { to: '/resources', label: 'Mes ressources' },
  { to: '/profile', label: 'Mes résultats' },
  { to: '/weaknesses', label: 'Mes lacunes' },
]

export default function Dashboard() {
  // TODO(phase 2+): remplacer par des données réelles issues de Supabase
  // (resources, quiz_sessions, mastery) une fois les tables créées.
  const stats = {
    resources: 0,
    quizzesDone: 0,
    averageScore: null as number | null,
    gapsCount: 0,
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Prépa Concours</h1>
      </header>

      <section className="rounded-2xl bg-blue-600 p-5 text-white">
        <p className="text-sm opacity-90">Votre progression</p>
        <p className="mt-1 text-4xl font-bold">
          {stats.averageScore === null ? '—' : `${stats.averageScore}%`}
        </p>
        <p className="mt-2 text-sm opacity-90">
          {stats.gapsCount > 0
            ? `${stats.gapsCount} notion${stats.gapsCount > 1 ? 's' : ''} nécessite${stats.gapsCount > 1 ? 'nt' : ''} une révision`
            : 'Ajoutez une ressource pour commencer'}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Ressources" value={stats.resources} />
        <StatCard label="QCM réalisés" value={stats.quizzesDone} />
      </section>

      <section className="space-y-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={`block rounded-xl px-4 py-3 text-center text-sm font-medium ${
              action.primary ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'
            }`}
          >
            {action.label}
          </Link>
        ))}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
