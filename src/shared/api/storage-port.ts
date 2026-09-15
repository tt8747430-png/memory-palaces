export type StorageBucket = 'deck-images' | 'avatars'

/**
 * One stored object, named the way storage names it.
 *
 * `(bucket, userId, entityId)` used to travel as three loose arguments through upload, remove and
 * both schema migrations, and this slice would have added two more functions carrying them. One
 * type instead, and `objectPath` is the only place the layout `${userId}/${entityId}` is written —
 * which matters, because storage RLS reads the first segment as the owner.
 */
export interface ObjectRef {
  bucket: StorageBucket
  userId: string
  entityId: string
}

export const objectPath = (ref: Pick<ObjectRef, 'userId' | 'entityId'>): string =>
  `${ref.userId}/${ref.entityId}`

/**
 * A stored image as a document names it: the bucket, and the object path inside it. The stored
 * form of an `ObjectRef` — a deck's `image` and a profile's `avatar` are paths, and the image cache
 * is keyed by this pair.
 */
export interface ImageRef {
  bucket: StorageBucket
  path: string
}

/** `objectPath` read back — the other half of the one place the layout is written. */
export function parseObjectPath({ bucket, path }: ImageRef): ObjectRef | null {
  const [userId, entityId, ...rest] = path.split('/')
  return userId && entityId && !rest.length ? { bucket, userId, entityId } : null
}

/**
 * The object is not in storage, as opposed to storage being unreachable. The two need different
 * answers: a missing object will never arrive and the image is unavailable; an unreachable one is
 * worth trying again on the next connected moment.
 */
export class ObjectMissingError extends Error {
  constructor(ref: ObjectRef) {
    super(`No stored object at ${ref.bucket}/${objectPath(ref)}`)
    this.name = 'ObjectMissingError'
  }
}

export interface UploadInput extends ObjectRef {
  file: Blob
  contentType?: string
}

/** How long a minted URL lives. One hour: long enough for a session, short enough to be worth
 *  having made the bucket private at all. */
export const SIGNED_URL_TTL_SECONDS = 3600

/** Binary that is too big to live inside a synced document. */
export interface StoragePort {
  /** Returns the object's **path**, not a URL: the buckets are private and a URL expires. */
  upload(input: UploadInput): Promise<{ path: string }>
  remove(ref: ObjectRef): Promise<void>
  /**
   * A temporary URL the bytes can be fetched from, good for `SIGNED_URL_TTL_SECONDS`. Only the
   * image keeper calls this.
   */
  signedUrl(ref: ObjectRef): Promise<string>
}

/**
 * The no-cloud adapter: hands back an object URL and touches no network. Good enough for tests and
 * for a session with no Supabase project — callers keep their own durable local copy either way,
 * because an object URL dies with the document that made it.
 *
 * `upload` still answers with a path, so documents hold the same shape whether or not a cloud is
 * configured, and `signedUrl` hands back the object URL it is already holding — which is what keeps
 * the no-cloud path working after the buckets went private.
 */
export class LocalObjectUrlStorage implements StoragePort {
  private readonly issued = new Map<string, string>()

  async upload(input: UploadInput): Promise<{ path: string }> {
    const path = objectPath(input)
    this.issued.set(`${input.bucket}/${path}`, URL.createObjectURL(input.file))
    return { path }
  }

  async remove(ref: ObjectRef): Promise<void> {
    const key = `${ref.bucket}/${objectPath(ref)}`
    const url = this.issued.get(key)
    if (!url) return
    URL.revokeObjectURL(url)
    this.issued.delete(key)
  }

  async signedUrl(ref: ObjectRef): Promise<string> {
    const url = this.issued.get(`${ref.bucket}/${objectPath(ref)}`)
    if (!url) throw new ObjectMissingError(ref)
    return url
  }
}
