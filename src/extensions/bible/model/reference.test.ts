import { describe, expect, it } from 'vitest'
import { expandRange, formatPartial, formatRef, parseRef } from './reference'

describe('formatRef', () => {
  it('renders a single verse without a range', () => {
    expect(formatRef({ book: 'Genesis', chapter: 1, from: 1, to: 1 })).toBe('Genesis 1:1')
  })

  it('renders a range', () => {
    expect(formatRef({ book: 'Genesis', chapter: 1, from: 1, to: 31 })).toBe('Genesis 1:1-31')
  })
})

describe('parseRef', () => {
  it('reads a single verse', () => {
    expect(parseRef('Genesis 1:1')).toEqual({ book: 'Genesis', chapter: 1, from: 1, to: 1 })
  })

  it('reads a range, hyphen or en dash', () => {
    expect(parseRef('1 John 2:3-5')).toEqual({ book: '1 John', chapter: 2, from: 3, to: 5 })
    expect(parseRef('1 John 2:3–5')).toEqual({ book: '1 John', chapter: 2, from: 3, to: 5 })
  })

  it('returns null for anything else', () => {
    expect(parseRef('Zeus, King of the gods')).toBeNull()
  })
})

describe('expandRange', () => {
  it('lists every verse number in the range', () => {
    expect(expandRange({ book: 'Genesis', chapter: 1, from: 2, to: 4 })).toEqual([2, 3, 4])
  })

  it('handles a single verse', () => {
    expect(expandRange({ book: 'Jude', chapter: 1, from: 3, to: 3 })).toEqual([3])
  })
})

describe('formatPartial', () => {
  it('renders the breadcrumb at every step the picker passes through', () => {
    expect(formatPartial({ book: null, chapter: null, from: null, to: null })).toBe('')
    expect(formatPartial({ book: 'Genesis', chapter: null, from: null, to: null })).toBe('Genesis')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: null, to: null })).toBe('Genesis 1:')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: 1, to: null })).toBe('Genesis 1:1')
    expect(formatPartial({ book: 'Genesis', chapter: 1, from: 1, to: 31 })).toBe('Genesis 1:1-31')
  })

  it('collapses a range that ends where it starts', () => {
    expect(formatPartial({ book: 'Jude', chapter: 1, from: 3, to: 3 })).toBe('Jude 1:3')
  })

  it('ignores a chapter picked without a book', () => {
    expect(formatPartial({ book: null, chapter: 1, from: 1, to: 1 })).toBe('')
  })
})
