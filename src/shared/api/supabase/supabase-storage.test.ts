import { describe, expect, it, vi } from 'vitest'
import { SupabaseStorage } from './supabase-storage'

function makeClient() {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/x' } }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  }
  return { bucket, client: { storage: { from: vi.fn().mockReturnValue(bucket) } } }
}

describe('SupabaseStorage', () => {
  it('uploads and returns the public URL', async () => {
    const { bucket, client } = makeClient()

    const { url } = await new SupabaseStorage(client as never).upload({
      bucket: 'deck-images',
      path: 'u1/d1',
      file: new Blob(['x']),
    })

    expect(url).toBe('https://cdn/x')
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
      bucket: 'avatars',
      path: 'u1/p1',
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
      new SupabaseStorage(client as never).upload({
        bucket: 'avatars',
        path: 'u1/p1',
        file: new Blob(['x']),
      }),
    ).rejects.toThrow('over quota')
  })

  it('removes by path', async () => {
    const { bucket, client } = makeClient()

    await new SupabaseStorage(client as never).remove('avatars', 'u1/p1')

    expect(bucket.remove).toHaveBeenCalledWith(['u1/p1'])
  })
})
