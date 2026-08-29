import { db } from './db'
import { computeMasteryStatus } from '../types'
import type { Mastery } from '../types'

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
