import { useParams } from 'react-router-dom'

export default function Quiz() {
  const { id } = useParams()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Quiz {id}</h1>
      <p className="text-sm text-gray-500">Expérience de QCM — à implémenter (Phase 5).</p>
    </div>
  )
}
