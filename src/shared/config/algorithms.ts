/**
 * Which scheduler a Deck follows — Fast review or Spaced repetition.
 *
 * It lives in `shared/config` rather than `entities/deck` because more than the deck turns on it:
 * a study session's swipe actions are chosen per algorithm, and `shared` may not reach an entity.
 * `entities/deck` re-exports it, so a Deck still declares its own settings in its own words.
 */
export const LEARNING_ALGORITHMS = ['fast', 'spaced'] as const

export type LearningAlgorithm = (typeof LEARNING_ALGORITHMS)[number]

export function isLearningAlgorithm(value: unknown): value is LearningAlgorithm {
  return LEARNING_ALGORITHMS.includes(value as LearningAlgorithm)
}
