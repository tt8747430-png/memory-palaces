import type { StorageBucket, StoragePort } from '@/shared/api'
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
 * Moves an inline image into storage, returning its hosted URL — or null if that could not happen,
 * in which case the caller keeps the inline copy and tries again later. Never throws: failing to
 * upload a picture must not fail the write that carried it.
 */
export async function uploadInlineImage(
  storage: StoragePort,
  input: { bucket: StorageBucket; path: string; dataUrl: string },
): Promise<string | null> {
  if (!isInlineImage(input.dataUrl)) return null
  try {
    const file = dataUrlToBlob(input.dataUrl)
    const { url } = await storage.upload({
      bucket: input.bucket,
      path: input.path,
      file,
      contentType: file.type,
    })
    return url
  } catch {
    return null
  }
}
