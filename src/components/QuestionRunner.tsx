import { useEffect, useState } from 'react'
import type { AnsweredQuestion } from '../lib/quiz'
import { playCorrect, playIncorrect } from '../lib/sounds'
import { isSpeechEnabled, setSpeechEnabled, speak, speakSequence, stopSpeaking } from '../lib/speech'
import type { Question } from '../types'

type Props = {
  questions: Question[]
  onComplete: (results: AnsweredQuestion[]) => void
  completing?: boolean
  completeLabel?: string
}

const OPTION_IDLE: Record<'A' | 'B' | 'C' | 'D', { border: string; badge: string }> = {
  A: { border: 'border-blue-200 bg-blue-50/60 text-gray-800', badge: 'bg-blue-600' },
  B: { border: 'border-violet-200 bg-violet-50/60 text-gray-800', badge: 'bg-violet-600' },
  C: { border: 'border-teal-200 bg-teal-50/60 text-gray-800', badge: 'bg-teal-600' },
  D: { border: 'border-amber-200 bg-amber-50/60 text-gray-800', badge: 'bg-amber-600' },
}

/**
 * Fait défiler une série de questions une par une avec des boutons de choix (§14).
 * Correction immédiate à chaque réponse (visuelle + sonore), et le résultat détaillé
 * complet reste consultable à la fin (§15).
 */
export default function QuestionRunner({ questions, onComplete, completing = false, completeLabel = 'Voir mes résultats' }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [results, setResults] = useState<AnsweredQuestion[]>([])
  const [voiceOn, setVoiceOn] = useState(isSpeechEnabled)
  const [speaking, setSpeaking] = useState(false) // vrai pendant l'appréciation + la lecture du commentaire

  const current = questions[index]
  const isLast = index === questions.length - 1

  useEffect(() => {
    setSpeaking(false)
    stopSpeaking()
    speak(current.question)
    return stopSpeaking
  }, [current.id])

  function toggleVoice() {
    const next = !voiceOn
    setVoiceOn(next)
    setSpeechEnabled(next)
    if (!next) stopSpeaking()
  }

  function handleSelect(option: 'A' | 'B' | 'C' | 'D') {
    if (selected) return
    setSelected(option)
    const isCorrect = option === current.correct_answer
    ;(isCorrect ? playCorrect : playIncorrect)()
    stopSpeaking()
    setSpeaking(true)
    speakSequence([isCorrect ? 'Bonne réponse.' : 'Mauvaise réponse.', current.explanation]).then(() =>
      setSpeaking(false),
    )
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
    <div className="flex min-h-[calc(100svh-11rem)] flex-col justify-center gap-6">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            Question {index + 1} / {questions.length}
          </p>
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voiceOn ? 'Couper la lecture vocale' : 'Activer la lecture vocale'}
            className="text-lg"
          >
            {voiceOn ? '🔊' : '🔇'}
          </button>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-teal-500 transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <p className="text-xl font-semibold leading-snug text-gray-900">{current.question}</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const isCorrectOption = opt.key === current.correct_answer
          const isSelected = opt.key === selected
          const idle = OPTION_IDLE[opt.key]

          let border = idle.border
          let badge = idle.badge
          let anim = ''
          if (selected) {
            if (isCorrectOption) {
              border = 'border-green-600 bg-green-100 text-green-900'
              badge = 'bg-green-600'
              anim = 'anim-pop-correct'
            } else if (isSelected) {
              border = 'border-red-600 bg-red-100 text-red-900'
              badge = 'bg-red-600'
              anim = 'anim-shake-incorrect'
            } else {
              border = 'border-gray-200 bg-white text-gray-400'
              badge = 'bg-gray-300'
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={!!selected}
              onClick={() => handleSelect(opt.key)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left text-base transition-colors ${border} ${anim}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${badge}`}
              >
                {selected ? (isCorrectOption ? '✓' : isSelected ? '✗' : opt.key) : opt.key}
              </span>
              <span>{opt.text}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className={`text-base font-semibold ${selected === current.correct_answer ? 'text-green-700' : 'text-red-700'}`}>
            {selected === current.correct_answer ? '✓ Bonne réponse' : '✗ Mauvaise réponse'}
          </p>
          <p className="mt-1 text-sm text-gray-700">{current.explanation}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected || speaking || completing}
          aria-label={isLast ? completeLabel : 'Question suivante'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-sm transition-opacity disabled:opacity-30"
        >
          {completing ? '…' : isLast ? '🏁' : '▶️'}
        </button>
        <p className="text-xs text-gray-400">
          {completing ? 'Enregistrement…' : speaking ? 'Écoutez…' : isLast ? completeLabel : 'Question suivante'}
        </p>
      </div>
    </div>
  )
}
