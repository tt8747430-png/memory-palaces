import type { RxConflictHandler } from 'rxdb'
import { sameWrite } from '@/shared/api/rxdb'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { mergePreferences, type Preferences } from '@/entities/preferences'
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

/**
 * Setting by setting, against the copy this device last saw — so the push reaches it at all,
 * preferences sync with `refuseUnseenOverwrites` (`shared/config/sync-tables.ts`).
 */
export const mergePreferencesConflict: RxConflictHandler<Preferences> = {
  isEqual: sameWrite,
  async resolve({ newDocumentState, realMasterState, assumedMasterState }) {
    return {
      ...mergePreferences(newDocumentState, realMasterState, assumedMasterState),
      _deleted: realMasterState._deleted,
    }
  },
}
