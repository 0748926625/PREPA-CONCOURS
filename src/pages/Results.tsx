import { useParams } from 'react-router-dom'

export default function Results() {
  const { id } = useParams()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Résultats {id}</h1>
      <p className="text-sm text-gray-500">Résultats de session — à implémenter (Phase 5/6).</p>
    </div>
  )
}
