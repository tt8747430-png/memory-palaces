import { useMemo, useState } from 'react'
import { chapterCount, verseCount } from './canon'
import type { PartialVerseRef, VerseRef } from './reference'

export type PickerStep = 'book' | 'chapter' | 'from' | 'to' | 'done'

export interface PassagePicker extends PartialVerseRef {
  step: PickerStep
  /** Complete once every part is picked; the breadcrumb reads the partial fields until then. */
  ref: VerseRef | null
  chapterOptions: number[]
  startOptions: number[]
  endOptions: number[]
  pickBook: (book: string) => void
  pickChapter: (chapter: number) => void
  pickFrom: (verse: number) => void
  pickTo: (verse: number) => void
  startOver: () => void
  changeVerses: () => void
}

const upTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1)

export function usePassagePicker(): PassagePicker {
  const [book, setBook] = useState<string | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [from, setFrom] = useState<number | null>(null)
  const [to, setTo] = useState<number | null>(null)

  const chapterOptions = useMemo(() => (book ? upTo(chapterCount(book)) : []), [book])
  const startOptions = useMemo(
    () => (book && chapter ? upTo(verseCount(book, chapter)) : []),
    [book, chapter],
  )
  const endOptions = useMemo(
    () => (from ? startOptions.filter((verse) => verse > from) : []),
    [startOptions, from],
  )

  const step: PickerStep = !book
    ? 'book'
    : !chapter
      ? 'chapter'
      : !from
        ? 'from'
        : !to
          ? 'to'
          : 'done'

  return {
    step,
    book,
    chapter,
    from,
    to,
    ref: book && chapter && from && to ? { book, chapter, from, to } : null,
    chapterOptions,
    startOptions,
    endOptions,
    pickBook: (next) => {
      setBook(next)
      setChapter(null)
      setFrom(null)
      setTo(null)
    },
    pickChapter: (next) => {
      setChapter(next)
      setFrom(null)
      setTo(null)
    },
    pickFrom: (next) => {
      setFrom(next)
      setTo(null)
    },
    pickTo: setTo,
    startOver: () => {
      setBook(null)
      setChapter(null)
      setFrom(null)
      setTo(null)
    },
    changeVerses: () => {
      setFrom(null)
      setTo(null)
    },
  }
}
