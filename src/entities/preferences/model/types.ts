import type { Entity } from '@/shared/lib'
import { DEFAULT_DAILY_GOAL } from '@/shared/config/constants'

/** How the Palaces screen lays out its list. Persisted so the choice survives sessions. */
export type PalacesView = 'grid' | 'list'

/** How the library orders its items. `manual` is a hand-dragged order; the rest are
 * automatic rules. Persisted so the choice survives sessions. */
export type PalacesSort = 'manual' | 'recent' | 'progress' | 'name'

const PALACES_SORTS: readonly PalacesSort[] = ['manual', 'recent', 'progress', 'name']

/** The active recall mode in verse study. Persisted so it's remembered everywhere. */
export type VerseMode = 'blur' | 'words' | 'initials' | 'type'

/** App appearance: an explicit light/dark choice, or `system` to follow the OS. */
export type Theme = 'light' | 'dark' | 'system'

/** Privacy & security switches. Cosmetic placeholders for now (no feature reads them
 * yet) but persisted so the choices survive once the features that honour them land. */
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

/**
 * App-wide user preferences — one singleton record. Behaviour-driving switches
 * (haptics, reduced-motion, sound, in-app notifications) the user can turn off.
 * Applying them to the running app (motion config, haptics flag, toast gating,
 * theme) is wired at the composition root; this is the persisted source of truth.
 */
export interface Preferences extends Entity {
  /** Play short confirmation tones on answers and session completion. */
  soundEffects: boolean
  /** Vibrate on swipe commits and milestones (supported devices only). */
  haptics: boolean
  /** Force reduced motion app-wide, regardless of the OS setting. */
  reducedMotion: boolean
  /** Show in-app milestone toasts (level-ups, streaks, completions). */
  notifications: boolean
  /** Appearance: light, dark, or follow the OS. Applied via the `[data-theme]` root. */
  theme: Theme
  /** BCP-47 language tag; only 'en' is shipped today. */
  language: string
  /** Items to practise per day to keep the streak (the daily goal). */
  dailyGoal: number
  /** Palaces screen: grid or list layout. */
  palacesView: PalacesView
  /** Palaces screen: list ordering. */
  palacesSort: PalacesSort
  /** Verse study: the last-used recall mode. */
  verseMode: VerseMode
  /** Verse study: practise verses in a random order. */
  verseShuffle: boolean
  /** Verse study: mark a blank for each hidden word so length is felt (Initials mode). */
  verseWordSpaces: boolean
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
  palacesView: 'grid',
  palacesSort: 'recent',
  verseMode: 'blur',
  verseShuffle: false,
  verseWordSpaces: true,
  privacy: DEFAULT_PRIVACY,
} as const satisfies Omit<Preferences, keyof Entity>

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
  palacesView?: PalacesView
  palacesSort?: PalacesSort
  verseMode?: VerseMode
  verseShuffle?: boolean
  verseWordSpaces?: boolean
  privacy?: PrivacySettings
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
    palacesView: input.palacesView ?? DEFAULT_PREFERENCES.palacesView,
    // Clamp a persisted sort that's no longer offered (e.g. the retired `category`).
    palacesSort:
      input.palacesSort && PALACES_SORTS.includes(input.palacesSort)
        ? input.palacesSort
        : DEFAULT_PREFERENCES.palacesSort,
    verseMode: input.verseMode ?? DEFAULT_PREFERENCES.verseMode,
    verseShuffle: input.verseShuffle ?? DEFAULT_PREFERENCES.verseShuffle,
    verseWordSpaces: input.verseWordSpaces ?? DEFAULT_PREFERENCES.verseWordSpaces,
    privacy: input.privacy ?? { ...DEFAULT_PRIVACY },
  }
}

/** The switchable fields — identity and timestamps are owned elsewhere. */
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
    | 'palacesView'
    | 'palacesSort'
    | 'verseMode'
    | 'verseShuffle'
    | 'verseWordSpaces'
    | 'privacy'
  >
>

/** Apply a change. `updatedAt` is set by the caller (clock injected) so it stays pure. */
export function updatePreferences(
  preferences: Preferences,
  changes: PreferencesChanges,
  updatedAt: string,
): Preferences {
  return { ...preferences, ...changes, updatedAt }
}
