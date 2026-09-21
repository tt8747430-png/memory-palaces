import { CONTENT_SORTS, type ContentSort, type Entity, type ExtensionId } from '@/shared/lib'
import { DEFAULT_DAILY_GOAL } from '@/shared/config/constants'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  SWIPE_ITEM_TYPES,
  type SwipePreferences,
} from '@/shared/config/swipe'
import {
  DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
  type FlashcardSwipePreferences,
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
export type {
  FlashcardSwipeConfig,
  FlashcardSwipeByMode,
  FlashcardSwipePreferences,
} from '@/shared/config/flashcard-swipe'

export type { ContentSort }

export const STUDY_MODES = ['blur', 'initials', 'words', 'type'] as const
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
  dataEncryption: false,
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
  studyTypeInitialsOnly: boolean
  shakeToUndo: boolean
  swipe: SwipePreferences
  flashcardSwipe: FlashcardSwipePreferences
  selectToolbar: SelectToolbarPreferences
  privacy: PrivacySettings
  extensions: ExtensionId[]
  /**
   * The features each Extension has switched **off**, by its id. The negative is what is stored:
   * a feature a newer build adds is on without anyone writing anything, and an id this build does
   * not know survives instead of being deleted on the next write — the same reasoning as
   * `extensions`.
   */
  disabledFeatures: Record<ExtensionId, string[]>
  /** Shows the admin screens. Follows the account, like every other setting. */
  devMode: boolean
  /** Synchronise without being asked. */
  autosync: boolean
  /** The Library rows left open, by deck id. */
  libraryExpanded: string[]
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
  studyTypeInitialsOnly: false,
  shakeToUndo: true,
  swipe: DEFAULT_SWIPE,
  flashcardSwipe: DEFAULT_FLASHCARD_SWIPE_PREFERENCES,
  selectToolbar: DEFAULT_SELECT_TOOLBAR,
  privacy: DEFAULT_PRIVACY,
  extensions: [] as ExtensionId[],
  disabledFeatures: {} as Record<ExtensionId, string[]>,
  devMode: false,
  autosync: true,
  libraryExpanded: [] as string[],
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
  studyTypeInitialsOnly?: boolean
  shakeToUndo?: boolean
  swipe?: SwipePreferences
  flashcardSwipe?: FlashcardSwipePreferences
  selectToolbar?: SelectToolbarPreferences
  privacy?: PrivacySettings
  extensions?: ExtensionId[]
  disabledFeatures?: Record<ExtensionId, string[]>
  devMode?: boolean
  autosync?: boolean
  libraryExpanded?: string[]
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
    studyTypeInitialsOnly: input.studyTypeInitialsOnly ?? DEFAULT_PREFERENCES.studyTypeInitialsOnly,
    shakeToUndo: input.shakeToUndo ?? DEFAULT_PREFERENCES.shakeToUndo,
    swipe: resolveSwipe(input.swipe),
    flashcardSwipe: normalizeFlashcardSwipe(input.flashcardSwipe),
    selectToolbar: resolveSelectToolbar(input.selectToolbar),
    privacy: input.privacy ?? { ...DEFAULT_PRIVACY },
    extensions: [...(input.extensions ?? [])],
    disabledFeatures: normalizeDisabledFeatures(input.disabledFeatures),
    devMode: input.devMode ?? DEFAULT_PREFERENCES.devMode,
    autosync: input.autosync ?? DEFAULT_PREFERENCES.autosync,
    libraryExpanded: [...(input.libraryExpanded ?? [])],
  }
}

/**
 * Copies the stored map, keeping every id — including an extension or a feature this build has
 * never heard of, which another device may have switched off on a newer version.
 */
function normalizeDisabledFeatures(
  stored: Record<ExtensionId, string[]> | undefined,
): Record<ExtensionId, string[]> {
  if (!stored || typeof stored !== 'object') return {}
  return Object.fromEntries(
    Object.entries(stored).flatMap(([id, features]) =>
      Array.isArray(features) ? [[id, features.filter((f) => typeof f === 'string')]] : [],
    ),
  )
}

export function isExtensionEnabled(
  preferences: Pick<Preferences, 'extensions'>,
  id: ExtensionId,
): boolean {
  return preferences.extensions.includes(id)
}

/**
 * Whether one of an Extension's features is on. On is the default: a feature only a newer build
 * declares has never been switched off, and a learner who never touched the switch gets all of it.
 */
export function isExtensionFeatureOn(
  preferences: Pick<Preferences, 'disabledFeatures'>,
  extensionId: ExtensionId,
  featureId: string,
): boolean {
  return !preferences.disabledFeatures[extensionId]?.includes(featureId)
}

/** The stored map with one feature switched on or off. Switching the last one back on drops the key. */
export function withExtensionFeature(
  disabled: Record<ExtensionId, string[]>,
  extensionId: ExtensionId,
  featureId: string,
  on: boolean,
): Record<ExtensionId, string[]> {
  const held = disabled[extensionId] ?? []
  const next = on ? held.filter((id) => id !== featureId) : [...new Set([...held, featureId])]
  if (next.length === 0) {
    const { [extensionId]: _dropped, ...rest } = disabled
    return rest
  }
  return { ...disabled, [extensionId]: next }
}

export function completePreferences(preferences: Preferences): Preferences {
  return { ...makePreferences(preferences), updatedAt: preferences.updatedAt }
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
    | 'studyTypeInitialsOnly'
    | 'shakeToUndo'
    | 'swipe'
    | 'flashcardSwipe'
    | 'selectToolbar'
    | 'privacy'
    | 'devMode'
    | 'autosync'
    | 'libraryExpanded'
  >
>

/**
 * What one write may change. `extensions` and `disabledFeatures` are kept out of
 * `PreferencesChanges` so no generic caller can pass a whole list or map it never read;
 * `setPreferences` resolves their updaters and hands the results here, which is the only way
 * either is ever replaced.
 */
type PreferencesUpdate = PreferencesChanges & {
  extensions?: ExtensionId[]
  disabledFeatures?: Record<ExtensionId, string[]>
}

export function updatePreferences(
  preferences: Preferences,
  changes: PreferencesUpdate,
  updatedAt: string,
): Preferences {
  return { ...preferences, ...changes, updatedAt }
}
