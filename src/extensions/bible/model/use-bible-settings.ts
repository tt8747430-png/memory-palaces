import { useMemo } from 'react'
import { toast } from 'sonner'
import { cardsInSubtree, nowIso, selectIsReady, usePendingAct } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { selectDevMode, usePreferencesStore } from '@/entities/preferences'
import { useBibleT } from '../i18n/use-bible-t'
import { forgetBook } from '../features/forget-book'
import { keepMissingVerses } from '../features/keep-missing-verses'
import type { BookCode } from './canon'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { type BookCoverage, libraryCoverage } from './coverage'
import { indexLibrary } from './library-index'
import { type TextFromCards, textFromCards } from './text-from-cards'
import { CORNILESCU_2024, type Translation } from './translations'

/**
 * What the page has open over itself, or nothing — one value, never a flag each, so a question can
 * never stand over the deck sheet. Picking a deck is the first step of adding from it.
 */
export type BibleSettingsPending =
  | { kind: 'pick-deck' }
  | { kind: 'add'; text: TextFromCards }
  | { kind: 'forget'; book: BookCode; verses: number }

export interface BibleSettings {
  ready: boolean
  translation: Translation
  coverage: BookCoverage[]
  /** The library holds no text at all — the coverage list has nothing to show. */
  empty: boolean
  /** Destructive tools are for developers; a learner's library is never one tap from gone. */
  devMode: boolean

  /** Previews adding text from every card, then asks. */
  addFromAllCards: () => void
  /** Opens the deck sheet: adding from one deck starts by picking it. */
  requestDeckPick: () => void
  /** Previews adding text from the picked deck's cards, then asks. */
  addFromDeck: (deckId: string) => void
  requestForget: (book: BookCode) => void
  /** What the deck sheet offers. */
  decks: Deck[]
  folders: Folder[]

  pending: BibleSettingsPending | null
  /** Answers the question open: adds the previewed text, or forgets the book. */
  confirm: () => void
  dismiss: () => void
}

export function useBibleSettings(): BibleSettings {
  const t = useBibleT()
  const verses = useBibleVerseStore((state) => state.verses)
  const versesReady = useBibleVerseStore(selectIsReady)
  const verseStore = useBibleVerseStoreApi()
  const cards = useCardStore(selectCards)
  const cardsReady = useCardStore(selectIsReady)
  const decks = useDeckStore(selectDecks)
  const decksReady = useDeckStore(selectIsReady)
  const folders = useFolderStore(selectFolders)
  const devMode = usePreferencesStore(selectDevMode)
  const pending = usePendingAct<BibleSettingsPending>()

  const index = useMemo(() => indexLibrary(verses), [verses])
  const coverage = useMemo(() => libraryCoverage(index), [index])

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
    empty: coverage.every((book) => book.verses === 0),
    devMode,
    addFromAllCards: () => preview(cards),
    requestDeckPick: () => pending.request({ kind: 'pick-deck' }),
    addFromDeck: (deckId) => preview(cardsInSubtree(decks, cards, deckId)),
    requestForget: (book) =>
      pending.request({ kind: 'forget', book, verses: index.coverage(book).verses }),
    decks,
    folders,
    pending: pending.act,
    confirm,
    dismiss: pending.dismiss,
  }
}
