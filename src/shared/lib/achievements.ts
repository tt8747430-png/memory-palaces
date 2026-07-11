/**
 * Achievements are derived live from existing progress — there is no achievement entity
 * or stored "earned" flag, so a badge can never drift from the truth behind it. This
 * module is pure: it owns the canonical badge order and the earn thresholds; icons and
 * copy live in the widget that renders them.
 */

export type AchievementId =
  | 'first-palace'
  | 'week-warrior'
  | 'palace-master'
  | 'xp-champion'
  | 'perfectionist'
  | 'dedicated-learner'

export interface AchievementInput {
  deckCount: number
  streakCount: number
  xp: number
  bestQuizAccuracy: number
  decksCompleted: number
  anyDeckCompleted: boolean
}

export interface Achievement {
  id: AchievementId
  earned: boolean
}

const WEEK_WARRIOR_STREAK = 7
const XP_CHAMPION_XP = 2000
const PERFECT_ACCURACY = 100
const DEDICATED_LEARNER_DECKS = 10

/** The six badges in canonical display order, each marked earned from live progress. */
export function computeAchievements(input: AchievementInput): Achievement[] {
  return [
    { id: 'first-palace', earned: input.deckCount >= 1 },
    { id: 'week-warrior', earned: input.streakCount >= WEEK_WARRIOR_STREAK },
    { id: 'palace-master', earned: input.anyDeckCompleted },
    { id: 'xp-champion', earned: input.xp >= XP_CHAMPION_XP },
    { id: 'perfectionist', earned: input.bestQuizAccuracy >= PERFECT_ACCURACY },
    { id: 'dedicated-learner', earned: input.decksCompleted >= DEDICATED_LEARNER_DECKS },
  ]
}
