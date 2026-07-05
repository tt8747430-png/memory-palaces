import { isDue, shuffle, srsStatus } from '@/shared/lib'
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

export function scopesEqual(a: Scope, b: Scope): boolean {
  return a.kind === b.kind
}
