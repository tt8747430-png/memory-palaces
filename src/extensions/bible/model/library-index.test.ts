import { describe, expect, it } from 'vitest'
import { indexLibrary } from './library-index'
import type { BibleVerse } from './verse'

const verse = (
  book: string,
  chapter: number,
  number: number,
  over: Partial<BibleVerse> = {},
): BibleVerse => ({
  id: `cornilescu-2024:${book}:${chapter}:${number}`,
  createdAt: 't0',
  updatedAt: 't0',
  translation: 'cornilescu-2024',
  book,
  chapter,
  verse: number,
  text: `${book} ${chapter}:${number}`,
  ...over,
})

describe('indexLibrary', () => {
  const index = indexLibrary([
    verse('JHN', 3, 16),
    verse('JHN', 3, 17),
    verse('JHN', 14, 1),
    verse('GEN', 1, 1, { translation: 'kjv' }),
    verse('Zeus', 1, 1),
  ])

  it('knows which books, chapters and verses it holds text for', () => {
    expect(index.hasBook('JHN')).toBe(true)
    expect(index.hasChapter('JHN', 3)).toBe(true)
    expect(index.hasChapter('JHN', 4)).toBe(false)
    expect(index.hasVerse('JHN', 3, 16)).toBe(true)
    expect(index.hasVerse('JHN', 3, 18)).toBe(false)
  })

  it('reads a verse’s text, and null for one it lacks', () => {
    expect(index.text('JHN', 3, 16)).toBe('JHN 3:16')
    expect(index.text('JHN', 3, 18)).toBeNull()
  })

  it('counts coverage as distinct chapters and verses', () => {
    expect(index.coverage('JHN')).toEqual({ chapters: 2, verses: 3 })
    expect(index.coverage('ROM')).toEqual({ chapters: 0, verses: 0 })
  })

  it('ignores other translations and books it cannot name', () => {
    expect(index.hasBook('GEN')).toBe(false)
  })

  it('keeps the newer of two rows for one verse — a legacy row waiting on the keeper', () => {
    const twice = indexLibrary([
      verse('JHN', 3, 16, { id: 'web:Ioan:3:16', text: 'old', updatedAt: 't1' }),
      verse('JHN', 3, 16, { text: 'new', updatedAt: 't2' }),
    ])
    expect(twice.text('JHN', 3, 16)).toBe('new')
    expect(twice.coverage('JHN').verses).toBe(1)
  })
})
