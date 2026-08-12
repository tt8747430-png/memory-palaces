export type StorageBucket = 'deck-images' | 'avatars'

export interface UploadInput {
  bucket: StorageBucket
  /** Always `${userId}/${entityId}` — storage RLS scopes writes to the caller's own prefix. */
  path: string
  file: Blob
  contentType?: string
}

/** Binary that is too big to live inside a synced document. */
export interface StoragePort {
  upload(input: UploadInput): Promise<{ url: string }>
  remove(bucket: StorageBucket, path: string): Promise<void>
}

/**
 * The no-cloud adapter: hands back an object URL and touches no network. Good enough for tests and
 * for a session with no Supabase project — callers keep their own durable local copy either way,
 * because an object URL dies with the document that made it.
 */
export class LocalObjectUrlStorage implements StoragePort {
  private readonly issued = new Map<string, string>()

  async upload(input: UploadInput): Promise<{ url: string }> {
    const url = URL.createObjectURL(input.file)
    this.issued.set(`${input.bucket}/${input.path}`, url)
    return { url }
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    const key = `${bucket}/${path}`
    const url = this.issued.get(key)
    if (!url) return
    URL.revokeObjectURL(url)
    this.issued.delete(key)
  }
}
