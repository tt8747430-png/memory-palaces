import type { Locus, LocusChanges } from '@/entities/locus'
import type { Grade } from '@/shared/lib'
import type { CardOrder } from '@/features/review'

/** A card to study, carried with the context needed to grade and label it.
 * Room training passes a single room's loci; daily review passes the cross-library
 * due queue, so each card remembers which palace/room it came from. */
export interface StudyCard {
  locus: Locus
  palaceName: string
  roomTitle: string
}

/** Which face leads: `front` recalls the prompt, `back` flips the card over. */
export type StudyDirection = 'front' | 'back'

export interface StudyPrefs {
  mode: 'review' | 'browse'
  direction: StudyDirection
  order: CardOrder
  shuffle: boolean
  textToSpeech: boolean
  /** Replace the four SM-2 grades with a two-way learning/known sort. */
  sortIntoPiles: boolean
}

/** Optional capabilities the host enables. Daily review keeps most off (it's a
 * fixed due queue with no editing). */
export interface StudyFeatures {
  browse: boolean
  scope: boolean
  edit: boolean
  swipe: boolean
}

export interface SessionSummary {
  graded: number
  learning: number
  known: number
}

export type { Grade, LocusChanges }
