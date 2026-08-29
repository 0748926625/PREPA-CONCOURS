import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteResource, getResource } from '../lib/resources'
import { analyzeResource, listTopics } from '../lib/ai/analyzeResource'
import { generateQuestions, listQuestions } from '../lib/ai/generateQuestions'
import { hasAiKey } from '../lib/aiSettings'
import type { Question, Resource, Topic } from '../types'

const DIFFICULTY_LABEL: Record<Question['difficulty'], string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resource, setResource] = useState<Resource | null | undefined>(undefined)
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getResource(id).then((r) => setResource(r ?? null))
    listTopics(id).then(setTopics)
    listQuestions(id).then(setQuestions)
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
      setAnalyzeError('Configurez votre clé API IA dans Réglages avant de lancer une analyse.')
      return
    }
    setAnalyzeError(null)
    setAnalyzing(true)
    try {
      const result = await analyzeResource(resource)
      setTopics(result)
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "Erreur inconnue lors de l'analyse.")
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerate() {
    if (!resource) return
    if (!hasAiKey()) {
      setGenerateError('Configurez votre clé API IA dans Réglages avant de générer des QCM.')
      return
    }
    setGenerateError(null)
    setGenerating(true)
    try {
      const result = await generateQuestions(resource, topics)
      setQuestions(result)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Erreur inconnue lors de la génération.')
    } finally {
      setGenerating(false)
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
          {questions.length} question{questions.length !== 1 ? 's' : ''} générée
          {questions.length !== 1 ? 's' : ''}
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

        {analyzeError && <p className="mt-2 text-sm text-red-600">{analyzeError}</p>}

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

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            Questions générées {questions.length > 0 && `(${questions.length})`}
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || topics.length === 0}
            title={topics.length === 0 ? "Analysez d'abord le document" : undefined}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {generating ? 'Génération…' : questions.length > 0 ? 'Régénérer' : 'Générer des QCM'}
          </button>
        </div>

        {topics.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">Analysez d'abord le document pour identifier ses notions.</p>
        )}
        {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}

        {questions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg bg-gray-50 p-2.5">
                <p className="text-sm text-gray-800">{q.question}</p>
                <p className="mt-1 text-xs text-gray-500">{DIFFICULTY_LABEL[q.difficulty]}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {questions.length > 0 ? (
        <Link
          to={`/quiz/${resource.id}`}
          className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white"
        >
          Réviser
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white opacity-50"
        >
          Générez des QCM pour pouvoir réviser
        </button>
      )}

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
