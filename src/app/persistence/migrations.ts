import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'
import { DEFAULT_PROFILE, type Profile } from '@/entities/profile'

/** The v0 preferences shape — before darkMode/language/privacy (and, later,
 * palacesView/palacesSort) were added. */
export type PreferencesV0 = Omit<
  Preferences,
  'darkMode' | 'language' | 'privacy' | 'palacesView' | 'palacesSort'
>

/** v0 → v1: backfill the new fields with defaults. Saved values always win, so the
 * spread order puts the stored doc last. RxDB serializes the result, so sharing the
 * default privacy reference here is safe. */
export function migratePreferencesV1(oldDoc: PreferencesV0): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** The v1 preferences shape — before the Palaces screen's view/sort were persisted. */
export type PreferencesV1 = Omit<Preferences, 'palacesView' | 'palacesSort'>

/** v1 → v2: backfill the Palaces view/sort with defaults; stored fields win. */
export function migratePreferencesV2(oldDoc: PreferencesV1): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** The v0 profile shape — before the chosen username was added. */
export type ProfileV0 = Omit<Profile, 'username'>

/** v0 → v1: backfill an empty username; saved fields win (stored doc spread last). */
export function migrateProfileV1(oldDoc: ProfileV0): Profile {
  return { username: DEFAULT_PROFILE.username, ...oldDoc }
}
