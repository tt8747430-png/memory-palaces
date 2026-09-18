import { type BookCode, chapterCount, verseCount } from './canon'
import { matchBooks, resolveBook } from './book-names'
import type { PartialVerseRef } from './reference'

export interface Jump {
  /** The books the typed name could mean — what the field offers while the name is unfinished. */
  books: BookCode[]
  /** As much of a passage as the text determines, every part checked against the canon. */
  target: PartialVerseRef | null
}

/**
 * A book name (optionally numbered: `1 Ioan`, `1cor`), then chapter, verse and an optional range
 * end, separated by spaces, colons, dots or commas. Everything after the name is optional, so the
 * field can answer while the learner is still typing.
 */
const JUMP =
  /^(?<name>[1-3]?\s*\p{L}[\p{L}\s.]*?)\s*(?:(?<chapter>\d+)(?:\s*[:.,\s]\s*(?<from>\d+)?)?(?<dash>\s*[-–]\s*(?<to>\d+)?)?)?\s*$/u

const NONE: Jump = { books: [], target: null }

const within = (value: number | undefined, max: number): number | null =>
  value !== undefined && value >= 1 && value <= max ? value : null

/** `ioan 3 16-18`, `Ioan 3:16`, `1cor13`, `ps 23` — what the picker's jump field understands. */
export function parseJump(text: string): Jump {
  const match = JUMP.exec(text.trim())
  const groups = match?.groups
  if (!groups?.name) return NONE

  const books = matchBooks(groups.name)
  const typedChapter = groups.chapter !== undefined
  const book = resolveBook(groups.name) ?? (books.length === 1 || typedChapter ? books[0] : undefined)
  if (!book) return { books, target: null }

  const chapter = within(Number(groups.chapter ?? NaN), chapterCount(book))
  const verses = chapter ? verseCount(book, chapter) : 0
  const from = chapter ? within(Number(groups.from ?? NaN), verses) : null
  // No dash: the verse is a passage of one. A dash with no end yet leaves the range open.
  const end = groups.dash ? within(Number(groups.to ?? NaN), verses) : from
  const to = from && end && end >= from ? end : null

  return { books, target: { book, chapter, from, to } }
}
