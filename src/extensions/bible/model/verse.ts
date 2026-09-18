import type { Entity } from '@/shared/lib'

export const DEFAULT_TRANSLATION = 'web'

/** A verse's primary key. It lives here, not in `reference.ts`, which knows nothing of translations. */
export function refKey(translation: string, book: string, chapter: number, verse: number): string {
  return `${translation}:${book}:${chapter}:${verse}`
}

export interface BibleVerse extends Entity {
  translation: string
  book: string
  chapter: number
  verse: number
  /** Verse text only. The reference lives on the card front, never in here. */
  text: string
}

export interface MakeBibleVerseInput {
  createdAt: string
  translation?: string
  book: string
  chapter: number
  verse: number
  text: string
}

export function makeBibleVerse(input: MakeBibleVerseInput): BibleVerse {
  const translation = (input.translation ?? DEFAULT_TRANSLATION).trim()
  const book = input.book.trim()
  const text = input.text.trim()
  if (!book) throw new Error('A verse needs a book')
  if (!text) throw new Error('A verse needs text')
  if (!Number.isInteger(input.chapter) || input.chapter < 1) {
    throw new Error(`Chapter must be a positive whole number: ${input.chapter}`)
  }
  if (!Number.isInteger(input.verse) || input.verse < 1) {
    throw new Error(`Verse must be a positive whole number: ${input.verse}`)
  }
  return {
    id: refKey(translation, book, input.chapter, input.verse),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    translation,
    book,
    chapter: input.chapter,
    verse: input.verse,
    text,
  }
}

/**
 * Read-side twin: rows arrive from replication unmigrated, so a field the type calls required can
 * genuinely be absent. The `??` looks dead to TypeScript and is not — `completeSyncState` defaults
 * a required `checkpoints` for the same reason. Do not delete it; the test beside it is why.
 */
export function completeBibleVerse(verse: BibleVerse): BibleVerse {
  return { ...verse, translation: verse.translation ?? DEFAULT_TRANSLATION }
}
