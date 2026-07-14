import { describe, expect, it } from 'vitest'
import { coverSquare } from './avatar'

describe('coverSquare', () => {
  it('centers the crop horizontally on a landscape image', () => {
    expect(coverSquare(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 })
  })

  it('centers the crop vertically on a portrait image', () => {
    expect(coverSquare(200, 500)).toEqual({ sx: 0, sy: 150, size: 200 })
  })

  it('uses the whole square image with no offset', () => {
    expect(coverSquare(300, 300)).toEqual({ sx: 0, sy: 0, size: 300 })
  })
})
