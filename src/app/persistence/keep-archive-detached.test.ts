import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { keepArchiveDetached } from './keep-archive-detached'

const deck = (id: string, over: Partial<Deck> = {}): Deck => ({
  ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }),
  ...over,
})

describe('keepArchiveDetached', () => {
  it('lifts an archived deck out of its folder once the first snapshot lands', async () => {
    const store = createDeckStore(
      new InMemoryRepository<Deck>([deck('old', { archived: true, folderId: 'f1' })]),
    )
    const stop = keepArchiveDetached(store)

    store.getState().start()

    await waitFor(() =>
      expect(store.getState().decks.find((d) => d.id === 'old')?.folderId).toBeNull(),
    )
    stop()
  })

  it('lifts one that arrives later, the way a replicated deck does', async () => {
    const repo = new InMemoryRepository<Deck>([deck('main')])
    const store = createDeckStore(repo)
    store.getState().start()
    const stop = keepArchiveDetached(store)

    await repo.save(deck('synced', { archived: true, parentId: 'main' }))

    await waitFor(() =>
      expect(store.getState().decks.find((d) => d.id === 'synced')?.parentId).toBeNull(),
    )
    stop()
  })
})
