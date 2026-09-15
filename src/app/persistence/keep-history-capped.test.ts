import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import {
  createHistoryStore,
  HISTORY_CAP,
  type HistoryEntry,
  makeHistoryEntry,
} from '@/entities/learning-history'
import { keepHistoryCapped } from './keep-history-capped'

const at = (ms: number) => new Date(ms).toISOString()

const entry = (id: string, ms: number): HistoryEntry =>
  makeHistoryEntry({
    id,
    createdAt: at(ms),
    cardId: 'c1',
    deckId: 'd1',
    kind: 'graded',
    grade: 'good',
  })

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('keepHistoryCapped', () => {
  it('does nothing before the store has mirrored — idle is not "over cap"', async () => {
    const repo = new InMemoryRepository<HistoryEntry>([entry('h1', 1), entry('h2', 2)])
    const store = createHistoryStore(repo)

    const stop = keepHistoryCapped(store)
    await flush()

    expect(await repo.getAll()).toHaveLength(2)
    stop()
  })

  it('leaves a history that is inside its cap alone', async () => {
    const repo = new InMemoryRepository<HistoryEntry>([entry('h1', 1), entry('h2', 2)])
    const store = createHistoryStore(repo)
    store.getState().start()

    const stop = keepHistoryCapped(store)
    await flush()

    expect(await repo.getAll()).toHaveLength(2)
    stop()
  })

  it('trims a history that is already over the cap, dropping the oldest', async () => {
    // Seeded rather than written one at a time: what this covers is the log a write-time trim
    // never reaches — one that arrived over the cap, which is the whole reason the keeper exists.
    const over = Array.from({ length: HISTORY_CAP + 2 }, (_, i) => entry(`h${i}`, i + 1))
    const repo = new InMemoryRepository<HistoryEntry>(over)
    const store = createHistoryStore(repo)
    store.getState().start()

    const stop = keepHistoryCapped(store)
    await flush()

    const kept = await repo.getAll()
    expect(kept).toHaveLength(HISTORY_CAP)
    expect(kept.map((each) => each.id)).not.toContain('h0')
    expect(kept.map((each) => each.id)).toContain(`h${HISTORY_CAP + 1}`)
    stop()
  })

  it('stops watching once its unsubscribe is called', async () => {
    const repo = new InMemoryRepository<HistoryEntry>()
    const store = createHistoryStore(repo)
    store.getState().start()
    const stop = keepHistoryCapped(store)

    stop()
    await repo.save(entry('h1', 1))
    await flush()

    expect(await repo.getAll()).toHaveLength(1)
  })
})

describe('a history entry pulled from the cloud', () => {
  it('does not resurrect one this device trimmed — trimming is by recency', async () => {
    // The cap is two here by construction: the store holds the newest first, and the keeper drops
    // everything past `HISTORY_CAP`. What matters is that an *older* arrival is dropped again
    // rather than pushing a newer entry out.
    const newest = Array.from({ length: HISTORY_CAP }, (_, i) => entry(`h${i}`, 1000 + i))
    const repo = new InMemoryRepository<HistoryEntry>(newest)
    const store = createHistoryStore(repo)
    store.getState().start()
    const stop = keepHistoryCapped(store)
    await flush()

    // An entry from another device, older than everything the device already holds.
    await store.getState().save(entry('from-elsewhere', 1))
    await flush()
    await flush()

    expect(store.getState().history).toHaveLength(HISTORY_CAP)
    expect(store.getState().history.some((e) => e.id === 'from-elsewhere')).toBe(false)
    stop()
  }, 20_000)
})
