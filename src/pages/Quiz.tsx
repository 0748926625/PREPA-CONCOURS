import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../lib/db'
import { saveQuizSession, type AnsweredQuestion } from '../lib/quiz'
import type { Question, Resource, Topic } from '../types'

const QUICK_MODE_SIZE = 10

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Quiz() {
  const { id: resourceId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [resource, setResource] = useState<Resource | null | undefined>(undefined)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [topicsById, setTopicsById] = useState<Map<string, Topic>>(new Map())

  const [set, setSet] = useState<Question[] | null>(null) // null tant que le mode n'est pas choisi
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!resourceId) return
    db.resources.get(resourceId).then((r) => setResource(r ?? null))
    db.questions
      .where('resource_id')
      .equals(resourceId)
      .toArray()
      .then(async (qs) => {
        setAllQuestions(qs)
        const topics = await db.topics.bulkGet([...new Set(qs.map((q) => q.topic_id))])
        setTopicsById(new Map(topics.filter((t): t is Topic => !!t).map((t) => [t.id, t])))
      })
  }, [resourceId])

  const current = set?.[index] ?? null
  const isLast = set !== null && index === set.length - 1

  function startQuiz(mode: 'quick' | 'complete') {
    const pool = mode === 'quick' ? shuffle(allQuestions).slice(0, QUICK_MODE_SIZE) : shuffle(allQuestions)
    setSet(pool)
    setIndex(0)
    setSelected(null)
    setResults([])
  }

  function handleSelect(option: 'A' | 'B' | 'C' | 'D') {
    if (selected || !current) return
    setSelected(option)
    setResults((prev) => [...prev, { question: current, selected: option, isCorrect: option === current.correct_answer }])
  }

  async function handleNext() {
    if (!resourceId) return
    if (isLast) {
      setSaving(true)
      const session = await saveQuizSession(resourceId, results)
      setSaving(false)
      navigate(`/results/${session.id}`)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
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

  if (!current) return null

  const topic = topicsById.get(current.topic_id)
  const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: current.option_a },
    { key: 'B', text: current.option_b },
    { key: 'C', text: current.option_c },
    ...(current.option_d ? [{ key: 'D' as const, text: current.option_d }] : []),
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">
          Question {index + 1} / {set.length}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((index + (selected ? 1 : 0)) / set.length) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-base font-medium text-gray-900">{current.question}</p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isCorrectOption = opt.key === current.correct_answer
          const isSelected = opt.key === selected
          let style = 'border-gray-300 bg-white text-gray-800'
          if (selected) {
            if (isCorrectOption) style = 'border-green-500 bg-green-50 text-green-800'
            else if (isSelected) style = 'border-red-500 bg-red-50 text-red-800'
            else style = 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button
              key={opt.key}
              type="button"
              disabled={!!selected}
              onClick={() => handleSelect(opt.key)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${style}`}
            >
              <span className="font-medium">{opt.key}.</span> {opt.text}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-xl bg-gray-50 p-4">
          <p className={`text-sm font-medium ${selected === current.correct_answer ? 'text-green-700' : 'text-red-700'}`}>
            {selected === current.correct_answer ? '✓ Bonne réponse' : '✗ Mauvaise réponse'}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Bonne réponse : {current.correct_answer} — {current.explanation}
          </p>
          {topic && <p className="mt-1 text-xs text-gray-500">Notion évaluée : {topic.name}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!selected || saving}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : isLast ? 'Voir mes résultats' : 'Question suivante'}
      </button>
    </div>
  )
}
