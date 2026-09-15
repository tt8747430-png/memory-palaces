import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import {
  createHistoryStore,
  HISTORY_CAP,
  type HistoryEntry,
  type HistoryStore,
} from '@/entities/learning-history'
import { started } from '@/shared/test/started'
import { forgetCardHistory } from './forget-card-history'
import { recordHistory, recordHistoryBatch } from './record-history'

function historyStore(seed: HistoryEntry[] = []): HistoryStore {
  return started(createHistoryStore(new InMemoryRepository<HistoryEntry>(seed)))
}

const entries = (store: HistoryStore) => store.getState().history
const answered = (cardId: string) =>
  ({ cardId, deckId: 'd1', kind: 'answered', outcome: 'gotIt' }) as const

describe('recordHistory', () => {
  it('stamps the entry with the injected clock and hands it back', async () => {
    const store = historyStore()
    const entry = await recordHistory(store, answered('c1'), 5000)
    expect(entry.createdAt).toBe(new Date(5000).toISOString())
    expect(entries(store)).toEqual([entry])
  })
})

describe('recordHistoryBatch', () => {
  it('writes one entry per draft under a single clock', async () => {
    const store = historyStore()
    const written = await recordHistoryBatch(store, [answered('c1'), answered('c2')], 7000)
    expect(written).toHaveLength(2)
    expect(entries(store)).toHaveLength(2)
    expect(new Set(entries(store).map((entry) => entry.createdAt))).toEqual(
      new Set([new Date(7000).toISOString()]),
    )
  })

  // 2001 writes against `InMemoryRepository`, which re-clones the whole collection on every save:
  // quadratic by construction, ~2.5s on its own and slower under a loaded suite. The cap is the
  // thing being tested and it needs the real number, so the budget is raised rather than the cap
  // lowered.
  it('trims past the cap even when the batch crosses it in one go', async () => {
    const store = historyStore()
    const drafts = Array.from({ length: HISTORY_CAP + 5 }, () => answered('c1'))
    await recordHistoryBatch(store, drafts, 1000)
    expect(entries(store)).toHaveLength(HISTORY_CAP)
  }, 20_000)

  it('writes nothing for an empty batch', async () => {
    const store = historyStore()
    expect(await recordHistoryBatch(store, [], 1000)).toEqual([])
    expect(entries(store)).toHaveLength(0)
  })
})

describe('forgetCardHistory', () => {
  it('drops every entry for the named cards and leaves the rest', async () => {
    const store = historyStore()
    await recordHistory(store, answered('c1'), 1000)
    await recordHistory(store, answered('c1'), 2000)
    await recordHistory(store, answered('c2'), 3000)

    await forgetCardHistory(store, ['c1'])

    expect(entries(store).map((entry) => entry.cardId)).toEqual(['c2'])
  })

  it('is quiet about a card that has no history', async () => {
    const store = historyStore()
    await recordHistory(store, answered('c1'), 1000)
    await forgetCardHistory(store, ['c9'])
    expect(entries(store)).toHaveLength(1)
  })
})
