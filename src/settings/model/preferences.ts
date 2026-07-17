import type { Entity } from '@/shared/domain'
import { DEFAULT_DAILY_GOAL } from '@/shared/config/constants'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  type SwipePreferences,
  SWIPE_ITEM_TYPES,
} from '@/shared/config/swipe'
import {
  DEFAULT_FLASHCARD_SWIPE_BY_MODE,
  type FlashcardSwipeByMode,
  normalizeFlashcardSwipe,
} from '@/shared/config/flashcard-swipe'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_SURFACES,
  type SelectToolbarPreferences,
} from '@/shared/config/select-toolbar'

export type { SwipePreferences } from '@/shared/config/swipe'
export type { SelectToolbarPreferences } from '@/shared/config/select-toolbar'
export type { FlashcardSwipeConfig, FlashcardSwipeByMode } from '@/shared/config/flashcard-swipe'

export type ContentSort = 'manual' | 'recent' | 'name' | 'due' | 'flagged'

const CONTENT_SORTS: readonly ContentSort[] = ['manual', 'recent', 'name', 'due', 'flagged']

export const STUDY_MODES = ['blur', 'words', 'initials', 'type'] as const
export type StudyMode = (typeof STUDY_MODES)[number]

export type Theme = 'light' | 'dark' | 'system'

export interface PrivacySettings {
  profileVisibility: boolean
  activitySharing: boolean
  locationAccess: boolean
  notificationTracking: boolean
  dataEncryption: boolean
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: true,
  activitySharing: false,
  locationAccess: false,
  notificationTracking: true,
  dataEncryption: true,
}

export interface Preferences extends Entity {
  soundEffects: boolean
  haptics: boolean
  reducedMotion: boolean
  notifications: boolean
  theme: Theme
  language: string
  dailyGoal: number
  contentSort: ContentSort
  studyMode: StudyMode
  studyWordSpaces: boolean
  shakeToUndo: boolean
  swipe: SwipePreferences
  flashcardSwipe: FlashcardSwipeByMode
  selectToolbar: SelectToolbarPreferences
  privacy: PrivacySettings
}

export const DEFAULT_PREFERENCES = {
  soundEffects: true,
  haptics: true,
  reducedMotion: false,
  notifications: true,
  theme: 'system',
  language: 'en',
  dailyGoal: DEFAULT_DAILY_GOAL,
  contentSort: 'manual',
  studyMode: 'blur',
  studyWordSpaces: true,
  shakeToUndo: true,
  swipe: DEFAULT_SWIPE,
  flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_BY_MODE,
  selectToolbar: DEFAULT_SELECT_TOOLBAR,
  privacy: DEFAULT_PRIVACY,
} as const satisfies Omit<Preferences, keyof Entity>

export function resolveStudyMode(value: string | undefined): StudyMode {
  return value && (STUDY_MODES as readonly string[]).includes(value)
    ? (value as StudyMode)
    : DEFAULT_PREFERENCES.studyMode
}

export interface MakePreferencesInput {
  id: string
  createdAt: string
  soundEffects?: boolean
  haptics?: boolean
  reducedMotion?: boolean
  notifications?: boolean
  theme?: Theme
  language?: string
  dailyGoal?: number
  contentSort?: ContentSort
  studyMode?: StudyMode
  studyWordSpaces?: boolean
  shakeToUndo?: boolean
  swipe?: SwipePreferences
  flashcardSwipe?: FlashcardSwipeByMode
  selectToolbar?: SelectToolbarPreferences
  privacy?: PrivacySettings
}

function resolveSwipe(input?: SwipePreferences): SwipePreferences {
  const out = {} as SwipePreferences
  for (const type of SWIPE_ITEM_TYPES) {
    out[type] = normalizeSwipeConfig(type, input?.[type] ?? DEFAULT_SWIPE[type])
  }
  return out
}

function resolveSelectToolbar(input?: SelectToolbarPreferences): SelectToolbarPreferences {
  const out = {} as SelectToolbarPreferences
  for (const surface of SELECT_SURFACES) {
    out[surface] = normalizeSelectToolbar(
      surface,
      input?.[surface] ?? DEFAULT_SELECT_TOOLBAR[surface],
    )
  }
  return out
}

export function makePreferences(input: MakePreferencesInput): Preferences {
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    soundEffects: input.soundEffects ?? DEFAULT_PREFERENCES.soundEffects,
    haptics: input.haptics ?? DEFAULT_PREFERENCES.haptics,
    reducedMotion: input.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
    notifications: input.notifications ?? DEFAULT_PREFERENCES.notifications,
    theme: input.theme ?? DEFAULT_PREFERENCES.theme,
    language: input.language ?? DEFAULT_PREFERENCES.language,
    dailyGoal: input.dailyGoal ?? DEFAULT_PREFERENCES.dailyGoal,
    contentSort:
      input.contentSort && CONTENT_SORTS.includes(input.contentSort)
        ? input.contentSort
        : DEFAULT_PREFERENCES.contentSort,
    studyMode: resolveStudyMode(input.studyMode),
    studyWordSpaces: input.studyWordSpaces ?? DEFAULT_PREFERENCES.studyWordSpaces,
    shakeToUndo: input.shakeToUndo ?? DEFAULT_PREFERENCES.shakeToUndo,
    swipe: resolveSwipe(input.swipe),
    flashcardSwipe: normalizeFlashcardSwipe(input.flashcardSwipe),
    selectToolbar: resolveSelectToolbar(input.selectToolbar),
    privacy: input.privacy ?? { ...DEFAULT_PRIVACY },
  }
}

export type PreferencesChanges = Partial<
  Pick<
    Preferences,
    | 'soundEffects'
    | 'haptics'
    | 'reducedMotion'
    | 'notifications'
    | 'theme'
    | 'language'
    | 'dailyGoal'
    | 'contentSort'
    | 'studyMode'
    | 'studyWordSpaces'
    | 'shakeToUndo'
    | 'swipe'
    | 'flashcardSwipe'
    | 'selectToolbar'
    | 'privacy'
  >
>

export function updatePreferences(
  preferences: Preferences,
  changes: PreferencesChanges,
  updatedAt: string,
): Preferences {
  return { ...preferences, ...changes, updatedAt }
}
