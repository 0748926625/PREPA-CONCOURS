export type MasteryStatus = 'a_revoir' | 'fragile' | 'en_bonne_voie' | 'maitrise'

export const MASTERY_THRESHOLDS: Record<MasteryStatus, { min: number; max: number; label: string }> = {
  a_revoir: { min: 0, max: 49, label: 'À revoir' },
  fragile: { min: 50, max: 69, label: 'Fragile' },
  en_bonne_voie: { min: 70, max: 84, label: 'En bonne voie' },
  maitrise: { min: 85, max: 100, label: 'Maîtrisé' },
}

export function masteryStatusFromScore(score: number): MasteryStatus {
  if (score >= MASTERY_THRESHOLDS.maitrise.min) return 'maitrise'
  if (score >= MASTERY_THRESHOLDS.en_bonne_voie.min) return 'en_bonne_voie'
  if (score >= MASTERY_THRESHOLDS.fragile.min) return 'fragile'
  return 'a_revoir'
}

// Toutes les données vivent en local (IndexedDB) — application mono-utilisateur, sans compte.

export type Resource = {
  id: string
  title: string
  category: string | null
  extracted_text: string
  created_at: string
}

export type Topic = {
  id: string
  resource_id: string
  name: string
  description: string | null
}

export type Question = {
  id: string
  resource_id: string
  topic_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  difficulty: 'facile' | 'moyen' | 'difficile'
  source_reference: string | null
}

export type QuizSession = {
  id: string
  resource_id: string
  score: number
  total_questions: number
  created_at: string
}

export type Answer = {
  id: string
  session_id: string
  question_id: string
  selected_answer: 'A' | 'B' | 'C' | 'D'
  is_correct: boolean
}

export type Mastery = {
  id: string
  topic_id: string
  attempts: number
  correct_answers: number
  wrong_answers: number
  mastery_score: number
  status: MasteryStatus
  updated_at: string
}
