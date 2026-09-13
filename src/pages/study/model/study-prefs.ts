import { type Deck, type DeckSettings, isSubdeck, MAIN_DECK_SETTINGS } from '@/entities/deck'
import type { EditableStudyPref, StudyPrefs } from '@/widgets/study-session'

/**
 * The deck setting each pref the study session changes is stored as — the one place that says so.
 * Reading, locking and patching all go through it, so the three cannot disagree.
 */
const SETTING_OF = {
  direction: 'studyDirection',
  shuffle: 'shuffleCards',
  textToSpeech: 'textToSpeech',
} as const satisfies Record<EditableStudyPref, keyof DeckSettings>

const EDITABLE = Object.keys(SETTING_OF) as EditableStudyPref[]

export function studyPrefsFromSettings(settings: DeckSettings): StudyPrefs {
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
export function lockedStudyPrefs(deck: Deck): EditableStudyPref[] {
  if (!isSubdeck(deck)) return []
  const owned = new Set<keyof DeckSettings>(MAIN_DECK_SETTINGS)
  return EDITABLE.filter((pref) => owned.has(SETTING_OF[pref]))
}

/**
 * The settings a change in the study session moved, and only those. Restating the rest would have a
 * subdeck's study session write a setting its main deck owns every time any toggle was touched.
 */
export function studyPrefsPatch(current: StudyPrefs, next: StudyPrefs): Partial<DeckSettings> {
  return Object.fromEntries(
    EDITABLE.filter((pref) => current[pref] !== next[pref]).map((pref) => [
      SETTING_OF[pref],
      next[pref],
    ]),
  )
}
