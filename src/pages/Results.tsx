import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSessionResults, type SessionResults } from '../lib/quiz'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<SessionResults | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getSessionResults(id).then(setResults)
  }, [id])

  if (results === undefined) return null

  if (results === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Session introuvable.</p>
        <Link to="/resources" className="text-sm text-blue-600">
          ← Retour aux ressources
        </Link>
      </div>
    )
  }

  const { session, strengths, weaknesses } = results
  const percent = Math.round((session.score / session.total_questions) * 100)
  const wrong = session.total_questions - session.score

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-900">
          {session.score} / {session.total_questions}
        </p>
        <p className="mt-1 text-lg font-medium text-blue-600">{percent}%</p>
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <span className="text-green-700">✓ {session.score} bonne{session.score !== 1 ? 's' : ''} réponse{session.score !== 1 ? 's' : ''}</span>
        <span className="text-red-700">✗ {wrong} mauvaise{wrong !== 1 ? 's' : ''} réponse{wrong !== 1 ? 's' : ''}</span>
      </div>

      {strengths.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-900">Tes points forts</p>
          <ul className="mt-2 space-y-1">
            {strengths.map((name) => (
              <li key={name} className="text-sm text-green-700">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-900">À revoir</p>
          <ul className="mt-2 space-y-1">
            {weaknesses.map((name) => (
              <li key={name} className="text-sm text-red-700">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 ? (
        <Link
          to="/weaknesses"
          className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white"
        >
          Corriger mes lacunes
        </Link>
      ) : (
        <Link
          to={`/resources/${session.resource_id}`}
          className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white"
        >
          Retour à la ressource
        </Link>
      )}
    </div>
  )
}
