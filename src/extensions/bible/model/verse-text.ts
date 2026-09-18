import type { VerseRef } from './reference'
import type { BibleVerse } from './verse'

export interface StoredVerse {
  verse: number
  text: string
}

/**
 * Where verse text comes from. Today: the Bible library, what was published into it in dev mode.
 * Later: a bundled translation, implementing this same port with nothing above it changing.
 */
export interface VerseTextSource {
  read(ref: VerseRef): Promise<StoredVerse[]>
  /**
   * The books it holds any text for. Known up front — a source knows what it holds without reading
   * it — so the picker derives what it offers rather than waiting on it.
   */
  books(): ReadonlySet<string>
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
    books() {
      const held = verses.filter((verse) => verse.translation === translation)
      return new Set(held.map((verse) => verse.book))
    },
  }
}
