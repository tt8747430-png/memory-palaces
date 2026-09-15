import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { fakeCacheStorage } from '@/shared/test/fake-cache-storage'
import { markImageMissing, writeCachedImage } from './image-cache'
import { useImageSrc } from './use-image-src'

const INLINE = `data:image/jpeg;base64,${btoa('cover')}`

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('caches', fakeCacheStorage().caches)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const render = (value: string | null | undefined) =>
  renderHook(() => useImageSrc('deck-images', value))

describe('useImageSrc', () => {
  it('reports nothing for an absent value', () => {
    expect(render(null).result.current).toEqual({ state: 'unavailable' })
  })

  it('short-circuits an inline image with no lookup at all', () => {
    expect(render(INLINE).result.current).toEqual({ state: 'inline', src: INLINE })
  })

  it('never hands the browser a URL to fetch — a remote address is a path it cannot find', async () => {
    const { result } = render('https://cdn.example/cover.png')

    await waitFor(() => expect(result.current).toEqual({ state: 'pending' }))
  })

  it('reports pending until the keeper settles the image, then looks again on its own', async () => {
    const { result } = render('u1/d1')
    await waitFor(() => expect(result.current).toEqual({ state: 'pending' }))

    await act(() =>
      writeCachedImage({ bucket: 'deck-images', path: 'u1/d1' }, new Response('bytes')),
    )

    await waitFor(() => expect(result.current).toEqual({ state: 'cached', src: 'blob:cached' }))
  })

  it('reports unavailable once storage said the object does not exist', async () => {
    await markImageMissing({ bucket: 'deck-images', path: 'u1/gone' })

    const { result } = render('u1/gone')

    await waitFor(() => expect(result.current).toEqual({ state: 'unavailable' }))
  })

  it('performs no network call in any state — reads never touch the network', async () => {
    await writeCachedImage({ bucket: 'deck-images', path: 'u1/d1' }, new Response('bytes'))

    render(INLINE)
    render('u1/d1')
    render('https://cdn.example/cover.png')
    render(null)
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('revokes the object URL it made when the caller unmounts', async () => {
    await writeCachedImage({ bucket: 'deck-images', path: 'u1/d1' }, new Response('bytes'))
    const view = render('u1/d1')
    await waitFor(() => expect(view.result.current).toMatchObject({ state: 'cached' }))

    view.unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cached')
  })
})
