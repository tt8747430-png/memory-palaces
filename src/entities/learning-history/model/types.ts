import type { Entity, FastOutcome, Grade } from '@/shared/lib'

/**
 * What put an entry on the Learning history. The three ways a Card's learning state moves, and the
 * reason this is not `LearningAlgorithm`: UBIQUITOUS_LANGUAGE reserves **Review** for grading a
 * Card's recall, and says in as many words that the two Fast-review answers "are _not_ Grades".
 * Keying the history on the scheduler would have filed a Fast answer as a Review.
 *
 * - `graded` — a Review: a Grade, and the schedule it produced.
 * - `answered` — a Fast-review answer, Not quite or Got it. Fast review has no schedule to move.
 * - `mastered` — the learner marked the Card Mastered by hand, which moves the schedule without
 *   anyone recalling anything.
 */
export type HistoryKind = 'graded' | 'answered' | 'mastered'

/**
 * One answer, as it happened. The Card carries only where its schedule stands *now*, which is the
 * one thing a Learning history cannot be reconstructed from — `schedule()` is not invertible, and a
 * Fast answer moves no schedule at all. So every answer writes an entry, and the entry is the
 * record.
 *
 * `createdAt` is when the learner answered; an entry is never edited, so `updatedAt` only ever
 * matches it. `deckId` is copied rather than followed, because moving a Card to another Deck must
 * not rewrite where its past answers happened.
 *
 * Which fields are filled is decided by `kind`, and `makeHistoryEntry` is what holds the two
 * together.
 *
 * **`intervalBefore` absent on a `graded` entry means the Card had no schedule at all** — it was
 * being seen for the first time. It is *not* the same as `0`, which is where a lapse leaves a Card
 * (`schedule()` zeroes the interval on `again`). Collapsing the two is what made every answer after
 * a lapse report itself as a first review.
 */
export interface HistoryEntry extends Entity {
  cardId: string
  deckId: string
  kind: HistoryKind
  /** `graded` only. */
  grade?: Grade
  /** `answered` only. */
  outcome?: FastOutcome
  /** Days the Card was scheduled out by before. Absent on `answered`, and on a first review. */
  intervalBefore?: number
  /** Absent on `answered`. */
  intervalAfter?: number
  /** When the answer put the Card back in front of the learner. Absent on `answered`. */
  dueAfter?: string
}

/**
 * How many entries the device keeps. The store mirrors the whole collection into memory, so the
 * Learning history is a rolling window rather than an archive — bounded on purpose, disclosed in
 * the sheet that reads it, and trimmed from two places that must agree on the number:
 * `recordHistory` on every write, and `keepHistoryCapped` for a log that is already over it.
 */
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

/** Whether `kind` records a move of the Card's schedule — everything but a Fast-review answer. */
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
    // Never defaulted: absent is the answer for "this Card had no schedule yet", and only the
    // caller knows that. `0` means a lapsed Card, which is a different thing entirely.
    intervalBefore: scheduled ? input.intervalBefore : undefined,
    intervalAfter: scheduled ? input.intervalAfter : undefined,
    dueAfter: scheduled ? input.dueAfter : undefined,
  }
}
