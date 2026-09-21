import { useMemo } from 'react'
import { toast } from 'sonner'
import { cardsInSubtree, nowIso, selectIsReady, usePendingAct } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { useBibleT } from '../i18n/use-bible-t'
import { keepMissingVerses } from '../features/keep-missing-verses'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { type BookCoverage, libraryCoverage } from './coverage'
import { indexLibrary } from './library-index'
import { type TextFromCards, textFromCards } from './text-from-cards'
import { CORNILESCU_2024, type Translation } from './translations'

/**
 * What the library screen has open over itself, or nothing — one value, never a flag each, so a
 * question can never stand over the deck sheet. Picking a deck is the first step of adding from it.
 */
export type BibleLibraryPending = { kind: 'pick-deck' } | { kind: 'add'; text: TextFromCards }

export interface BibleLibrary {
  ready: boolean
  translation: Translation
  coverage: BookCoverage[]
  /** The library holds no text at all — the coverage list has nothing to show. */
  empty: boolean
  /** Books with text, and verses held: the one-line answer to "how much have I got?". */
  totals: { books: number; verses: number }

  /** Previews adding text from every card, then asks. */
  addFromAllCards: () => void
  /** Opens the deck sheet: adding from one deck starts by picking it. */
  requestDeckPick: () => void
  /** Previews adding text from the picked deck's cards, then asks. */
  addFromDeck: (deckId: string) => void
  /** What the deck sheet offers. */
  decks: Deck[]
  folders: Folder[]

  pending: BibleLibraryPending | null
  /** Answers the question open: adds the previewed text. */
  confirm: () => void
  dismiss: () => void
}

/**
 * The Bible library as a learner manages it: what it holds, and the two ways to fill it from cards
 * they already have. Nothing here destroys anything — forgetting a book is a developer tool.
 */
export function useBibleLibrary(): BibleLibrary {
  const t = useBibleT()
  const verses = useBibleVerseStore((state) => state.verses)
  const versesReady = useBibleVerseStore(selectIsReady)
  const verseStore = useBibleVerseStoreApi()
  const cards = useCardStore(selectCards)
  const cardsReady = useCardStore(selectIsReady)
  const decks = useDeckStore(selectDecks)
  const decksReady = useDeckStore(selectIsReady)
  const folders = useFolderStore(selectFolders)
  const pending = usePendingAct<BibleLibraryPending>()

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
      toast(t(text.cards ? 'nothingNew' : 'noVerseCards', { count: text.held }))
      return
    }
    pending.request({ kind: 'add', text })
  }

  const confirm = () =>
    pending.resolve((act) => {
      if (act.kind !== 'add') return
      void keepMissingVerses(verseStore, act.text.fresh).then(
        (kept) => toast.success(t('kept', { count: kept })),
        () => toast.error(t('keepFailed')),
      )
    })

  return {
    ready: versesReady && cardsReady && decksReady,
    translation: CORNILESCU_2024,
    coverage,
    empty: totals.verses === 0,
    totals,
    addFromAllCards: () => preview(cards),
    requestDeckPick: () => pending.request({ kind: 'pick-deck' }),
    addFromDeck: (deckId) => preview(cardsInSubtree(decks, cards, deckId)),
    decks,
    folders,
    pending: pending.act,
    confirm,
    dismiss: pending.dismiss,
  }
}
