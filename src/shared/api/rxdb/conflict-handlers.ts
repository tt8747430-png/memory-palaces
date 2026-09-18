import type { RxConflictHandler, WithDeleted } from 'rxdb'
import { deepEqual } from 'rxdb/plugins/utils'
import { type Clocked, mergeFields, newest } from '@/shared/lib'

/**
 * Generic over `Clocked` and knowing no entity, so anything that declares a collection can reach
 * them — including an extension, which may not import `app`. Handlers that know an entity
 * (`mergeCardConflict`, `mergeProgressConflict`) stay in `app/persistence`.
 */
export function sameWrite<T extends Clocked>(a: WithDeleted<T>, b: WithDeleted<T>): boolean {
  return a.updatedAt === b.updatedAt && a._deleted === b._deleted && deepEqual(a, b)
}

export interface MergeAgainstBase<T> {
  /** The merge when RxDB knows which server copy this device last saw. */
  against: (mine: WithDeleted<T>, theirs: WithDeleted<T>, base: WithDeleted<T>) => WithDeleted<T>
  /** The merge when it does not — a device that never pulled the document. */
  without: (mine: WithDeleted<T>, theirs: WithDeleted<T>) => WithDeleted<T>
}

/**
 * A conflict is two devices' copies of one document. With the copy both started from on hand
 * (`assumedMasterState`, which RxDB records at every pull) the two are merged field by field, so
 * each device keeps what it changed. Without it — this device never pulled the document — the
 * newer whole document wins, which is all that can be said.
 */
export function mergeAgainstBase<T extends Clocked>(
  merge: MergeAgainstBase<T> = {
    against: (mine, theirs, base) => mergeFields(mine, theirs, base),
    without: newest,
  },
): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve({ newDocumentState, realMasterState, assumedMasterState }) {
      return assumedMasterState
        ? merge.against(newDocumentState, realMasterState, assumedMasterState)
        : merge.without(newDocumentState, realMasterState)
    },
  }
}

export function firstWriteWins<T extends Clocked>(): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve(input) {
      return input.realMasterState
    },
  }
}
