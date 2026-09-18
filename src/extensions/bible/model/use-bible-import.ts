import { useEffect, useMemo, useState } from 'react'
import type { ParsedCard } from '@/shared/lib'
import { selectCards, useCardStore } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { useBibleVerseStore } from './context'
import { formatPartial, formatRef } from './reference'
import { type PassagePicker, usePassagePicker } from './use-passage-picker'
import { createStoredVerseSource, type StoredVerse } from './verse-text'
import { buildVerseCards, canSplit, findDuplicates, type HeldRef } from './verse-cards'
import { verseSources } from './verse-sources'
import { type VerseTarget, targetIsResolvable } from './verse-target'
import { DEFAULT_TRANSLATION } from './verse'

/** Markers, not a plain join: a plain one would round-trip into a single card for the whole range. */
const prefillFrom = (verses: readonly StoredVerse[]): string =>
  verses.map((held) => `${held.verse}) ${held.text}`).join(' ')

export interface BibleImport {
  picker: PassagePicker
  /** The reference as far as it has been picked, for the heading above the pickers. */
  breadcrumb: string
  /** `Genesis 1`, the name a chapter deck would take. Empty until book and chapter are picked. */
  chapterName: string

  text: string
  setText: (value: string) => void
  /** The box holds text the library supplied, not text the reader typed. */
  prefilled: boolean

  split: boolean
  setSplit: (value: boolean) => void
  /** The text carries markers at all — without them the toggle would silently do nothing. */
  splitAvailable: boolean
  /** What splitting *would* produce, asked of the text rather than of the current toggle. */
  splitCount: number
  /** More than one verse is picked, so there is something to split. */
  spansRange: boolean

  /** Every card in the library, as the duplicate check and the command both want it. */
  held: readonly HeldRef[]
  duplicates: HeldRef[]
  keepDuplicates: boolean
  setKeepDuplicates: (value: boolean) => void
  /** The cards Add would make, after duplicates are dropped. Its length labels the button. */
  addable: ParsedCard[]
  canAdd: boolean

  /** Include in decks: the app places the cards. Off hands the choice back to the reader. */
  auto: boolean
  setAuto: (value: boolean) => void
  target: VerseTarget
  pickDeck: (deckId: string) => void
  nameDeck: (name: string) => void
  /** The deck name to show while the reader is placing the cards; null while the app places them. */
  destination: string | null

  /**
   * Every verse card the text makes, always split — what the dev-mode Keep publishes. It ignores
   * the toggle on purpose: the library stores one record per verse, and a range card is not one.
   */
  keepable: ParsedCard[]
  canKeep: boolean
}

/**
 * Everything the Bible import screen holds, in one surface. The screen reads it and renders; every
 * write still goes through a command, which this hook does not call.
 */
export function useBibleImport(deckId: string | undefined): BibleImport {
  const picker = usePassagePicker()
  const { book, chapter, from, to, ref } = picker

  const decks = useDeckStore(selectDecks)
  const cards = useCardStore(selectCards)
  const verses = useBibleVerseStore((state) => state.verses)

  // What the reader typed, or null while they have not touched the box. Keeping the two apart is
  // what lets clearing a prefilled box stay cleared: an empty string is an answer, absence is not.
  const [typed, setTyped] = useState<string | null>(null)
  const [prefill, setPrefill] = useState<{ ref: string; text: string } | null>(null)
  const [split, setSplit] = useState(true)
  const [keepDuplicates, setKeepDuplicates] = useState(false)
  const [auto, setAutoState] = useState(!deckId)
  // The reader's own placement, remembered across the toggle. Switching "Include in decks" on and
  // straight off again must give back the deck they arrived with, not throw it away.
  const [manual, setManual] = useState<VerseTarget>(
    deckId ? { kind: 'deck', deckId } : { kind: 'newDeck', name: '' },
  )

  const source = useMemo(() => createStoredVerseSource(verses, DEFAULT_TRANSLATION), [verses])

  // Read the library once per completed reference. Not once per keystroke: the reader's own text
  // always wins, and a box they cleared stays clear.
  useEffect(() => {
    if (!ref) return
    const key = formatRef(ref)
    if (prefill?.ref === key) return
    let live = true
    void source.read(ref).then((held) => {
      if (live) setPrefill({ ref: key, text: held.length > 0 ? prefillFrom(held) : '' })
    })
    return () => {
      live = false
    }
  }, [ref, source, prefill])

  const text = typed ?? prefill?.text ?? ''
  const prefilled = typed === null && Boolean(prefill?.text)

  const chapterName = book && chapter ? `${book} ${chapter}` : ''
  const target: VerseTarget = auto ? { kind: 'automatic' } : manual

  const held = useMemo(
    () => cards.map((card) => ({ front: card.front, deckId: card.deckId })),
    [cards],
  )

  const built = useMemo(() => buildVerseCards(ref, text, { split }), [ref, text, split])
  const duplicates = useMemo(() => findDuplicates(built, held), [built, held])
  const addable = useMemo(() => {
    if (keepDuplicates) return built
    const seen = new Set(duplicates.map((entry) => entry.front))
    return built.filter((card) => !seen.has(card.front))
  }, [built, duplicates, keepDuplicates])

  const splitAvailable = canSplit(text)
  const keepable = useMemo(() => buildVerseCards(ref, text), [ref, text])

  return {
    picker,
    breadcrumb: formatPartial({ book, chapter, from, to }),
    chapterName,

    text,
    setText: setTyped,
    prefilled,

    split,
    setSplit,
    splitAvailable,
    splitCount: splitAvailable ? keepable.length : 0,
    spansRange: Boolean(from && to && to > from),

    held,
    duplicates,
    keepDuplicates,
    setKeepDuplicates,
    addable,
    canAdd: addable.length > 0 && targetIsResolvable(target),

    auto,
    setAuto: (next) => {
      setAutoState(next)
      // Falling back to a new deck the reader never named would leave Add disabled with nothing
      // saying why, so an unnamed one takes the chapter's name. A real choice is left alone.
      if (!next) {
        setManual((choice) =>
          choice.kind === 'newDeck' && !choice.name.trim()
            ? { kind: 'newDeck', name: chapterName }
            : choice,
        )
      }
    },
    target,
    pickDeck: (picked) => setManual({ kind: 'deck', deckId: picked }),
    nameDeck: (name) => setManual({ kind: 'newDeck', name }),
    destination:
      target.kind === 'deck'
        ? (decks.find((deck) => deck.id === target.deckId)?.name ?? null)
        : target.kind === 'newDeck'
          ? target.name
          : null,

    keepable,
    canKeep: verseSources(keepable).length > 0,
  }
}
