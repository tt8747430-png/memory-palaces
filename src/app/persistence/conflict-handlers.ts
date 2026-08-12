import type { RxConflictHandler, WithDeleted } from 'rxdb'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { mergeCard, mergeProgress } from '@/shared/lib'

interface Clocked {
  updatedAt: string
}

/**
 * RxDB asks `isEqual` on every replicated document, so it compares the two things that decide a
 * conflict — the write clock and the tombstone — rather than deep-equalling whole documents.
 */
function sameWrite<T extends Clocked>(a: WithDeleted<T>, b: WithDeleted<T>): boolean {
  return a.updatedAt === b.updatedAt && a._deleted === b._deleted
}

/**
 * Content collections: the later edit wins the whole document. A factory rather than one shared
 * value so each collection gets a handler typed to its own document — no casts at the call site.
 */
export function lastWriteWins<T extends Clocked>(): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve(input) {
      const local = input.newDocumentState
      const master = input.realMasterState
      return local.updatedAt >= master.updatedAt ? local : master
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
