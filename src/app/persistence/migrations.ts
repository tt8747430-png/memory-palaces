import { DEFAULT_PREFERENCES, type Preferences } from '@/entities/preferences'
import { DEFAULT_PROFILE, type Profile } from '@/entities/profile'
import type { Palace } from '@/entities/palace'
import type { Folder } from '@/entities/folder'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import type { Progress } from '@/entities/progress'

/** The v0 palace shape — before the manual `order` field, and while a Scripture palace
 * still carried a `bibleMode` flag. */
export type PalaceV0 = Omit<Palace, 'order'> & { bibleMode?: boolean }

/** v0 → v1: drop the removed `bibleMode` flag and backfill a flat `order` (the library
 * tiebreaks equal orders by `createdAt`, so existing palaces keep their order until the
 * learner hand-sorts). */
export function migratePalaceV1(oldDoc: PalaceV0): Palace {
  const { bibleMode: _removed, ...rest } = oldDoc
  return { ...rest, order: 0 }
}

/** The v0 folder shape — before the manual `order` field. */
export type FolderV0 = Omit<Folder, 'order'>

/** v0 → v1: backfill a flat `order`; equal orders tiebreak by `createdAt`. */
export function migrateFolderV1(oldDoc: FolderV0): Folder {
  return { ...oldDoc, order: 0 }
}

/** v0 → v1: cards/questions gained an explicit `order` field. Existing docs backfill to
 * 0; the stores tiebreak equal orders by `createdAt`, so legacy items keep their original
 * (creation) order until the learner reorders them. */
export function migrateLocusV1(oldDoc: Omit<Locus, 'order'>): Locus {
  return { ...oldDoc, order: 0 }
}

export function migrateQuestionV1(oldDoc: Omit<Question, 'order'>): Question {
  return { ...oldDoc, order: 0 }
}

/** Fields added after v0; never present on an old persisted doc. */
type PostV0 =
  | 'darkMode'
  | 'language'
  | 'privacy'
  | 'palacesView'
  | 'palacesSort'
  | 'dailyGoal'
  | 'verseMode'
  | 'verseShuffle'
  | 'verseWordSpaces'

/** The v0 preferences shape — before darkMode/language/privacy (and, later,
 * palacesView/palacesSort, the daily goal, and verse prefs) were added. */
export type PreferencesV0 = Omit<Preferences, PostV0>

/** v0 → v1: backfill the new fields with defaults. Saved values always win, so the
 * spread order puts the stored doc last. RxDB serializes the result, so sharing the
 * default privacy reference here is safe. */
export function migratePreferencesV1(oldDoc: PreferencesV0): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** The v1 preferences shape — before the Palaces screen's view/sort were persisted. */
export type PreferencesV1 = Omit<
  Preferences,
  'palacesView' | 'palacesSort' | 'dailyGoal' | 'verseMode' | 'verseShuffle' | 'verseWordSpaces'
>

/** v1 → v2: backfill the Palaces view/sort with defaults; stored fields win. */
export function migratePreferencesV2(oldDoc: PreferencesV1): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** The v0 profile shape — before the chosen username was added. */
export type ProfileV0 = Omit<Profile, 'username'>

/** v0 → v1: backfill an empty username; saved fields win (stored doc spread last). */
export function migrateProfileV1(oldDoc: ProfileV0): Profile {
  return { username: DEFAULT_PROFILE.username, ...oldDoc }
}

/** The v0 progress shape — before the per-day practice tally was added. */
export type ProgressV0 = Omit<Progress, 'activeDayKey' | 'activeDayCount'>

/** v0 → v1: backfill an empty tally; existing streak history is untouched. */
export function migrateProgressV1(oldDoc: ProgressV0): Progress {
  return { ...oldDoc, activeDayKey: null, activeDayCount: 0 }
}

/** The v2 preferences shape — before the daily goal was added. */
export type PreferencesV2 = Omit<
  Preferences,
  'dailyGoal' | 'verseMode' | 'verseShuffle' | 'verseWordSpaces'
>

/** v2 → v3: backfill the default daily goal; stored fields win. */
export function migratePreferencesV3(oldDoc: PreferencesV2): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** The v3 preferences shape — before verse-study prefs were persisted. */
export type PreferencesV3 = Omit<Preferences, 'verseMode' | 'verseShuffle' | 'verseWordSpaces'>

/** v3 → v4: backfill the verse-study prefs with defaults; stored fields win. */
export function migratePreferencesV4(oldDoc: PreferencesV3): Preferences {
  return { ...DEFAULT_PREFERENCES, ...oldDoc }
}

/** v4 → v5: the library gained a `manual` sort option. No field change — every stored
 * `palacesSort` is still valid — so the doc passes through unchanged. */
export function migratePreferencesV5(oldDoc: Preferences): Preferences {
  return oldDoc
}
