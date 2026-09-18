import type { RxConflictHandler, WithDeleted } from 'rxdb'
import { deepEqual } from 'rxdb/plugins/utils'
import { type Clocked, newest } from '@/shared/lib'

/**
 * Generic over `Clocked` and knowing no entity, so anything that declares a collection can reach
 * them — including an extension, which may not import `app`. Handlers that know an entity
 * (`mergeCardConflict`, `mergeProgressConflict`) stay in `app/persistence`.
 */
export function sameWrite<T extends Clocked>(a: WithDeleted<T>, b: WithDeleted<T>): boolean {
  return a.updatedAt === b.updatedAt && a._deleted === b._deleted && deepEqual(a, b)
}

export function lastWriteWins<T extends Clocked>(): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve(input) {
      return newest(input.newDocumentState, input.realMasterState)
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
