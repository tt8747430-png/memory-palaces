import { afterEach, describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createPreferencesStore, type Preferences } from '@/entities/preferences'
import {
  preferencesStoreHolding,
  storedPreferences as stored,
} from '@/entities/preferences/testing/stored-preferences'
import {
  adoptDeviceSettings,
  AUTOSYNC_OFF_HANDOFF_KEY,
  LEGACY_SETTING_KEYS,
} from './adopt-device-settings'

afterEach(() => localStorage.clear())

describe('adoptDeviceSettings', () => {
  it('moves the old dev-mode flag into Preferences and forgets it', async () => {
    localStorage.setItem(LEGACY_SETTING_KEYS.devMode, '1')
    const store = preferencesStoreHolding()
    await adoptDeviceSettings(store)
    expect(store.getState().preferences?.devMode).toBe(true)
    expect(localStorage.getItem(LEGACY_SETTING_KEYS.devMode)).toBeNull()
  })

  it('moves the expanded Library rows, and the Autosync choice sync-state handed over', async () => {
    localStorage.setItem(LEGACY_SETTING_KEYS.libraryExpanded, JSON.stringify(['deck-1', 'deck-2']))
    localStorage.setItem(AUTOSYNC_OFF_HANDOFF_KEY, '1')
    const store = preferencesStoreHolding()
    await adoptDeviceSettings(store)
    expect(store.getState().preferences?.libraryExpanded).toEqual(['deck-1', 'deck-2'])
    expect(store.getState().preferences?.autosync).toBe(false)
    expect(localStorage.length).toBe(0)
  })

  it('creates the document when this device never stored one — a migration would miss it', async () => {
    localStorage.setItem(LEGACY_SETTING_KEYS.devMode, '1')
    const store = preferencesStoreHolding(null)
    await adoptDeviceSettings(store)
    expect(store.getState().preferences?.devMode).toBe(true)
  })

  it('returns at once when there is nothing to adopt — boot never waits on the database for it', async () => {
    const unstarted = createPreferencesStore(new InMemoryRepository<Preferences>([stored()]))
    await adoptDeviceSettings(unstarted)
    expect(unstarted.getState().status).toBe('idle')
  })

  it('ignores an expanded set it cannot read, and still forgets it', async () => {
    localStorage.setItem(LEGACY_SETTING_KEYS.libraryExpanded, '{not json')
    const store = preferencesStoreHolding()
    await adoptDeviceSettings(store)
    expect(store.getState().preferences?.libraryExpanded).toEqual([])
    expect(localStorage.getItem(LEGACY_SETTING_KEYS.libraryExpanded)).toBeNull()
  })

  it('keeps the old keys when the write fails, so the next launch tries again', async () => {
    localStorage.setItem(LEGACY_SETTING_KEYS.devMode, '1')
    const failing = started(
      createPreferencesStore({
        observe: (emit: (all: Preferences[]) => void) => {
          emit([])
          return () => {}
        },
        save: () => Promise.reject(new Error('disk is full')),
        remove: () => Promise.resolve(),
      } as never),
    )
    await expect(adoptDeviceSettings(failing)).rejects.toThrow('disk is full')
    expect(localStorage.getItem(LEGACY_SETTING_KEYS.devMode)).toBe('1')
  })
})
