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

export function buildQuestionsPrompt(text: string, topics: { name: string; description: string | null }[]): string {
  const truncated = text.length > MAX_CONTENT_CHARS
  const content = text.slice(0, MAX_CONTENT_CHARS)
  const topicsList = topics.map((t, i) => `${i}: ${t.name}${t.description ? ` — ${t.description}` : ''}`).join('\n')

  return `Tu es un assistant pédagogique. Génère des questions à choix multiples (QCM) à partir EXCLUSIVEMENT
du document ci-dessous, réparties entre les notions déjà identifiées dans ce document.

NOTIONS (index: nom — description) :
${topicsList}

RÈGLES STRICTES :
- N'utilise que les informations réellement présentes dans le document ci-dessous.
- N'invente aucune information.
- Génère entre 1 et 3 questions par notion, selon la richesse du contenu disponible pour cette notion.
- Chaque question a 3 ou 4 propositions plausibles (les distracteurs doivent être crédibles, pas absurdes)
  et une seule bonne réponse.
- Varie la position de la bonne réponse (A, B, C ou D) d'une question à l'autre.
- Mélange les niveaux de difficulté (facile, moyen, difficile).
- Évite les questions ambiguës ou dont la formulation trahit la réponse.
- Fournis une explication de la bonne réponse, et la référence/le passage d'origine si identifiable.
- Réponds UNIQUEMENT avec un JSON strict de cette forme, sans texte autour :
{"questions": [{
  "topic_index": 0,
  "question": "string",
  "option_a": "string",
  "option_b": "string",
  "option_c": "string",
  "option_d": "string ou null si seulement 3 propositions",
  "correct_answer": "A" | "B" | "C" | "D",
  "explanation": "string",
  "difficulty": "facile" | "moyen" | "difficile",
  "source_reference": "string ou null"
}]}

${truncated ? `(Document tronqué aux ${MAX_CONTENT_CHARS} premiers caractères.)\n\n` : ''}DOCUMENT :
"""
${content}
"""`
}

type FailedAttempt = {
  question: string
  selected_answer: string
  correct_answer: string
  explanation: string
}

const QUESTION_JSON_SHAPE = `{
  "question": "string",
  "option_a": "string",
  "option_b": "string",
  "option_c": "string",
  "option_d": "string ou null si seulement 3 propositions",
  "correct_answer": "A" | "B" | "C" | "D",
  "explanation": "string",
  "difficulty": "facile" | "moyen" | "difficile",
  "source_reference": "string ou null"
}`

export function buildRemediationContentPrompt(
  topic: { name: string; description: string | null },
  text: string,
  failedAttempts: FailedAttempt[],
): string {
  const content = text.slice(0, MAX_CONTENT_CHARS)
  const attemptsList = failedAttempts
    .map(
      (a, i) =>
        `${i + 1}. Question : ${a.question}\n   Réponse donnée : ${a.selected_answer} — Bonne réponse : ${a.correct_answer}\n   Explication : ${a.explanation}`,
    )
    .join('\n')

  return `Tu es un professeur particulier. Un élève a échoué plusieurs fois sur la notion "${topic.name}"
(${topic.description ?? 'sans description'}) dans le document ci-dessous. Voici ses erreurs récentes sur
cette notion :
${attemptsList || "(pas d'erreur détaillée disponible)"}

À partir EXCLUSIVEMENT du contenu du document ci-dessous, détermine la cause probable de l'erreur et produis
une remédiation ciblée SUR CETTE SEULE NOTION (ne couvre pas tout le chapitre) :

1. reminder : un rappel très court (1-2 phrases) de la règle/notion.
2. explanation : une explication pédagogique un peu plus détaillée, qui adresse si possible la confusion
   probable révélée par les erreurs ci-dessus.
3. example : un exemple concret tiré ou inspiré du document pour illustrer la notion.
4. exercises : 3 à 5 nouvelles questions à choix multiples ciblées sur cette notion, DIFFÉRENTES des
   questions ratées listées ci-dessus (mêmes règles que d'habitude : pas d'invention, distracteurs
   plausibles, une seule bonne réponse, explication fournie).

RÈGLES STRICTES : n'utilise que les informations réellement présentes dans le document. N'invente rien.
Réponds UNIQUEMENT avec un JSON strict de cette forme, sans texte autour :
{"reminder": "string", "explanation": "string", "example": "string", "exercises": [${QUESTION_JSON_SHAPE}]}

DOCUMENT :
"""
${content}
"""`
}

export function buildVerificationPrompt(
  topic: { name: string; description: string | null },
  text: string,
  excludeQuestions: string[],
): string {
  const content = text.slice(0, MAX_CONTENT_CHARS)
  const excludeList = excludeQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')

  return `Tu es un professeur particulier. Génère 3 à 5 NOUVELLES questions à choix multiples pour vérifier
si un élève a bien compris la notion "${topic.name}" (${topic.description ?? 'sans description'}) après une
séance de remédiation, à partir EXCLUSIVEMENT du document ci-dessous.

Ces questions doivent être DIFFÉRENTES (autre formulation, autre angle) des questions d'exercice déjà vues :
${excludeList || '(aucune)'}

RÈGLES STRICTES : n'utilise que les informations réellement présentes dans le document. N'invente rien.
Une seule bonne réponse par question, distracteurs plausibles, explication fournie.
Réponds UNIQUEMENT avec un JSON strict de cette forme, sans texte autour :
{"questions": [${QUESTION_JSON_SHAPE}]}

DOCUMENT :
"""
${content}
"""`
}
