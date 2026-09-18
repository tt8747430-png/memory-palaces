import { type BookCode, chapterCount, verseCount } from './canon'
import { bookName, resolveBook } from './book-names'

export interface VerseRef {
  book: BookCode
  chapter: number
  from: number
  to: number
}

const REF = /^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$/

/** `1 Corinteni 8:9`, `Ioan 3:16-18` — the book named the way the translation names it. */
export function formatRef({ book, chapter, from, to }: VerseRef): string {
  const name = bookName(book)
  return to > from ? `${name} ${chapter}:${from}-${to}` : `${name} ${chapter}:${from}`
}

/** Whether the canon holds every verse of the reference. */
export function isInCanon({ book, chapter, from, to }: VerseRef): boolean {
  return (
    chapter >= 1 &&
    chapter <= chapterCount(book) &&
    from >= 1 &&
    to >= from &&
    to <= verseCount(book, chapter)
  )
}

/**
 * Reads a card front back into a reference. The book must be one the canon knows under one of its
 * aliases, and the verses must exist — `Zeus 1:1` is a note, not a reference.
 */
export function parseRef(text: string): VerseRef | null {
  const match = REF.exec(text.trim())
  if (!match) return null
  const [, name = '', chapter = '', from = '', to] = match
  const book = resolveBook(name)
  if (!book) return null
  const ref = { book, chapter: Number(chapter), from: Number(from), to: Number(to ?? from) }
  return isInCanon(ref) ? ref : null
}

/**
 * A reference part-way through being picked. The four fields travel together everywhere — the
 * picker holds them, the breadcrumb reads them — so they are one type rather than four parameters.
 */
export interface PartialVerseRef {
  book: BookCode | null
  chapter: number | null
  from: number | null
  to: number | null
}

/** As much of the reference as has been picked. `formatRef` cannot do this — it needs all of it. */
export function formatPartial(parts: PartialVerseRef): string {
  const { book, chapter, from, to } = parts
  if (!book) return ''
  if (!chapter) return bookName(book)
  if (!from) return `${bookName(book)} ${chapter}`
  return formatRef({ book, chapter, from, to: to ?? from })
}
