import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import {
  createHistoryStore,
  HISTORY_CAP,
  type HistoryEntry,
  makeHistoryEntry,
  selectHistory,
} from '@/entities/learning-history'
import {
  type AppNotification,
  createNotificationStore,
  makeNotification,
  NOTIFICATION_CAP,
  selectNotifications,
} from '@/entities/notification'
import { keepCapped } from './keep-capped'

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

const notification = (id: string, ms: number): AppNotification =>
  makeNotification({ id, createdAt: at(ms), milestone: { type: 'streak', count: 7 } })

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('keepCapped', () => {
  it('does nothing before the store has mirrored — idle is not "over cap"', async () => {
    const repo = new InMemoryRepository<HistoryEntry>([entry('h1', 1), entry('h2', 2)])
    const store = createHistoryStore(repo)

    const stop = keepCapped(store, selectHistory, 1)
    await flush()

    expect(await repo.getAll()).toHaveLength(2)
    stop()
  })

  it('leaves a collection that is inside its cap alone', async () => {
    const repo = new InMemoryRepository<HistoryEntry>([entry('h1', 1), entry('h2', 2)])
    const store = createHistoryStore(repo)
    store.getState().start()

    const stop = keepCapped(store, selectHistory, HISTORY_CAP)
    await flush()

    expect(await repo.getAll()).toHaveLength(2)
    stop()
  })

  it('trims a collection that is already over the cap, dropping the oldest', async () => {
    const over = Array.from({ length: HISTORY_CAP + 2 }, (_, i) => entry(`h${i}`, i + 1))
    const repo = new InMemoryRepository<HistoryEntry>(over)
    const store = createHistoryStore(repo)
    store.getState().start()

    const stop = keepCapped(store, selectHistory, HISTORY_CAP)
    await flush()

    const kept = await repo.getAll()
    expect(kept).toHaveLength(HISTORY_CAP)
    expect(kept.map((each) => each.id)).not.toContain('h0')
    expect(kept.map((each) => each.id)).toContain(`h${HISTORY_CAP + 1}`)
    stop()
  })

  it('trims again as writes push a collection back over the cap', async () => {
    const repo = new InMemoryRepository<HistoryEntry>()
    const store = createHistoryStore(repo)
    store.getState().start()
    const stop = keepCapped(store, selectHistory, 2)

    for (const ms of [1, 2, 3, 4]) await store.getState().save(entry(`h${ms}`, ms))
    await flush()
    await flush()

    expect(store.getState().history.map((each) => each.id)).toEqual(['h4', 'h3'])
    stop()
  })

  it('stops mid-trim once its unsubscribe is called, leaving the rest alone', async () => {
    const over = Array.from({ length: 6 }, (_, i) => entry(`h${i}`, i + 1))
    const repo = new InMemoryRepository<HistoryEntry>(over)
    const store = createHistoryStore(repo)
    store.getState().start()

    const stop = keepCapped(store, selectHistory, 2)
    stop()
    await flush()
    await flush()

    // The first pass was already queued; nothing asks for a second one.
    expect((await repo.getAll()).length).toBeGreaterThanOrEqual(2)
    await store.getState().save(entry('h9', 99))
    await flush()
    expect(await repo.getAll()).toHaveLength(3)
  })

  it('stops watching once its unsubscribe is called', async () => {
    const repo = new InMemoryRepository<HistoryEntry>()
    const store = createHistoryStore(repo)
    store.getState().start()
    const stop = keepCapped(store, selectHistory, 0)

    stop()
    await repo.save(entry('h1', 1))
    await flush()

    expect(await repo.getAll()).toHaveLength(1)
  })

  it('caps notifications the same way, off the same order', async () => {
    const over = Array.from({ length: NOTIFICATION_CAP + 2 }, (_, i) =>
      notification(`n${i}`, i + 1),
    )
    const repo = new InMemoryRepository<AppNotification>(over)
    const store = createNotificationStore(repo)
    store.getState().start()

    const stop = keepCapped(store, selectNotifications, NOTIFICATION_CAP)
    await flush()

    const kept = await repo.getAll()
    expect(kept).toHaveLength(NOTIFICATION_CAP)
    expect(kept.map((each) => each.id)).not.toContain('n0')
    expect(kept.map((each) => each.id)).toContain(`n${NOTIFICATION_CAP + 1}`)
    stop()
  })
})

describe('an entry pulled from the cloud', () => {
  it('does not resurrect one this device trimmed — trimming is by recency', async () => {
    const newest = Array.from({ length: HISTORY_CAP }, (_, i) => entry(`h${i}`, 1000 + i))
    const repo = new InMemoryRepository<HistoryEntry>(newest)
    const store = createHistoryStore(repo)
    store.getState().start()
    const stop = keepCapped(store, selectHistory, HISTORY_CAP)
    await flush()

    await store.getState().save(entry('from-elsewhere', 1))
    await flush()
    await flush()

    expect(store.getState().history).toHaveLength(HISTORY_CAP)
    expect(store.getState().history.some((e) => e.id === 'from-elsewhere')).toBe(false)
    stop()
  }, 20_000)
})
