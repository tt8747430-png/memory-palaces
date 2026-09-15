import type { Entity, FastOutcome, SrsState } from '@/shared/lib'

export type { FastOutcome }

export interface Card extends Entity {
  deckId: string
  front: string
  back: string
  hint?: string
  tip?: string
  srs?: SrsState
  flagged: boolean
  memorized: boolean
  frozen: boolean
  reversed: boolean
  fastReview?: FastOutcome
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
  frozen?: boolean
  reversed?: boolean
  fastReview?: FastOutcome
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
    frozen: input.frozen ?? false,
    reversed: input.reversed ?? false,
    fastReview: input.fastReview,
    order,
  }
}

export function moveCard(card: Card, deckId: string, order: number, updatedAt: string): Card {
  if (!deckId) throw new Error('Card must belong to a deck')
  if (order < 0) throw new Error('Card order must be >= 0')
  return { ...card, deckId, order, updatedAt }
}

export interface PriorAnswer {
  srs: SrsState | undefined
  fastReview: FastOutcome | undefined
}

export function priorAnswer(card: Card): PriorAnswer {
  return { srs: card.srs, fastReview: card.fastReview }
}

export type CardChanges = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'deckId'>>

export function updateCard(card: Card, changes: CardChanges, updatedAt: string): Card {
  const next = { ...card, ...changes, updatedAt }
  const front = next.front.trim()
  const back = next.back.trim()
  if (!front) throw new Error('Card front is required')
  if (!back) throw new Error('Card back is required')
  if (next.order < 0) throw new Error('Card order must be >= 0')
  return { ...next, front, back }
}
