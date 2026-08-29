import { useEffect, useState, type ReactNode } from 'react'
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL_URL,
  CONTACT_WHATSAPP_URL,
  checkLicense,
  getStoredLicenseKey,
  getTrialRemainingMs,
  isLicenseConfigured,
} from '../lib/license'

type Status = 'checking' | 'trial' | 'locked' | 'unlocked'

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
    if (stored) {
      checkLicense(stored).then((result) => {
        setStatus(result === 'valid' ? 'unlocked' : 'locked')
      })
      return
    }

    const remaining = getTrialRemainingMs()
    if (remaining <= 0) {
      setStatus('locked')
      return
    }
    setStatus('trial')
    const timer = setTimeout(() => setStatus('locked'), remaining)
    return () => clearTimeout(timer)
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
      setError('Clé invalide, ou déjà utilisée sur un autre appareil.')
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
          <p className="mb-6 text-center text-sm text-gray-500">Votre période d'essai est terminée.</p>

          <div className="mb-6 rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-700">Veuillez contacter l'administrateur du site pour obtenir une clé.</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{CONTACT_PHONE_DISPLAY}</p>
            <div className="mt-3 flex gap-2">
              <a
                href={CONTACT_PHONE_TEL_URL}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                📞 Appeler
              </a>
              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-center text-xs text-gray-500">Vous avez déjà une clé d'activation ?</p>
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
