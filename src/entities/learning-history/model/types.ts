import type { Entity, FastOutcome, Grade } from '@/shared/lib'

export type HistoryKind = 'graded' | 'answered' | 'mastered' | 'adjusted'

export interface HistoryEntry extends Entity {
  cardId: string
  deckId: string
  kind: HistoryKind
  grade?: Grade
  outcome?: FastOutcome
  intervalBefore?: number
  intervalAfter?: number
  dueAfter?: string
}

export const HISTORY_CAP = 2000

export interface MakeHistoryEntryInput {
  id: string
  createdAt: string
  cardId: string
  deckId: string
  kind: HistoryKind
  grade?: Grade
  outcome?: FastOutcome
  intervalBefore?: number
  intervalAfter?: number
  dueAfter?: string
}

function movesSchedule(kind: HistoryKind): boolean {
  return kind !== 'answered'
}

export function makeHistoryEntry(input: MakeHistoryEntryInput): HistoryEntry {
  if (!input.cardId) throw new Error('A history entry belongs to a card')
  if (!input.deckId) throw new Error('A history entry belongs to a deck')
  if (input.kind === 'graded' && !input.grade) {
    throw new Error('A graded entry is a grade')
  }
  if (input.kind === 'answered' && !input.outcome) {
    throw new Error('An answered entry is a fast-review outcome')
  }
  const scheduled = movesSchedule(input.kind)
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    cardId: input.cardId,
    deckId: input.deckId,
    kind: input.kind,
    grade: input.kind === 'graded' ? input.grade : undefined,
    outcome: input.kind === 'answered' ? input.outcome : undefined,
    intervalBefore: scheduled ? input.intervalBefore : undefined,
    intervalAfter: scheduled ? input.intervalAfter : undefined,
    dueAfter: scheduled ? input.dueAfter : undefined,
  }
}
