import type { RxConflictHandler, WithDeleted } from 'rxdb'
import { deepEqual } from 'rxdb/plugins/utils'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { type Clocked, mergeCard, mergeProgress, newest } from '@/shared/lib'

/**
 * RxDB asks `isEqual` on every replicated document. The write clock and the tombstone decide almost
 * every case and are the cheap answer, but they cannot be the whole answer: two devices that write
 * the same document in the same millisecond produce different content under one clock, and calling
 * those equal makes replication skip the difference entirely — no conflict is raised, so the merges
 * below never run and one device's XP, streak or review schedule is dropped on the floor.
 */
function sameWrite<T extends Clocked>(a: WithDeleted<T>, b: WithDeleted<T>): boolean {
  return a.updatedAt === b.updatedAt && a._deleted === b._deleted && deepEqual(a, b)
}

/**
 * Content collections: the later edit wins the whole document. A factory rather than one shared
 * value so each collection gets a handler typed to its own document — no casts at the call site.
 */
export function lastWriteWins<T extends Clocked>(): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve(input) {
      return newest(input.newDocumentState, input.realMasterState)
    },
  }
}

/** Progress is counters, not content — merging keeps both devices' study. */
export const mergeProgressConflict: RxConflictHandler<Progress> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeProgress(input.newDocumentState, input.realMasterState)
  },
}

/** Cards are content plus a review schedule; each half resolves on its own clock. */
export const mergeCardConflict: RxConflictHandler<Card> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeCard(input.newDocumentState, input.realMasterState)
  },
}
