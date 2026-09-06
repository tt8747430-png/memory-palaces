import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { withoutFields } from '@/shared/test/legacy-document'
import { createProgressStore } from './store'
import { makeProgress, type Progress } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('progress store — Dependency Injection', () => {
  it('reflects the seeded record through the injected repository', () => {
    const seed = makeProgress({ id: 'progress', createdAt: at(0), xp: 320, streakCount: 40 })
    const store = createProgressStore(new InMemoryRepository<Progress>([seed]))
    store.getState().start()
    expect(store.getState().progress?.streakCount).toBe(40)
  })

  it('completes a document written before a field existed', () => {
    // A device on an older build pushed this; the schema migration never sees it, because
    // replication writes at the current version. `mergeProgress` spreads `trainingDays`
    // unguarded inside the conflict handler, so an absent one used to throw there.
    const legacy = withoutFields(
      makeProgress({ id: 'progress', createdAt: at(0), xp: 320, streakCount: 40 }),
      'trainingDays',
      'activeDayCount',
    )
    const store = createProgressStore(new InMemoryRepository<Progress>([legacy]))
    store.getState().start()
    expect(store.getState().progress?.trainingDays).toEqual([])
    expect(store.getState().progress?.activeDayCount).toBe(0)
    expect(store.getState().progress?.streakCount).toBe(40)
  })
})
