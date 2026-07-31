/**
 * Every achievement, in display order. The one list — id union, earning rules and the
 * `isAchievementId` route guard all derive from it — so adding one is a single edit the compiler
 * chases.
 */
export const ACHIEVEMENT_IDS = [
  'first-deck',
  'week-warrior',
  'deck-master',
  'xp-champion',
  'perfectionist',
  'dedicated-learner',
] as const

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export const isAchievementId = (value: string): value is AchievementId =>
  (ACHIEVEMENT_IDS as readonly string[]).includes(value)

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

const EARNED = {
  'first-deck': (input) => input.deckCount >= 1,
  'week-warrior': (input) => input.streakCount >= WEEK_WARRIOR_STREAK,
  'deck-master': (input) => input.anyDeckCompleted,
  'xp-champion': (input) => input.xp >= XP_CHAMPION_XP,
  perfectionist: (input) => input.bestQuizAccuracy >= PERFECT_ACCURACY,
  'dedicated-learner': (input) => input.decksCompleted >= DEDICATED_LEARNER_DECKS,
} satisfies Record<AchievementId, (input: AchievementInput) => boolean>

export function computeAchievements(input: AchievementInput): Achievement[] {
  return ACHIEVEMENT_IDS.map((id) => ({ id, earned: EARNED[id](input) }))
}
