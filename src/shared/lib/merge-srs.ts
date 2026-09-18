import type { SrsState } from './srs'
import { mergeFields, type MergeFieldsOptions } from './merge-fields'
import { type Clocked, newest } from './newest'

export interface MergeableCard extends Clocked {
  srs?: SrsState
}

function mergeSrs(local: SrsState | undefined, remote: SrsState | undefined): SrsState | undefined {
  if (!local) return remote
  if (!remote) return local
  const latest = local.lastReviewed >= remote.lastReviewed ? local : remote
  return {
    ...latest,
    reps: Math.max(local.reps, remote.reps),
    lapses: Math.max(local.lapses, remote.lapses),
  }
}

/**
 * Two copies of a card, with no record of what they started from: the newer document, carrying
 * both devices' review counters. `mergeCardAgainst` is the merge that keeps both devices' edits.
 */
export function mergeCard<T extends MergeableCard>(local: T, remote: T): T {
  const winner = newest(local, remote)
  const srs = mergeSrs(local.srs, remote.srs)
  return srs ? { ...winner, srs } : { ...winner }
}

/**
 * Field by field against the copy both devices last saw: a study on one device and an edit on the
 * other both survive. A review both devices made keeps the later one with both sets of counters.
 */
export function mergeCardAgainst<T extends MergeableCard>(mine: T, theirs: T, base: T): T {
  // The rules touch only what MergeableCard declares, so they hold for any T that extends it.
  return mergeFields(mine, theirs, base, CARD_RULES as MergeFieldsOptions<T>)
}

const CARD_RULES: MergeFieldsOptions<MergeableCard> = { both: { srs: mergeSrs } }
