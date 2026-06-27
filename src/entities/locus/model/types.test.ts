import { describe, expect, it } from 'vitest'
import { makeLocus } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makeLocus', () => {
  it('creates a locus with default flags and no schedule', () => {
    const locus = makeLocus({ id: 'l1', createdAt: T0, roomId: 'r1', front: 'Q', back: 'A' })
    expect(locus).toMatchObject({
      id: 'l1',
      updatedAt: T0,
      roomId: 'r1',
      front: 'Q',
      back: 'A',
      flagged: false,
      memorized: false,
    })
    expect(locus.srs).toBeUndefined()
  })

  it('trims front/back and requires room, front, and back', () => {
    expect(
      makeLocus({ id: 'l1', createdAt: T0, roomId: 'r1', front: '  Q  ', back: '  A  ' }).front,
    ).toBe('Q')
    expect(() =>
      makeLocus({ id: 'l1', createdAt: T0, roomId: '', front: 'Q', back: 'A' }),
    ).toThrow()
    expect(() =>
      makeLocus({ id: 'l1', createdAt: T0, roomId: 'r1', front: '  ', back: 'A' }),
    ).toThrow()
    expect(() =>
      makeLocus({ id: 'l1', createdAt: T0, roomId: 'r1', front: 'Q', back: '  ' }),
    ).toThrow()
  })
})
