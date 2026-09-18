import { useMemo } from 'react'
import type { ParsedCard } from '@/shared/lib'
import type { LibraryIndex } from './library-index'
import { parseRef, type VerseRef } from './reference'
import {
  addableCards,
  buildVerseCards,
  canSplit,
  findDuplicates,
  type HeldRef,
} from './verse-cards'
import { type VerseSource, verseSources } from './verse-sources'

export interface VerseCardsInput {
  ref: VerseRef | null
  text: string
  split: boolean
  keepDuplicates: boolean
  /** Every card the learner holds — what a new card could duplicate. */
  cards: readonly { front: string; deckId: string }[]
  index: LibraryIndex
}

export interface VerseCards {
  /** The cards the text makes, under the split toggle as it stands. */
  built: ParsedCard[]
  duplicates: HeldRef[]
  /** The cards Add would make, after duplicates are dropped. */
  addable: ParsedCard[]
  /** The text carries markers at all — without them splitting would silently do nothing. */
  splitAvailable: boolean
  /** What splitting *would* produce, asked of the text rather than of the current toggle. */
  splitCount: number
  /** The verses the text supplies and the Bible library lacks — what Add would save. */
  unheld: VerseSource[]
  /** Verses of the passage the text still has none for, while its verses are numbered. */
  missing: number[]
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

/** What the text box makes: the cards, the duplicates among them, and the verses it would save. */
export function useVerseCards({
  ref,
  text,
  split,
  keepDuplicates,
  cards,
  index,
}: VerseCardsInput): VerseCards {
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

  return {
    built,
    duplicates,
    addable,
    splitAvailable,
    splitCount: splitAvailable ? keepable.length : 0,
    unheld,
    missing,
  }
}
