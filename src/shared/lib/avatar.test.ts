import { describe, expect, it } from 'vitest'
import { coverSquare, dataUrlToBlob } from './avatar'

describe('coverSquare', () => {
  it('centres the crop on the long edge', () => {
    expect(coverSquare(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 })
    expect(coverSquare(200, 400)).toEqual({ sx: 0, sy: 100, size: 200 })
  })
})

describe('dataUrlToBlob', () => {
  it('keeps the declared media type', () => {
    const blob = dataUrlToBlob(`data:image/jpeg;base64,${btoa('hello')}`)

    expect(blob.type).toBe('image/jpeg')
    expect(blob.size).toBe(5)
  })

  it('rejects anything that is not a data URL', () => {
    expect(() => dataUrlToBlob('https://cdn/x.jpg')).toThrow()
  })
})
