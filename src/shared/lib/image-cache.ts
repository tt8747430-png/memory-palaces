import type { ImageRef } from '@/shared/api'

/** Where the bytes of every referenced image live on the device. */
export const IMAGE_CACHE = 'mindscape-images'

/**
 * The key an image is stored under: `<bucket>/<path>`, and never the URL it was fetched from.
 *
 * A signed URL carries an expiring token in its query string, so keying on it would mean a fresh
 * entry every hour and a cache that only ever grows. The synthetic prefix keeps these keys from
 * colliding with anything the service worker precaches.
 */
export const imageCacheKey = ({ bucket, path }: ImageRef): string => `/__image/${bucket}/${path}`

/** The marker that says storage answered "no such object" — so the image is unavailable, not late. */
const missingKey = ({ bucket, path }: ImageRef): string => `/__image-missing/${bucket}/${path}`

export type CachedImage =
  { state: 'cached'; blob: Blob } | { state: 'missing' } | { state: 'absent' }

const listeners = new Set<(image: ImageRef) => void>()

/**
 * Told whenever the keeper settles an image, so a reader showing `pending` can look again instead
 * of waiting for a remount.
 */
export function onImageSettled(listener: (image: ImageRef) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const settled = (image: ImageRef) => {
  for (const listener of listeners) listener(image)
}

/**
 * Null where Cache Storage does not exist. It is a secure-context API, so a build served over plain
 * HTTP to a phone on the LAN has none — and that is how a device is checked before a deploy. The
 * app still renders there: every image reads as `pending`, nothing throws.
 */
async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(IMAGE_CACHE)
  } catch {
    return null
  }
}

export async function readCachedImage(image: ImageRef): Promise<CachedImage> {
  const cache = await openCache()
  if (!cache) return { state: 'absent' }
  const response = await cache.match(imageCacheKey(image))
  if (response) return { state: 'cached', blob: await response.blob() }
  return (await cache.match(missingKey(image))) ? { state: 'missing' } : { state: 'absent' }
}

/** Whether the keeper has already settled this image, one way or the other. */
export async function isImageSettled(image: ImageRef): Promise<boolean> {
  return (await readCachedImage(image)).state !== 'absent'
}

export async function writeCachedImage(image: ImageRef, response: Response): Promise<void> {
  const cache = await openCache()
  if (!cache) return
  await cache.put(imageCacheKey(image), response)
  await cache.delete(missingKey(image))
  settled(image)
}

export async function markImageMissing(image: ImageRef): Promise<void> {
  const cache = await openCache()
  if (!cache) return
  await cache.put(missingKey(image), new Response(null, { status: 204 }))
  settled(image)
}
