import { db } from './db'
import type { Resource } from '../types'

export const RESOURCE_CATEGORIES = [
  'Fonction publique',
  'Droit',
  'Administration',
  'Concours',
  'Santé',
  'Enseignement',
  'Formation',
  'Culture générale',
  'Autre',
] as const

export async function createResource(input: {
  title: string
  category: string | null
  extracted_text: string
}): Promise<Resource> {
  const resource: Resource = {
    id: crypto.randomUUID(),
    title: input.title,
    category: input.category,
    extracted_text: input.extracted_text,
    created_at: new Date().toISOString(),
  }
  await db.resources.add(resource)
  return resource
}

export function listResources(): Promise<Resource[]> {
  return db.resources.orderBy('created_at').reverse().toArray()
}

export function getResource(id: string): Promise<Resource | undefined> {
  return db.resources.get(id)
}

export async function deleteResource(id: string): Promise<void> {
  await db.transaction('rw', db.resources, db.topics, db.questions, async () => {
    await db.resources.delete(id)
    await db.topics.where('resource_id').equals(id).delete()
    await db.questions.where('resource_id').equals(id).delete()
  })
}

export function countQuestions(resourceId: string): Promise<number> {
  return db.questions.where('resource_id').equals(resourceId).count()
}

export type RevisableResource = Resource & { questionCount: number }

/** Ressources ayant déjà des QCM générés, prêtes à réviser immédiatement. */
export async function listRevisableResources(): Promise<RevisableResource[]> {
  const resources = await listResources()
  const withCounts = await Promise.all(
    resources.map(async (r) => ({ ...r, questionCount: await countQuestions(r.id) })),
  )
  return withCounts.filter((r) => r.questionCount > 0)
}
