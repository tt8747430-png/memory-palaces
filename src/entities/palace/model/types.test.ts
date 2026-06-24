import { describe, expect, it } from 'vitest'
import { DEFAULT_PALACE_SETTINGS, makePalace } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makePalace', () => {
  it('fills defaults and applies the base timestamps', () => {
    const palace = makePalace({ id: 'p1', createdAt: T0, name: 'Memory' })
    expect(palace).toMatchObject({
      id: 'p1',
      createdAt: T0,
      updatedAt: T0,
      name: 'Memory',
      description: '',
      folderId: null,
      order: 0,
      favorite: false,
      archived: false,
    })
    expect(palace.settings).toEqual(DEFAULT_PALACE_SETTINGS)
  })

  it('merges partial settings over the defaults', () => {
    const palace = makePalace({
      id: 'p1',
      createdAt: T0,
      name: 'M',
      settings: { studyDirection: 'back' },
    })
    expect(palace.settings.studyDirection).toBe('back')
    expect(palace.settings.quizTimer).toBe(DEFAULT_PALACE_SETTINGS.quizTimer)
  })

  it('requires a name', () => {
    expect(() => makePalace({ id: 'p1', createdAt: T0, name: '   ' })).toThrow()
  })
})
