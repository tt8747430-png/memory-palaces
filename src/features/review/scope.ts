import { isDue, srsStatus, shuffle } from '@/shared/lib'
import type { Locus } from '@/entities/locus'

/** Build a review queue from a scoped deck: lead with the cards due now (or the
 * whole deck if none are due yet), optionally shuffled. The id order the State
 * machine starts from. `random` is injectable for deterministic tests. */
export function shuffleFirstDue(
  loci: Locus[],
  now: number,
  shuffleCards: boolean,
  random: () => number = Math.random,
): string[] {
  const due = loci.filter((locus) => isDue(locus.srs, now))
  const base = (due.length > 0 ? due : loci).map((locus) => locus.id)
  return shuffleCards ? shuffle(base, random) : base
}

/** Which subset of a room's loci a session studies. */
export type Scope =
  | { kind: 'all' }
  | { kind: 'due' }
  | { kind: 'new' }
  | { kind: 'learning' }
  | { kind: 'flagged' }
  /** A contiguous batch by position, e.g. cards 1–10 (0-indexed [start, end)). */
  | { kind: 'range'; start: number; end: number }

/** Browse order; review always leads with due cards. */
export type CardOrder = 'inOrder' | 'shuffle' | 'reverse'

/** Default cards per range batch (the "1–10 / 11–20" chunks). */
export const BATCH_SIZE = 10

/** Filter a deck down to the active scope, preserving the deck's card order. */
export function applyScope(loci: Locus[], scope: Scope, now: number): Locus[] {
  switch (scope.kind) {
    case 'due':
      return loci.filter((locus) => isDue(locus.srs, now))
    case 'new':
      return loci.filter((locus) => srsStatus(locus.srs) === 'new')
    case 'learning':
      return loci.filter((locus) => srsStatus(locus.srs) === 'learning')
    case 'flagged':
      return loci.filter((locus) => locus.flagged)
    case 'range':
      return loci.slice(scope.start, scope.end)
    default:
      return loci
  }
}

export interface ScopeCounts {
  all: number
  due: number
  new: number
  learning: number
  flagged: number
}

/** Live counts per filter, for the "Cards to study" chips. */
export function scopeCounts(loci: Locus[], now: number): ScopeCounts {
  return {
    all: loci.length,
    due: loci.filter((locus) => isDue(locus.srs, now)).length,
    new: loci.filter((locus) => srsStatus(locus.srs) === 'new').length,
    learning: loci.filter((locus) => srsStatus(locus.srs) === 'learning').length,
    flagged: loci.filter((locus) => locus.flagged).length,
  }
}

export interface RangeBatch {
  start: number
  end: number
  label: string
}

/** Split a deck into labelled, 1-indexed position batches ("1–10", "11–20", …).
 * Empty when the deck fits in a single batch (nothing to choose between). */
export function rangeBatches(count: number, batchSize = BATCH_SIZE): RangeBatch[] {
  if (count <= batchSize) return []
  const batches: RangeBatch[] = []
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count)
    batches.push({ start, end, label: `${start + 1}–${end}` })
  }
  return batches
}

export function scopesEqual(a: Scope, b: Scope): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'range' && b.kind === 'range') {
    return a.start === b.start && a.end === b.end
  }
  return true
}

/** Order a deck's ids for browse mode. `random` is injectable for deterministic tests. */
export function orderIds(
  loci: Locus[],
  order: CardOrder,
  random: () => number = Math.random,
): string[] {
  const ids = loci.map((locus) => locus.id)
  if (order === 'reverse') return [...ids].reverse()
  if (order === 'shuffle') return shuffle(ids, random)
  return ids
}
