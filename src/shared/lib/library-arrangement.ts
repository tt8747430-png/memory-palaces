import {
  type DeckFilter,
  type DeckFilterId,
  type DeckGroup,
  type DeckOrder,
  folderOrderOf,
  headingsFor,
  orderForChildren,
  resolveDeckOrder,
  type ResolvedOrder,
  sortDecks,
  type SortableDeck,
  type SubdeckOrderPreferences,
} from './deck-order'
import { compareTreeOrder, reachableDecks, type TreeDeck } from './deck-tree'

/**
 * The Library's arrangement — which order each level follows, what the filter keeps, which shelf
 * heading sits over which row — decided once, here, for every list of decks in the app. The
 * Library, the move sheet and the deck switcher all read it; none of them sorts on its own, so a
 * learner who shelved their decks by book reads them in that order wherever a deck is listed.
 */

export interface ArrangeableDeck extends TreeDeck, SortableDeck {
  favorite?: boolean
}

export interface ArrangeableFolder extends SortableDeck {
  order: number
}

/** The order settings, and the filter beside them — both settings the Library reads. */
export interface LibraryOrderPreferences extends SubdeckOrderPreferences {
  filter: DeckFilterId
}

export interface ArrangeLibraryInput<D extends ArrangeableDeck, F extends ArrangeableFolder> {
  decks: readonly D[]
  folders: readonly F[]
  prefs: LibraryOrderPreferences
  /** The orders extensions contribute, as they stand right now. */
  orders: readonly DeckOrder[]
  /** The filters extensions contribute, as they stand right now. */
  filters: readonly DeckFilter[]
  /** What a deck has waiting. Asked only where an order or the filter needs it. */
  dueOf: (deck: D) => number
}

/** A list the learner reads: a folder's top level (`null` is the Library's own), or one deck's subdecks. */
export type ShelfPlace = { folderId: string | null } | { deckId: string }

export interface Shelf<D> {
  /** The rows, in order, narrowed by the filter. */
  decks: D[]
  /** The same rows before the filter narrowed them. */
  levelDecks: D[]
  /** How many rows the filter is keeping off this list. */
  hidden: number
  /** The heading to print over a row, by the row's id, when the order shelves the rows. */
  headings: ReadonlyMap<string, DeckGroup>
}

export interface FlatDeck {
  id: string
  depth: number
  parentId: string | null
  folderId: string | null
  hasChildren: boolean
  expanded: boolean
}

export interface LibraryArrangement<D extends ArrangeableDeck, F extends ArrangeableFolder> {
  /** Every deck, each standing where the Library can reach it (`reachableDecks`). */
  decks: D[]
  /** The folders, in the order the Library shelves them. */
  folders: F[]
  /** The order the children of `parentId` follow — `null` is the top of every folder. */
  orderAt: (parentId: string | null) => ResolvedOrder
  shelf: (place: ShelfPlace) => Shelf<D>
  /** One deck's subdecks in their own order. A filter narrows a list, never a deck's contents. */
  subdecks: (deckId: string) => D[]
  /** A shelf with every expanded deck opened beneath it, as the tree draws it. */
  flatten: (place: ShelfPlace, expanded: ReadonlySet<string>) => FlatDeck[]
}

/**
 * The rows a filter keeps: the Library's own three by what it knows about a deck, a contributed
 * one by what the extension knows. A filter nobody is offering — its extension switched off since
 * it was picked — hides nothing.
 */
export function filterDecks<T extends ArrangeableDeck>(
  decks: readonly T[],
  filter: DeckFilterId,
  dueOf: (deck: T) => number,
  contributed: readonly DeckFilter[],
): T[] {
  const keep = keepFor(filter, dueOf, contributed)
  return keep ? decks.filter(keep) : [...decks]
}

function keepFor<T extends ArrangeableDeck>(
  filter: DeckFilterId,
  dueOf: (deck: T) => number,
  contributed: readonly DeckFilter[],
): ((deck: T) => boolean) | null {
  switch (filter) {
    case 'all':
      return null
    case 'favorites':
      return (deck) => Boolean(deck.favorite)
    case 'due':
      return (deck) => dueOf(deck) > 0
    default: {
      const offered = contributed.find((each) => each.id === filter)
      return offered ? offered.keep : null
    }
  }
}

