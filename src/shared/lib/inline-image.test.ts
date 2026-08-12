import { describe, expect, it, vi } from 'vitest'
import type { StoragePort } from '@/shared/api'
import { isInlineImage, uploadInlineImage } from './inline-image'

const DATA_URL = `data:image/jpeg;base64,${btoa('photo')}`

const storageThat = (upload: ReturnType<typeof vi.fn>) =>
  ({ upload, remove: vi.fn() }) as unknown as StoragePort

describe('isInlineImage', () => {
  it('recognises only a data URL', () => {
    expect(isInlineImage(DATA_URL)).toBe(true)
    expect(isInlineImage('https://cdn/x.jpg')).toBe(false)
    expect(isInlineImage(null)).toBe(false)
    expect(isInlineImage(undefined)).toBe(false)
  })
})

describe('uploadInlineImage', () => {
  it('returns the hosted URL and sends the decoded bytes', async () => {
    const upload = vi.fn().mockResolvedValue({ url: 'https://cdn/x' })

    const url = await uploadInlineImage(storageThat(upload), {
      bucket: 'deck-images',
      path: 'u1/d1',
      dataUrl: DATA_URL,
    })

    expect(url).toBe('https://cdn/x')
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'deck-images', path: 'u1/d1', contentType: 'image/jpeg' }),
    )
  })

  it('returns null rather than throwing when the upload fails', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('offline'))

    await expect(
      uploadInlineImage(storageThat(upload), {
        bucket: 'avatars',
        path: 'u1/p1',
        dataUrl: DATA_URL,
      }),
    ).resolves.toBeNull()
  })

  it('ignores anything already hosted', async () => {
    const upload = vi.fn()

    const url = await uploadInlineImage(storageThat(upload), {
      bucket: 'avatars',
      path: 'u1/p1',
      dataUrl: 'https://cdn/existing.jpg',
    })

    expect(url).toBeNull()
    expect(upload).not.toHaveBeenCalled()
  })
})
