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
}

export function makeLocus(input: MakeLocusInput): Locus {
  const front = input.front.trim()
  const back = input.back.trim()
  if (!input.roomId) throw new Error('Locus must belong to a room')
  if (!front) throw new Error('Locus front is required')
  if (!back) throw new Error('Locus back is required')
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
  }
}
