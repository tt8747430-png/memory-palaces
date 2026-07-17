import type { CompleteSessionOptions } from './complete-session'

const STUDY_XP_PER_CARD = 6
const STUDY_XP_MIN = 20
const STUDY_XP_MAX = 150

export const XP_PER_CORRECT = 20
export const XP_MATCH = 60

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

export function studyXp(graded: number): number {
  return clamp(graded * STUDY_XP_PER_CARD, STUDY_XP_MIN, STUDY_XP_MAX)
}

export function quizXp(score: number): number {
  return Math.max(0, score) * XP_PER_CORRECT
}

export type SessionOutcome =
  | { kind: 'study'; graded: number }
  | { kind: 'quiz'; correct: number; total: number; accuracy: number }
  | { kind: 'match'; pairs: number }

export function outcomeToReward(
  outcome: SessionOutcome,
): Omit<CompleteSessionOptions, 'dailyGoal'> {
  switch (outcome.kind) {
    case 'study':
      return { xp: studyXp(outcome.graded), itemsPracticed: outcome.graded }
    case 'quiz':
      return {
        xp: quizXp(outcome.correct),
        itemsPracticed: outcome.total,
        quizAccuracy: outcome.accuracy,
      }
    case 'match':
      return { xp: XP_MATCH, itemsPracticed: outcome.pairs }
  }
}
