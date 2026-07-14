export const STORAGE_PREFIX = 'mindscape'

export const LEGAL_URLS = {
  terms: 'https://mindscape.app/terms',
  privacy: 'https://mindscape.app/privacy',
  licenses: 'https://mindscape.app/licenses',
} as const

export const DEFAULT_DAILY_GOAL = 5

export const DAILY_GOAL_OPTIONS = [3, 5, 10, 20] as const

export interface AppLanguage {
  code: string
  label: string
}

export const AVAILABLE_LANGUAGES: readonly AppLanguage[] = [{ code: 'en', label: 'English' }]
