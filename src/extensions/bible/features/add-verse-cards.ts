import type { DeckStore } from '@/entities/deck'
import { createDeck } from '@/features/deck'
import type { ParsedCard } from '@/shared/lib'
import type { VerseRef } from '../model/reference'
import { targetIsResolvable, type VerseTarget } from '../model/verse-target'
import { ensureChapterDeck } from './place-in-chapter-deck'

export type { VerseTarget }

export interface AddVerseCardsDeps {
  deckStore: DeckStore
  setDraft: (source: 'extension', cards: ParsedCard[]) => void
}

export interface AddVerseCardsInput {
  /** Exactly what the screen promised — built and de-duplicated by `addableCards`. */
  cards: readonly ParsedCard[]
  /** Names the chapter deck under automatic placement; null for a paste with no book picked. */
  ref: VerseRef | null
  target: VerseTarget
}

/**
 * Resolve the destination and hand the cards to the existing import draft. Returns the deck to
 * review them in.
 */
export async function addVerseCards(
  { deckStore, setDraft }: AddVerseCardsDeps,
  { cards, ref, target }: AddVerseCardsInput,
): Promise<string> {
  if (!targetIsResolvable(target)) throw new Error('This passage has no deck to go to yet')
  const first = cards[0]
  if (!first) throw new Error('There are no cards left to add')

  const deckId =
    target.kind === 'deck'
      ? target.deckId
      : target.kind === 'newDeck'
        ? (await createDeck(deckStore, { name: target.name })).id
        : ref
          ? await ensureChapterDeck(deckStore, ref.book, ref.chapter)
          : // A paste with markers and no book picked has no book to name a deck after, so the
            // first card's own front stands in.
            (await createDeck(deckStore, { name: first.front })).id

  setDraft('extension', [...cards])
  return deckId
}
