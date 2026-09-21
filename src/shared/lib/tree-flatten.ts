import { siblingDecks, type TreeDeck } from './deck-tree'

export interface FlatDeck {
  id: string
  depth: number
  parentId: string | null
  folderId: string | null
  hasChildren: boolean
  expanded: boolean
}

/**
 * Rearranges one row of peers before they are laid out. It is handed the depth so a caller can
 * order the level being looked at without disturbing the rows nested beneath it.
 */
export type ArrangeRow<T extends TreeDeck> = (peers: T[], depth: number) => T[]

export function flattenDecks<T extends TreeDeck>(
  decks: readonly T[],
  expanded: ReadonlySet<string>,
  folderId: string | null,
  arrange?: ArrangeRow<T>,
): FlatDeck[] {
  const out: FlatDeck[] = []
  const walk = (parentId: string | null, depth: number, scopeFolderId: string | null) => {
    const peers = siblingDecks(decks, parentId, scopeFolderId)
    for (const deck of arrange ? arrange(peers, depth) : peers) {
      const children = siblingDecks(decks, deck.id)
      const isExpanded = expanded.has(deck.id)
      out.push({
        id: deck.id,
        depth,
        parentId: deck.parentId,
        folderId: deck.folderId ?? null,
        hasChildren: children.length > 0,
        expanded: isExpanded,
      })
      if (children.length > 0 && isExpanded) walk(deck.id, depth + 1, null)
    }
  }
  walk(null, 0, folderId)
  return out
}
