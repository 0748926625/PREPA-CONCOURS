import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../lib/db'
import { hasAiKey } from '../lib/aiSettings'
import { getRecentFailedAttempts, type AnsweredQuestion } from '../lib/quiz'
import { getMasteryByTopic, updateMasteryFromAnswers } from '../lib/mastery'
import { generateRemediationContent, generateVerificationQuestions, type RemediationContent } from '../lib/ai/generateRemediation'
import QuestionRunner from '../components/QuestionRunner'
import { MASTERY_THRESHOLDS, type Mastery, type Question, type Resource, type Topic } from '../types'

type Phase = 'intro' | 'exercises' | 'exercises-done' | 'verifying' | 'verification' | 'done'

export default function Remediation() {
  const { topicId } = useParams<{ topicId: string }>()

  const [topic, setTopic] = useState<Topic | null | undefined>(undefined)
  const [resource, setResource] = useState<Resource | null>(null)

  const [phase, setPhase] = useState<Phase>('intro')
  const [content, setContent] = useState<RemediationContent | null>(null)
  const [exerciseResults, setExerciseResults] = useState<AnsweredQuestion[]>([])
  const [verificationQuestions, setVerificationQuestions] = useState<Question[]>([])
  const [verificationResults, setVerificationResults] = useState<AnsweredQuestion[]>([])
  const [mastery, setMastery] = useState<Mastery | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) return
    db.topics.get(topicId).then(async (t) => {
      setTopic(t ?? null)
      if (t) setResource((await db.resources.get(t.resource_id)) ?? null)
    })
  }, [topicId])

  if (topic === undefined) return null
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

  async function handleStart() {
    if (!hasAiKey()) {
      setError('Configurez votre clé API IA dans Réglages avant de lancer une remédiation.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const failedAttempts = await getRecentFailedAttempts(topic!.id)
      const result = await generateRemediationContent(resource!, topic!, failedAttempts)
      setContent(result)
      setPhase('exercises')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.')
    } finally {
      setLoading(false)
    }
  }

  function handleExercisesComplete(results: AnsweredQuestion[]) {
    setExerciseResults(results)
    setPhase('exercises-done')
  }

  async function handleStartVerification() {
    setError(null)
    setPhase('verifying')
    try {
      const questions = await generateVerificationQuestions(
        resource!,
        topic!,
        content!.exercises.map((q) => q.question),
      )
      setVerificationQuestions(questions)
      setPhase('verification')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.')
      setPhase('exercises-done')
    }
  }

  async function handleVerificationComplete(results: AnsweredQuestion[]) {
    setVerificationResults(results)
    await updateMasteryFromAnswers(results.map((r) => ({ topic_id: topic!.id, is_correct: r.isCorrect })))
    setMastery((await getMasteryByTopic(topic!.id)) ?? null)
    setPhase('done')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">Remédiation</p>
        <h1 className="text-xl font-semibold text-gray-900">{topic.name}</h1>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {phase === 'intro' && !content && (
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Préparation…' : 'Générer ma remédiation'}
        </button>
      )}

      {content && (phase === 'exercises' || phase === 'exercises-done') && (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">Rappel</p>
            <p className="mt-1 text-sm text-gray-700">{content.reminder}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">Explication</p>
            <p className="mt-1 text-sm text-gray-700">{content.explanation}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">Exemple</p>
            <p className="mt-1 text-sm text-gray-700">{content.example}</p>
          </div>
        </div>
      )}

      {phase === 'exercises' && content && (
        <QuestionRunner
          questions={content.exercises}
          onComplete={handleExercisesComplete}
          completeLabel="Terminer les exercices"
        />
      )}

      {phase === 'exercises-done' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {exerciseResults.filter((r) => r.isCorrect).length} / {exerciseResults.length}
            </p>
            <p className="text-xs text-gray-500">bonnes réponses aux exercices</p>
          </div>
          <button
            type="button"
            onClick={handleStartVerification}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white"
          >
            Vérifier ma compréhension
          </button>
        </div>
      )}

      {phase === 'verifying' && <p className="text-sm text-gray-500">Préparation de la vérification…</p>}

      {phase === 'verification' && verificationQuestions.length > 0 && (
        <QuestionRunner
          questions={verificationQuestions}
          onComplete={handleVerificationComplete}
          completeLabel="Voir le résultat"
        />
      )}

      {phase === 'done' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">
              {verificationResults.filter((r) => r.isCorrect).length} / {verificationResults.length}
            </p>
            <p className="text-xs text-gray-500">bonnes réponses à la vérification</p>
            {mastery && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                Notion désormais : {MASTERY_THRESHOLDS[mastery.status].label} ({mastery.mastery_score}%)
              </p>
            )}
          </div>
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
