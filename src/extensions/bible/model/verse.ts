import type { Entity } from '@/shared/lib'
import { type BookCode, isBookCode } from './canon'
import { resolveBook } from './book-names'
import { DEFAULT_TRANSLATION } from './translations'

/**
 * The translation id every verse was published under before the translation was named. The text
 * was Cornilescu all along; `completeBibleVerse` reads it as such and the keeper re-keys it.
 */
export const LEGACY_TRANSLATION = 'web'

/** A verse's primary key. It lives here, not in `reference.ts`, which knows nothing of translations. */
export function refKey(translation: string, book: string, chapter: number, verse: number): string {
  return `${translation}:${book}:${chapter}:${verse}`
}

export interface BibleVerse extends Entity {
  translation: string
  /**
   * A `BookCode` for every verse the app writes. A row published before codes carried the book's
   * name; `completeBibleVerse` resolves it, and one whose name names no book keeps it — nothing can
   * address that row, and nothing deletes it either. Readers narrow with `isBookCode`.
   */
  book: string
  chapter: number
  verse: number
  /** Verse text only. The reference lives on the card front, never in here. */
  text: string
}

export interface MakeBibleVerseInput {
  createdAt: string
  translation: string
  book: BookCode
  chapter: number
  verse: number
  text: string
}

export function makeBibleVerse(input: MakeBibleVerseInput): BibleVerse {
  const translation = input.translation.trim()
  const text = input.text.trim()
  if (!translation) throw new Error('A verse needs a translation')
  if (!text) throw new Error('A verse needs text')
  if (!Number.isInteger(input.chapter) || input.chapter < 1) {
    throw new Error(`Chapter must be a positive whole number: ${input.chapter}`)
  }
  if (!Number.isInteger(input.verse) || input.verse < 1) {
    throw new Error(`Verse must be a positive whole number: ${input.verse}`)
  }
  return {
    id: refKey(translation, input.book, input.chapter, input.verse),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    translation,
    book: input.book,
    chapter: input.chapter,
    verse: input.verse,
    text,
  }
}

/**
 * Read-side twin: rows arrive from replication unmigrated, so a field the type calls required can
 * genuinely be absent, and a row published before 2026-09-18 names its book and carries the
 * placeholder translation. Both read as today's shape here; the id is left alone —
 * `keepVersesCanonical` re-keys it, because only it can see whether the canonical row exists.
 */
export function completeBibleVerse(verse: BibleVerse): BibleVerse {
  const translation =
    !verse.translation || verse.translation === LEGACY_TRANSLATION
      ? DEFAULT_TRANSLATION
      : verse.translation
  const book = isBookCode(verse.book) ? verse.book : (resolveBook(verse.book) ?? verse.book)
  return { ...verse, translation, book }
}