/**
 * Whether anything in these settings reads what a deck has waiting. Counting it walks every card,
 * so a Library arranged by name never pays for it. A per-deck `due` order counts too: a level
 * arranged by it with no counts would not fail — it would silently sort by name.
 */
export function needsDueCounts(prefs: LibraryOrderPreferences): boolean {
  return (
    prefs.filter === 'due' ||
    prefs.deckSort === 'due' ||
    Object.values(prefs.subdeckSorts).includes('due')
  )
}

const levelOf = (place: ShelfPlace): string =>
  'deckId' in place ? `deck:${place.deckId}` : `folder:${place.folderId ?? ''}`

export function arrangeLibrary<D extends ArrangeableDeck, F extends ArrangeableFolder>({
  decks: stored,
  folders: storedFolders,
  prefs,
  orders,
  filters,
  dueOf,
}: ArrangeLibraryInput<D, F>): LibraryArrangement<D, F> {
  const folderIds = new Set(storedFolders.map((folder) => folder.id))
  const decks = reachableDecks(stored, folderIds)

  const orderAt = (parentId: string | null) =>
    resolveDeckOrder(orderForChildren(parentId, prefs), orders)

  // A folder follows the Library order only when it is one a shelf can follow; otherwise it keeps
  // the order it was dragged into.
  const folderOrder = folderOrderOf(orderAt(null))
  const dragged = storedFolders.toSorted((a, b) => a.order - b.order)
  const folders = folderOrder ? sortDecks(dragged, folderOrder) : dragged

  // Every level's peers, in the order they were dragged into, collected in one pass.
  const peers = new Map<string, D[]>()
  for (const deck of decks) {
    if (deck.archived) continue
    const level = levelOf(
      deck.parentId === null ? { folderId: deck.folderId ?? null } : { deckId: deck.parentId },
    )
    const bucket = peers.get(level)
    if (bucket) bucket.push(deck)
    else peers.set(level, [deck])
  }

  const arranged = new Map<string, D[]>()
  const arrangedAt = (place: ShelfPlace): D[] => {
    const level = levelOf(place)
    const known = arranged.get(level)
    if (known) return known
    const dragOrder = (peers.get(level) ?? []).toSorted(compareTreeOrder)
    const rows = sortDecks(dragOrder, orderAt('deckId' in place ? place.deckId : null), dueOf)
    arranged.set(level, rows)
    return rows
  }

  const shelves = new Map<string, Shelf<D>>()
  const shelf = (place: ShelfPlace): Shelf<D> => {
    const level = levelOf(place)
    const known = shelves.get(level)
    if (known) return known
    const levelDecks = arrangedAt(place)
    const kept = filterDecks(levelDecks, prefs.filter, dueOf, filters)
    const made: Shelf<D> = {
      decks: kept,
      levelDecks,
      hidden: levelDecks.length - kept.length,
      headings: headingsFor(kept, orderAt('deckId' in place ? place.deckId : null)),
    }
    shelves.set(level, made)
    return made
  }

  const subdecks = (deckId: string) => arrangedAt({ deckId })

  const flatten = (place: ShelfPlace, expanded: ReadonlySet<string>): FlatDeck[] => {
    const rows: FlatDeck[] = []
    const walk = (level: readonly D[], depth: number) => {
      for (const deck of level) {
        const children = subdecks(deck.id)
        const open = expanded.has(deck.id)
        rows.push({
          id: deck.id,
          depth,
          parentId: deck.parentId,
          folderId: deck.folderId ?? null,
          hasChildren: children.length > 0,
          expanded: open,
        })
        if (open && children.length > 0) walk(children, depth + 1)
      }
    }
    walk(shelf(place).decks, 0)
    return rows
  }

  return { decks, folders, orderAt, shelf, subdecks, flatten }
}
