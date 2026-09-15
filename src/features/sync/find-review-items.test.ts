import { describe, expect, it } from 'vitest'
import { makeDeck } from '@/entities/deck'
import { selectSyncState } from '@/entities/sync-state'
import { AT, syncFixture } from './testing/fake-cloud'
import { findReviewItems } from './find-review-items'

const deck = (id: string) => makeDeck({ id, createdAt: AT, name: id })

describe('findReviewItems', () => {
  it('asks the question without running a cycle or touching the log', async () => {
    const { deps, cloud, log } = syncFixture()
    await deps.deckStore.getState().save(deck('d1'))
    await deps.deckStore.getState().remove('d1')
    cloud.write('decks', deck('d1'))

    await expect(findReviewItems(deps)).resolves.toEqual({
      kind: 'needs-review',
      items: [{ collection: 'decks', id: 'd1' }],
    })
    expect(cloud.cycles).toBe(0)
    expect(log()).toHaveLength(1)
    expect(selectSyncState(deps.syncStateStore.getState()).lastSyncedAt).toBeNull()
  })

  it('answers clean when nothing clashes, still without a cycle', async () => {
    const { deps, cloud } = syncFixture()
    cloud.write('decks', deck('remote'))

    await expect(findReviewItems(deps)).resolves.toEqual({ kind: 'clean' })
    expect(cloud.cycles).toBe(0)
  })

  it('answers offline without asking the cloud', async () => {
    const { deps } = syncFixture()
    deps.isOnline = () => false

    await expect(findReviewItems(deps)).resolves.toEqual({ kind: 'offline' })
  })
})
