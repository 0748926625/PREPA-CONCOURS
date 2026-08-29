import { useState } from 'react'
import type { AnsweredQuestion } from '../lib/quiz'
import { playClick } from '../lib/sounds'
import type { Question } from '../types'

type Props = {
  questions: Question[]
  onComplete: (results: AnsweredQuestion[]) => void
  completing?: boolean
  completeLabel?: string
}

/**
 * Fait défiler une série de questions une par une avec des boutons de choix (§14).
 * Pas de correction pendant le parcours : le résultat détaillé s'affiche à la fin (§3/§15).
 */
export default function QuestionRunner({ questions, onComplete, completing = false, completeLabel = 'Voir mes résultats' }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [results, setResults] = useState<AnsweredQuestion[]>([])

  const current = questions[index]
  const isLast = index === questions.length - 1

  function handleSelect(option: 'A' | 'B' | 'C' | 'D') {
    setSelected(option)
    playClick()
  }

  function handleNext() {
    if (!selected) return
    const updatedResults = [
      ...results,
      { question: current, selected, isCorrect: selected === current.correct_answer },
    ]
    if (isLast) {
      onComplete(updatedResults)
      return
    }
    setResults(updatedResults)
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
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
      </div>

      <p className="text-base font-medium text-gray-900">{current.question}</p>

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => handleSelect(opt.key)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
              opt.key === selected
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            <span className="font-medium">{opt.key}.</span> {opt.text}
          </button>
        ))}
      </div>

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
