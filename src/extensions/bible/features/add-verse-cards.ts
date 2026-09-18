import type { DeckStore } from '@/entities/deck'
import { createDeck } from '@/features/deck'
import type { ParsedCard } from '@/shared/lib'
import type { VerseRef } from '../model/reference'
import { buildVerseCards, findDuplicates, type HeldRef } from './build-verse-cards'
import { ensureChapterDeck } from './place-in-chapter-deck'

/** Where the cards are going: the reader's choice, or the app's. */
export type VerseTarget =
  { kind: 'automatic' } | { kind: 'deck'; deckId: string } | { kind: 'newDeck'; name: string }

export interface AddVerseCardsDeps {
  deckStore: DeckStore
  setDraft: (source: 'extension', cards: ParsedCard[]) => void
}

export interface AddVerseCardsInput {
  ref: VerseRef | null
  text: string
  split: boolean
  target: VerseTarget
  held: readonly HeldRef[]
  keepDuplicates: boolean
}

/**
 * Build, drop the duplicates, resolve the destination, hand the cards to the existing import
 * draft. Returns the deck to review them in.
 */
export async function addVerseCards(
  { deckStore, setDraft }: AddVerseCardsDeps,
  { ref, text, split, target, held, keepDuplicates }: AddVerseCardsInput,
): Promise<string> {
  const built = buildVerseCards(ref, text, { split })
  const duplicates = new Set(findDuplicates(built, held).map((entry) => entry.front))
  const cards = keepDuplicates ? built : built.filter((card) => !duplicates.has(card.front))

  const deckId =
    target.kind === 'deck'
      ? target.deckId
      : target.kind === 'newDeck'
        ? (await createDeck(deckStore, { name: target.name })).id
        : ref
          ? await ensureChapterDeck(deckStore, ref.book, ref.chapter)
          : // A paste with markers and no book picked has no book to name a deck after.
            (await createDeck(deckStore, { name: cards[0]?.front ?? '' })).id

  setDraft('extension', cards)
  return deckId
}
