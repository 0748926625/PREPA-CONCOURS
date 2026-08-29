import { z } from 'zod'
import { db } from '../db'
import type { Resource, Topic } from '../../types'
import { generateJson, AiError } from './client'
import { buildAnalysisPrompt } from './prompts'

const AnalysisSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        description: z.string().trim().min(1),
      }),
    )
    .min(1),
})

/** Identifie les notions d'une ressource via l'IA et remplace ses notions existantes (§6 du cahier des charges). */
export async function analyzeResource(resource: Resource): Promise<Topic[]> {
  const raw = await generateJson(buildAnalysisPrompt(resource.extracted_text))

  const parsed = AnalysisSchema.safeParse(raw)
  if (!parsed.success) {
    throw new AiError("La réponse de l'IA ne respecte pas le format attendu.")
  }

  const topics: Topic[] = parsed.data.topics.map((t) => ({
    id: crypto.randomUUID(),
    resource_id: resource.id,
    name: t.name,
    description: t.description,
  }))

  await db.transaction('rw', db.topics, async () => {
    await db.topics.where('resource_id').equals(resource.id).delete()
    await db.topics.bulkAdd(topics)
  })

  return topics
}

export function listTopics(resourceId: string): Promise<Topic[]> {
  return db.topics.where('resource_id').equals(resourceId).toArray()
}
