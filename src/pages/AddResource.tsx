import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createResource, RESOURCE_CATEGORIES } from '../lib/resources'

type Mode = 'pdf' | 'text'

export default function AddResource() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('pdf')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>(RESOURCE_CATEGORIES[0])
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setFileName(file.name)
    setExtracting(true)
    try {
      const { extractTextFromPdf } = await import('../lib/pdf')
      const extracted = await extractTextFromPdf(file)
      if (!extracted) {
        setError("Aucun texte n'a pu être extrait de ce PDF (peut-être un scan sans texte).")
      }
      setText(extracted)
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ''))
    } catch {
      setError('Impossible de lire ce fichier PDF.')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Donnez un titre à la ressource.')
      return
    }
    if (text.trim().length < 50) {
      setError('Le contenu est trop court (au moins 50 caractères) pour générer des QCM utiles.')
      return
    }

    setSubmitting(true)
    const resource = await createResource({
      title: title.trim(),
      category,
      extracted_text: text.trim(),
    })
    setSubmitting(false)
    navigate(`/resources/${resource.id}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Ajouter une ressource</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="title">
            Titre
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Statut général de la Fonction publique"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('pdf')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === 'pdf' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            Importer un PDF
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === 'text' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            Coller du texte
          </button>
        </div>

        {mode === 'pdf' ? (
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            {extracting && <p className="mt-2 text-sm text-gray-500">Extraction du texte en cours…</p>}
            {!extracting && fileName && text && (
              <p className="mt-2 text-sm text-gray-500">
                {fileName} — {text.length.toLocaleString('fr-FR')} caractères extraits
              </p>
            )}
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Collez ici le contenu de votre cours, document ou guide…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || extracting}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Ajout…' : 'Ajouter la ressource'}
        </button>
      </form>
    </div>
  )
}
