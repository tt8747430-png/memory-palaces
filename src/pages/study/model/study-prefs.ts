import { type Deck, type DeckSettings, isSubdeck, MAIN_DECK_SETTINGS } from '@/entities/deck'
import type { Preferences, PreferencesChanges } from '@/entities/preferences'
import { normalizeFlashcardSwipe } from '@/shared/config/flashcard-swipe'
import type { DeckStudyPrefs, EditableDeckPref, LearnerStudyPrefs } from '@/widgets/study-session'

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

export function lockedDeckPrefs(deck: Deck): EditableDeckPref[] {
  if (!isSubdeck(deck)) return []
  const owned = new Set<keyof DeckSettings>(MAIN_DECK_SETTINGS)
  return EDITABLE.filter((pref) => owned.has(SETTING_OF[pref]))
}

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

const PREFERENCE_OF = {
  wordSpaces: 'studyWordSpaces',
  typeInitialsOnly: 'studyTypeInitialsOnly',
  shakeToUndo: 'shakeToUndo',
  swipeByMode: 'flashcardSwipe',
} as const satisfies Record<keyof LearnerStudyPrefs, keyof PreferencesChanges>

export function learnerStudyPrefs(
  preferences: Pick<Preferences, (typeof PREFERENCE_OF)[keyof typeof PREFERENCE_OF]>,
): LearnerStudyPrefs {
  return {
    wordSpaces: preferences[PREFERENCE_OF.wordSpaces],
    typeInitialsOnly: preferences[PREFERENCE_OF.typeInitialsOnly],
    shakeToUndo: preferences[PREFERENCE_OF.shakeToUndo],
    swipeByMode: normalizeFlashcardSwipe(preferences[PREFERENCE_OF.swipeByMode]),
  }
}

export function learnerStudyPrefsPatch(changes: Partial<LearnerStudyPrefs>): PreferencesChanges {
  return Object.fromEntries(
    Object.entries(changes).map(([pref, value]) => [
      PREFERENCE_OF[pref as keyof LearnerStudyPrefs],
      value,
    ]),
  )
}
