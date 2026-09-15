import { describe, expect, it } from 'vitest'
import { makePendingChange } from './types'
import { pendingByCollection, selectLatestPendingAt, selectPendingCount } from './selectors'
import type { PendingChangeState } from './store'

const change = (collection: 'decks' | 'cards', entityId: string, at: string) =>
  makePendingChange({ collection, entityId, op: 'save', at })

const holding = (pendingChanges: PendingChangeState['pendingChanges']): PendingChangeState => ({
  pendingChanges,
  status: 'ready',
  start: () => {},
  stop: () => {},
  save: async (entry) => entry,
  remove: async () => {},
})

describe('pending-change selectors', () => {
  it('counts every entry — each one is a content document', () => {
    expect(
      selectPendingCount(holding([change('decks', 'd1', 't1'), change('cards', 'c1', 't2')])),
    ).toBe(2)
  })

  it('finds the newest write, wherever it sits in the log, and null for an empty one', () => {
    expect(selectLatestPendingAt(holding([]))).toBeNull()
    expect(
      selectLatestPendingAt(
        holding([
          change('decks', 'd1', 't3'),
          change('cards', 'c1', 't9'),
          change('cards', 'c2', 't5'),
        ]),
      ),
    ).toBe('t9')
  })

  it('breaks the log down by collection, naming every collection even at zero', () => {
    expect(
      pendingByCollection([
        change('decks', 'd1', 't1'),
        change('cards', 'c1', 't1'),
        change('cards', 'c2', 't1'),
      ]),
    ).toEqual({
      folders: 0,
      decks: 1,
      cards: 2,
      questions: 0,
    })
  })
})
