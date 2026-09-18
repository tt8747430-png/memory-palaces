import { describe, expect, it } from 'vitest'
import { parseJump } from './jump'

const target = (text: string) => parseJump(text).target

describe('parseJump', () => {
  it('reads a whole passage however it is typed', () => {
    expect(target('ioan 3 16-18')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: 18 })
    expect(target('Ioan 3:16–18')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: 18 })
  })

  it('reads a single verse as a passage of one', () => {
    expect(target('Ioan 3:16')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: 16 })
  })

  it('reads a chapter, even run together with an abbreviation', () => {
    expect(target('1cor13')).toEqual({ book: '1CO', chapter: 13, from: null, to: null })
    expect(target('ps 23')).toEqual({ book: 'PSA', chapter: 23, from: null, to: null })
    expect(target('1 ioan 2')).toEqual({ book: '1JN', chapter: 2, from: null, to: null })
  })

  it('leaves the end open while a range is still being typed', () => {
    expect(target('ioan 3:16-')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: null })
  })

  it('reads a book on its own', () => {
    expect(target('Geneza')).toEqual({ book: 'GEN', chapter: null, from: null, to: null })
  })

  it('offers the books a prefix could mean, and no target while it is ambiguous', () => {
    const jump = parseJump('io')
    expect(jump.books).toEqual(['JOS', 'JOB', 'JOL', 'JON', 'JHN'])
    expect(jump.target).toBeNull()
  })

  it('settles an ambiguous prefix on its first book once a chapter is typed', () => {
    expect(target('gene 1')).toEqual({ book: 'GEN', chapter: 1, from: null, to: null })
  })

  it('drops what the book does not have, keeping what it does', () => {
    expect(target('ioan 99')).toEqual({ book: 'JHN', chapter: null, from: null, to: null })
    expect(target('ioan 3 40')).toEqual({ book: 'JHN', chapter: 3, from: null, to: null })
    expect(target('ioan 3 16-99')).toEqual({ book: 'JHN', chapter: 3, from: 16, to: null })
    expect(target('ioan 3 18-16')).toEqual({ book: 'JHN', chapter: 3, from: 18, to: null })
  })

  it('finds nothing in nothing, or in numbers alone', () => {
    expect(parseJump('   ')).toEqual({ books: [], target: null })
    expect(parseJump('3 16')).toEqual({ books: [], target: null })
  })
})
