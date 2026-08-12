import type { SrsState } from './srs'

export interface MergeableCard {
  updatedAt: string
  srs?: SrsState
}

/**
 * Schedule state follows whichever device reviewed last; the counters that only grow take the max,
 * so a review done offline on the other device is never erased.
 */
function mergeSrs(local: SrsState | undefined, remote: SrsState | undefined): SrsState | undefined {
  if (!local) return remote
  if (!remote) return local
  const newest = local.lastReviewed >= remote.lastReviewed ? local : remote
  return {
    ...newest,
    reps: Math.max(local.reps, remote.reps),
    lapses: Math.max(local.lapses, remote.lapses),
  }
}

/** Content is last-write-wins by `updatedAt`; the `srs` sub-object merges on its own clock. */
export function mergeCard<T extends MergeableCard>(local: T, remote: T): T {
  const newest = local.updatedAt >= remote.updatedAt ? local : remote
  const srs = mergeSrs(local.srs, remote.srs)
  return srs ? { ...newest, srs } : { ...newest }
}
