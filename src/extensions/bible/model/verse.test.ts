import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSLATION } from './translations'
import { completeBibleVerse, LEGACY_TRANSLATION, makeBibleVerse, refKey } from './verse'

const at = new Date(0).toISOString()

const input = {
  createdAt: at,
  translation: DEFAULT_TRANSLATION,
  book: 'JHN' as const,
  chapter: 3,
  verse: 16,
  text: 'Fiindcă atât de mult a iubit Dumnezeu lumea',
}

describe('makeBibleVerse', () => {
  it('keys itself by translation, book code, chapter and verse', () => {
    expect(makeBibleVerse(input).id).toBe('cornilescu-2024:JHN:3:16')
  })

  it('trims the text', () => {
    expect(makeBibleVerse({ ...input, text: '  Fiindcă  ' }).text).toBe('Fiindcă')
  })

  it('throws on empty text — an empty verse is not a verse', () => {
    expect(() => makeBibleVerse({ ...input, text: '   ' })).toThrow()
  })

  it('throws when the chapter or verse is not positive', () => {
    expect(() => makeBibleVerse({ ...input, chapter: 0 })).toThrow()
    expect(() => makeBibleVerse({ ...input, verse: -1 })).toThrow()
  })
})

describe('refKey', () => {
  it('keys a verse so saving it again updates it in place', () => {
    expect(refKey(DEFAULT_TRANSLATION, 'GEN', 1, 1)).toBe('cornilescu-2024:GEN:1:1')
  })
})

describe('completeBibleVerse', () => {
  const legacy = {
    id: 'web:1 Corinteni:8:9',
    createdAt: at,
    updatedAt: at,
    translation: LEGACY_TRANSLATION,
    book: '1 Corinteni',
    chapter: 8,
    verse: 9,
    text: 'Luați seama',
  }

  it('reads a row published under the placeholder translation as Cornilescu', () => {
    expect(completeBibleVerse(legacy).translation).toBe(DEFAULT_TRANSLATION)
  })

  it('reads a book stored by name as its code, and leaves the id to the keeper', () => {
    const completed = completeBibleVerse(legacy)
    expect(completed.book).toBe('1CO')
    expect(completed.id).toBe(legacy.id)
  })

  it('reads an English name too — the picker once published under those', () => {
    expect(completeBibleVerse({ ...legacy, book: '1 Thessalonians' }).book).toBe('1TH')
  })

  it('fills a row pulled from the cloud that predates the translation field', () => {
    const { translation: _dropped, ...pulled } = legacy
    expect(completeBibleVerse(pulled as never).translation).toBe(DEFAULT_TRANSLATION)
  })

  it('leaves a book it cannot name alone — nothing can address it, and nothing loses it', () => {
    expect(completeBibleVerse({ ...legacy, book: 'Zeus' }).book).toBe('Zeus')
  })
})
