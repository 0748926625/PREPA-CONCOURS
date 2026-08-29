import { useState, type FormEvent } from 'react'
import { getAiSettings, saveAiSettings, type AiProvider } from '../lib/aiSettings'

export default function Profile() {
  const initial = getAiSettings()
  const [provider, setProvider] = useState<AiProvider>(initial.provider)
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveAiSettings({ provider, apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Réglages</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Fournisseur IA</p>
          <div className="flex gap-2">
            {(['gemini', 'openai'] as const).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                  provider === p ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="apiKey">
            Clé API {provider === 'gemini' ? 'Gemini' : 'OpenAI'}
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Collez votre clé API"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Stockée uniquement dans ce navigateur (localStorage), jamais envoyée ailleurs qu'au fournisseur IA
            choisi. L'application étant hébergée statiquement, il n'y a pas de serveur pour la protéger — ne
            partagez pas cet appareil si votre clé a un quota facturé.
          </p>
        </div>

        <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white">
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
