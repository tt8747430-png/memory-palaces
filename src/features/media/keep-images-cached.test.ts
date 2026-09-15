import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryRepository, ObjectMissingError, type StoragePort } from '@/shared/api'
import { readCachedImage } from '@/shared/lib'
import { fakeCacheStorage } from '@/shared/test/fake-cache-storage'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { createProfileStore, makeProfile, type Profile } from '@/entities/profile'
import { keepImagesCached } from './keep-images-cached'

const NOW = new Date(0).toISOString()
const INLINE = `data:image/jpeg;base64,${btoa('cover')}`

const deck = (id: string, image?: string): Deck =>
  ({ ...makeDeck({ id, createdAt: NOW, name: id }), image }) as Deck

function storagePort(signedUrl = vi.fn().mockResolvedValue('https://cdn/signed?token=abc')) {
  return { upload: vi.fn(), remove: vi.fn(), signedUrl } as unknown as StoragePort & {
    signedUrl: ReturnType<typeof vi.fn>
  }
}

function setup(decks: Deck[] = [], avatar: string | null = null) {
  const deckStore = started(createDeckStore(new InMemoryRepository<Deck>(decks)))
  const profileStore = started(
    createProfileStore(
      new InMemoryRepository<Profile>([makeProfile({ id: 'profile', createdAt: NOW, avatar })]),
    ),
  )
  return { deckStore, profileStore, target: new EventTarget() }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  vi.stubGlobal('caches', fakeCacheStorage().caches)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response('bytes', { status: 200 })),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('keepImagesCached', () => {
  it('fills the cache for every stored path a document points at', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')], 'u1/profile')
    const storage = storagePort()

    keepImagesCached({ deckStore, profileStore, storage, target })
    await settle()

    expect((await readCachedImage({ bucket: 'avatars', path: 'u1/profile' })).state).toBe('cached')
    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).state).toBe('cached')
    expect(storage.signedUrl).toHaveBeenCalledWith({
      bucket: 'deck-images',
      userId: 'u1',
      entityId: 'd1',
    })
  })

  it('leaves an inline image alone — there is nothing stored to fetch', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', INLINE)], INLINE)
    const storage = storagePort()

    keepImagesCached({ deckStore, profileStore, storage, target })
    await settle()

    expect(storage.signedUrl).not.toHaveBeenCalled()
  })

  it('does nothing offline, and leaves the image pending rather than missing', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')])
    const storage = storagePort(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    keepImagesCached({ deckStore, profileStore, storage, target })
    await settle()

    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).state).toBe('absent')
  })

  it('records an object storage says does not exist, so the reader stops waiting', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')])
    const missing = new ObjectMissingError({ bucket: 'deck-images', userId: 'u1', entityId: 'd1' })
    const storage = storagePort(vi.fn().mockRejectedValue(missing))

    keepImagesCached({ deckStore, profileStore, storage, target })
    await settle()

    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).state).toBe('missing')
  })

  it('tries again on reconnect — the next connected moment, not the next unrelated edit', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')])
    const signedUrl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('https://cdn/signed?token=abc')
    keepImagesCached({ deckStore, profileStore, storage: storagePort(signedUrl), target })
    await settle()
    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).state).toBe('absent')

    target.dispatchEvent(new Event('online'))
    await settle()

    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).state).toBe('cached')
  })

  it('tries again when the stores change', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')])
    const signedUrl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('https://cdn/signed?token=abc')
    keepImagesCached({ deckStore, profileStore, storage: storagePort(signedUrl), target })
    await settle()

    await deckStore.getState().save(deck('d2', 'u1/d2'))
    await settle()

    expect((await readCachedImage({ bucket: 'deck-images', path: 'u1/d2' })).state).toBe('cached')
  })

  it('never fetches an image it has already settled', async () => {
    const { deckStore, profileStore, target } = setup([deck('d1', 'u1/d1')])
    const storage = storagePort()

    keepImagesCached({ deckStore, profileStore, storage, target })
    await settle()
    target.dispatchEvent(new Event('online'))
    await settle()

    expect(storage.signedUrl).toHaveBeenCalledTimes(1)
  })

  it('stops watching when its teardown runs', async () => {
    const { deckStore, profileStore, target } = setup()
    const storage = storagePort()

    keepImagesCached({ deckStore, profileStore, storage, target })()
    await deckStore.getState().save(deck('d1', 'u1/d1'))
    target.dispatchEvent(new Event('online'))
    await settle()

    expect(storage.signedUrl).not.toHaveBeenCalled()
  })
})
