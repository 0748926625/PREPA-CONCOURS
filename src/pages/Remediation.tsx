import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../lib/db'
import { getFailedQuestions, type AnsweredQuestion } from '../lib/quiz'
import { getMasteryByTopic, updateMasteryFromAnswers } from '../lib/mastery'
import QuestionRunner from '../components/QuestionRunner'
import AnswerReview from '../components/AnswerReview'
import { playSoft, playSuccess } from '../lib/sounds'
import { MASTERY_THRESHOLDS, type Mastery, type Question, type Resource, type Topic } from '../types'

type Phase = 'intro' | 'running' | 'done'

/**
 * Remédiation simple : on refait exactement les questions de la notion sur lesquelles la dernière
 * réponse était fausse (§9/§13), sans rien générer — pas besoin de clé IA, fonctionne hors-ligne.
 */
export default function Remediation() {
  const { topicId } = useParams<{ topicId: string }>()

  const [topic, setTopic] = useState<Topic | null | undefined>(undefined)
  const [resource, setResource] = useState<Resource | null>(null)
  const [failedQuestions, setFailedQuestions] = useState<Question[] | null>(null)

  const [phase, setPhase] = useState<Phase>('intro')
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [mastery, setMastery] = useState<Mastery | null>(null)

  useEffect(() => {
    if (!topicId) return
    db.topics.get(topicId).then(async (t) => {
      setTopic(t ?? null)
      if (t) setResource((await db.resources.get(t.resource_id)) ?? null)
    })
    getFailedQuestions(topicId).then(setFailedQuestions)
  }, [topicId])

  if (topic === undefined || failedQuestions === null) return null
  if (topic === null || !resource) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Notion introuvable.</p>
        <Link to="/weaknesses" className="text-sm text-blue-600">
          ← Retour à mes lacunes
        </Link>
      </div>
    )
  }

  async function handleComplete(newResults: AnsweredQuestion[]) {
    setResults(newResults)
    await updateMasteryFromAnswers(newResults.map((r) => ({ topic_id: topic!.id, is_correct: r.isCorrect })))
    setMastery((await getMasteryByTopic(topic!.id)) ?? null)
    setPhase('done')
    const correct = newResults.filter((r) => r.isCorrect).length
    ;(correct / newResults.length >= 0.7 ? playSuccess : playSoft)()
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">Remédiation</p>
        <h1 className="text-xl font-semibold text-gray-900">{topic.name}</h1>
      </div>

      {phase === 'intro' && failedQuestions.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Aucune question actuellement ratée sur cette notion — vous les avez toutes retrouvées.
          </p>
          <Link
            to="/weaknesses"
            className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white"
          >
            Retour à mes lacunes
          </Link>
        </div>
      )}

      {phase === 'intro' && failedQuestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {failedQuestions.length} question{failedQuestions.length > 1 ? 's' : ''} où vous vous êtes trompé{' '}
            sur cette notion. Refaites-les pour vérifier que c'est acquis.
          </p>
          <button
            type="button"
            onClick={() => setPhase('running')}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white"
          >
            Refaire ces questions
          </button>
        </div>
      )}

      {phase === 'running' && <QuestionRunner questions={failedQuestions} onComplete={handleComplete} completeLabel="Voir le résultat" />}

      {phase === 'done' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {results.filter((r) => r.isCorrect).length} / {results.length}
            </p>
            <p className="text-xs text-gray-500">bonnes réponses cette fois-ci</p>
            {mastery && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                Notion désormais : {MASTERY_THRESHOLDS[mastery.status].label} ({mastery.mastery_score}%)
              </p>
            )}
          </div>
          <AnswerReview results={results} />
          <Link
            to="/weaknesses"
            className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white"
          >
            Retour à mes lacunes
          </Link>
        </div>
      )}
    </div>
  )
}
