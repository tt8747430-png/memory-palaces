import type { ObjectRef, StoragePort } from '@/shared/api'
import { dataUrlToBlob } from './avatar'

export const isInlineImage = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith('data:')

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
