import type { ImageRef } from '@/shared/api'

export const IMAGE_CACHE = 'mindscape-images'

export const imageCacheKey = ({ bucket, path }: ImageRef): string => `/__image/${bucket}/${path}`

const missingKey = ({ bucket, path }: ImageRef): string => `/__image-missing/${bucket}/${path}`

export type CachedImage =
  { state: 'cached'; blob: Blob } | { state: 'missing' } | { state: 'absent' }

const listeners = new Set<(image: ImageRef) => void>()

export function onImageSettled(listener: (image: ImageRef) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const settled = (image: ImageRef) => {
  for (const listener of listeners) listener(image)
}

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
