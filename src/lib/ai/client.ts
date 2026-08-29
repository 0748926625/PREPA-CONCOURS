import { getAiSettings } from '../aiSettings'

export class AiError extends Error {}

/** Envoie un prompt au fournisseur IA configuré et retourne sa réponse JSON parsée (non validée). */
export async function generateJson(prompt: string): Promise<unknown> {
  const { provider, apiKey } = getAiSettings()

  if (!apiKey.trim()) {
    throw new AiError(
      "Aucune clé API configurée. Rendez-vous dans Réglages pour renseigner votre clé " +
        (provider === 'gemini' ? 'Gemini' : 'OpenAI') +
        '.',
    )
  }

  const raw = provider === 'gemini' ? await callGemini(prompt, apiKey) : await callOpenAi(prompt, apiKey)

  try {
    return JSON.parse(raw)
  } catch {
    throw new AiError("Le fournisseur IA a renvoyé une réponse qui n'est pas un JSON valide.")
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AiError(`Erreur Gemini (${res.status}) : ${body?.error?.message ?? 'requête refusée'}`)
  }

  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new AiError("Réponse Gemini inattendue (pas de contenu texte).")
  }
  return text
}

async function callOpenAi(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AiError(`Erreur OpenAI (${res.status}) : ${body?.error?.message ?? 'requête refusée'}`)
  }

  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== 'string') {
    throw new AiError('Réponse OpenAI inattendue (pas de contenu texte).')
  }
  return text
}
