import { useMemo, useState } from 'react'
import { type BookCode, chapterCount, verseCount } from './canon'
import type { PartialVerseRef, VerseRef } from './reference'

/** `book` — choosing one; `passage` — chapter and verses, one screen; `done` — confirmed. */
export type PickerStep = 'book' | 'passage' | 'done'

export interface PassagePicker extends PartialVerseRef {
  step: PickerStep
  /** The confirmed passage; null until `confirm`, and again while it is being edited. */
  ref: VerseRef | null
  chapterOptions: number[]
  verseOptions: number[]
  pickBook: (book: BookCode) => void
  pickChapter: (chapter: number) => void
  /** First tap sets the start; the second the end (or a new start, if it comes before); a third restarts. */
  tapVerse: (verse: number) => void
  /** The passage is the one verse tapped so far. */
  justFrom: () => void
  confirm: () => void
  /** Back from `done` to the passage, keeping what was picked. */
  edit: () => void
  /** Back to the books, forgetting everything. */
  toBooks: () => void
  /** Straight to what the jump field determined: `done` when it is a whole passage. */
  jump: (target: PartialVerseRef) => void
}

const upTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1)

const EMPTY: PartialVerseRef = { book: null, chapter: null, from: null, to: null }

interface Picked extends PartialVerseRef {
  confirmed: boolean
}

const complete = (parts: PartialVerseRef): VerseRef | null => {
  const { book, chapter, from, to } = parts
  return book && chapter && from && to ? { book, chapter, from, to } : null
}

export function usePassagePicker(): PassagePicker {
  const [picked, setPicked] = useState<Picked>({ ...EMPTY, confirmed: false })
  const { book, chapter, from, to, confirmed } = picked

  const chapterOptions = useMemo(() => (book ? upTo(chapterCount(book)) : []), [book])
  const verseOptions = useMemo(
    () => (book && chapter ? upTo(verseCount(book, chapter)) : []),
    [book, chapter],
  )

  // Memoised by value: `ref` feeds effects and memos on the import screen, and a fresh object
  // every render would recompute them on every render.
  const ref = useMemo(
    () => (confirmed ? complete({ book, chapter, from, to }) : null),
    [confirmed, book, chapter, from, to],
  )

  const step: PickerStep = !book ? 'book' : ref ? 'done' : 'passage'

  return {
    step,
    book,
    chapter,
    from,
    to,
    ref,
    chapterOptions,
    verseOptions,
    // A one-chapter book (Obadia, Iuda) has no chapter to choose, so its verses open at once.
    pickBook: (next) =>
      setPicked({
        ...EMPTY,
        book: next,
        chapter: chapterCount(next) === 1 ? 1 : null,
        confirmed: false,
      }),
    pickChapter: (next) =>
      setPicked((held) => ({ ...held, chapter: next, from: null, to: null, confirmed: false })),
    tapVerse: (verse) =>
      setPicked((held) => {
        if (held.from === null || held.to !== null || verse < held.from) {
          return { ...held, from: verse, to: null, confirmed: false }
        }
        return { ...held, to: verse, confirmed: false }
      }),
    justFrom: () => setPicked((held) => (held.from ? { ...held, to: held.from } : held)),
    confirm: () => setPicked((held) => (complete(held) ? { ...held, confirmed: true } : held)),
    edit: () => setPicked((held) => ({ ...held, confirmed: false })),
    toBooks: () => setPicked({ ...EMPTY, confirmed: false }),
    jump: (target) => setPicked({ ...target, confirmed: complete(target) !== null }),
  }
}
