import { describe, expect, it, vi } from 'vitest'
import { ObjectMissingError } from '@/shared/api'
import { SupabaseStorage } from './supabase-storage'

const deckRef = { bucket: 'deck-images', userId: 'u1', entityId: 'd1' } as const
const avatarRef = { bucket: 'avatars', userId: 'u1', entityId: 'p1' } as const

function makeClient() {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://cdn/x?token=abc' }, error: null }),
  }
  return { bucket, client: { storage: { from: vi.fn().mockReturnValue(bucket) } } }
}

describe('SupabaseStorage', () => {
  it('uploads and returns the object path, never a URL that can expire', async () => {
    const { bucket, client } = makeClient()

    const { path } = await new SupabaseStorage(client as never).upload({
      ...deckRef,
      file: new Blob(['x']),
    })

    expect(path).toBe('u1/d1')
    expect(client.storage.from).toHaveBeenCalledWith('deck-images')
    // Replacing an image must overwrite, not 409 — hence upsert.
    expect(bucket.upload).toHaveBeenCalledWith('u1/d1', expect.any(Blob), {
      upsert: true,
      contentType: undefined,
    })
  })

  it('passes the content type through when the caller knows it', async () => {
    const { bucket, client } = makeClient()

    await new SupabaseStorage(client as never).upload({
      ...avatarRef,
      file: new Blob(['x']),
      contentType: 'image/jpeg',
    })

    expect(bucket.upload).toHaveBeenCalledWith('u1/p1', expect.any(Blob), {
      upsert: true,
      contentType: 'image/jpeg',
    })
  })

  it('throws what supabase reports on a failed upload', async () => {
    const { bucket, client } = makeClient()
    bucket.upload.mockResolvedValue({ error: { message: 'over quota' } })

    await expect(
      new SupabaseStorage(client as never).upload({ ...avatarRef, file: new Blob(['x']) }),
    ).rejects.toThrow('over quota')
  })

  it('removes by path', async () => {
    const { bucket, client } = makeClient()

    await new SupabaseStorage(client as never).remove(avatarRef)

    expect(bucket.remove).toHaveBeenCalledWith(['u1/p1'])
  })

  it('mints a signed URL that lasts an hour by default', async () => {
    const { bucket, client } = makeClient()

    await expect(new SupabaseStorage(client as never).signedUrl(deckRef)).resolves.toBe(
      'https://cdn/x?token=abc',
    )
    expect(bucket.createSignedUrl).toHaveBeenCalledWith('u1/d1', 3600)
  })

  it('reports a missing object as missing, so the keeper stops asking', async () => {
    const { bucket, client } = makeClient()
    bucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Object not found', status: 400, statusCode: '404' },
    })

    await expect(new SupabaseStorage(client as never).signedUrl(deckRef)).rejects.toBeInstanceOf(
      ObjectMissingError,
    )
  })

  it('reports any other failure as a plain error, worth trying again', async () => {
    const { bucket, client } = makeClient()
    bucket.createSignedUrl.mockResolvedValue({ data: null, error: { message: 'timeout' } })

    const failure = new SupabaseStorage(client as never).signedUrl(deckRef)
    await expect(failure).rejects.toThrow('timeout')
    await expect(failure).rejects.not.toBeInstanceOf(ObjectMissingError)
  })

  it('throws rather than handing back an empty URL', async () => {
    const { bucket, client } = makeClient()
    bucket.createSignedUrl.mockResolvedValue({ data: null, error: null })

    await expect(new SupabaseStorage(client as never).signedUrl(deckRef)).rejects.toThrow(
      'No signed URL',
    )
  })
})
