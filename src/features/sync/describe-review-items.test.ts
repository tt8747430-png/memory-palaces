import { describe, expect, it } from 'vitest'
import { makeCard } from '@/entities/card'
import { makeDeck } from '@/entities/deck'
import { AT, syncFixture } from './testing/fake-cloud'
import { describeReviewItems } from './describe-review-items'

describe('describeReviewItems', () => {
  it('names each item from the cloud’s copy, in the order asked, with one fetch per collection', async () => {
    const { deps, cloud } = syncFixture()
    cloud.write('decks', makeDeck({ id: 'd1', createdAt: AT, name: 'Kanji' }))
    cloud.write(
      'cards',
      makeCard({ id: 'c1', createdAt: AT, deckId: 'd1', front: '水', back: 'w' }),
    )
    cloud.write(
      'cards',
      makeCard({ id: 'c2', createdAt: AT, deckId: 'd1', front: '火', back: 'f' }),
    )

    const rows = await describeReviewItems(deps, [
      { collection: 'cards', id: 'c2' },
      { collection: 'decks', id: 'd1', descendants: [{ collection: 'cards', id: 'c9' }] },
      { collection: 'cards', id: 'c1' },
    ])

    expect(rows).toEqual([
      { collection: 'cards', id: 'c2', label: '火' },
      {
        collection: 'decks',
        id: 'd1',
        descendants: [{ collection: 'cards', id: 'c9' }],
        label: 'Kanji',
      },
      { collection: 'cards', id: 'c1', label: '水' },
    ])
    expect(cloud.fetched).toEqual([
      { table: 'decks', ids: ['d1'] },
      { table: 'cards', ids: ['c2', 'c1'] },
    ])
  })

  it('drops what the cloud no longer holds, and falls back to the id for a blank name', async () => {
    const { deps, cloud } = syncFixture()
    cloud.write('decks', makeDeck({ id: 'gone', createdAt: AT, name: 'Gone' }), true)
    cloud.write('decks', { ...makeDeck({ id: 'blank', createdAt: AT, name: 'x' }), name: '  ' })

    const rows = await describeReviewItems(deps, [
      { collection: 'decks', id: 'gone' },
      { collection: 'decks', id: 'blank' },
      { collection: 'decks', id: 'never' },
    ])

    expect(rows).toEqual([{ collection: 'decks', id: 'blank', label: 'blank' }])
  })
})
