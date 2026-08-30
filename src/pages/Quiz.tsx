import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../lib/db'
import { saveQuizSession, type AnsweredQuestion } from '../lib/quiz'
import QuestionRunner from '../components/QuestionRunner'
import type { Question, Resource } from '../types'

const QUICK_MODE_SIZE = 10

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Regroupe les questions par notion (toutes celles d'une rubrique se suivent) pour la révision complète. */
function groupByTopic(questions: Question[]): Question[] {
  const byTopic = new Map<string, Question[]>()
  for (const q of questions) {
    const group = byTopic.get(q.topic_id) ?? []
    group.push(q)
    byTopic.set(q.topic_id, group)
  }
  return [...byTopic.values()].flat()
}

export default function Quiz() {
  const { id: resourceId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [resource, setResource] = useState<Resource | null | undefined>(undefined)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [set, setSet] = useState<Question[] | null>(null) // null tant que le mode n'est pas choisi
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!resourceId) return
    db.resources.get(resourceId).then((r) => setResource(r ?? null))
    db.questions.where('resource_id').equals(resourceId).toArray().then(setAllQuestions)
  }, [resourceId])

  function startQuiz(mode: 'quick' | 'complete') {
    const pool = mode === 'quick' ? shuffle(allQuestions).slice(0, QUICK_MODE_SIZE) : groupByTopic(allQuestions)
    setSet(pool)
  }

  async function handleComplete(results: AnsweredQuestion[]) {
    if (!resourceId) return
    setSaving(true)
    const session = await saveQuizSession(resourceId, results)
    setSaving(false)
    navigate(`/results/${session.id}`)
  }

  if (resource === undefined) return null
  if (resource === null) return <p className="text-sm text-gray-500">Ressource introuvable.</p>

  if (allQuestions.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-gray-900">{resource.title}</h1>
        <p className="text-sm text-gray-500">
          Aucune question générée pour cette ressource. Retournez sur sa page pour en générer.
        </p>
      </div>
    )
  }

  if (!set) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">{resource.title}</h1>
        <p className="text-sm text-gray-500">Choisissez un mode de révision.</p>
        <button
          type="button"
          onClick={() => startQuiz('quick')}
          className="w-full rounded-xl bg-white p-4 text-left shadow-sm"
        >
          <p className="text-sm font-medium text-gray-900">Révision rapide</p>
          <p className="text-xs text-gray-500">
            {Math.min(QUICK_MODE_SIZE, allQuestions.length)} questions aléatoires
          </p>
        </button>
        <button
          type="button"
          onClick={() => startQuiz('complete')}
          className="w-full rounded-xl bg-white p-4 text-left shadow-sm"
        >
          <p className="text-sm font-medium text-gray-900">Révision complète</p>
          <p className="text-xs text-gray-500">Les {allQuestions.length} questions disponibles</p>
        </button>
      </div>
    )
  }

  return <QuestionRunner questions={set} onComplete={handleComplete} completing={saving} />
}
