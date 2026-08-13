import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { withoutFields } from '@/shared/test/legacy-document'
import { DEFAULT_SELECT_TOOLBAR } from '@/shared/config/select-toolbar'
import { createPreferencesStore } from './store'
import { makePreferences, type Preferences } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('preferences store — Dependency Injection', () => {
  it('reflects the seeded record through the injected repository', () => {
    const seed = makePreferences({ id: 'preferences', createdAt: at(0), dailyGoal: 42 })
    const store = createPreferencesStore(new InMemoryRepository<Preferences>([seed]))
    store.getState().start()
    expect(store.getState().preferences?.dailyGoal).toBe(42)
  })

  it('completes a document written before a field existed', () => {
    // A device on an older build pushed this; the schema migration never sees it, because
    // replication writes at the current version.
    const legacy = withoutFields(
      makePreferences({ id: 'preferences', createdAt: at(0), dailyGoal: 42 }),
      'selectToolbar',
    )
    const store = createPreferencesStore(new InMemoryRepository<Preferences>([legacy]))
    store.getState().start()
    expect(store.getState().preferences?.selectToolbar).toEqual(DEFAULT_SELECT_TOOLBAR)
    expect(store.getState().preferences?.dailyGoal).toBe(42)
  })
})
