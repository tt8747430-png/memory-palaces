import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ObjectMissingError,
  type ObjectRef,
  objectPath,
  SIGNED_URL_TTL_SECONDS,
  type StoragePort,
  type UploadInput,
} from '@/shared/api'

/** Storage answers a missing object with HTTP 400 and a `statusCode` of `'404'`. */
const isNotFound = (error: { message: string; statusCode?: string; status?: number }): boolean =>
  error.statusCode === '404' || error.status === 404 || /not found/i.test(error.message)

/**
 * Both buckets are **private**. Reads, writes, replacements and deletes are all scoped to the
 * caller's own `${userId}/` prefix by RLS, so a deck cover is no longer fetchable by anyone holding
 * the URL.
 *
 * Which is why `upload` answers with a path rather than a URL: a signed URL expires, and a document
 * that stored one would carry a dead link to every other device. The path is the durable name;
 * `signedUrl` is how the image keeper turns it into bytes.
 */
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
