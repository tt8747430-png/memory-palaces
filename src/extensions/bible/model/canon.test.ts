import { describe, expect, it } from 'vitest'
import { BOOKS, chapterCount, findBook, isBookCode, verseCount } from './canon'

describe('the canon', () => {
  it('holds 66 books in order, 39 old and 27 new', () => {
    expect(BOOKS).toHaveLength(66)
    expect(BOOKS[0]?.code).toBe('GEN')
    expect(BOOKS[65]?.code).toBe('REV')
    expect(BOOKS.filter((book) => book.testament === 'old')).toHaveLength(39)
    expect(BOOKS.filter((book) => book.testament === 'new')).toHaveLength(27)
  })

  it('keys every book by a code of its own', () => {
    expect(new Set(BOOKS.map((book) => book.code)).size).toBe(66)
  })

  it('holds 1189 chapters altogether', () => {
    expect(BOOKS.reduce((total, book) => total + book.verses.length, 0)).toBe(1189)
  })

  it('files each book under its genre', () => {
    expect(findBook('DEU').genre).toBe('law')
    expect(findBook('EST').genre).toBe('history')
    expect(findBook('SNG').genre).toBe('wisdom')
    expect(findBook('DAN').genre).toBe('majorProphets')
    expect(findBook('MAL').genre).toBe('minorProphets')
    expect(findBook('JHN').genre).toBe('gospels')
    expect(findBook('ACT').genre).toBe('acts')
    expect(findBook('PHM').genre).toBe('pauline')
    expect(findBook('HEB').genre).toBe('general')
    expect(findBook('REV').genre).toBe('apocalyptic')
  })

  it('knows how many chapters a book has', () => {
    expect(chapterCount('GEN')).toBe(50)
    expect(chapterCount('OBA')).toBe(1)
  })

  it('knows how many verses a chapter has, and none for a chapter it does not', () => {
    expect(verseCount('GEN', 1)).toBe(31)
    expect(verseCount('PSA', 119)).toBe(176)
    expect(verseCount('PSA', 117)).toBe(2)
    expect(verseCount('GEN', 99)).toBe(0)
  })

  it('tells a code from any other text', () => {
    expect(isBookCode('1CO')).toBe(true)
    expect(isBookCode('1 Corinteni')).toBe(false)
    expect(isBookCode('gen')).toBe(false)
  })
})
