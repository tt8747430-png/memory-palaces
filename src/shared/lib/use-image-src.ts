import { useEffect, useState } from 'react'
import type { StorageBucket } from '@/shared/api'
import { isInlineImage } from './inline-image'
import { onImageSettled, readCachedImage } from './image-cache'

/**
 * The four answers a stored image field has, all of them the hook's contract rather than the
 * caller's guesswork:
 *
 * - `inline` — a `data:` image still inside the document, which is its own source.
 * - `cached` — the bytes are on the device; `src` is an object URL over them.
 * - `pending` — the keeper has not settled this one yet. The caller renders its placeholder, not an
 *   error: this is the normal state on a device that has just pulled a deck it has never seen.
 * - `unavailable` — there is no image, or storage said the object does not exist.
 */
export type ImageSrc =
  | { state: 'inline'; src: string }
  | { state: 'cached'; src: string }
  | { state: 'pending' }
  | { state: 'unavailable' }

const PENDING: ImageSrc = { state: 'pending' }
const UNAVAILABLE: ImageSrc = { state: 'unavailable' }

/**
 * Resolves a stored image value to something renderable, **reading only the device**.
 *
 * MOBILE_DESIGN is binding here: "RxDB is the local source of truth — reads never touch the
 * network. Never block UI on a round-trip." So anything that is not inline is an object path, and a
 * path is looked up in the cache `keepImagesCached` fills — never handed to the browser as a URL to
 * go and fetch. When the keeper settles the image later, the hook hears about it and looks again.
 */
export function useImageSrc(bucket: StorageBucket, value: string | null | undefined): ImageSrc {
  const [resolved, setResolved] = useState<ImageSrc>(value ? PENDING : UNAVAILABLE)
  const inline = isInlineImage(value)

  useEffect(() => {
    if (!value || inline) return

    const image = { bucket, path: value }
    let url: string | null = null
    let live = true

    const look = async () => {
      const cached = await readCachedImage(image)
      if (!live) return
      if (cached.state === 'cached') {
        if (url) URL.revokeObjectURL(url)
        url = URL.createObjectURL(cached.blob)
        setResolved({ state: 'cached', src: url })
      } else {
        setResolved(cached.state === 'missing' ? UNAVAILABLE : PENDING)
      }
    }

    setResolved(PENDING)
    void look()
    const stop = onImageSettled((settled) => {
      if (settled.bucket === bucket && settled.path === value) void look()
    })

    return () => {
      live = false
      stop()
      if (url) URL.revokeObjectURL(url)
    }
  }, [bucket, value, inline])

  if (!value) return UNAVAILABLE
  if (inline) return { state: 'inline', src: value }
  return resolved
}
