import { db } from './db'
import { computeMasteryStatus } from '../types'
import type { Mastery, Resource, Topic } from '../types'

/** Met à jour la maîtrise par notion à partir des réponses d'une session, dans l'ordre où elles ont été données (§11). */
export async function updateMasteryFromAnswers(
  answers: { topic_id: string; is_correct: boolean }[],
): Promise<void> {
  const byTopic = new Map<string, { is_correct: boolean }[]>()
  for (const a of answers) {
    if (!byTopic.has(a.topic_id)) byTopic.set(a.topic_id, [])
    byTopic.get(a.topic_id)!.push({ is_correct: a.is_correct })
  }

  await db.transaction('rw', db.mastery, async () => {
    for (const [topicId, topicAnswers] of byTopic) {
      const existing = await db.mastery.where('topic_id').equals(topicId).first()

      let attempts = existing?.attempts ?? 0
      let correct = existing?.correct_answers ?? 0
      let wrong = existing?.wrong_answers ?? 0
      let consecutiveFailures = existing?.consecutive_failures ?? 0

      for (const a of topicAnswers) {
        attempts++
        if (a.is_correct) {
          correct++
          consecutiveFailures = 0
        } else {
          wrong++
          consecutiveFailures++
        }
      }

      const mastery_score = Math.round((correct / attempts) * 100)
      const record: Mastery = {
        id: existing?.id ?? crypto.randomUUID(),
        topic_id: topicId,
        attempts,
        correct_answers: correct,
        wrong_answers: wrong,
        mastery_score,
        consecutive_failures: consecutiveFailures,
        status: computeMasteryStatus(mastery_score, consecutiveFailures),
        updated_at: new Date().toISOString(),
      }
      await db.mastery.put(record)
    }
  })
}

export function getMasteryByTopic(topicId: string): Promise<Mastery | undefined> {
  return db.mastery.where('topic_id').equals(topicId).first()
}

/** Maîtrise de chaque notion d'une liste, indexée par topic_id (notions jamais évaluées absentes de la Map). */
export async function getMasteryMapForTopics(topicIds: string[]): Promise<Map<string, Mastery>> {
  const rows = await db.mastery.where('topic_id').anyOf(topicIds).toArray()
  return new Map(rows.map((m) => [m.topic_id, m]))
}

export type TopicMastery = { topic: Topic; resource: Resource; mastery: Mastery }

async function withTopicAndResource(masteries: Mastery[]): Promise<TopicMastery[]> {
  const topics = await db.topics.bulkGet(masteries.map((m) => m.topic_id))
  const topicById = new Map(topics.filter((t): t is Topic => !!t).map((t) => [t.id, t]))
  const resources = await db.resources.bulkGet(
    [...new Set([...topicById.values()].map((t) => t.resource_id))],
  )
  const resourceById = new Map(resources.filter((r): r is Resource => !!r).map((r) => [r.id, r]))

  const rows: TopicMastery[] = []
  for (const mastery of masteries) {
    const topic = topicById.get(mastery.topic_id)
    const resource = topic && resourceById.get(topic.resource_id)
    if (topic && resource) rows.push({ topic, resource, mastery })
  }
  return rows
}

/** Notions "fragile" ou "à revoir" (§9/§13), triées des moins maîtrisées aux mieux maîtrisées. */
export async function listWeaknesses(): Promise<TopicMastery[]> {
  const masteries = await db.mastery.where('status').anyOf('a_revoir', 'fragile').toArray()
  const rows = await withTopicAndResource(masteries)
  return rows.sort((a, b) => a.mastery.mastery_score - b.mastery.mastery_score)
}

/** Notions identifiées par l'IA mais jamais évaluées par un QCM (§9). */
export async function listUnevaluatedTopics(): Promise<{ topic: Topic; resource: Resource }[]> {
  const [topics, masteries] = await Promise.all([db.topics.toArray(), db.mastery.toArray()])
  const evaluatedTopicIds = new Set(masteries.map((m) => m.topic_id))
  const unevaluated = topics.filter((t) => !evaluatedTopicIds.has(t.id))

  const resources = await db.resources.bulkGet([...new Set(unevaluated.map((t) => t.resource_id))])
  const resourceById = new Map(resources.filter((r): r is Resource => !!r).map((r) => [r.id, r]))

  const rows: { topic: Topic; resource: Resource }[] = []
  for (const topic of unevaluated) {
    const resource = resourceById.get(topic.resource_id)
    if (resource) rows.push({ topic, resource })
  }
  return rows
}
