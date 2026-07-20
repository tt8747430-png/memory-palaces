import { type SrsState, srsStatus } from './srs'

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

interface Reviewable {
  srs?: SrsState
}

export function isCardReviewed(card: Reviewable): boolean {
  return (card.srs?.reps ?? 0) > 0
}

export function isDeckCompleted(cards: readonly Reviewable[]): boolean {
  return cards.length > 0 && cards.every(isCardReviewed)
}

export interface TrainingTotals {
  decksCompleted: number
  totalDecks: number
  totalCards: number
}

export function computeTrainingTotals(
  decks: readonly { id: string }[],
  cards: readonly (Reviewable & { deckId: string })[],
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

export function cardMaturityCounts(cards: readonly { srs?: SrsState }[]): {
  new: number
  learning: number
  known: number
} {
  const counts = { new: 0, learning: 0, known: 0 }
  for (const card of cards) counts[srsStatus(card.srs)] += 1
  return counts
}
