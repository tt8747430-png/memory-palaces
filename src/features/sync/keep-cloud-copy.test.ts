import { describe, expect, it } from 'vitest'
import { makeCard } from '@/entities/card'
import { makeDeck } from '@/entities/deck'
import { AT, syncFixture } from './testing/fake-cloud'
import { keepCloudCopy } from './keep-cloud-copy'

const deck = (id: string, name = id) => makeDeck({ id, createdAt: AT, name })
const card = (id: string, deckId: string) =>
  makeCard({ id, createdAt: AT, deckId, front: id, back: id })

describe('keepCloudCopy', () => {
  it('brings the cloud’s copy back and drops its pending change — nothing is left to push', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1', 'Kanji'))

    await keepCloudCopy(deps, { collection: 'decks', id: 'd1' })

    expect(deps.deckStore.getState().decks.map((row) => row.name)).toEqual(['Kanji'])
    expect(log()).toEqual([])
  })

  it('brings back the deck’s cards that were deleted with it, so a kept deck is not empty', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.cardStore.getState().save(card('c1', 'd1'))
    await deps.cardStore.getState().remove('c1')
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1'))
    cloud.write('cards', card('c1', 'd1'))

    await keepCloudCopy(deps, { collection: 'decks', id: 'd1' })

    expect(deps.cardStore.getState().cards.map((row) => row.id)).toEqual(['c1'])
    expect(log()).toEqual([])
  })

  it('leaves alone what the same review answered Delete for, inside the kept deck', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.cardStore.getState().save(card('c1', 'd1'))
    await deps.cardStore.getState().remove('c1')
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1'))
    cloud.write('cards', card('c1', 'd1'))

    await keepCloudCopy(deps, { collection: 'decks', id: 'd1' }, new Set(['cards:c1']))

    expect(deps.deckStore.getState().decks.map((row) => row.id)).toEqual(['d1'])
    expect(deps.cardStore.getState().cards).toEqual([])
    expect(log().map((row) => row.id)).toEqual(['cards:c1'])
  })

  it('lets a deletion stand when the cloud no longer holds the document', async () => {
    const { deps, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')

    await keepCloudCopy(deps, { collection: 'decks', id: 'd1' })

    expect(deps.deckStore.getState().decks).toEqual([])
    expect(log().map((row) => row.op)).toEqual(['remove'])
  })
})
