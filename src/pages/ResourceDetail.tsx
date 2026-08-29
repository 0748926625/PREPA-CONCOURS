import { useParams } from 'react-router-dom'

export default function ResourceDetail() {
  const { id } = useParams()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Ressource {id}</h1>
      <p className="text-sm text-gray-500">Détail de la ressource — à implémenter (Phase 2/3).</p>
    </div>
  )
}
