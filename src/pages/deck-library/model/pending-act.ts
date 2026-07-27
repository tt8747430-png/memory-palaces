import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'

/**
 * An act the library has asked for but not yet carried out, because it first needs the learner
 * to confirm it or pick a destination.
 *
 * One value rather than five independent flags: only one of these can be true at a time — a
 * delete dialog and a move sheet open together is not a state the library has — and modelling
 * them as separate `useState`s made that possible to reach by accident.
 */
export type PendingAct =
  | { kind: 'move-deck'; deck: Deck }
  | { kind: 'move-selection' }
  | { kind: 'delete-deck'; deck: Deck }
  | { kind: 'delete-folder'; folder: Folder }
  | { kind: 'delete-selection' }

export const isMove = (act: PendingAct | null): boolean =>
  act?.kind === 'move-deck' || act?.kind === 'move-selection'

/** The deck a single-deck move is about, if that is what is pending. */
export const movingDeck = (act: PendingAct | null): Deck | undefined =>
  act?.kind === 'move-deck' ? act.deck : undefined
