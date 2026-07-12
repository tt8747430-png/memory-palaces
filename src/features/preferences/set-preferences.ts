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
    store.getState().preferences ??
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
  await store.getState().save(updated)
  return updated
}
