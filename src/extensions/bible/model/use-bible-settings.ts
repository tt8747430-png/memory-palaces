import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cardsInSubtree, nowIso, selectIsReady } from '@/shared/lib'
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

/** What the page is asking the learner to confirm, or nothing. One value, never a flag each. */
export type BibleSettingsPending =
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
  /** Previews adding text from one deck's cards, then asks. */
  addFromDeck: (deckId: string) => void
  requestForget: (book: BookCode) => void
  decks: Deck[]
  folders: Folder[]
  deckSheet: boolean
  showDeckSheet: (open: boolean) => void

  pending: BibleSettingsPending | null
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
  const [pending, setPending] = useState<BibleSettingsPending | null>(null)
  const [deckSheet, showDeckSheet] = useState(false)

  const index = useMemo(() => indexLibrary(verses), [verses])
  const coverage = useMemo(() => libraryCoverage(index), [index])

  // Nothing to add is an answer, not a question: it is said at once, and no dialog opens on it.
  const preview = (source: typeof cards) => {
    const text = textFromCards(source, index, nowIso())
    if (text.fresh.length === 0) {
      toast(t(text.cards ? 'nothingNew' : 'noVerseCards', { count: text.held }))
      return
    }
    setPending({ kind: 'add', text })
  }

  const confirm = () => {
    if (!pending) return
    setPending(null)
    if (pending.kind === 'add') {
      void keepMissingVerses(verseStore, pending.text.fresh).then(
        (kept) => toast.success(t('kept', { count: kept })),
        () => toast.error(t('keepFailed')),
      )
    } else {
      void forgetBook(verseStore, pending.book).then(
        (forgotten) => toast.success(t('forgotten', { count: forgotten })),
        () => toast.error(t('forgetFailed')),
      )
    }
  }

  return {
    ready: versesReady && cardsReady && decksReady,
    translation: CORNILESCU_2024,
    coverage,
    empty: coverage.every((book) => book.verses === 0),
    devMode,
    addFromAllCards: () => preview(cards),
    addFromDeck: (deckId) => preview(cardsInSubtree(decks, cards, deckId)),
    requestForget: (book) =>
      setPending({ kind: 'forget', book, verses: index.coverage(book).verses }),
    decks,
    folders,
    deckSheet,
    showDeckSheet,
    pending,
    confirm,
    dismiss: () => setPending(null),
  }
}
