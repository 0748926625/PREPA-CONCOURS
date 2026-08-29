import Dexie, { type EntityTable } from 'dexie'
import type { Answer, Mastery, Question, QuizSession, Resource, Topic } from '../types'

const db = new Dexie('prepa-concours') as Dexie & {
  resources: EntityTable<Resource, 'id'>
  topics: EntityTable<Topic, 'id'>
  questions: EntityTable<Question, 'id'>
  quizSessions: EntityTable<QuizSession, 'id'>
  answers: EntityTable<Answer, 'id'>
  mastery: EntityTable<Mastery, 'id'>
}

db.version(1).stores({
  resources: 'id, category, created_at',
  topics: 'id, resource_id, name',
  questions: 'id, resource_id, topic_id',
  quizSessions: 'id, resource_id, created_at',
  answers: 'id, session_id, question_id',
  mastery: 'id, topic_id, status',
})

export { db }
