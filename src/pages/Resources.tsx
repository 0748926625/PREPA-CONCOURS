import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { countQuestions, listResources } from '../lib/resources'
import type { Resource } from '../types'

type ResourceRow = Resource & { questionCount: number }

export default function Resources() {
  const [resources, setResources] = useState<ResourceRow[] | null>(null)

  useEffect(() => {
    async function load() {
      const list = await listResources()
      const withCounts = await Promise.all(
        list.map(async (r) => ({ ...r, questionCount: await countQuestions(r.id) })),
      )
      setResources(withCounts)
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Mes ressources</h1>
        <Link to="/resources/new" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          + Ajouter
        </Link>
      </header>

      {resources && resources.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Aucune ressource pour le moment.
          <br />
          Ajoutez un PDF ou un texte pour générer vos premiers QCM.
        </div>
      )}

      <div className="space-y-3">
        {resources?.map((resource) => (
          <Link
            key={resource.id}
            to={`/resources/${resource.id}`}
            className="block rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{resource.title}</p>
                {resource.category && <p className="text-xs text-gray-500">{resource.category}</p>}
              </div>
              <span className="whitespace-nowrap text-xs text-gray-400">
                {new Date(resource.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {resource.questionCount} question{resource.questionCount !== 1 ? 's' : ''} générée
              {resource.questionCount !== 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
