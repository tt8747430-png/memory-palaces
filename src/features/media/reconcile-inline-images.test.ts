import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository, type StoragePort } from '@/shared/api'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { createProfileStore, makeProfile, type Profile } from '@/entities/profile'
import { started } from '@/shared/test/started'
import { reconcileInlineImages } from './reconcile-inline-images'

const NOW = new Date(0).toISOString()
const INLINE = `data:image/jpeg;base64,${btoa('photo')}`

function setup(decks: Deck[] = [], avatar: string | null = null) {
  const profileStore = started(
    createProfileStore(
      new InMemoryRepository<Profile>([makeProfile({ id: 'profile', createdAt: NOW, avatar })]),
    ),
  )
  const deckStore = started(createDeckStore(new InMemoryRepository<Deck>(decks)))
  const storage = {
    upload: vi.fn().mockResolvedValue({ url: 'https://cdn/moved' }),
    remove: vi.fn(),
  }
  return { profileStore, deckStore, storage: storage as unknown as StoragePort & typeof storage }
}

const deck = (id: string, image?: string) =>
  ({ ...makeDeck({ id, createdAt: NOW, name: id }), image }) as Deck

describe('reconcileInlineImages', () => {
  it('moves an inline avatar into storage and patches the hosted URL in', async () => {
    const { profileStore, deckStore, storage } = setup([], INLINE)

    const moved = await reconcileInlineImages({ profileStore, deckStore, storage, userId: 'u1' })

    expect(moved).toBe(1)
    expect(profileStore.getState().profile?.avatar).toBe('https://cdn/moved')
  })

  it('moves every inline deck cover', async () => {
    const { profileStore, deckStore, storage } = setup([deck('d1', INLINE), deck('d2', INLINE)])

    const moved = await reconcileInlineImages({ profileStore, deckStore, storage, userId: 'u1' })

    expect(moved).toBe(2)
    expect(storage.upload).toHaveBeenCalledTimes(2)
  })

  it('leaves already-hosted images alone', async () => {
    const { profileStore, deckStore, storage } = setup(
      [deck('d1', 'https://cdn/existing.jpg')],
      'https://cdn/avatar.jpg',
    )

    const moved = await reconcileInlineImages({ profileStore, deckStore, storage, userId: 'u1' })

    expect(moved).toBe(0)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('keeps the inline copy when the upload fails, so nothing is lost', async () => {
    const { profileStore, deckStore, storage } = setup([deck('d1', INLINE)])
    storage.upload.mockRejectedValue(new Error('offline'))

    const moved = await reconcileInlineImages({ profileStore, deckStore, storage, userId: 'u1' })

    expect(moved).toBe(0)
    expect(deckStore.getState().decks[0]?.image).toBe(INLINE)
  })
})
