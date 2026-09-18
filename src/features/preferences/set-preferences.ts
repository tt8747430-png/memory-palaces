import { type ExtensionId, nowIso, whenStoreReady } from '@/shared/lib'
import {
  makePreferences,
  type Preferences,
  type PreferencesChanges,
  type PreferencesStore,
  updatePreferences,
} from '@/entities/preferences'

export const PREFERENCES_ID = 'preferences'

function currentPreferences(store: PreferencesStore, now: number): Preferences {
  return (
    store.getState().preferences ?? makePreferences({ id: PREFERENCES_ID, createdAt: nowIso(now) })
  )
}

export interface SetPreferencesInput extends PreferencesChanges {
  /**
   * Applied to the ids already stored, never a replacement. A caller cannot hold a whole array
   * and overwrite ids it never read — including ids this build has never heard of, which a newer
   * build on another device enabled.
   */
  extensions?: (current: readonly ExtensionId[]) => ExtensionId[]
}

/**
 * Applies a change to what is stored. It waits for the store to load first: an unloaded store reads
 * as "nothing stored", and writing then would save a fresh set of defaults over every setting the
 * account has — which the next Sync would carry to every device.
 */
export async function setPreferences(
  store: PreferencesStore,
  input: SetPreferencesInput,
  now: number = Date.now(),
): Promise<Preferences> {
  await whenStoreReady(store)
  const base = currentPreferences(store, now)
  const { extensions, ...changes } = input
  const updated = updatePreferences(
    base,
    extensions ? { ...changes, extensions: extensions(base.extensions) } : changes,
    nowIso(now),
  )
  await store.getState().save(updated)
  return updated
}
