import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPreferencesStore, makePreferences, type Preferences } from '@/entities/preferences'
import { setExtensionEnabled, setPreferences } from './index'
import { PREFERENCES_ID } from './set-preferences'

const NOW = Date.UTC(2026, 0, 10)

function startedStore(seed: Preferences[] = []) {
  const store = createPreferencesStore(new InMemoryRepository<Preferences>(seed))
  store.getState().start()
  return store
}

function startedPreferencesStore(over: Partial<Preferences> = {}) {
  const base = makePreferences({ id: PREFERENCES_ID, createdAt: new Date(0).toISOString() })
  return startedStore([{ ...base, ...over }])
}

describe('setPreferences', () => {
  it('waits for what is stored before writing — an unloaded store is not "no settings"', async () => {
    const stored = {
      ...makePreferences({ id: PREFERENCES_ID, createdAt: new Date(0).toISOString() }),
      theme: 'dark' as const,
    }
    const store = createPreferencesStore(new InMemoryRepository<Preferences>([stored]))
    const written = setPreferences(store, { haptics: false }, NOW)
    store.getState().start()
    const prefs = await written
    expect(prefs.theme).toBe('dark')
    expect(prefs.haptics).toBe(false)
  })

  it('creates the singleton and applies a change, keeping other defaults', async () => {
    const store = startedStore()
    const prefs = await setPreferences(store, { haptics: false }, NOW)
    expect(prefs.haptics).toBe(false)
    expect(prefs.soundEffects).toBe(true)
    expect(store.getState().preferences?.haptics).toBe(false)
  })

  it('merges successive changes into the one record', async () => {
    const store = startedStore()
    await setPreferences(store, { haptics: false }, NOW)
    const prefs = await setPreferences(store, { reducedMotion: true }, NOW)
    expect(prefs.haptics).toBe(false)
    expect(prefs.reducedMotion).toBe(true)
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = startedStore()
    const prefs = await setPreferences(store, { soundEffects: false }, NOW)
    expect(prefs.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('persists the chosen theme while keeping the other defaults', async () => {
    const store = startedStore()
    const prefs = await setPreferences(store, { theme: 'dark' }, NOW)
    expect(prefs.theme).toBe('dark')
    expect(prefs.language).toBe('en')
    expect(prefs.soundEffects).toBe(true)
  })

  it('merges a nested privacy change without dropping the other flags', async () => {
    const store = startedStore()
    const seeded = await setPreferences(store, {}, NOW)
    const prefs = await setPreferences(
      store,
      { privacy: { ...seeded.privacy, activitySharing: true } },
      NOW,
    )
    expect(prefs.privacy.activitySharing).toBe(true)
    expect(prefs.privacy.profileVisibility).toBe(true)
    expect(prefs.privacy.dataEncryption).toBe(false)
  })
})

describe('setExtensionEnabled', () => {
  it('turns one on without disturbing the others', async () => {
    const store = startedPreferencesStore({ extensions: ['atlas'] })
    const saved = await setExtensionEnabled(store, 'bible', true)
    expect(saved.extensions.sort()).toEqual(['atlas', 'bible'])
  })

  it('turns one off and leaves ids this build does not know', async () => {
    const store = startedPreferencesStore({ extensions: ['bible', 'from-the-future'] })
    const saved = await setExtensionEnabled(store, 'bible', false)
    expect(saved.extensions).toEqual(['from-the-future'])
  })

  it('enabling twice does not duplicate the id', async () => {
    const store = startedPreferencesStore({ extensions: ['bible'] })
    const saved = await setExtensionEnabled(store, 'bible', true)
    expect(saved.extensions).toEqual(['bible'])
  })
})
