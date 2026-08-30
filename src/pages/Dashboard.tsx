import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import PerformanceChart from '../components/PerformanceChart'
import type { QuizSession } from '../types'

const SECONDARY_ACTIONS = [
  { to: '/resources', label: 'Mes ressources' },
  { to: '/weaknesses', label: 'Mes lacunes' },
]

type Stats = {
  resources: number
  quizzesDone: number
  averageScore: number | null
  gapsCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    resources: 0,
    quizzesDone: 0,
    averageScore: null,
    gapsCount: 0,
  })
  const [sessions, setSessions] = useState<QuizSession[]>([])

  useEffect(() => {
    async function load() {
      const [resources, sessions, masteries] = await Promise.all([
        db.resources.count(),
        db.quizSessions.toArray(),
        db.mastery.toArray(),
      ])

      const averageScore =
        sessions.length === 0
          ? null
          : Math.round(
              (sessions.reduce((sum, s) => sum + s.score / s.total_questions, 0) / sessions.length) * 100,
            )

      const gapsCount = masteries.filter((m) => m.status === 'a_revoir' || m.status === 'fragile').length

      setStats({ resources, quizzesDone: sessions.length, averageScore, gapsCount })
      setSessions(sessions)
    }
    load()
  }, [])

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

      <Link
        to="/qcm"
        className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white"
      >
        Commencer à réviser
      </Link>

      <PerformanceChart sessions={sessions} />

      <section className="space-y-2">
        {SECONDARY_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-gray-800 shadow-sm"
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
