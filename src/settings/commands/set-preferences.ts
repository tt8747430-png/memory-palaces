import { makePreferences, updatePreferences } from '@/settings/model/preferences'
import type { Preferences, PreferencesChanges } from '@/settings/model/preferences'
import type { PreferencesStore } from '@/settings/data/preferences-store'

export const PREFERENCES_ID = 'preferences'

function currentPreferences(store: PreferencesStore, now: number): Preferences {
  return (
    store.preferences() ??
    makePreferences({ id: PREFERENCES_ID, createdAt: new Date(now).toISOString() })
  )
}

export async function setPreferences(
  store: PreferencesStore,
  changes: PreferencesChanges,
  now: number = Date.now(),
): Promise<Preferences> {
  const base = currentPreferences(store, now)
  const updated = updatePreferences(base, changes, new Date(now).toISOString())
  await store.save(updated)
  return updated
}
