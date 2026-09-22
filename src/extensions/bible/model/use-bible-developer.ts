import { useMemo } from 'react'
import { toast } from 'sonner'
import { cardsInSubtree, nowIso, selectIsReady, usePendingAct } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { useBibleT } from '../i18n/use-bible-t'
import { forgetBook } from '../features/forget-book'
import { keepMissingVerses } from '../features/keep-missing-verses'
import type { BookCode } from './canon'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { type BookCoverage, libraryCoverage } from './coverage'
import { indexLibrary } from './library-index'
import { summariseVerseRefs } from './summarise-refs'
import { type TextFromCards, textFromCards } from './text-from-cards'
import { CORNILESCU_2024, type Translation } from './translations'

/**
 * What the developer screen has open over itself, or nothing — one value, never a flag each, so
 * a question can never stand over the deck sheet. Picking a deck is the first step of adding
 * from it.
 */
export type BibleDeveloperPending =
  | { kind: 'forget'; book: BookCode; verses: number }
  | { kind: 'pick-deck' }
  | { kind: 'add'; text: TextFromCards }

export interface BibleDeveloper {
  ready: boolean
  translation: Translation
  coverage: BookCoverage[]
  /** Books with text, and verses held: the one-line answer to "how much is published?". */
  totals: { books: number; verses: number }
  /** The library holds no text at all — the coverage list has nothing to show. */
  empty: boolean

  /** Previews publishing text from every card, then asks. */
  addFromAllCards: () => void
  /** Opens the deck sheet: publishing from one deck starts by picking it. */
  requestDeckPick: () => void
  /** Previews publishing text from the picked deck's cards, then asks. */
  addFromDeck: (deckId: string) => void
  /** What the deck sheet offers. */
  decks: Deck[]
  folders: Folder[]

  requestForget: (book: BookCode) => void
  pending: BibleDeveloperPending | null
  /** Answers the question open: publishes the previewed text, or forgets the book. */
  confirm: () => void
  dismiss: () => void
}

/**
 * The tools behind Developer mode. The Bible library is a published corpus, read by every account
 * and written by a publisher: filling it from cards and forgetting a book are both editorial
 * acts, not something a learner should be one tap away from.
 */
export function useBibleDeveloper(): BibleDeveloper {
  const t = useBibleT()
  const verses = useBibleVerseStore((state) => state.verses)
  const versesReady = useBibleVerseStore(selectIsReady)
  const verseStore = useBibleVerseStoreApi()
  const cards = useCardStore(selectCards)
  const cardsReady = useCardStore(selectIsReady)
  const decks = useDeckStore(selectDecks)
  const decksReady = useDeckStore(selectIsReady)
  const folders = useFolderStore(selectFolders)
  const pending = usePendingAct<BibleDeveloperPending>()

  const index = useMemo(() => indexLibrary(verses), [verses])
  const coverage = useMemo(() => libraryCoverage(index), [index])
  const totals = useMemo(
    () =>
      coverage.reduce(
        (sum, book) => ({
          books: sum.books + (book.verses > 0 ? 1 : 0),
          verses: sum.verses + book.verses,
        }),
        { books: 0, verses: 0 },
      ),
    [coverage],
  )

  // Nothing to add is an answer, not a question: it is said at once, and no dialog opens on it.
  const preview = (source: typeof cards) => {
    const text = textFromCards(source, index, nowIso())
    if (text.fresh.length === 0) {
      pending.dismiss()
      if (!text.cards) {
        toast(t('noVerseCards'))
        return
      }
      const { text: refs, more } = summariseVerseRefs(text.heldRefs)
      toast(t(more ? 'nothingNewMore' : 'nothingNew', { count: text.held, refs, more }))
      return
    }
    pending.request({ kind: 'add', text })
  }

  const confirm = () =>
    pending.resolve((act) => {
      switch (act.kind) {
        case 'add':
          void keepMissingVerses(verseStore, act.text.fresh).then(
            (kept) => toast.success(t('kept', { count: kept })),
            () => toast.error(t('keepFailed')),
          )
          return
        case 'forget':
          void forgetBook(verseStore, act.book).then(
            (forgotten) => toast.success(t('forgotten', { count: forgotten })),
            () => toast.error(t('forgetFailed')),
          )
          return
        case 'pick-deck':
          return
      }
    })

  return {
    ready: versesReady && cardsReady && decksReady,
    translation: CORNILESCU_2024,
    coverage,
    totals,
    empty: totals.verses === 0,
    addFromAllCards: () => preview(cards),
    requestDeckPick: () => pending.request({ kind: 'pick-deck' }),
    addFromDeck: (deckId) => preview(cardsInSubtree(decks, cards, deckId)),
    decks,
    folders,
    requestForget: (book) =>
      pending.request({ kind: 'forget', book, verses: index.coverage(book).verses }),
    pending: pending.act,
    confirm,
    dismiss: pending.dismiss,
  }
}
