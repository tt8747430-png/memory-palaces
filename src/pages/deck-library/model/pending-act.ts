import type { Deck } from '@/entities/deck'
import type { Folder } from '@/entities/folder'

export type PendingAct =
  | { kind: 'move-deck'; deck: Deck }
  | { kind: 'move-selection' }
  | { kind: 'delete-deck'; deck: Deck }
  | { kind: 'delete-folder'; folder: Folder }
  | { kind: 'delete-selection' }

export const isMove = (act: PendingAct | null): boolean =>
  act?.kind === 'move-deck' || act?.kind === 'move-selection'

export const movingDeck = (act: PendingAct | null): Deck | undefined =>
  act?.kind === 'move-deck' ? act.deck : undefined
