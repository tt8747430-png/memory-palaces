import { type Deck, type DeckSettings, isSubdeck, MAIN_DECK_SETTINGS } from '@/entities/deck'
import type { Preferences, PreferencesChanges } from '@/entities/preferences'
import { normalizeFlashcardSwipe } from '@/shared/config/flashcard-swipe'
import type { DeckStudyPrefs, EditableDeckPref, LearnerStudyPrefs } from '@/widgets/study-session'

/**
 * A study session's settings live in two places, and this module is the only one that knows which
 * is which: the Deck's own `DeckSettings`, and the learner's `Preferences`. Each half has the same
 * three parts — a map of pref name to stored key, a read through it, and a patch through it — so a
 * pref cannot be read from one key and written to another.
 */

/**
 * The deck setting each pref the study session changes is stored as — the one place that says so.
 * Reading, locking and patching all go through it, so the three cannot disagree.
 */
const SETTING_OF = {
  direction: 'studyDirection',
  shuffle: 'shuffleCards',
  textToSpeech: 'textToSpeech',
} as const satisfies Record<EditableDeckPref, keyof DeckSettings>

const EDITABLE = Object.keys(SETTING_OF) as EditableDeckPref[]

export function deckStudyPrefs(settings: DeckSettings): DeckStudyPrefs {
  return {
    direction: settings[SETTING_OF.direction],
    shuffle: settings[SETTING_OF.shuffle],
    textToSpeech: settings[SETTING_OF.textToSpeech],
    newCardsPerDay: settings.newCardsPerDay,
    maxCardsPerDay: settings.maxCardsPerDay,
    cardStyle: settings.cardStyle,
  }
}

/** What a subdeck's study session shows but cannot change: the prefs its main deck owns. */
export function lockedDeckPrefs(deck: Deck): EditableDeckPref[] {
  if (!isSubdeck(deck)) return []
  const owned = new Set<keyof DeckSettings>(MAIN_DECK_SETTINGS)
  return EDITABLE.filter((pref) => owned.has(SETTING_OF[pref]))
}

/**
 * The settings a change in the study session moved, and only those. Restating the rest would have a
 * subdeck's study session write a setting its main deck owns every time any toggle was touched.
 */
export function deckStudyPrefsPatch(
  current: DeckStudyPrefs,
  next: DeckStudyPrefs,
): Partial<DeckSettings> {
  return Object.fromEntries(
    EDITABLE.filter((pref) => current[pref] !== next[pref]).map((pref) => [
      SETTING_OF[pref],
      next[pref],
    ]),
  )
}

/**
 * Which `Preferences` key each learner-owned study pref is stored as. The study session names these
 * the way it talks about them (`wordSpaces`); storage spells them `studyWordSpaces`. This is the
 * one line that knows both.
 */
const PREFERENCE_OF = {
  wordSpaces: 'studyWordSpaces',
  typeInitialsOnly: 'studyTypeInitialsOnly',
  shakeToUndo: 'shakeToUndo',
  swipeByMode: 'flashcardSwipe',
} as const satisfies Record<keyof LearnerStudyPrefs, keyof PreferencesChanges>

/** The learner's study prefs as the session reads them. */
export function learnerStudyPrefs(
  preferences: Pick<Preferences, (typeof PREFERENCE_OF)[keyof typeof PREFERENCE_OF]>,
): LearnerStudyPrefs {
  return {
    wordSpaces: preferences[PREFERENCE_OF.wordSpaces],
    typeInitialsOnly: preferences[PREFERENCE_OF.typeInitialsOnly],
    shakeToUndo: preferences[PREFERENCE_OF.shakeToUndo],
    // A stored map written before a mode existed is completed on the way in, so the session always
    // has all four.
    swipeByMode: normalizeFlashcardSwipe(preferences[PREFERENCE_OF.swipeByMode]),
  }
}

/**
 * The preferences a change in the study session moved, and only those — the learner-side twin of
 * `deckStudyPrefsPatch`, and the reason the session can hand back a patch of one key.
 */
export function learnerStudyPrefsPatch(changes: Partial<LearnerStudyPrefs>): PreferencesChanges {
  return Object.fromEntries(
    Object.entries(changes).map(([pref, value]) => [
      PREFERENCE_OF[pref as keyof LearnerStudyPrefs],
      value,
    ]),
  )
}
