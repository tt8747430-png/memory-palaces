import type { Entity, SrsState } from '@/shared/lib'

/**
 * A locus: one memory spot inside a room. `front` is the prompt to recall,
 * `back` its meaning, `hint` the image/place you picture it in, `tip` an
 * optional peek. `srs` carries its spaced-repetition schedule. `memorized` is a
 * verse-study marker only — it never feeds the schedule, streaks, or stats.
 */
export interface Locus extends Entity {
  roomId: string
  front: string
  back: string
  hint?: string
  tip?: string
  srs?: SrsState
  flagged: boolean
  memorized: boolean
  /** Position within the room; cards read and reorder in this order. */
  order: number
}

export interface MakeLocusInput {
  id: string
  createdAt: string
  roomId: string
  front: string
  back: string
  hint?: string
  tip?: string
  srs?: SrsState
  flagged?: boolean
  memorized?: boolean
  /** Defaults to 0 — legacy and test data sort by `createdAt` as the tiebreak; the
   * createLocus command assigns the real next position. */
  order?: number
}

export function makeLocus(input: MakeLocusInput): Locus {
  const front = input.front.trim()
  const back = input.back.trim()
  if (!input.roomId) throw new Error('Locus must belong to a room')
  if (!front) throw new Error('Locus front is required')
  if (!back) throw new Error('Locus back is required')
  const order = input.order ?? 0
  if (order < 0) throw new Error('Locus order must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    roomId: input.roomId,
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

/** Editable fields of a locus — identity, timestamps, and room are owned elsewhere. */
export type LocusChanges = Partial<Omit<Locus, 'id' | 'createdAt' | 'updatedAt' | 'roomId'>>

/** Apply an edit, enforcing the same invariants as {@link makeLocus}. `updatedAt`
 * is set by the caller (clock injected) so the function stays pure. */
export function updateLocus(locus: Locus, changes: LocusChanges, updatedAt: string): Locus {
  const next = { ...locus, ...changes, updatedAt }
  const front = next.front.trim()
  const back = next.back.trim()
  if (!front) throw new Error('Locus front is required')
  if (!back) throw new Error('Locus back is required')
  if (next.order < 0) throw new Error('Locus order must be >= 0')
  return { ...next, front, back }
}
