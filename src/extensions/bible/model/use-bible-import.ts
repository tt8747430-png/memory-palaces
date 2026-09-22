import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type ParsedCard, selectIsReady } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { useImportDraft } from '@/widgets/content-editor'
import { useBibleT } from '../i18n/use-bible-t'
import { BIBLE_FEATURES } from '../ids'
import { useBibleFeature } from './use-bible-feature'
import { addVerseCards } from '../features/add-verse-cards'
import { useBibleVerseStore } from './context'
import { chapterDeckName } from './deck-names'
import { indexLibrary, type LibraryIndex } from './library-index'
import type { PassageText } from './passage-text'
import { recentPassages, type RecentPassage } from './recents'
import { DEFAULT_TRANSLATION } from './translations'
import { type PassagePicker, usePassagePicker } from './use-passage-picker'
import { useVerseCards } from './use-verse-cards'
import { type BibleImportSheet, useVersePlacement } from './use-verse-placement'
import { useVerseText } from './use-verse-text'
import type { HeldRef } from './verse-cards'
import { type VerseTarget, targetIsResolvable } from './verse-target'

/** The switches on the screen. The text box is the learner's own input, not a setting. */
export type BibleImportToggle = 'split' | 'keepDuplicates' | 'auto'

export interface BibleImport {
  /** The stores the screen reads have all mirrored, so what it says about either library is true. */
  ready: boolean
  picker: PassagePicker
  /** What the Bible library holds — the picker marks it, the summary counts it. */
  index: LibraryIndex
  recents: RecentPassage[]
  /** How much of the confirmed passage the Bible library holds; null until one is confirmed. */
  passage: PassageText | null
  /** `Geneza 1`, the name a chapter deck would take. Empty until book and chapter are picked. */
  chapterName: string
  translation: string

  text: string
  setText: (value: string) => void
  /** The box holds exactly what the Bible library supplied, not text the learner typed. */
  prefilled: boolean
  /** Verses of the passage the box still has no text for, while its verses are numbered. */
  missing: number[]

  split: boolean
  keepDuplicates: boolean
  /** Include in decks: the app places the cards. Off hands the choice back to the learner. */
  auto: boolean
  set: (key: BibleImportToggle, on: boolean) => void
  /** The text carries markers at all — without them the split toggle would silently do nothing. */
  splitAvailable: boolean
  /** What splitting *would* produce, asked of the text rather than of the current toggle. */
  splitCount: number
  /** More than one verse is picked, so there is something to split. */
  spansRange: boolean
  /** The Verse library feature is on: text is filled in from it. */
  libraryAvailable: boolean
  /** The Chapter decks feature is on: the app can place the cards for the learner. */
  chapterDecksAvailable: boolean

  /** The box makes at least one card — until then the options below it have nothing to act on. */
  hasCards: boolean
  duplicates: HeldRef[]
  /** The cards Add would make, after duplicates are dropped. Its length labels the button. */
  addable: ParsedCard[]
  canAdd: boolean
  add: () => void

  target: VerseTarget
  /** The deck name to show while the learner is placing the cards; null while the app places them. */
  destination: string | null
  pickDeck: (deckId: string) => void
  nameDeck: (name: string) => void
  /** What the deck sheet offers, when the learner places the cards themselves. */
  decks: Deck[]
  folders: Folder[]
  sheet: BibleImportSheet | null
  showSheet: (sheet: BibleImportSheet | null) => void
}

/**
 * Everything the Bible import screen holds, in one surface: the screen reads it and renders. The
 * text box, the cards it makes and where they go are seams of their own (`useVerseText`,
 * `useVerseCards`, `useVersePlacement`); every write goes through a command, called from here.
 *
 * The Bible library is read here and never written: it is a published corpus, and publishing is
 * an editorial act that lives behind Developer mode (`useBibleDeveloper`). Text the learner pastes
 * becomes their cards and nothing else.
 */
export function useBibleImport(
  deckId: string | undefined,
  onReview: (deckId: string) => void,
): BibleImport {
  const t = useBibleT()
  const picker = usePassagePicker()
  const { book, chapter, ref } = picker

  const decks = useDeckStore(selectDecks)
  const folders = useFolderStore(selectFolders)
  const cards = useCardStore(selectCards)
  const verses = useBibleVerseStore((state) => state.verses)
  const versesReady = useBibleVerseStore(selectIsReady)
  const cardsReady = useCardStore(selectIsReady)
  const decksReady = useDeckStore(selectIsReady)
  const deckStore = useDeckStoreApi()
  const setDraft = useImportDraft((draft) => draft.setDraft)

  const [toggles, setToggles] = useState<Record<BibleImportToggle, boolean>>({
    split: true,
    keepDuplicates: false,
    auto: !deckId,
  })
  const { split, keepDuplicates } = toggles

  const libraryAvailable = useBibleFeature(BIBLE_FEATURES.library)
  const chapterDecksAvailable = useBibleFeature(BIBLE_FEATURES.chapterDecks)

  // With the Verse library switched off the import reads no text: the passage is not prefilled
  // and nothing is marked as held. The verses themselves stay.
  const stored = useMemo(() => indexLibrary(verses), [verses])
  const empty = useMemo(() => indexLibrary([]), [])
  const index = libraryAvailable ? stored : empty
  // A switched-off feature is not a setting the learner can override from the import screen.
  const auto = toggles.auto && chapterDecksAvailable
  const recents = useMemo(() => recentPassages(cards), [cards])
  const chapterName = book && chapter ? chapterDeckName(book, chapter) : ''

  const box = useVerseText(ref, index)
  const deckIds = useMemo(() => new Set(decks.map((deck) => deck.id)), [decks])
  const made = useVerseCards({ ref, text: box.text, split, keepDuplicates, cards, deckIds })
  const placement = useVersePlacement(deckId, auto, chapterName, decks)

  const add = () => {
    void addVerseCards(
      { deckStore, setDraft },
      { cards: made.addable, ref, target: placement.target },
    ).then(onReview, () => toast.error(t('addFailed')))
  }

  return {
    ready: versesReady && cardsReady && decksReady,
    picker,
    index,
    recents,
    passage: box.passage,
    chapterName,
    translation: DEFAULT_TRANSLATION,

    text: box.text,
    setText: box.setText,
    prefilled: box.prefilled,
    missing: made.missing,

    split,
    keepDuplicates,
    auto,
    set: (toggle, on) => setToggles((current) => ({ ...current, [toggle]: on })),
    splitAvailable: made.splitAvailable,
    splitCount: made.splitCount,
    libraryAvailable,
    chapterDecksAvailable,
    spansRange: Boolean(ref && ref.to > ref.from),

    hasCards: made.built.length > 0,
    duplicates: made.duplicates,
    addable: made.addable,
    canAdd: made.addable.length > 0 && targetIsResolvable(placement.target),
    add,

    target: placement.target,
    destination: placement.destination,
    pickDeck: placement.pickDeck,
    nameDeck: placement.nameDeck,
    decks,
    folders,
    sheet: placement.sheet,
    showSheet: placement.showSheet,
  }
}
