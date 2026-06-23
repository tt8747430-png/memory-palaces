/** XP reward tuning, in one place. Study/review scale with effort (clamped so a
 * session can't be farmed); quiz pays per correct answer; match is a flat win. */
const STUDY_XP_PER_CARD = 6
const STUDY_XP_MIN = 20
const STUDY_XP_MAX = 150

export const XP_PER_CORRECT = 20
export const XP_MATCH = 60
/** XP for memorising a single verse (bible mode). */
export const XP_VERSE = 20

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

/** XP for a finished study/review session, by cards graded. */
export function studyXp(graded: number): number {
  return clamp(graded * STUDY_XP_PER_CARD, STUDY_XP_MIN, STUDY_XP_MAX)
}

/** XP for a finished quiz, by correct answers. */
export function quizXp(score: number): number {
  return Math.max(0, score) * XP_PER_CORRECT
}
