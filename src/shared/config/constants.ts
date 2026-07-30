export const STORAGE_PREFIX = 'mindscape'

export const LEGAL_URLS = {
  terms: 'https://mindscape.app/terms',
  privacy: 'https://mindscape.app/privacy',
  licenses: 'https://mindscape.app/licenses',
} as const

/** The longest name a deck or folder may carry. One limit, so a deck renamed
 * into a folder's name never has to be truncated. */
export const NAME_MAX = 60

export const DEFAULT_DAILY_GOAL = 5

export const DAILY_GOAL_OPTIONS = [3, 5, 10, 20] as const

export interface AppLanguage {
  code: string
  label: string
}

export const AVAILABLE_LANGUAGES: readonly AppLanguage[] = [{ code: 'en', label: 'English' }]
