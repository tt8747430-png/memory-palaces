import type { Entity } from '@/shared/lib'

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
 * Applying them to the running app (motion config, haptics flag, toast gating) is
 * wired separately; this is the persisted source of truth. `darkMode`/`language`
 * are persisted but not yet applied (surfaced as "coming soon" in Settings).
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
  /** Persisted opt-in for the night theme; not applied until the theme ships. */
  darkMode: boolean
  /** BCP-47 language tag; only 'en' is shipped today. */
  language: string
  privacy: PrivacySettings
}

export const DEFAULT_PREFERENCES = {
  soundEffects: true,
  haptics: true,
  reducedMotion: false,
  notifications: true,
  darkMode: false,
  language: 'en',
  privacy: DEFAULT_PRIVACY,
} as const

export interface MakePreferencesInput {
  id: string
  createdAt: string
  soundEffects?: boolean
  haptics?: boolean
  reducedMotion?: boolean
  notifications?: boolean
  darkMode?: boolean
  language?: string
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
    darkMode: input.darkMode ?? DEFAULT_PREFERENCES.darkMode,
    language: input.language ?? DEFAULT_PREFERENCES.language,
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
    | 'darkMode'
    | 'language'
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
