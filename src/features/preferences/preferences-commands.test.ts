import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPreferencesStore, type Preferences } from '@/entities/preferences'
import { setPreferences } from './index'

const NOW = Date.UTC(2026, 0, 10)

function startedStore(seed: Preferences[] = []) {
  const store = createPreferencesStore(new InMemoryRepository<Preferences>(seed))
  store.getState().start()
  return store
}

describe('setPreferences', () => {
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
})
