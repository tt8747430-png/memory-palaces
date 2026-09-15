import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeCacheStorage } from '@/shared/test/fake-cache-storage'
import {
  imageCacheKey,
  isImageSettled,
  markImageMissing,
  onImageSettled,
  readCachedImage,
  writeCachedImage,
} from './image-cache'

let store: ReturnType<typeof fakeCacheStorage>

beforeEach(() => {
  store = fakeCacheStorage()
  vi.stubGlobal('caches', store.caches)
})

afterEach(() => vi.unstubAllGlobals())

describe('the image cache', () => {
  it('keys by bucket and path, never by the expiring URL the bytes came from', () => {
    expect(imageCacheKey({ bucket: 'avatars', path: 'u1/profile' })).toBe(
      '/__image/avatars/u1/profile',
    )
  })

  it('reads back what was written', async () => {
    await writeCachedImage({ bucket: 'deck-images', path: 'u1/d1' }, new Response('bytes'))

    const cached = await readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })
    expect(cached.state).toBe('cached')
    expect(await isImageSettled({ bucket: 'deck-images', path: 'u1/d1' })).toBe(true)
  })

  it('tells an image that is not there yet from one storage says does not exist', async () => {
    await expect(readCachedImage({ bucket: 'deck-images', path: 'u1/later' })).resolves.toEqual({
      state: 'absent',
    })

    await markImageMissing({ bucket: 'deck-images', path: 'u1/gone' })

    await expect(readCachedImage({ bucket: 'deck-images', path: 'u1/gone' })).resolves.toEqual({
      state: 'missing',
    })
    expect(await isImageSettled({ bucket: 'deck-images', path: 'u1/gone' })).toBe(true)
  })

  it('forgets a missing mark once the bytes do arrive', async () => {
    await markImageMissing({ bucket: 'avatars', path: 'u1/profile' })
    await writeCachedImage({ bucket: 'avatars', path: 'u1/profile' }, new Response('bytes'))

    expect((await readCachedImage({ bucket: 'avatars', path: 'u1/profile' })).state).toBe('cached')
  })

  it('tells readers when an image settles, so a pending one can look again', async () => {
    const heard: string[] = []
    const stop = onImageSettled(({ bucket, path }) => heard.push(`${bucket}/${path}`))

    await writeCachedImage({ bucket: 'deck-images', path: 'u1/d1' }, new Response('bytes'))
    await markImageMissing({ bucket: 'avatars', path: 'u1/profile' })
    stop()
    await writeCachedImage({ bucket: 'deck-images', path: 'u1/d2' }, new Response('bytes'))

    expect(heard).toEqual(['deck-images/u1/d1', 'avatars/u1/profile'])
  })

  it('answers absent where Cache Storage does not exist', async () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('caches', undefined)

    await expect(readCachedImage({ bucket: 'deck-images', path: 'u1/d1' })).resolves.toEqual({
      state: 'absent',
    })
  })
})
