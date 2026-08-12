import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageBucket, StoragePort, UploadInput } from '@/shared/api'

/** Buckets are public-read; writes are scoped to the caller's own `${userId}/` prefix by RLS. */
export class SupabaseStorage implements StoragePort {
  constructor(private readonly client: SupabaseClient) {}

  async upload(input: UploadInput): Promise<{ url: string }> {
    const bucket = this.client.storage.from(input.bucket)
    const { error } = await bucket.upload(input.path, input.file, {
      upsert: true,
      contentType: input.contentType,
    })
    if (error) throw new Error(error.message)
    return { url: bucket.getPublicUrl(input.path).data.publicUrl }
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path])
    if (error) throw new Error(error.message)
  }
}
