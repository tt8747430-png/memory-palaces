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

/**
 * The persisted preferences shape BEFORE v6 renamed the boolean `darkMode` → the
 * three-way `theme`. The whole v0→v5 chain produces this legacy shape;
 * {@link migratePreferencesV6} converts it to the current {@link Preferences}.
 */
type LegacyPreferences = Omit<Preferences, 'theme'> & { darkMode: boolean }

/** Legacy defaults: today's defaults with `theme` swapped back for `darkMode`. */
const { theme: _legacyTheme, ...DEFAULTS_SANS_THEME } = DEFAULT_PREFERENCES
const DEFAULT_LEGACY = { ...DEFAULTS_SANS_THEME, darkMode: false }

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
export type PreferencesV0 = Omit<LegacyPreferences, PostV0>

/** v0 → v1: backfill the new fields with defaults. Saved values always win, so the
 * spread order puts the stored doc last. RxDB serializes the result, so sharing the
 * default privacy reference here is safe. */
export function migratePreferencesV1(oldDoc: PreferencesV0): LegacyPreferences {
  return { ...DEFAULT_LEGACY, ...oldDoc }
}

/** The v1 preferences shape — before the Palaces screen's view/sort were persisted. */
export type PreferencesV1 = Omit<
  LegacyPreferences,
  'palacesView' | 'palacesSort' | 'dailyGoal' | 'verseMode' | 'verseShuffle' | 'verseWordSpaces'
>

/** v1 → v2: backfill the Palaces view/sort with defaults; stored fields win. */
export function migratePreferencesV2(oldDoc: PreferencesV1): LegacyPreferences {
  return { ...DEFAULT_LEGACY, ...oldDoc }
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
  LegacyPreferences,
  'dailyGoal' | 'verseMode' | 'verseShuffle' | 'verseWordSpaces'
>

/** v2 → v3: backfill the default daily goal; stored fields win. */
export function migratePreferencesV3(oldDoc: PreferencesV2): LegacyPreferences {
  return { ...DEFAULT_LEGACY, ...oldDoc }
}

/** The v3 preferences shape — before verse-study prefs were persisted. */
export type PreferencesV3 = Omit<
  LegacyPreferences,
  'verseMode' | 'verseShuffle' | 'verseWordSpaces'
>

/** v3 → v4: backfill the verse-study prefs with defaults; stored fields win. */
export function migratePreferencesV4(oldDoc: PreferencesV3): LegacyPreferences {
  return { ...DEFAULT_LEGACY, ...oldDoc }
}

/** v4 → v5: the library gained a `manual` sort option. No field change — every stored
 * `palacesSort` is still valid — so the doc passes through unchanged. */
export function migratePreferencesV5(oldDoc: LegacyPreferences): LegacyPreferences {
  return oldDoc
}

/** The v5 preferences shape — the last one carrying the boolean `darkMode`. */
export type PreferencesV5 = LegacyPreferences

/** v5 → v6: rename the boolean `darkMode` to the three-way `theme` — `true` → `dark`,
 * `false` → `light`. New installs (created at v6) default to `system`; this conversion
 * preserves the explicit light/dark choice an upgrading user already had. */
export function migratePreferencesV6(oldDoc: PreferencesV5): Preferences {
  const { darkMode, ...rest } = oldDoc
  return { ...rest, theme: darkMode ? 'dark' : 'light' }
}
