import { describe, expect, it } from 'vitest'
import { BOOKS, chapterCount, verseCount } from './canon'

describe('the canon', () => {
  it('holds 66 books in order', () => {
    expect(BOOKS).toHaveLength(66)
    expect(BOOKS[0]?.name).toBe('Genesis')
    expect(BOOKS[65]?.name).toBe('Revelation')
  })

  it('holds 1189 chapters altogether', () => {
    expect(BOOKS.reduce((total, book) => total + book.verses.length, 0)).toBe(1189)
  })

  it('knows how many chapters a book has', () => {
    expect(chapterCount('Genesis')).toBe(50)
    expect(chapterCount('Jude')).toBe(1)
    expect(chapterCount('Nowhere')).toBe(0)
  })

  it('knows how many verses a chapter has', () => {
    expect(verseCount('Genesis', 1)).toBe(31)
    expect(verseCount('Psalms', 117)).toBe(2)
    expect(verseCount('Genesis', 99)).toBe(0)
  })
})
