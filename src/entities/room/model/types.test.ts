import { describe, expect, it } from 'vitest'
import { makeRoom } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makeRoom', () => {
  it('creates an ordered room under a palace', () => {
    const room = makeRoom({ id: 'r1', createdAt: T0, palaceId: 'p1', title: 'Kitchen', order: 0 })
    expect(room).toEqual({
      id: 'r1',
      createdAt: T0,
      updatedAt: T0,
      palaceId: 'p1',
      title: 'Kitchen',
      description: '',
      order: 0,
    })
  })

  it('rejects an empty title, a missing palace, or a negative order', () => {
    expect(() =>
      makeRoom({ id: 'r1', createdAt: T0, palaceId: 'p1', title: '  ', order: 0 }),
    ).toThrow()
    expect(() =>
      makeRoom({ id: 'r1', createdAt: T0, palaceId: '', title: 'Kitchen', order: 0 }),
    ).toThrow()
    expect(() =>
      makeRoom({ id: 'r1', createdAt: T0, palaceId: 'p1', title: 'Kitchen', order: -1 }),
    ).toThrow()
  })
})
