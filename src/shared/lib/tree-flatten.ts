import { siblingDecks, type TreeDeck } from './deck-tree'

export interface FlatDeck {
  id: string
  depth: number
  parentId: string | null
  folderId: string | null
  hasChildren: boolean
  expanded: boolean
}

export function flattenDecks(
  decks: readonly TreeDeck[],
  expanded: ReadonlySet<string>,
  folderId: string | null,
): FlatDeck[] {
  const out: FlatDeck[] = []
  const walk = (parentId: string | null, depth: number, scopeFolderId: string | null) => {
    for (const deck of siblingDecks(decks, parentId, scopeFolderId)) {
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
