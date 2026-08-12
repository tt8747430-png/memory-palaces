import type { SrsState } from './srs'
import { type Clocked, newest } from './newest'

export interface MergeableCard extends Clocked {
  srs?: SrsState
}

/**
 * Schedule state follows whichever device reviewed last; the counters that only grow take the max,
 * so a review done offline on the other device is never erased.
 */
function mergeSrs(local: SrsState | undefined, remote: SrsState | undefined): SrsState | undefined {
  if (!local) return remote
  if (!remote) return local
  // Reviews merge on their own clock: the schedule follows whoever studied last, not who typed last.
  const latest = local.lastReviewed >= remote.lastReviewed ? local : remote
  return {
    ...latest,
    reps: Math.max(local.reps, remote.reps),
    lapses: Math.max(local.lapses, remote.lapses),
  }
}

/** Content is last-write-wins by `updatedAt`; the `srs` sub-object merges on its own clock. */
export function mergeCard<T extends MergeableCard>(local: T, remote: T): T {
  const winner = newest(local, remote)
  const srs = mergeSrs(local.srs, remote.srs)
  return srs ? { ...winner, srs } : { ...winner }
}
