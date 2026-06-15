import { describe, expect, it } from 'vitest'
import { makeFolder } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makeFolder', () => {
  it('creates a folder, mirroring createdAt into updatedAt', () => {
    const folder = makeFolder({ id: 'f1', createdAt: T0, name: 'Spanish', color: 'blue', icon: 'book' })
    expect(folder).toEqual({
      id: 'f1',
      createdAt: T0,
      updatedAt: T0,
      name: 'Spanish',
      color: 'blue',
      icon: 'book',
    })
  })

  it('trims the name and rejects an empty one', () => {
    expect(makeFolder({ id: 'f1', createdAt: T0, name: '  Spanish  ', color: 'b', icon: 'i' }).name).toBe('Spanish')
    expect(() => makeFolder({ id: 'f1', createdAt: T0, name: '   ', color: 'b', icon: 'i' })).toThrow()
  })
})
