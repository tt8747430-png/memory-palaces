import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { nowIso, type ParsedCard, selectIsReady, useDevMode } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { type Deck, selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { type Folder, selectFolders, useFolderStore } from '@/entities/folder'
import { useImportDraft } from '@/widgets/content-editor'
import { useBibleT } from '../i18n/use-bible-t'
import { addVerseCards } from '../features/add-verse-cards'
import { publishVerses } from '../features/publish-verses'
import { useBibleVerseStore, useBibleVerseStoreApi } from './context'
import { chapterDeckName } from './deck-names'
import { formatPartial, formatRef } from './reference'
import { type PassagePicker, usePassagePicker } from './use-passage-picker'
import { createStoredVerseSource, type StoredVerse } from './verse-text'
import {
  addableCards,
  buildVerseCards,
  canSplit,
  findDuplicates,
  type HeldRef,
} from './verse-cards'
import { verseSources, versesFromCards } from './verse-sources'
import { type VerseTarget, targetIsResolvable } from './verse-target'
import { DEFAULT_TRANSLATION } from './verse'

/** Markers, not a plain join: a plain one would round-trip into a single card for the whole range. */
const prefillFrom = (verses: readonly StoredVerse[]): string =>
  verses.map((held) => `${held.verse}) ${held.text}`).join(' ')

/** The three switches on the screen. The text box is the reader's own input, not a setting. */
export type BibleImportToggle = 'split' | 'keepDuplicates' | 'auto'

export type BibleImportSheet = 'deck' | 'name'

export interface BibleImport {
  /** The stores the screen reads have all mirrored, so what it says about the library is true. */
  ready: boolean
  picker: PassagePicker
  /** The reference as far as it has been picked, for the heading above the pickers. */
  breadcrumb: string
  /** `Genesis 1`, the name a chapter deck would take. Empty until book and chapter are picked. */
  chapterName: string
  translation: string

  text: string
  setText: (value: string) => void
  /** The box holds text the library supplied, not text the reader typed. */
  prefilled: boolean

  split: boolean
  keepDuplicates: boolean
  /** Include in decks: the app places the cards. Off hands the choice back to the reader. */
  auto: boolean
  set: (key: BibleImportToggle, on: boolean) => void
  /** The text carries markers at all — without them the split toggle would silently do nothing. */
  splitAvailable: boolean
  /** What splitting *would* produce, asked of the text rather than of the current toggle. */
  splitCount: number
  /** More than one verse is picked, so there is something to split. */
  spansRange: boolean

  duplicates: HeldRef[]
  /** The cards Add would make, after duplicates are dropped. Its length labels the button. */
  addable: ParsedCard[]
  canAdd: boolean
  add: () => void

  target: VerseTarget
  /** The deck name to show while the reader is placing the cards; null while the app places them. */
  destination: string | null
  pickDeck: (deckId: string) => void
  nameDeck: (name: string) => void
  /** What the deck sheet offers, when the reader places the cards themselves. */
  decks: Deck[]
  folders: Folder[]
  sheet: BibleImportSheet | null
  showSheet: (sheet: BibleImportSheet | null) => void

  /**
   * Dev mode only: whether keeping the text would store anything. The library holds one record
   * per verse, so a range front names nothing to keep.
   */
  keepOffered: boolean
  keep: () => void
}

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
  const { book, chapter, from, to, ref } = picker

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
  const devMode = useDevMode()

  // What the reader typed, and the reference they typed it under. Absent until they touch the box.
  const [own, setOwn] = useState<{ ref: string | null; text: string } | null>(null)
  // What the library supplied for a reference, read again whenever the reference or the library
  // changes — a verse that arrives by sync fills a box the reader has not touched.
  const [supplied, setSupplied] = useState<{ ref: string; text: string } | null>(null)
  const [toggles, setToggles] = useState<Record<BibleImportToggle, boolean>>({
    split: true,
    keepDuplicates: false,
    auto: !deckId,
  })
  // The reader's own placement, remembered across the toggle. Switching "Include in decks" on and
  // straight off again must give back the deck they arrived with, not throw it away.
  const [choice, setChoice] = useState<VerseTarget>(
    deckId ? { kind: 'deck', deckId } : { kind: 'newDeck', name: '' },
  )
  const [sheet, setSheet] = useState<BibleImportSheet | null>(null)

  const source = useMemo(() => createStoredVerseSource(verses, DEFAULT_TRANSLATION), [verses])

  useEffect(() => {
    if (!ref) return
    let live = true
    void source.read(ref).then((held) => {
      if (live) setSupplied({ ref: formatRef(ref), text: prefillFrom(held) })
    })
    return () => {
      live = false
    }
  }, [ref, source])

  const key = ref ? formatRef(ref) : null
  const prefill = supplied?.ref === key ? supplied.text : ''
  // The reader's text always wins. An empty one is an answer too — but only for the passage it was
  // cleared under: change verses, and the library gets to speak again.
  const typed = own && (own.text !== '' || own.ref === key) ? own.text : null
  const text = typed ?? prefill
  const prefilled = typed === null && prefill !== ''

  const chapterName = book && chapter ? chapterDeckName(book, chapter) : ''
  const { split, keepDuplicates, auto } = toggles
  // An unnamed new deck takes the chapter's name and follows it: named once at the toggle, a deck
  // for chapter 2 would still be called "Genesis 1". A name the reader gave is left alone.
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
  // Every verse card the text makes, always split: the library stores one record per verse, and
  // a range card is not one. Keep publishes this whatever the toggle says.
  const keepable = useMemo(() => buildVerseCards(ref, text), [ref, text])
  const splitAvailable = canSplit(text)

  const add = () => {
    void addVerseCards({ deckStore, setDraft }, { cards: addable, ref, target }).then(
      onReview,
      () => toast.error(t('addFailed')),
    )
  }

  /** Dev-mode only: this is how the verse library is filled before a bundled translation exists. */
  const keep = () => {
    void publishVerses(verseStore, versesFromCards(keepable, DEFAULT_TRANSLATION, nowIso())).then(
      (kept) => toast.success(t('kept', { count: kept })),
      () => toast.error(t('keepFailed')),
    )
  }

  return {
    ready: versesReady && cardsReady && decksReady,
    picker,
    breadcrumb: formatPartial({ book, chapter, from, to }),
    chapterName,
    translation: DEFAULT_TRANSLATION,

    text,
    setText: (value) => setOwn({ ref: key, text: value }),
    prefilled,

    split,
    keepDuplicates,
    auto,
    set: (toggle, on) => setToggles((current) => ({ ...current, [toggle]: on })),
    splitAvailable,
    splitCount: splitAvailable ? keepable.length : 0,
    spansRange: Boolean(from && to && to > from),

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

    keepOffered: devMode && verseSources(keepable).length > 0,
    keep,
  }
}
