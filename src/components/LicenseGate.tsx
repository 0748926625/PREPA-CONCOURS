import { useEffect, useState, type ReactNode } from 'react'
import { checkLicense, getStoredLicenseKey, isLicenseConfigured } from '../lib/license'

type Status = 'checking' | 'locked' | 'unlocked'

export default function LicenseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLicenseConfigured()) {
      setStatus('unlocked')
      return
    }
    const stored = getStoredLicenseKey()
    if (!stored) {
      setStatus('locked')
      return
    }
    checkLicense(stored).then((result) => {
      setStatus(result === 'valid' ? 'unlocked' : 'locked')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await checkLicense(input)
    setSubmitting(false)
    if (result === 'valid') {
      setStatus('unlocked')
    } else if (result === 'invalid') {
      setError('Clé invalide, déjà utilisée sur un autre appareil, ou déjà attribuée ailleurs.')
    } else {
      setError('Impossible de vérifier la clé pour le moment. Réessayez plus tard.')
    }
  }

  if (status === 'checking') return null

  if (status === 'locked') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">Prépa Concours</h1>
          <p className="mb-8 text-center text-sm text-gray-500">Entrez votre clé d'activation pour continuer.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Clé d'activation"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Vérification…' : 'Activer'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
