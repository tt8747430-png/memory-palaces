import { describe, expect, it, vi } from 'vitest'
import {
  LocalObjectUrlStorage,
  ObjectMissingError,
  objectPath,
  parseObjectPath,
} from './storage-port'

const deckRef = { bucket: 'deck-images', userId: 'u1', entityId: 'd1' } as const
const avatarRef = { bucket: 'avatars', userId: 'u1', entityId: 'p1' } as const

describe('objectPath', () => {
  it('puts the owner first, because storage RLS reads the first segment as the owner', () => {
    expect(objectPath(deckRef)).toBe('u1/d1')
  })

  it('reads back into the ref it was written from, and refuses anything else', () => {
    const at = (path: string) => parseObjectPath({ bucket: 'deck-images', path })
    expect(at(objectPath(deckRef))).toEqual(deckRef)
    expect(at('u1')).toBeNull()
    expect(at('u1/d1/extra')).toBeNull()
    expect(at('https://cdn.example/x.png')).toBeNull()
  })
})

describe('LocalObjectUrlStorage', () => {
  it('answers with a path, so documents hold the same shape with or without a cloud', async () => {
    const storage = new LocalObjectUrlStorage()

    const { path } = await storage.upload({ ...deckRef, file: new Blob(['x']) })

    expect(path).toBe('u1/d1')
  })

  it('hands back the object URL it is holding, so the no-cloud path still renders', async () => {
    const storage = new LocalObjectUrlStorage()
    await storage.upload({ ...deckRef, file: new Blob(['x']) })

    await expect(storage.signedUrl(deckRef)).resolves.toMatch(/^blob:|^data:|^mock/)
  })

  it('reports an object it never issued as missing, not as unreachable', async () => {
    await expect(new LocalObjectUrlStorage().signedUrl(deckRef)).rejects.toBeInstanceOf(
      ObjectMissingError,
    )
  })

  it('revokes the URL it issued on remove', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const storage = new LocalObjectUrlStorage()
    await storage.upload({ ...avatarRef, file: new Blob(['x']) })

    await storage.remove(avatarRef)

    expect(revoke).toHaveBeenCalled()
  })

  it('ignores a remove for something it never issued', async () => {
    await expect(new LocalObjectUrlStorage().remove(avatarRef)).resolves.toBeUndefined()
  })
})
