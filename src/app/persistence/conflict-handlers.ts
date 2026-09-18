import type { RxConflictHandler } from 'rxdb'
import { mergeAgainstBase } from '@/shared/api/rxdb'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { mergePreferences, type Preferences } from '@/entities/preferences'
import { mergeCard, mergeCardAgainst, mergeProgress, mergeProgressAgainst } from '@/shared/lib'

/** XP and freezes add up against the base; without one, every counter takes its max. */
export const mergeProgressConflict: RxConflictHandler<Progress> = mergeAgainstBase({
  against: mergeProgressAgainst,
  without: mergeProgress,
})

/** Field by field against the base, review counters merged; without one, the newer card. */
export const mergeCardConflict: RxConflictHandler<Card> = mergeAgainstBase({
  against: mergeCardAgainst,
  without: mergeCard,
})

/**
 * Setting by setting against the copy this device last saw — this device wins a setting both
 * changed. Without a base, what differs from the defaults counts as this device's change.
 */
export const mergePreferencesConflict: RxConflictHandler<Preferences> = mergeAgainstBase({
  against: (mine, theirs, base) => ({
    ...mergePreferences(mine, theirs, base),
    _deleted: theirs._deleted,
  }),
  without: (mine, theirs) => ({
    ...mergePreferences(mine, theirs, undefined),
    _deleted: theirs._deleted,
  }),
})
