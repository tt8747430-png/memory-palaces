import { describe, expect, it } from 'vitest'
import { makePendingChange } from './types'
import { pendingByTable, pendingIn, selectLatestPendingAt, selectPendingCount } from './selectors'
import type { PendingChangeState } from './store'

const change = (table: string, entityId: string, at = 't1') =>
  makePendingChange({ table, entityId, op: 'save', at })

const holding = (pendingChanges: PendingChangeState['pendingChanges']): PendingChangeState => ({
  pendingChanges,
  status: 'ready',
  start: () => {},
  stop: () => {},
  save: async (entry) => entry,
  remove: async () => {},
})

describe('pending-change selectors', () => {
  it('counts every entry — each one is a synced document', () => {
    expect(
      selectPendingCount(holding([change('decks', 'd1'), change('progress', 'progress')])),
    ).toBe(2)
  })

  it('finds the newest write, wherever it sits in the log, and null for an empty one', () => {
    expect(selectLatestPendingAt(holding([]))).toBeNull()
    expect(
      selectLatestPendingAt(
        holding([change('decks', 'd1', 't3'), change('cards', 'c1', 't9'), change('cards', 'c2', 't5')]),
      ),
    ).toBe('t9')
  })

  it('keeps only the changes a Sync over the live tables would carry', () => {
    const changes = [change('decks', 'd1'), change('bible_verses', 'v1')]
    expect(pendingIn(changes, ['decks', 'cards'])).toEqual([changes[0]])
    expect(pendingIn(changes, ['decks', 'bible_verses'])).toEqual(changes)
  })

  it('breaks the log down by table, naming only the tables that have something waiting', () => {
    expect(
      pendingByTable([change('decks', 'd1'), change('cards', 'c1'), change('cards', 'c2')]),
    ).toEqual({ decks: 1, cards: 2 })
  })
})
