import { useParams } from 'react-router-dom'

export default function Remediation() {
  const { topicId } = useParams()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Remédiation</h1>
      <p className="text-sm text-gray-500">Notion {topicId} — à implémenter (Phase 7).</p>
    </div>
  )
}
