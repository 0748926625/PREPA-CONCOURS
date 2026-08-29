import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRevisableResources, type RevisableResource } from '../lib/resources'

export default function QcmMenu() {
  const [resources, setResources] = useState<RevisableResource[] | null>(null)

  useEffect(() => {
    listRevisableResources().then(setResources)
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">QCM</h1>
      <p className="text-sm text-gray-500">Choisissez une ressource pour réviser immédiatement.</p>

      {resources && resources.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Aucun QCM disponible pour le moment.
          <br />
          Ajoutez une ressource et générez ses QCM depuis "Mes ressources".
        </div>
      )}

      <div className="space-y-3">
        {resources?.map((resource) => (
          <Link
            key={resource.id}
            to={`/quiz/${resource.id}`}
            className="block rounded-xl bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-gray-900">{resource.title}</p>
            {resource.category && <p className="text-xs text-gray-500">{resource.category}</p>}
            <p className="mt-2 text-xs text-gray-500">
              {resource.questionCount} question{resource.questionCount !== 1 ? 's' : ''} disponible
              {resource.questionCount !== 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
