/** Namespace for any persisted key (localStorage now; RxDB collections later). */
export const STORAGE_PREFIX = 'mindscape'

/** Public legal pages, opened in a new tab from signup and the About screen. Defined once here
 * so the two surfaces can never drift to different URLs. */
export const LEGAL_URLS = {
  terms: 'https://mindscape.app/terms',
  privacy: 'https://mindscape.app/privacy',
  licenses: 'https://mindscape.app/licenses',
} as const

/** Items practised in a day to make it "active" (advance the streak). */
export const DEFAULT_DAILY_GOAL = 5

/** Selectable daily-goal targets, shown in Settings. */
export const DAILY_GOAL_OPTIONS = [3, 5, 10, 20] as const

/**
 * Languages the app ships translations for. The `label` is the autonym (a language names
 * itself in its own script, so it is never translated). Settings reads this to render the
 * language picker; only `en` ships today, and the list grows as `shared/i18n/locales`
 * gains siblings — no Settings change needed.
 */
export interface AppLanguage {
  code: string
  label: string
}

export const AVAILABLE_LANGUAGES: readonly AppLanguage[] = [{ code: 'en', label: 'English' }]
