import type { FastOutcome } from '@/entities/card'
import type { Grade, SrsState } from '@/shared/lib'

/**
 * What the progress drawer asks for. A spaced deck has a schedule to set; a
 * fast deck has only its last outcome, so the same action means both.
 */
export type CardProgressChange =
  | { kind: 'schedule'; srs: SrsState | undefined; grade?: Grade }
  | { kind: 'fastReview'; outcome: FastOutcome }
