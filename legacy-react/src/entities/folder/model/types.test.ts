import { describe, expect, it } from 'vitest'
import { makeFolder, updateFolder } from './types'

const T0 = '2026-01-01T00:00:00.000Z'
const T1 = '2026-02-02T00:00:00.000Z'

describe('makeFolder', () => {
  it('creates a folder, mirroring createdAt into updatedAt', () => {
    const folder = makeFolder({
      id: 'f1',
      createdAt: T0,
      name: 'Spanish',
      color: 'blue',
      icon: 'book',
    })
    expect(folder).toEqual({
      id: 'f1',
      createdAt: T0,
      updatedAt: T0,
      name: 'Spanish',
      color: 'blue',
      icon: 'book',
      order: 0,
    })
  })

  it('trims the name and rejects an empty one', () => {
    expect(
      makeFolder({ id: 'f1', createdAt: T0, name: '  Spanish  ', color: 'b', icon: 'i' }).name,
    ).toBe('Spanish')
    expect(() =>
      makeFolder({ id: 'f1', createdAt: T0, name: '   ', color: 'b', icon: 'i' }),
    ).toThrow()
  })
})

describe('updateFolder', () => {
  const base = makeFolder({ id: 'f1', createdAt: T0, name: 'Spanish', color: 'blue', icon: 'book' })

  it('applies only the supplied changes, trims the name, and stamps updatedAt', () => {
    const next = updateFolder(base, { name: '  French  ', color: 'rose' }, T1)
    expect(next).toEqual({ ...base, name: 'French', color: 'rose', updatedAt: T1 })
    expect(next.icon).toBe('book')
  })

  it('leaves untouched fields alone and rejects an emptied name', () => {
    expect(updateFolder(base, {}, T1)).toEqual({ ...base, updatedAt: T1 })
    expect(() => updateFolder(base, { name: '   ' }, T1)).toThrow()
  })
})
