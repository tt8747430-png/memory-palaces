import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'

/** The v0 preferences shape — before darkMode/language/privacy were added. */
export type PreferencesV0 = Omit<Preferences, 'darkMode' | 'language' | 'privacy'>

/** v0 → v1: backfill the new fields with defaults. Saved values always win, so the
 * spread order puts the stored doc last. RxDB serializes the result, so sharing the
 * default privacy reference here is safe. */
export function migratePreferencesV1(oldDoc: PreferencesV0): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}
