import type { Locus, LocusChanges } from '@/entities/locus'
import type { Grade } from '@/shared/lib'
import type { StudyDirection } from '@/entities/palace'

/** A card to study, carried with the context needed to grade and label it.
 * Room training passes a single room's loci; daily review passes the cross-library
 * due queue, so each card remembers which palace/room it came from. */
export interface StudyCard {
  locus: Locus
  palaceName: string
  roomTitle: string
}

export type { StudyDirection }

/** Per-palace flashcard preferences the study surface reads and writes back. */
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

export type { Grade, LocusChanges }
