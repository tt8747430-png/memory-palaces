
export type AchievementId =
  | 'first-deck'
  | 'week-warrior'
  | 'deck-master'
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

export function computeAchievements(input: AchievementInput): Achievement[] {
  return [
    { id: 'first-deck', earned: input.deckCount >= 1 },
    { id: 'week-warrior', earned: input.streakCount >= WEEK_WARRIOR_STREAK },
    { id: 'deck-master', earned: input.anyDeckCompleted },
    { id: 'xp-champion', earned: input.xp >= XP_CHAMPION_XP },
    { id: 'perfectionist', earned: input.bestQuizAccuracy >= PERFECT_ACCURACY },
    { id: 'dedicated-learner', earned: input.decksCompleted >= DEDICATED_LEARNER_DECKS },
  ]
}
