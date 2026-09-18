import { describe, expect, it } from 'vitest'
import { formatPartial, formatRef, parseRef } from './reference'

describe('formatRef', () => {
  it('renders a single verse in the translation’s own words', () => {
    expect(formatRef({ book: '1CO', chapter: 8, from: 9, to: 9 })).toBe('1 Corinteni 8:9')
  })

  it('renders a range', () => {
    expect(formatRef({ book: 'GEN', chapter: 1, from: 1, to: 31 })).toBe('Geneza 1:1-31')
  })
})

describe('parseRef', () => {
  it('reads a single verse', () => {
    expect(parseRef('Ioan 3:16')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: 16 })
  })

  it('reads a range, hyphen or en dash', () => {
    expect(parseRef('1 Ioan 2:3-5')).toEqual({ book: '1JN', chapter: 2, from: 3, to: 5 })
    expect(parseRef('1 Ioan 2:3–5')).toEqual({ book: '1JN', chapter: 2, from: 3, to: 5 })
  })

  it('reads the learner’s existing fronts, abbreviations and English names alike', () => {
    expect(parseRef('1 Corinteni 8:9')).toEqual({ book: '1CO', chapter: 8, from: 9, to: 9 })
    expect(parseRef('1 cor 13:4')).toEqual({ book: '1CO', chapter: 13, from: 4, to: 4 })
    expect(parseRef('1 Thessalonians 1:1')).toEqual({ book: '1TH', chapter: 1, from: 1, to: 1 })
  })

  it('refuses a chapter or verse the book does not have', () => {
    expect(parseRef('Ioan 22:1')).toBeNull()
    expect(parseRef('Geneza 1:32')).toBeNull()
    expect(parseRef('Geneza 1:5-3')).toBeNull()
  })

  it('returns null for anything else', () => {
    expect(parseRef('Zeus, King of the gods')).toBeNull()
    expect(parseRef('Zeus 1:1')).toBeNull()
  })
})

describe('formatPartial', () => {
  it('renders the reference at every step the picker passes through', () => {
    expect(formatPartial({ book: null, chapter: null, from: null, to: null })).toBe('')
    expect(formatPartial({ book: 'GEN', chapter: null, from: null, to: null })).toBe('Geneza')
    expect(formatPartial({ book: 'GEN', chapter: 1, from: null, to: null })).toBe('Geneza 1')
    expect(formatPartial({ book: 'GEN', chapter: 1, from: 1, to: null })).toBe('Geneza 1:1')
    expect(formatPartial({ book: 'GEN', chapter: 1, from: 1, to: 31 })).toBe('Geneza 1:1-31')
  })

  it('collapses a range that ends where it starts', () => {
    expect(formatPartial({ book: 'JUD', chapter: 1, from: 3, to: 3 })).toBe('Iuda 1:3')
  })

  it('ignores a chapter picked without a book', () => {
    expect(formatPartial({ book: null, chapter: 1, from: 1, to: 1 })).toBe('')
  })
})
