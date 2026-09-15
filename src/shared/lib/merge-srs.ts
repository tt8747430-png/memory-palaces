import type { SrsState } from './srs'
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

export function mergeCard<T extends MergeableCard>(local: T, remote: T): T {
  const winner = newest(local, remote)
  const srs = mergeSrs(local.srs, remote.srs)
  return srs ? { ...winner, srs } : { ...winner }
}
