import { describe, expect, it, vi } from 'vitest'
import { LocalObjectUrlStorage } from './storage-port'

describe('LocalObjectUrlStorage', () => {
  it('returns an object URL without any network', async () => {
    const storage = new LocalObjectUrlStorage()

    const { url } = await storage.upload({
      bucket: 'deck-images',
      path: 'u1/d1',
      file: new Blob(['x']),
    })

    expect(url).toMatch(/^blob:|^data:|^mock/)
  })

  it('revokes the URL it issued on remove', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const storage = new LocalObjectUrlStorage()
    await storage.upload({ bucket: 'avatars', path: 'u1/p1', file: new Blob(['x']) })

    await storage.remove('avatars', 'u1/p1')

    expect(revoke).toHaveBeenCalled()
  })

  it('ignores a remove for something it never issued', async () => {
    await expect(new LocalObjectUrlStorage().remove('avatars', 'nope')).resolves.toBeUndefined()
  })
})
