import { describe, expect, it } from 'vitest'
import { libraryCoverage } from './coverage'
import { indexLibrary } from './library-index'
import { makeBibleVerse } from './verse'

describe('libraryCoverage', () => {
  it('lists all 66 books, with what the library holds of each', () => {
    const coverage = libraryCoverage(
      indexLibrary([
        makeBibleVerse({
          createdAt: 't0',
          translation: 'cornilescu-2024',
          book: 'JHN',
          chapter: 3,
          verse: 16,
          text: 'x',
        }),
      ]),
    )
    expect(coverage).toHaveLength(66)
    expect(coverage.find((book) => book.book === 'JHN')).toEqual({
      book: 'JHN',
      testament: 'new',
      chapters: 1,
      chaptersInBook: 21,
      verses: 1,
    })
    expect(coverage.find((book) => book.book === 'GEN')?.verses).toBe(0)
  })
})
