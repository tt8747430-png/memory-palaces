import { type SrsState, srsStatus } from './srs'

/**
 * Derived progress numbers. None of these are stored on entities — they are
 * computed from source-of-truth state so counts can never drift. Functions take
 * minimal structural shapes, keeping `shared/lib` below the entity layer.
 */
const XP_PER_LEVEL = 250

export interface LevelInfo {
  level: number
  xpInLevel: number
  xpForNextLevel: number
}

export function levelFromXp(xp: number): LevelInfo {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  }
}

type Reviewable = { srs?: SrsState }

/** A card counts as reviewed once it has left the "new" state. */
export function isCardReviewed(card: Reviewable): boolean {
  return (card.srs?.reps ?? 0) > 0
}

export function isDeckCompleted(cards: ReadonlyArray<Reviewable>): boolean {
  return cards.length > 0 && cards.every(isCardReviewed)
}

export interface TrainingTotals {
  decksCompleted: number
  totalDecks: number
  totalCards: number
}

/**
 * Roll up training progress across the whole library. Takes minimal structural shapes —
 * decks as `{ id }`, cards as `{ deckId, srs? }` — so it stays below the entity layer.
 * A deck counts as completed only when every one of its own cards is reviewed; empty decks
 * never count (via `isDeckCompleted`).
 */
export function computeTrainingTotals(
  decks: ReadonlyArray<{ id: string }>,
  cards: ReadonlyArray<Reviewable & { deckId: string }>,
): TrainingTotals {
  const cardsByDeck = new Map<string, Reviewable[]>()
  for (const card of cards) {
    const group = cardsByDeck.get(card.deckId)
    if (group) group.push(card)
    else cardsByDeck.set(card.deckId, [card])
  }

  const decksCompleted = decks.filter((deck) =>
    isDeckCompleted(cardsByDeck.get(deck.id) ?? []),
  ).length

  return { decksCompleted, totalDecks: decks.length, totalCards: cards.length }
}

/** Tally a card set by maturity bucket (independent of due-ness). */
export function cardMaturityCounts(cards: ReadonlyArray<{ srs?: SrsState }>): {
  new: number
  learning: number
  known: number
} {
  const counts = { new: 0, learning: 0, known: 0 }
  for (const card of cards) counts[srsStatus(card.srs)] += 1
  return counts
}
