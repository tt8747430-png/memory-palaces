import { describe, expect, it, vi } from 'vitest'
import { makeCard } from '@/entities/card'
import { makeDeck } from '@/entities/deck'
import { AT, syncFixture } from './testing/fake-cloud'
import { applyPendingDeletions } from './apply-pending-deletions'

const deck = (id: string, name = id) => makeDeck({ id, createdAt: AT, name })
const card = (id: string, deckId: string) =>
  makeCard({ id, createdAt: AT, deckId, front: id, back: id })

describe('applyPendingDeletions', () => {
  it('keeps what was kept and finishes the Sync without asking the same question again', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1', 'Kanji'))

    const outcome = await applyPendingDeletions(deps, [
      { collection: 'decks', id: 'd1', keep: true },
    ])

    expect(outcome.kind).toBe('merged')
    expect(cloud.cycles).toBe(1)
    expect(deps.deckStore.getState().decks.map((row) => row.name)).toEqual(['Kanji'])
  })

  it('re-deletes a Delete answer now, so the tombstone is dated after the edit it overrules', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1', 'edited elsewhere'))
    const remove = vi.spyOn(deps.deckStore.getState(), 'remove')

    await applyPendingDeletions(deps, [{ collection: 'decks', id: 'd1', keep: false }])

    expect(remove).toHaveBeenCalledWith('d1')
    expect(cloud.row('decks', 'd1')?.deleted).toBe(true)
    expect(deps.deckStore.getState().decks).toEqual([])
  })

  it('tombstones the unseen children of a deleted deck, so they do not arrive as orphans', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('cards', card('remote-card', 'd1'))

    await applyPendingDeletions(deps, [
      {
        collection: 'decks',
        id: 'd1',
        keep: false,
        descendants: [{ collection: 'cards', id: 'remote-card' }],
      },
    ])

    expect(cloud.row('cards', 'remote-card')?.deleted).toBe(true)
    expect(deps.cardStore.getState().cards).toEqual([])
  })

  it('lets a Delete answer stand inside a kept deck, whichever answer lands first', async () => {
    const { deps, cloud } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.cardStore.getState().save(card('c1', 'd1'))
    await deps.cardStore.getState().remove('c1')
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1', 'edited elsewhere'))
    cloud.write('cards', card('c1', 'd1'))

    const outcome = await applyPendingDeletions(deps, [
      { collection: 'decks', id: 'd1', keep: true },
      { collection: 'cards', id: 'c1', keep: false },
    ])

    expect(outcome.kind).toBe('merged')
    expect(deps.deckStore.getState().decks.map((row) => row.id)).toEqual(['d1'])
    expect(deps.cardStore.getState().cards).toEqual([])
    expect(cloud.row('cards', 'c1')?.deleted).toBe(true)
    expect(cloud.row('decks', 'd1')?.deleted).toBe(false)
  })

  it('keeps only what was kept when answers differ', async () => {
    const { deps, cloud } = syncFixture()
    for (const id of ['d1', 'd2']) {
      await deps.deckStore.getState().save(deck(id))
      await deps.deckStore.getState().remove(id)
      cloud.write('decks', deck(id))
    }

    await applyPendingDeletions(deps, [
      { collection: 'decks', id: 'd1', keep: true },
      { collection: 'decks', id: 'd2', keep: false },
    ])

    expect(deps.deckStore.getState().decks.map((row) => row.id)).toEqual(['d1'])
  })
})
