import type { RxConflictHandler, WithDeleted } from 'rxdb'
import { deepEqual } from 'rxdb/plugins/utils'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { type Clocked, mergeCard, mergeProgress, newest } from '@/shared/lib'

function sameWrite<T extends Clocked>(a: WithDeleted<T>, b: WithDeleted<T>): boolean {
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

export const mergeProgressConflict: RxConflictHandler<Progress> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeProgress(input.newDocumentState, input.realMasterState)
  },
}

export function firstWriteWins<T extends Clocked>(): RxConflictHandler<T> {
  return {
    isEqual: sameWrite,
    async resolve(input) {
      return input.realMasterState
    },
  }
}

export const mergeCardConflict: RxConflictHandler<Card> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeCard(input.newDocumentState, input.realMasterState)
  },
}
