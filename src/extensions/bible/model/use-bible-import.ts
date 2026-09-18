import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { nowIso, type ParsedCard, selectIsReady } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { useImportDraft } from '@/widgets/content-editor'
import { useBibleT } from '../i18n/use-bible-t'
import { addVerseCards } from '../features/add-verse-cards'
import { keepMissingVerses } from '../features/keep-missing-verses'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { chapterDeckName } from './deck-names'
import { indexLibrary, type LibraryIndex } from './library-index'
import { type PassageText, passagePrefill } from './passage-text'
import { recentPassages, type RecentPassage } from './recents'
import { formatRef, parseRef } from './reference'
import { DEFAULT_TRANSLATION } from './translations'
import { type PassagePicker, usePassagePicker } from './use-passage-picker'
import {
  addableCards,
  buildVerseCards,
  canSplit,
  findDuplicates,
  type HeldRef,
} from './verse-cards'
import { verseSources } from './verse-sources'
import { makeBibleVerse } from './verse'
import { type VerseTarget, targetIsResolvable } from './verse-target'

/** The switches on the screen. The text box is the learner's own input, not a setting. */
export type BibleImportToggle = 'split' | 'keepDuplicates' | 'auto' | 'save'

export type BibleImportSheet = 'deck' | 'name'

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
  /** Save the verses the text supplies and the Bible library lacks, when the cards are added. */
  save: boolean
  set: (key: BibleImportToggle, on: boolean) => void
  /** The text carries markers at all — without them the split toggle would silently do nothing. */
  splitAvailable: boolean
  /** What splitting *would* produce, asked of the text rather than of the current toggle. */
  splitCount: number
  /** More than one verse is picked, so there is something to split. */
  spansRange: boolean
  /** How many verses Add would save into the Bible library; the save toggle shows only above 0. */
  saveCount: number

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

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

/**
 * Everything the Bible import screen holds, in one surface: the screen reads it and renders. Every
 * write goes through a command, called from here.
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
  const verseStore = useBibleVerseStoreApi()
  const setDraft = useImportDraft((draft) => draft.setDraft)

  // What the learner typed, and the passage they typed it under. Absent until they touch the box.
  const [own, setOwn] = useState<{ ref: string | null; text: string } | null>(null)
  const [toggles, setToggles] = useState<Record<BibleImportToggle, boolean>>({
    split: true,
    keepDuplicates: false,
    auto: !deckId,
    save: true,
  })
  // The learner's own placement, remembered across the toggle. Switching "Include in decks" on and
  // straight off again must give back the deck they arrived with, not throw it away.
  const [choice, setChoice] = useState<VerseTarget>(
    deckId ? { kind: 'deck', deckId } : { kind: 'newDeck', name: '' },
  )
  const [sheet, setSheet] = useState<BibleImportSheet | null>(null)

  const index = useMemo(() => indexLibrary(verses), [verses])
  const recents = useMemo(() => recentPassages(cards), [cards])
  // Read again whenever the passage or the library changes — a verse that arrives by Sync fills a
  // box the learner has not touched.
  const passage = useMemo(() => (ref ? passagePrefill(ref, index) : null), [ref, index])

  const key = ref ? formatRef(ref) : null
  // The learner's text always wins. An empty one is an answer too — but only for the passage it was
  // cleared under: change verses, and the Bible library gets to speak again.
  const typed = own && (own.text !== '' || own.ref === key) ? own.text : null
  const prefill = passage?.text ?? ''
  const text = typed ?? prefill
  const prefilled = prefill !== '' && text === prefill

  const chapterName = book && chapter ? chapterDeckName(book, chapter) : ''
  const { split, keepDuplicates, auto, save } = toggles
  // An unnamed new deck takes the chapter's name and follows it: named once at the toggle, a deck
  // for chapter 2 would still be called "Geneza 1". A name the learner gave is left alone.
  const target: VerseTarget = auto
    ? { kind: 'automatic' }
    : choice.kind === 'newDeck' && !choice.name.trim()
      ? { kind: 'newDeck', name: chapterName }
      : choice

  const held = useMemo(
    () => cards.map((card) => ({ front: card.front, deckId: card.deckId })),
    [cards],
  )
  const built = useMemo(() => buildVerseCards(ref, text, { split }), [ref, text, split])
  const duplicates = useMemo(() => findDuplicates(built, held), [built, held])
  const addable = useMemo(
    () => addableCards(built, duplicates, keepDuplicates),
    [built, duplicates, keepDuplicates],
  )
  // Every verse card the text makes, always split: the Bible library holds one record per verse,
  // and a range card is not one. Saving reads this whatever the split toggle says.
  const keepable = useMemo(() => buildVerseCards(ref, text), [ref, text])
  const splitAvailable = canSplit(text)
  const unheld = useMemo(
    () =>
      verseSources(keepable).filter(
        (source) => !index.hasVerse(source.book, source.chapter, source.verse),
      ),
    [keepable, index],
  )
  const missing = useMemo(() => {
    if (!ref || !splitAvailable) return []
    const present = new Set(keepable.flatMap((card) => parseRef(card.front)?.from ?? []))
    return range(ref.from, ref.to).filter((verse) => !present.has(verse))
  }, [ref, splitAvailable, keepable])

  const add = () => {
    const at = nowIso()
    const fresh = save
      ? unheld.map((source) =>
          makeBibleVerse({ createdAt: at, translation: DEFAULT_TRANSLATION, ...source }),
        )
      : []
    void addVerseCards({ deckStore, setDraft }, { cards: addable, ref, target }).then(
      onReview,
      () => toast.error(t('addFailed')),
    )
    if (fresh.length) {
      void keepMissingVerses(verseStore, fresh).catch(() => toast.error(t('saveFailed')))
    }
  }

  return {
    ready: versesReady && cardsReady && decksReady,
    picker,
    index,
    recents,
    passage,
    chapterName,
    translation: DEFAULT_TRANSLATION,

    text,
    setText: (value) => setOwn({ ref: key, text: value }),
    prefilled,
    missing,

    split,
    keepDuplicates,
    auto,
    save,
    set: (toggle, on) => setToggles((current) => ({ ...current, [toggle]: on })),
    splitAvailable,
    splitCount: splitAvailable ? keepable.length : 0,
    spansRange: Boolean(ref && ref.to > ref.from),
    saveCount: unheld.length,

    hasCards: built.length > 0,
    duplicates,
    addable,
    canAdd: addable.length > 0 && targetIsResolvable(target),
    add,

    target,
    destination:
      target.kind === 'deck'
        ? (decks.find((deck) => deck.id === target.deckId)?.name ?? null)
        : target.kind === 'newDeck'
          ? target.name
          : null,
    pickDeck: (picked) => setChoice({ kind: 'deck', deckId: picked }),
    nameDeck: (name) => setChoice({ kind: 'newDeck', name }),
    decks,
    folders,
    sheet,
    showSheet: setSheet,
  }
}
