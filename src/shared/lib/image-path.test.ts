import { describe, expect, it } from 'vitest'
import { coerceImagePath } from './image-path'

const PUBLIC = 'https://abc.supabase.co/storage/v1/object/public/deck-images/u1/d1'
const SIGNED = 'https://abc.supabase.co/storage/v1/object/sign/avatars/u1/profile?token=xyz'

describe('coerceImagePath', () => {
  it('narrows a public storage URL to its object path', () => {
    expect(coerceImagePath(PUBLIC)).toBe('u1/d1')
  })

  it('narrows a signed URL too, dropping the token', () => {
    expect(coerceImagePath(SIGNED)).toBe('u1/profile')
  })

  it('leaves an inline image alone — it is a waypoint, not a URL', () => {
    const inline = `data:image/jpeg;base64,${btoa('photo')}`
    expect(coerceImagePath(inline)).toBe(inline)
  })

  it('leaves a value that is already a path alone', () => {
    expect(coerceImagePath('u1/d1')).toBe('u1/d1')
  })

  it('preserves an unrecognised string rather than discarding it', () => {
    expect(coerceImagePath('https://elsewhere.example/x.jpg')).toBe(
      'https://elsewhere.example/x.jpg',
    )
  })

  it('answers null for nothing', () => {
    expect(coerceImagePath(null)).toBeNull()
    expect(coerceImagePath(undefined)).toBeNull()
    expect(coerceImagePath('')).toBeNull()
  })
})
