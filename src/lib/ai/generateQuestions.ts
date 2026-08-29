import { z } from 'zod'
import { db } from '../db'
import type { Question, Resource, Topic } from '../../types'
import { generateJson, AiError } from './client'
import { buildQuestionsPrompt } from './prompts'

const QuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        topic_index: z.number().int().min(0),
        question: z.string().trim().min(1),
        option_a: z.string().trim().min(1),
        option_b: z.string().trim().min(1),
        option_c: z.string().trim().min(1),
        option_d: z.string().trim().min(1).nullable(),
        correct_answer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().trim().min(1),
        difficulty: z.enum(['facile', 'moyen', 'difficile']),
        source_reference: z.string().trim().min(1).nullable(),
      }),
    )
    .min(1),
})

/** Génère les QCM d'une ressource à partir de ses notions déjà identifiées (§7/§18 du cahier des charges). */
export async function generateQuestions(resource: Resource, topics: Topic[]): Promise<Question[]> {
  if (topics.length === 0) {
    throw new AiError("Analysez d'abord le document pour identifier ses notions.")
  }

  const raw = await generateJson(buildQuestionsPrompt(resource.extracted_text, topics))

  const parsed = QuestionsSchema.safeParse(raw)
  if (!parsed.success) {
    throw new AiError("La réponse de l'IA ne respecte pas le format attendu.")
  }

  const questions: Question[] = []
  for (const q of parsed.data.questions) {
    const topic = topics[q.topic_index]
    if (!topic) continue // notion hors bornes : question ignorée plutôt que de planter
    if (q.correct_answer === 'D' && !q.option_d) continue // réponse D annoncée sans option D : incohérent, ignorée

    questions.push({
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
    })
  }

  if (questions.length === 0) {
    throw new AiError("Aucune question exploitable n'a pu être générée. Réessayez.")
  }

  await db.transaction('rw', db.questions, async () => {
    await db.questions.where('resource_id').equals(resource.id).delete()
    await db.questions.bulkAdd(questions)
  })

  return questions
}

export function listQuestions(resourceId: string): Promise<Question[]> {
  return db.questions.where('resource_id').equals(resourceId).toArray()
}
