import { type BookCode, isBookCode } from './canon'
import { DEFAULT_TRANSLATION } from './translations'
import type { BibleVerse } from './verse'

/**
 * What the Bible library holds for one translation, answerable per book, chapter and verse — the
 * picker marks what it has, the import page prefills from it, and settings show its coverage.
 */
export interface LibraryIndex {
  hasBook(book: BookCode): boolean
  hasChapter(book: BookCode, chapter: number): boolean
  hasVerse(book: BookCode, chapter: number, verse: number): boolean
  text(book: BookCode, chapter: number, verse: number): string | null
  coverage(book: BookCode): { chapters: number; verses: number }
}

type Held = Map<BookCode, Map<number, Map<number, BibleVerse>>>

export function indexLibrary(
  verses: readonly BibleVerse[],
  translation: string = DEFAULT_TRANSLATION,
): LibraryIndex {
  const held: Held = new Map()
  for (const row of verses) {
    if (row.translation !== translation || !isBookCode(row.book)) continue
    const chapters = held.get(row.book) ?? new Map<number, Map<number, BibleVerse>>()
    held.set(row.book, chapters)
    const chapter = chapters.get(row.chapter) ?? new Map<number, BibleVerse>()
    chapters.set(row.chapter, chapter)
    const known = chapter.get(row.verse)
    // Two rows for one verse means a legacy row the keeper has not re-keyed yet; the newer wins.
    if (!known || known.updatedAt < row.updatedAt) chapter.set(row.verse, row)
  }

  const verseAt = (book: BookCode, chapter: number, verse: number) =>
    held.get(book)?.get(chapter)?.get(verse)

  return {
    hasBook: (book) => held.has(book),
    hasChapter: (book, chapter) => Boolean(held.get(book)?.has(chapter)),
    hasVerse: (book, chapter, verse) => Boolean(verseAt(book, chapter, verse)),
    text: (book, chapter, verse) => verseAt(book, chapter, verse)?.text ?? null,
    coverage: (book) => {
      const chapters = held.get(book)
      if (!chapters) return { chapters: 0, verses: 0 }
      let count = 0
      for (const chapter of chapters.values()) count += chapter.size
      return { chapters: chapters.size, verses: count }
    },
  }
}
