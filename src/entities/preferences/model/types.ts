import type { Entity } from '@/shared/lib'

/**
 * App-wide user preferences — one singleton record. Behaviour-driving switches
 * (haptics, reduced-motion, sound, in-app notifications) the user can turn off.
 * Applying them to the running app (motion config, haptics flag, toast gating) is
 * wired separately; this is the persisted source of truth.
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
}

export const DEFAULT_PREFERENCES = {
  soundEffects: true,
  haptics: true,
  reducedMotion: false,
  notifications: true,
} as const

export interface MakePreferencesInput {
  id: string
  createdAt: string
  soundEffects?: boolean
  haptics?: boolean
  reducedMotion?: boolean
  notifications?: boolean
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
  }
}

/** The switchable fields — identity and timestamps are owned elsewhere. */
export type PreferencesChanges = Partial<
  Pick<Preferences, 'soundEffects' | 'haptics' | 'reducedMotion' | 'notifications'>
>

/** Apply a change. `updatedAt` is set by the caller (clock injected) so it stays pure. */
export function updatePreferences(
  preferences: Preferences,
  changes: PreferencesChanges,
  updatedAt: string,
): Preferences {
  return { ...preferences, ...changes, updatedAt }
}
