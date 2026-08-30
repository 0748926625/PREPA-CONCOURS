import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRevisableResources, type RevisableResource } from '../lib/resources'

// Une couleur d'accent différente par carte, dans l'ordre des ressources (stable, pas aléatoire).
const CARD_COLORS = [
  { border: 'border-blue-400', bg: 'bg-blue-50/60' },
  { border: 'border-violet-400', bg: 'bg-violet-50/60' },
  { border: 'border-teal-400', bg: 'bg-teal-50/60' },
  { border: 'border-amber-400', bg: 'bg-amber-50/60' },
  { border: 'border-rose-400', bg: 'bg-rose-50/60' },
  { border: 'border-emerald-400', bg: 'bg-emerald-50/60' },
]

// Fonds pleins et nettement distincts pour les boutons de concours (premier niveau de choix).
const GROUP_COLORS = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-teal-600',
  'bg-amber-600',
  'bg-rose-600',
]

const CONCOURS_GROUPS = ['CAFOP', 'INFAS', 'Fonction publique'] as const
const OTHER_GROUP = 'Autres'

function groupOf(resource: RevisableResource): string {
  const title = resource.title.toUpperCase()
  if (title.includes('CAFOP')) return 'CAFOP'
  if (title.includes('INFAS')) return 'INFAS'
  if (title.includes('FONCTION PUBLIQUE')) return 'Fonction publique'
  return OTHER_GROUP
}

export default function QcmMenu() {
  const [resources, setResources] = useState<RevisableResource[] | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  useEffect(() => {
    listRevisableResources().then(setResources)
  }, [])

  if (resources && resources.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">QCM</h1>
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Aucun QCM disponible pour le moment.
          <br />
          Ajoutez une ressource et générez ses QCM depuis "Mes ressources".
        </div>
      </div>
    )
  }

  const groupNames = [...CONCOURS_GROUPS, OTHER_GROUP].filter((name) =>
    resources?.some((r) => groupOf(r) === name),
  )

  if (!selectedGroup) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">QCM</h1>
        <p className="text-sm text-gray-500">Choisissez un concours.</p>

        <div className="space-y-3">
          {groupNames.map((name, index) => {
            const bg = GROUP_COLORS[index % GROUP_COLORS.length]
            const groupResources = resources?.filter((r) => groupOf(r) === name) ?? []
            const totalQuestions = groupResources.reduce((sum, r) => sum + r.questionCount, 0)
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedGroup(name)}
                className={`block w-full rounded-xl p-4 text-left text-white shadow-sm ${bg}`}
              >
                <p className="font-medium">{name}</p>
                <p className="mt-2 text-xs text-white/80">
                  {groupResources.length} sujet{groupResources.length !== 1 ? 's' : ''} · {totalQuestions} question
                  {totalQuestions !== 1 ? 's' : ''} au total
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const groupResources = resources?.filter((r) => groupOf(r) === selectedGroup) ?? []

  return (
    <div className="space-y-4">
      <div>
        <button type="button" onClick={() => setSelectedGroup(null)} className="text-sm text-blue-600">
          ← Concours
        </button>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">{selectedGroup}</h1>
        <p className="text-sm text-gray-500">Choisissez une ressource pour réviser immédiatement.</p>
      </div>

      <div className="space-y-3">
        {groupResources.map((resource, index) => {
          const color = CARD_COLORS[index % CARD_COLORS.length]
          return (
            <Link
              key={resource.id}
              to={`/quiz/${resource.id}`}
              className={`block rounded-xl border-l-4 p-4 shadow-sm ${color.border} ${color.bg}`}
            >
              <p className="font-medium text-gray-900">{resource.title}</p>
              {resource.category && <p className="text-xs text-gray-500">{resource.category}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {resource.questionCount} question{resource.questionCount !== 1 ? 's' : ''} disponible
                {resource.questionCount !== 1 ? 's' : ''}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
