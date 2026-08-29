import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { countQuestions, deleteResource, getResource } from '../lib/resources'
import { analyzeResource, listTopics } from '../lib/ai/analyzeResource'
import { hasAiKey } from '../lib/aiSettings'
import type { Resource, Topic } from '../types'

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resource, setResource] = useState<Resource | null | undefined>(undefined)
  const [questionCount, setQuestionCount] = useState(0)
  const [topics, setTopics] = useState<Topic[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getResource(id).then((r) => setResource(r ?? null))
    countQuestions(id).then(setQuestionCount)
    listTopics(id).then(setTopics)
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

  async function handleAnalyze() {
    if (!resource) return
    if (!hasAiKey()) {
      setError('Configurez votre clé API IA dans Réglages avant de lancer une analyse.')
      return
    }
    setError(null)
    setAnalyzing(true)
    try {
      const result = await analyzeResource(resource)
      setTopics(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue lors de l'analyse.")
    } finally {
      setAnalyzing(false)
    }
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

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            Notions identifiées {topics.length > 0 && `(${topics.length})`}
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {analyzing ? 'Analyse…' : topics.length > 0 ? 'Ré-analyser' : "Analyser avec l'IA"}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {topics.length > 0 && (
          <ul className="mt-3 space-y-2">
            {topics.map((topic) => (
              <li key={topic.id} className="rounded-lg bg-gray-50 p-2.5">
                <p className="text-sm font-medium text-gray-800">{topic.name}</p>
                <p className="text-xs text-gray-500">{topic.description}</p>
              </li>
            ))}
          </ul>
        )}
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
