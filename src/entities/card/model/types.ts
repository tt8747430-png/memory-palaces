import type { Entity, SrsState } from '@/shared/lib'

/**
 * A card: one thing to recall inside a deck. `front` is the prompt, `back` its meaning,
 * `hint` an optional image/place cue, `tip` an optional peek. `srs` carries its
 * spaced-repetition schedule (absent = new, always due). `memorized` is a verse-study marker
 * only — it never feeds the schedule, streaks, or stats. A card belongs to exactly one deck
 * via `deckId` (its "own" deck); studying an ancestor deck includes it via the subtree.
 */
export interface Card extends Entity {
  deckId: string
  front: string
  back: string
  hint?: string
  tip?: string
  srs?: SrsState
  flagged: boolean
  memorized: boolean
  /** Position within the deck; cards read and reorder in this order. */
  order: number
}

export interface MakeCardInput {
  id: string
  createdAt: string
  deckId: string
  front: string
  back: string
  hint?: string
  tip?: string
  srs?: SrsState
  flagged?: boolean
  memorized?: boolean
  /** Defaults to 0 — legacy and test data sort by `createdAt` as the tiebreak; the
   * createCard command assigns the real next position. */
  order?: number
}

export function makeCard(input: MakeCardInput): Card {
  const front = input.front.trim()
  const back = input.back.trim()
  if (!input.deckId) throw new Error('Card must belong to a deck')
  if (!front) throw new Error('Card front is required')
  if (!back) throw new Error('Card back is required')
  const order = input.order ?? 0
  if (order < 0) throw new Error('Card order must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    deckId: input.deckId,
    front,
    back,
    hint: input.hint,
    tip: input.tip,
    srs: input.srs,
    flagged: input.flagged ?? false,
    memorized: input.memorized ?? false,
    order,
  }
}

/** Editable fields of a card — identity, timestamps, and deck are owned elsewhere. */
export type CardChanges = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'deckId'>>

/** Apply an edit, enforcing the same invariants as {@link makeCard}. `updatedAt` is set by
 * the caller (clock injected) so the function stays pure. */
export function updateCard(card: Card, changes: CardChanges, updatedAt: string): Card {
  const next = { ...card, ...changes, updatedAt }
  const front = next.front.trim()
  const back = next.back.trim()
  if (!front) throw new Error('Card front is required')
  if (!back) throw new Error('Card back is required')
  if (next.order < 0) throw new Error('Card order must be >= 0')
  return { ...next, front, back }
}
