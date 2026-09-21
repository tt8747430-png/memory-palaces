import type { Card, CardChanges } from '@/entities/card'
import type { Grade } from '@/shared/lib'
import type { CardStyle, StudyDirection } from '@/entities/deck'
import type { FlashcardSwipePreferences } from '@/shared/config/flashcard-swipe'

export interface StudyCard {
  card: Card
  deckName: string
  deckPath: string
}

export type { StudyDirection }

export interface DeckStudyPrefs {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  newCardsPerDay: number
  maxCardsPerDay: number
  cardStyle: CardStyle
}

export type EditableDeckPref = 'direction' | 'shuffle' | 'textToSpeech'

export interface LearnerStudyPrefs {
  wordSpaces: boolean
  typeInitialsOnly: boolean
  shakeToUndo: boolean
  swipePreferences: FlashcardSwipePreferences
}

export interface SessionSummary {
  graded: number
  learning: number
  known: number
}

export type { Grade, CardChanges }
