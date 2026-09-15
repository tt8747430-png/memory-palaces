import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ObjectMissingError,
  type ObjectRef,
  objectPath,
  SIGNED_URL_TTL_SECONDS,
  type StoragePort,
  type UploadInput,
} from '@/shared/api'

const isNotFound = (error: { message: string; statusCode?: string; status?: number }): boolean =>
  error.statusCode === '404' || error.status === 404 || /not found/i.test(error.message)

export class SupabaseStorage implements StoragePort {
  constructor(private readonly client: SupabaseClient) {}

  async upload(input: UploadInput): Promise<{ path: string }> {
    const path = objectPath(input)
    const { error } = await this.client.storage.from(input.bucket).upload(path, input.file, {
      upsert: true,
      contentType: input.contentType,
    })
    if (error) throw new Error(error.message)
    return { path }
  }

  async remove(ref: ObjectRef): Promise<void> {
    const { error } = await this.client.storage.from(ref.bucket).remove([objectPath(ref)])
    if (error) throw new Error(error.message)
  }

  async signedUrl(ref: ObjectRef): Promise<string> {
    const { data, error } = await this.client.storage
      .from(ref.bucket)
      .createSignedUrl(objectPath(ref), SIGNED_URL_TTL_SECONDS)
    if (error) throw isNotFound(error) ? new ObjectMissingError(ref) : new Error(error.message)
    if (!data?.signedUrl) throw new Error(`No signed URL for ${ref.bucket}/${objectPath(ref)}`)
    return data.signedUrl
  }
}
