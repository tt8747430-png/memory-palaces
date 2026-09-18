import type { RxConflictHandler } from 'rxdb'
import { sameWrite } from '@/shared/api/rxdb'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { mergeCard, mergeProgress } from '@/shared/lib'

export const mergeProgressConflict: RxConflictHandler<Progress> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeProgress(input.newDocumentState, input.realMasterState)
  },
}

export const mergeCardConflict: RxConflictHandler<Card> = {
  isEqual: sameWrite,
  async resolve(input) {
    return mergeCard(input.newDocumentState, input.realMasterState)
  },
}
