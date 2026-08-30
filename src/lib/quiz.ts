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
  review: AnsweredQuestion[] // détail question par question, pour la correction en fin de session
}

/** Récapitulatif d'une session terminée : score + notions fortes/faibles + détail question par question (§15). */
export async function getSessionResults(sessionId: string): Promise<SessionResults | null> {
  const session = await db.quizSessions.get(sessionId)
  if (!session) return null

  const answers = await db.answers.where('session_id').equals(sessionId).toArray()
  const questions = await db.questions.bulkGet(answers.map((a) => a.question_id))
  const questionById = new Map(questions.filter((q): q is Question => !!q).map((q) => [q.id, q]))

  const review: AnsweredQuestion[] = []
  for (const answer of answers) {
    const question = questionById.get(answer.question_id)
    if (!question) continue
    review.push({ question, selected: answer.selected_answer, isCorrect: answer.is_correct })
  }

  const topicIds = [...new Set(review.map((r) => r.question.topic_id))]
  const topics = await db.topics.bulkGet(topicIds)
  const topicNameById = new Map(topics.filter((t) => !!t).map((t) => [t!.id, t!.name]))

  const perTopic = new Map<string, { correct: number; total: number }>()
  for (const { question, isCorrect } of review) {
    const stat = perTopic.get(question.topic_id) ?? { correct: 0, total: 0 }
    stat.total += 1
    if (isCorrect) stat.correct += 1
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

  return { session, strengths, weaknesses, review }
}

/**
 * Questions d'une notion actuellement ratées : pour chaque question déjà répondue, on ne garde que sa
 * réponse la plus récente — si l'élève l'a depuis retrouvée, elle sort de la liste. Sert à faire rejouer
 * exactement les questions encore mal maîtrisées plutôt que de régénérer du contenu (§19).
 */
export async function getFailedQuestions(topicId: string): Promise<Question[]> {
  const topicQuestions = await db.questions.where('topic_id').equals(topicId).toArray()
  const questionIds = topicQuestions.map((q) => q.id)
  if (questionIds.length === 0) return []

  const answers = await db.answers.where('question_id').anyOf(questionIds).toArray()
  const sessions = await db.quizSessions.bulkGet([...new Set(answers.map((a) => a.session_id))])
  const sessionCreatedAt = new Map(sessions.filter((s): s is QuizSession => !!s).map((s) => [s.id, s.created_at]))

  const latestByQuestion = new Map<string, Answer>()
  for (const answer of answers) {
    const current = latestByQuestion.get(answer.question_id)
    if (!current || (sessionCreatedAt.get(answer.session_id) ?? '') > (sessionCreatedAt.get(current.session_id) ?? '')) {
      latestByQuestion.set(answer.question_id, answer)
    }
  }

  return topicQuestions.filter((q) => {
    const latest = latestByQuestion.get(q.id)
    return latest && !latest.is_correct
  })
}
