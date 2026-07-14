import type { Card, CardChanges } from '@/entities/card'
import type { Grade } from '@/shared/lib'
import type { StudyDirection } from '@/entities/deck'

export interface StudyCard {
  card: Card
  deckName: string
  deckPath: string
}

export type { StudyDirection }

export interface StudyPrefs {
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
}

export interface SessionSummary {
  graded: number
  learning: number
  known: number
}

export type { Grade, CardChanges }
