import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUnevaluatedTopics, listWeaknesses, type TopicMastery } from '../lib/mastery'
import type { Topic, Resource } from '../types'

export default function Weaknesses() {
  const [weaknesses, setWeaknesses] = useState<TopicMastery[] | null>(null)
  const [unevaluated, setUnevaluated] = useState<{ topic: Topic; resource: Resource }[]>([])

  useEffect(() => {
    listWeaknesses().then(setWeaknesses)
    listUnevaluatedTopics().then(setUnevaluated)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Mes lacunes</h1>

      {weaknesses && weaknesses.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Aucune lacune détectée pour le moment.
          <br />
          Réalisez un QCM pour voir apparaître vos notions à travailler.
        </div>
      )}

      {weaknesses && weaknesses.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Notions à revoir</h2>
          {weaknesses.map(({ topic, resource, mastery }) => (
            <div key={topic.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {mastery.status === 'a_revoir' ? '🔴' : '🟠'} {topic.name} — {mastery.mastery_score}%
                </p>
                <p className="text-xs text-gray-500">{resource.title}</p>
              </div>
              <Link
                to={`/remediation/${topic.id}`}
                className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Remédier
              </Link>
            </div>
          ))}
        </section>
      )}

      {unevaluated.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Jamais évaluées</h2>
          {unevaluated.map(({ topic, resource }) => (
            <Link
              key={topic.id}
              to={`/quiz/${resource.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-900">🔵 {topic.name}</p>
              <p className="text-xs text-gray-500">{resource.title} · pas encore testée</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
