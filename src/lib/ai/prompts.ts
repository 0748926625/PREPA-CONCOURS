// Prompts IA centralisés (§17 du cahier des charges) — facilement modifiables ici.

const MAX_CONTENT_CHARS = 30000

export function buildAnalysisPrompt(text: string): string {
  const truncated = text.length > MAX_CONTENT_CHARS
  const content = text.slice(0, MAX_CONTENT_CHARS)

  return `Tu es un assistant pédagogique. Analyse EXCLUSIVEMENT le document ci-dessous et identifie les
notions importantes qu'il contient : définitions, règles, dates, chiffres, conditions, exceptions,
procédures, concepts et leurs relations.

RÈGLES STRICTES :
- N'utilise que les informations réellement présentes dans le document ci-dessous.
- N'invente aucune information.
- Identifie entre 5 et 15 notions distinctes, adaptées à la richesse du contenu.
- Chaque notion doit avoir un nom court (3-6 mots) et une description en une phrase de ce qu'elle couvre
  dans ce document précis.
- Réponds UNIQUEMENT avec un JSON strict de cette forme, sans texte autour :
{"topics": [{"name": "string", "description": "string"}]}

${truncated ? `(Document tronqué aux ${MAX_CONTENT_CHARS} premiers caractères.)\n\n` : ''}DOCUMENT :
"""
${content}
"""`
}
