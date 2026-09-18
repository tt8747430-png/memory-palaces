import { describe, expect, it } from 'vitest'
import { BOOKS } from './canon'
import {
  bookAbbreviation,
  bookName,
  matchBooks,
  normalizeBookText,
  resolveBook,
} from './book-names'

describe('book names', () => {
  it('names and abbreviates a book the way its translation does', () => {
    expect(bookName('1CO')).toBe('1 Corinteni')
    expect(bookAbbreviation('1CO')).toBe('1Cor')
    expect(bookName('SNG')).toBe('Cântarea cântărilor')
  })

  it('normalizes away case, diacritics, spaces and dots', () => {
    expect(normalizeBookText(' 1 Împărați. ')).toBe('1imparati')
    expect(normalizeBookText('Ţefania')).toBe('tefania')
    expect(normalizeBookText('Țefania')).toBe('tefania')
  })
})

describe('resolveBook', () => {
  it.each([
    ['1 Corinteni', '1CO'],
    ['1corinteni', '1CO'],
    ['1 Cor.', '1CO'],
    ['1Cor', '1CO'],
    ['1 Corinthians', '1CO'],
    ['1 Împărați', '1KI'],
    ['1 Imparati', '1KI'],
    ['ţefania', 'ZEP'],
    ['Țefania', 'ZEP'],
    ['Song of Solomon', 'SNG'],
    ['Faptele apostolilor', 'ACT'],
    ['ps', 'PSA'],
  ])('reads %s as %s', (text, code) => {
    expect(resolveBook(text)).toBe(code)
  })

  it('reads every name, abbreviation and English name back as its own book', () => {
    for (const book of BOOKS) {
      expect(resolveBook(bookName(book.code))).toBe(book.code)
      expect(resolveBook(bookAbbreviation(book.code))).toBe(book.code)
      expect(resolveBook(book.english)).toBe(book.code)
    }
  })

  it.each(['Ioana', '', 'Corinteni', '4 Ioan'])('reads %j as no book', (text) => {
    expect(resolveBook(text)).toBeUndefined()
  })
})

describe('matchBooks', () => {
  it('lists every book a prefix could mean, in canon order', () => {
    expect(matchBooks('i', 66)).toEqual([
      'JOS',
      'JOB',
      'ISA',
      'JER',
      'JOL',
      'JON',
      'JHN',
      'JAS',
      'JUD',
    ])
  })

  it('puts an exact name or abbreviation first', () => {
    expect(matchBooks('ioan')).toEqual(['JHN'])
    expect(matchBooks('1 ioan')).toEqual(['1JN'])
    expect(matchBooks('iov')).toEqual(['JOB'])
  })

  it('matches across the numbered books', () => {
    expect(matchBooks('1c')).toEqual(['1CH', '1CO'])
  })

  it('caps the list', () => {
    expect(matchBooks('i', 3)).toEqual(['JOS', 'JOB', 'ISA'])
  })

  it('offers nothing for nothing', () => {
    expect(matchBooks('  ')).toEqual([])
  })
})
