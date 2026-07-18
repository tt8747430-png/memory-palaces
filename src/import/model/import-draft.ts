import type { ParsedCard } from '@/shared/domain'

export type ImportSource = 'paste' | 'mindscape' | 'anki'

/**
 * A parsed card given a local id, so the review screen can address one row
 * before any of it reaches a store. Draft cards are never persisted — they exist
 * only between "parse this" and "apply it to the deck".
 */
export interface DraftCard extends ParsedCard {
  id: string
}

export interface ImportDraft {
  source: ImportSource
  cards: DraftCard[]
}

export type DraftCardEdit = Partial<Pick<DraftCard, 'front' | 'back' | 'hint' | 'tip'>>

/**
 * `nextId` is injected rather than called here: model factories stay pure and
 * deterministic, and the nondeterminism lives at the store boundary — the same
 * split the deck commands use (`createCard` mints the uuid, `makeCard` doesn't).
 */
export function draftCardsFrom(cards: readonly ParsedCard[], nextId: () => string): DraftCard[] {
  return cards.map((card) => ({ ...card, id: nextId() }))
}

export function editDraftCard(draft: ImportDraft, id: string, changes: DraftCardEdit): ImportDraft {
  return {
    ...draft,
    cards: draft.cards.map((card) => (card.id === id ? { ...card, ...changes } : card)),
  }
}

export function removeDraftCard(draft: ImportDraft, id: string): ImportDraft {
  return { ...draft, cards: draft.cards.filter((card) => card.id !== id) }
}
