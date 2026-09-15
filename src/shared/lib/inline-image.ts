import type { ObjectRef, StoragePort } from '@/shared/api'
import { dataUrlToBlob } from './avatar'

/**
 * True while an image still lives inside the document as base64 rather than in storage.
 *
 * Inline is the honest offline state: an object URL would be dead on the next reload and meaningless
 * on another device, whereas a data URL syncs and renders anywhere. It is a waypoint, not a home —
 * `uploadInlineImage` moves it out as soon as there is a network.
 */
export const isInlineImage = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith('data:')

/**
 * Moves an inline image into storage, returning its object **path** — or null if that could not
 * happen, in which case the caller keeps the inline copy and tries again later. Never throws:
 * failing to upload a picture must not fail the write that carried it.
 *
 * A path rather than a URL because the buckets are private: a signed URL expires, and a document
 * that stored one would carry a dead link to every other device.
 */
export async function uploadInlineImage(
  storage: StoragePort,
  ref: ObjectRef,
  dataUrl: string,
): Promise<string | null> {
  if (!isInlineImage(dataUrl)) return null
  try {
    const file = dataUrlToBlob(dataUrl)
    const { path } = await storage.upload({ ...ref, file, contentType: file.type })
    return path
  } catch {
    return null
  }
}
