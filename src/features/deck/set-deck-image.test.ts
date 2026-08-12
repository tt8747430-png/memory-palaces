import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository, type StoragePort } from '@/shared/api'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { started } from '@/shared/test/started'
import { setDeckImage } from './set-deck-image'

const NOW = new Date(0).toISOString()
const INLINE = `data:image/jpeg;base64,${btoa('cover')}`

function setup(image?: string) {
  const deck = { ...makeDeck({ id: 'd1', createdAt: NOW, name: 'Deck' }), image } as Deck
  const store = started(createDeckStore(new InMemoryRepository<Deck>([deck])))
  const storage = {
    upload: vi.fn().mockResolvedValue({ url: 'https://cdn/d1' }),
    remove: vi.fn().mockResolvedValue(undefined),
  }
  return { store, storage: storage as unknown as StoragePort & typeof storage }
}

describe('setDeckImage', () => {
  it('saves the cover inline first, then patches in the hosted URL', async () => {
    const { store, storage } = setup()

    const deck = await setDeckImage({ store, storage, userId: 'u1' }, 'd1', INLINE)

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'deck-images', path: 'u1/d1' }),
    )
    expect(deck.image).toBe('https://cdn/d1')
  })

  it('keeps the inline cover when the upload fails', async () => {
    const { store, storage } = setup()
    storage.upload.mockRejectedValue(new Error('offline'))

    const deck = await setDeckImage({ store, storage, userId: 'u1' }, 'd1', INLINE)

    expect(deck.image).toBe(INLINE)
  })

  it('never uploads a guest’s cover', async () => {
    const { store, storage } = setup()

    const deck = await setDeckImage({ store, storage, userId: null }, 'd1', INLINE)

    expect(storage.upload).not.toHaveBeenCalled()
    expect(deck.image).toBe(INLINE)
  })

  it('clears the cover and deletes the stored object', async () => {
    const { store, storage } = setup('https://cdn/d1')

    const deck = await setDeckImage({ store, storage, userId: 'u1' }, 'd1', null)

    expect(deck.image).toBeUndefined()
    expect(storage.remove).toHaveBeenCalledWith('deck-images', 'u1/d1')
  })
})
