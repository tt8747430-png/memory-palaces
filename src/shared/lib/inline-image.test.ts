import { describe, expect, it, vi } from 'vitest'
import type { StoragePort } from '@/shared/api'
import { isInlineImage, uploadInlineImage } from './inline-image'

const DATA_URL = `data:image/jpeg;base64,${btoa('photo')}`

const storageThat = (upload: ReturnType<typeof vi.fn>) =>
  ({ upload, remove: vi.fn(), signedUrl: vi.fn() }) as unknown as StoragePort

const deckRef = { bucket: 'deck-images', userId: 'u1', entityId: 'd1' } as const
const avatarRef = { bucket: 'avatars', userId: 'u1', entityId: 'p1' } as const

describe('isInlineImage', () => {
  it('recognises only a data URL', () => {
    expect(isInlineImage(DATA_URL)).toBe(true)
    expect(isInlineImage('https://cdn/x.jpg')).toBe(false)
    expect(isInlineImage(null)).toBe(false)
    expect(isInlineImage(undefined)).toBe(false)
  })
})

describe('uploadInlineImage', () => {
  it('returns the object path and sends the decoded bytes', async () => {
    const upload = vi.fn().mockResolvedValue({ path: 'u1/d1' })

    const path = await uploadInlineImage(storageThat(upload), deckRef, DATA_URL)

    expect(path).toBe('u1/d1')
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'deck-images', entityId: 'd1', contentType: 'image/jpeg' }),
    )
  })

  it('returns null rather than throwing when the upload fails', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('offline'))

    await expect(uploadInlineImage(storageThat(upload), avatarRef, DATA_URL)).resolves.toBeNull()
  })

  it('ignores anything that is not still inline', async () => {
    const upload = vi.fn()

    const path = await uploadInlineImage(storageThat(upload), avatarRef, 'u1/p1')

    expect(path).toBeNull()
    expect(upload).not.toHaveBeenCalled()
  })
})
