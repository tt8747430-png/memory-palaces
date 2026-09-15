import type { Card, CardChanges } from '@/entities/card'
import type { Grade } from '@/shared/lib'
import type { CardStyle, StudyDirection } from '@/entities/deck'
import type { FlashcardSwipeByMode } from '@/shared/config/flashcard-swipe'

export interface StudyCard {
  card: Card
  deckName: string
  deckPath: string
}

export type { StudyDirection }

/**
 * What the **Deck** being studied decides, read off its `DeckSettings`. A Subdeck's Main deck may
 * own some of it, which is what `EditableDeckPref` and the session's `locked` set are about.
 */
export interface DeckStudyPrefs {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  newCardsPerDay: number
  maxCardsPerDay: number
  cardStyle: CardStyle
}

/** The Deck prefs the study session's settings sheet changes. */
export type EditableDeckPref = 'direction' | 'shuffle' | 'textToSpeech'

/**
 * What the **learner** decides, the same in every Deck, read off `entities/preferences`. One object
 * with one change channel rather than a value and an `onXChange` per field: every one of these is a
 * `Preferences` key, so four pairs said four times what `setPreferences` says once, and each new
 * learner-owned setting added a fifth.
 */
export interface LearnerStudyPrefs {
  wordSpaces: boolean
  typeInitialsOnly: boolean
  shakeToUndo: boolean
  swipeByMode: FlashcardSwipeByMode
}

export interface SessionSummary {
  graded: number
  learning: number
  known: number
}

export type { Grade, CardChanges }
