import { siblingDecks, type TreeDeck } from './deck-tree'

/** One row of the deck forest, flattened for a single live-reorder sortable list. */
export interface FlatDeck {
  id: string
  depth: number
  parentId: string | null
  folderId: string | null
  hasChildren: boolean
  expanded: boolean
}

/**
 * Flattens the visible deck forest of one scope — a folder, or the unfiled root — into a single
 * ordered list, descending into a deck's children only when it is expanded. This is the list the
 * tree renders and drags over: one sortable context, so a drag reorders live across the whole
 * forest instead of only within a sibling group.
 */
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
