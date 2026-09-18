import { describe, expect, it } from 'vitest'
import { completeBibleVerse, makeBibleVerse, refKey } from './verse'

const at = new Date(0).toISOString()

describe('makeBibleVerse', () => {
  it('keys itself by translation, book, chapter and verse', () => {
    const verse = makeBibleVerse({
      createdAt: at,
      translation: 'web',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning God created the heavens and the earth.',
    })
    expect(verse.id).toBe('web:Genesis:1:1')
  })

  it('trims the text', () => {
    const verse = makeBibleVerse({
      createdAt: at,
      translation: 'web',
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: '  In the beginning  ',
    })
    expect(verse.text).toBe('In the beginning')
  })

  it('throws on empty text — an empty verse is not a verse', () => {
    expect(() =>
      makeBibleVerse({
        createdAt: at,
        translation: 'web',
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: '   ',
      }),
    ).toThrow()
  })

  it('throws when the chapter or verse is not positive', () => {
    expect(() =>
      makeBibleVerse({
        createdAt: at,
        translation: 'web',
        book: 'Genesis',
        chapter: 0,
        verse: 1,
        text: 'x',
      }),
    ).toThrow()
  })
})

describe('refKey', () => {
  it('keys a verse so republishing it updates in place', () => {
    expect(refKey('web', 'Genesis', 1, 1)).toBe('web:Genesis:1:1')
  })
})

describe('completeBibleVerse', () => {
  it('fills a row pulled from the cloud that predates a field', () => {
    const pulled = {
      id: 'web:Genesis:1:1',
      createdAt: at,
      updatedAt: at,
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: 'In the beginning',
    } as never
    expect(completeBibleVerse(pulled).translation).toBe('web')
  })
})
