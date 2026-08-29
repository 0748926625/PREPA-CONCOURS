import { z } from 'zod'
import type { Question, Resource, Topic } from '../../types'
import { generateJson, AiError } from './client'
import { buildRemediationContentPrompt, buildVerificationPrompt } from './prompts'

const QuestionSchema = z.object({
  question: z.string().trim().min(1),
  option_a: z.string().trim().min(1),
  option_b: z.string().trim().min(1),
  option_c: z.string().trim().min(1),
  option_d: z.string().trim().min(1).nullable(),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(['facile', 'moyen', 'difficile']),
  source_reference: z.string().trim().min(1).nullable(),
})

function toQuestion(q: z.infer<typeof QuestionSchema>, resource: Resource, topic: Topic): Question | null {
  if (q.correct_answer === 'D' && !q.option_d) return null
  return {
    id: crypto.randomUUID(),
    resource_id: resource.id,
    topic_id: topic.id,
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    source_reference: q.source_reference,
  }
}

const RemediationContentSchema = z.object({
  reminder: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  example: z.string().trim().min(1),
  exercises: z.array(QuestionSchema).min(1),
})

export type RemediationContent = {
  reminder: string
  explanation: string
  example: string
  exercises: Question[]
}

type FailedAttempt = { question: string; selected_answer: string; correct_answer: string; explanation: string }

/** Rappel + explication + exemple + exercices ciblés pour une notion en échec (§10/§19). */
export async function generateRemediationContent(
  resource: Resource,
  topic: Topic,
  failedAttempts: FailedAttempt[],
): Promise<RemediationContent> {
  const raw = await generateJson(buildRemediationContentPrompt(topic, resource.extracted_text, failedAttempts))
  const parsed = RemediationContentSchema.safeParse(raw)
  if (!parsed.success) {
    throw new AiError("La réponse de l'IA ne respecte pas le format attendu.")
  }

  const exercises = parsed.data.exercises
    .map((q) => toQuestion(q, resource, topic))
    .filter((q): q is Question => q !== null)

  if (exercises.length === 0) {
    throw new AiError("Aucun exercice exploitable n'a pu être généré. Réessayez.")
  }

  return {
    reminder: parsed.data.reminder,
    explanation: parsed.data.explanation,
    example: parsed.data.example,
    exercises,
  }
}

const VerificationSchema = z.object({ questions: z.array(QuestionSchema).min(1) })

/** Nouvelle série de questions différentes des exercices, pour vérifier la compréhension (§19 point 5). */
export async function generateVerificationQuestions(
  resource: Resource,
  topic: Topic,
  excludeQuestions: string[],
): Promise<Question[]> {
  const raw = await generateJson(buildVerificationPrompt(topic, resource.extracted_text, excludeQuestions))
  const parsed = VerificationSchema.safeParse(raw)
  if (!parsed.success) {
    throw new AiError("La réponse de l'IA ne respecte pas le format attendu.")
  }

  const questions = parsed.data.questions
    .map((q) => toQuestion(q, resource, topic))
    .filter((q): q is Question => q !== null)

  if (questions.length === 0) {
    throw new AiError("Aucune question de vérification exploitable n'a pu être générée. Réessayez.")
  }

  return questions
}
