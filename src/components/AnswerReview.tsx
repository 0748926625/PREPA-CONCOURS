import type { AnsweredQuestion } from '../lib/quiz'
import type { Question } from '../types'

function optionText(question: Question, key: 'A' | 'B' | 'C' | 'D'): string {
  if (key === 'A') return question.option_a
  if (key === 'B') return question.option_b
  if (key === 'C') return question.option_c
  return question.option_d ?? ''
}

/** Récapitulatif détaillé d'une série de réponses : chaque question, ta réponse, la bonne réponse (§3/§15). */
export default function AnswerReview({ results }: { results: AnsweredQuestion[] }) {
  return (
    <div className="space-y-2">
      {results.map(({ question, selected, isCorrect }, i) => (
        <div key={question.id} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            {i + 1}. {question.question}
          </p>
          <p className={`mt-1.5 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓' : '✗'} Votre réponse : {selected}. {optionText(question, selected)}
          </p>
          {!isCorrect && (
            <p className="mt-0.5 text-sm text-green-700">
              Bonne réponse : {question.correct_answer}. {optionText(question, question.correct_answer)}
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">{question.explanation}</p>
        </div>
      ))}
    </div>
  )
}
