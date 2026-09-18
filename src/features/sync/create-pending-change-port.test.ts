import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { createProgressStore, makeProgress, type Progress } from '@/entities/progress'
import { createHistoryStore, type HistoryEntry } from '@/entities/learning-history'
import {
  createPendingChangeStore,
  type PendingChange,
  selectPendingChanges,
} from '@/entities/pending-change'
import { createPendingChangePort } from './create-pending-change-port'

const AT = '2026-01-01T00:00:00.000Z'

const deck = (id: string, name = id) => makeDeck({ id, createdAt: AT, name, order: 0 })

function setup() {
  const log = started(createPendingChangeStore(new InMemoryRepository<PendingChange>()))
  let tick = 0
  const now = () => `2026-01-0${++tick}T00:00:00.000Z`
  const decks = started(
    createDeckStore(new InMemoryRepository<Deck>(), createPendingChangePort(log, 'decks', now)),
  )
  const rows = () => selectPendingChanges(log.getState())
  return { log, decks, rows }
}

describe('the pending change log', () => {
  it('records a save against the document it was made to', async () => {
    const { decks, rows } = setup()

    await decks.getState().save(deck('d1'))

    expect(rows()).toEqual([
      {
        id: 'decks:d1',
        table: 'decks',
        entityId: 'd1',
        op: 'save',
        at: '2026-01-01T00:00:00.000Z',
      },
    ])
  })

  it('collapses repeated edits onto one entry, keeping the latest time', async () => {
    const { decks, rows } = setup()

    await decks.getState().save(deck('d1', 'first'))
    await decks.getState().save(deck('d1', 'second'))
    await decks.getState().save(deck('d1', 'third'))

    expect(rows()).toHaveLength(1)
    expect(rows()[0]?.at).toBe('2026-01-03T00:00:00.000Z')
  })

  it('replaces a save with the remove that followed it', async () => {
    const { decks, rows } = setup()

    await decks.getState().save(deck('d1'))
    await decks.getState().remove('d1')

    expect(rows()).toHaveLength(1)
    expect(rows()[0]?.op).toBe('remove')
  })

  it('replaces a remove with the save that followed it — the log holds the net state', async () => {
    const { decks, rows } = setup()

    await decks.getState().save(deck('d1'))
    await decks.getState().remove('d1')
    await decks.getState().save(deck('d1', 'back again'))

    expect(rows()).toHaveLength(1)
    expect(rows()[0]?.op).toBe('save')
  })

  it('keeps one entry per document', async () => {
    const { decks, rows } = setup()

    await decks.getState().save(deck('d1'))
    await decks.getState().save(deck('d2'))

    expect(rows().map((row) => row.id)).toEqual(['decks:d1', 'decks:d2'])
  })

  it('records a singleton write against its own table — it waits for a Sync like any other', async () => {
    const { log, rows } = setup()
    let tick = 0
    const now = () => `2026-02-0${++tick}T00:00:00.000Z`
    const progress = started(
      createProgressStore(
        new InMemoryRepository<Progress>(),
        createPendingChangePort(log, 'progress', now),
      ),
    )

    await progress.getState().save(makeProgress({ id: 'progress', createdAt: AT, xp: 10 }))

    expect(rows()).toEqual([
      {
        id: 'progress:progress',
        table: 'progress',
        entityId: 'progress',
        op: 'save',
        at: '2026-02-01T00:00:00.000Z',
      },
    ])
  })

  it('records a history entry — history syncs too', async () => {
    const { log, rows } = setup()
    const history = started(
      createHistoryStore(
        new InMemoryRepository<HistoryEntry>(),
        createPendingChangePort(log, 'history', () => AT),
      ),
    )

    await history.getState().save({
      id: 'h1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      cardId: 'c1',
      deckId: 'd1',
      kind: 'answered',
      outcome: 'gotIt',
    })

    expect(rows().map((row) => row.id)).toEqual(['history:h1'])
  })

  it('records nothing for a store given no port — a device-local collection', async () => {
    const { rows } = setup()
    const history = started(createHistoryStore(new InMemoryRepository<HistoryEntry>()))

    await history.getState().save({
      id: 'h1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      cardId: 'c1',
      deckId: 'd1',
      kind: 'answered',
      outcome: 'gotIt',
    })

    expect(rows()).toEqual([])
  })
})
