import type { VerseRef } from './reference'
import type { BibleVerse } from './verse'

export interface StoredVerse {
  verse: number
  text: string
}

/**
 * Where verse text comes from. Today: what the reader published into the library.
 * Later: a bundled translation, implementing this same port with nothing above it changing.
 */
export interface VerseTextSource {
  read(ref: VerseRef): Promise<StoredVerse[]>
}

export function createStoredVerseSource(
  verses: readonly BibleVerse[],
  translation: string,
): VerseTextSource {
  return {
    read({ book, chapter, from, to }) {
      const found = verses
        .filter(
          (held) =>
            held.translation === translation &&
            held.book === book &&
            held.chapter === chapter &&
            held.verse >= from &&
            held.verse <= to,
        )
        .sort((a, b) => a.verse - b.verse)
        .map(({ verse, text }) => ({ verse, text }))
      return Promise.resolve(found)
    },
  }
}
