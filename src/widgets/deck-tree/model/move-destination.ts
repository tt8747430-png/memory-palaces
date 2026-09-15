import { type DeckPlace, LIBRARY_TOP } from '@/entities/deck'

export type MoveDestination =
  | { kind: 'home' }
  | { kind: 'archive' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'deck'; deckId: string }

export function placeOfDestination(dest: MoveDestination): DeckPlace | null {
  switch (dest.kind) {
    case 'home':
      return LIBRARY_TOP
    case 'folder':
      return { parentId: null, folderId: dest.folderId }
    case 'deck':
      return { parentId: dest.deckId, folderId: null }
    case 'archive':
      return null
  }
}
