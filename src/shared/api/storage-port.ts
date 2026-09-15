export type StorageBucket = 'deck-images' | 'avatars'

export interface ObjectRef {
  bucket: StorageBucket
  userId: string
  entityId: string
}

export const objectPath = (ref: Pick<ObjectRef, 'userId' | 'entityId'>): string =>
  `${ref.userId}/${ref.entityId}`

export interface ImageRef {
  bucket: StorageBucket
  path: string
}

export function parseObjectPath({ bucket, path }: ImageRef): ObjectRef | null {
  const [userId, entityId, ...rest] = path.split('/')
  return userId && entityId && !rest.length ? { bucket, userId, entityId } : null
}

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

export const SIGNED_URL_TTL_SECONDS = 3600

export interface StoragePort {
  upload(input: UploadInput): Promise<{ path: string }>
  remove(ref: ObjectRef): Promise<void>
  signedUrl(ref: ObjectRef): Promise<string>
}

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
