import { useState } from 'react'
import type { AnsweredQuestion } from '../lib/quiz'
import type { Question } from '../types'

type Props = {
  questions: Question[]
  getTopicName?: (topicId: string) => string | undefined
  onComplete: (results: AnsweredQuestion[]) => void
  completing?: boolean
  completeLabel?: string
}

/** Fait passer une série de questions une par une, avec correction immédiate (§14). */
export default function QuestionRunner({
  questions,
  getTopicName,
  onComplete,
  completing = false,
  completeLabel = 'Voir mes résultats',
}: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [results, setResults] = useState<AnsweredQuestion[]>([])

  const current = questions[index]
  const isLast = index === questions.length - 1
  const topic = getTopicName?.(current.topic_id)

  function handleSelect(option: 'A' | 'B' | 'C' | 'D') {
    if (selected) return
    setSelected(option)
    setResults((prev) => [...prev, { question: current, selected: option, isCorrect: option === current.correct_answer }])
  }

  function handleNext() {
    if (isLast) {
      onComplete(results)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

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
          Question {index + 1} / {questions.length}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((index + (selected ? 1 : 0)) / questions.length) * 100}%` }}
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
          {topic && <p className="mt-1 text-xs text-gray-500">Notion évaluée : {topic}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!selected || completing}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {completing ? 'Enregistrement…' : isLast ? completeLabel : 'Question suivante'}
      </button>
    </div>
  )
}
