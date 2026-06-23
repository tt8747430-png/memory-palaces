export const APP_NAME = 'Mindscape'
export const APP_TAGLINE = 'Your Memory Palace'

/** Namespace for any persisted key (localStorage now; RxDB collections later). */
export const STORAGE_PREFIX = 'mindscape'

/** Items practised in a day to make it "active" (advance the streak). */
export const DEFAULT_DAILY_GOAL = 5

/** Selectable daily-goal targets, shown in Settings. */
export const DAILY_GOAL_OPTIONS = [3, 5, 10, 20] as const
