import { InMemoryRepository } from '@/shared/api'
import { makePreferences } from '../model/types'
import { createPreferencesStore } from '../model/store'
import type { Preferences } from '../model/types'

/** The singleton as a device would have stored it, with whatever the test is about. */
export function storedPreferences(overrides: Partial<Preferences> = {}): Preferences {
  return {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    ...overrides,
  }
}

/**
 * A started preferences store holding `stored` — or holding nothing when null, as on a device that
 * never changed a setting.
 */
export function preferencesStoreHolding(stored: Partial<Preferences> | null = {}) {
  const store = createPreferencesStore(
    new InMemoryRepository<Preferences>(stored === null ? [] : [storedPreferences(stored)]),
  )
  store.getState().start()
  return store
}
