import { useMemo } from 'react'
import { toast } from 'sonner'
import { selectIsReady, usePendingAct } from '@/shared/lib'
import { useBibleT } from '../i18n/use-bible-t'
import { forgetBook } from '../features/forget-book'
import type { BookCode } from './canon'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { type BookCoverage, libraryCoverage } from './coverage'
import { indexLibrary } from './library-index'
import { CORNILESCU_2024, type Translation } from './translations'

export interface BibleDeveloperPending {
  kind: 'forget'
  book: BookCode
  verses: number
}

export interface BibleDeveloper {
  ready: boolean
  translation: Translation
  coverage: BookCoverage[]
  /** The library holds no text at all — the coverage list has nothing to show. */
  empty: boolean

  requestForget: (book: BookCode) => void
  pending: BibleDeveloperPending | null
  /** Answers the question open: forgets the book. */
  confirm: () => void
  dismiss: () => void
}

/**
 * The tools behind Developer mode. Everything here is destructive or diagnostic: forgetting a book
 * takes its text off every device, which is not something a learner should be one tap away from.
 */
export function useBibleDeveloper(): BibleDeveloper {
  const t = useBibleT()
  const verses = useBibleVerseStore((state) => state.verses)
  const versesReady = useBibleVerseStore(selectIsReady)
  const verseStore = useBibleVerseStoreApi()
  const pending = usePendingAct<BibleDeveloperPending>()

  const index = useMemo(() => indexLibrary(verses), [verses])
  const coverage = useMemo(() => libraryCoverage(index), [index])

  const confirm = () =>
    pending.resolve((act) => {
      void forgetBook(verseStore, act.book).then(
        (forgotten) => toast.success(t('forgotten', { count: forgotten })),
        () => toast.error(t('forgetFailed')),
      )
    })

  return {
    ready: versesReady,
    translation: CORNILESCU_2024,
    coverage,
    empty: coverage.every((book) => book.verses === 0),
    requestForget: (book) =>
      pending.request({ kind: 'forget', book, verses: index.coverage(book).verses }),
    pending: pending.act,
    confirm,
    dismiss: pending.dismiss,
  }
}
