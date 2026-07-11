import type { Card, CardChanges } from '@/entities/card'
import type { Grade } from '@/shared/lib'
import type { StudyDirection } from '@/entities/deck'

/** A card to study, carried with the context needed to grade and label it. A deck-subtree
 * session passes the deck's own cards plus every descendant's; each card remembers which deck
 * it came from for labelling. */
export interface StudyCard {
  card: Card
  deckName: string
  /** Breadcrumb-style path to the card's deck, e.g. "Biblia › Efeseni". */
  deckPath: string
}

export type { StudyDirection }

/** Per-deck flashcard preferences the study surface reads and writes back. */
export interface StudyPrefs {
  /** Which face leads: `front` recalls the prompt, `back` flips the card over. */
  direction: StudyDirection
  /** Start each session in a random order. */
  shuffle: boolean
  textToSpeech: boolean
}

export interface SessionSummary {
  graded: number
  learning: number
  known: number
}

export type { Grade, CardChanges }
