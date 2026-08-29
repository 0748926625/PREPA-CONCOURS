import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { countQuestions, deleteResource, getResource } from '../lib/resources'
import type { Resource } from '../types'

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resource, setResource] = useState<Resource | null | undefined>(undefined)
  const [questionCount, setQuestionCount] = useState(0)

  useEffect(() => {
    if (!id) return
    getResource(id).then((r) => setResource(r ?? null))
    countQuestions(id).then(setQuestionCount)
  }, [id])

  if (resource === undefined) return null

  if (resource === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Ressource introuvable.</p>
        <Link to="/resources" className="text-sm text-blue-600">
          ← Retour aux ressources
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm(`Supprimer « ${resource!.title} » et toutes ses questions ?`)) return
    await deleteResource(id)
    navigate('/resources')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{resource.title}</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {resource.category && <span>{resource.category}</span>}
          <span>· ajoutée le {new Date(resource.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          {resource.extracted_text.length.toLocaleString('fr-FR')} caractères de contenu ·{' '}
          {questionCount} question{questionCount !== 1 ? 's' : ''} générée{questionCount !== 1 ? 's' : ''}
        </p>
        <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm text-gray-700">
          {resource.extracted_text.slice(0, 600)}
          {resource.extracted_text.length > 600 ? '…' : ''}
        </p>
      </div>

      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white opacity-50"
      >
        {questionCount > 0 ? 'Réviser' : 'Générer des QCM (bientôt)'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600"
      >
        Supprimer cette ressource
      </button>
    </div>
  )
}
