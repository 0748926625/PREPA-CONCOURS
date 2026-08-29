import { db } from './db'
import { updateMasteryFromAnswers } from './mastery'
import type { Answer, Question, QuizSession } from '../types'

export type AnsweredQuestion = {
  question: Question
  selected: 'A' | 'B' | 'C' | 'D'
  isCorrect: boolean
}

/** Sauvegarde une session terminée (score, réponses) et met à jour la maîtrise par notion (§8/§11). */
export async function saveQuizSession(
  resourceId: string,
  results: AnsweredQuestion[],
): Promise<QuizSession> {
  const session: QuizSession = {
    id: crypto.randomUUID(),
    resource_id: resourceId,
    score: results.filter((r) => r.isCorrect).length,
    total_questions: results.length,
    created_at: new Date().toISOString(),
  }

  const answers: Answer[] = results.map((r) => ({
    id: crypto.randomUUID(),
    session_id: session.id,
    question_id: r.question.id,
    selected_answer: r.selected,
    is_correct: r.isCorrect,
  }))

  await db.transaction('rw', db.quizSessions, db.answers, async () => {
    await db.quizSessions.add(session)
    await db.answers.bulkAdd(answers)
  })

  await updateMasteryFromAnswers(results.map((r) => ({ topic_id: r.question.topic_id, is_correct: r.isCorrect })))

  return session
}

export type SessionResults = {
  session: QuizSession
  strengths: string[] // noms des notions bien réussies dans cette session
  weaknesses: string[] // noms des notions mal réussies dans cette session
}

/** Récapitulatif d'une session terminée : score + notions fortes/faibles pour CETTE session (§15). */
export async function getSessionResults(sessionId: string): Promise<SessionResults | null> {
  const session = await db.quizSessions.get(sessionId)
  if (!session) return null

  const answers = await db.answers.where('session_id').equals(sessionId).toArray()
  const questions = await db.questions.bulkGet(answers.map((a) => a.question_id))
  const topicIds = [...new Set(questions.filter((q): q is Question => !!q).map((q) => q.topic_id))]
  const topics = await db.topics.bulkGet(topicIds)
  const topicNameById = new Map(topics.filter((t) => !!t).map((t) => [t!.id, t!.name]))

  const perTopic = new Map<string, { correct: number; total: number }>()
  for (const answer of answers) {
    const question = questions.find((q) => q?.id === answer.question_id)
    if (!question) continue
    const stat = perTopic.get(question.topic_id) ?? { correct: 0, total: 0 }
    stat.total += 1
    if (answer.is_correct) stat.correct += 1
    perTopic.set(question.topic_id, stat)
  }

  const strengths: string[] = []
  const weaknesses: string[] = []
  for (const [topicId, stat] of perTopic) {
    const name = topicNameById.get(topicId) ?? 'Notion'
    const accuracy = (stat.correct / stat.total) * 100
    if (accuracy >= 70) strengths.push(name)
    else weaknesses.push(name)
  }

  return { session, strengths, weaknesses }
}
