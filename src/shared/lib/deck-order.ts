import { compareNatural } from './order'

/**
 * The orders the Library itself knows. `manual` is the order a drag writes — it is not an
 * arrangement at all, it is the absence of one, which is why it hands the list back untouched.
 */
export const CORE_DECK_SORTS = ['manual', 'name', 'recent', 'due'] as const

export type CoreDeckSort = (typeof CORE_DECK_SORTS)[number]

/**
 * What the preference holds: a core order, or the id of one an extension contributed. The id is
 * kept whether or not that extension is on — the Library resolves it to an order at read time,
 * and falls back to manual while the extension is off (`resolveDeckOrder`).
 *
 * `string & {}` keeps the set open without losing the four names the compiler can complete.
 */
export type DeckSort = CoreDeckSort | (string & {})

export const DEFAULT_DECK_SORT: DeckSort = 'manual'

export const isCoreDeckSort = (sort: string): sort is CoreDeckSort =>
  (CORE_DECK_SORTS as readonly string[]).includes(sort)

/** The orders a folder can follow — see `folderOrderOf`. */
export const FOLDER_SORTS: ReadonlySet<DeckSort> = new Set<DeckSort>(['name', 'recent'])

/** An order the Library can apply: one of its own by name, or one an extension contributed. */
export type ResolvedOrder = CoreDeckSort | DeckOrder

/**
 * The one place that tells the two apart. A core order is a name; a contributed one is an object
 * with a `rank`. Every other question about an order — its id, whether folders follow it, whether
 * a drag may write it — is asked of this, so no caller spells the discrimination itself.
 */
export const isCoreOrder = (order: ResolvedOrder): order is CoreDeckSort =>
  typeof order === 'string'

/** The id an order is stored and offered under. */
export const orderId = (order: ResolvedOrder): DeckSort => (isCoreOrder(order) ? order : order.id)

/**
 * The order the folders on a level follow, if any. A folder is a shelf: it has a name and a
 * birthday but no due date of its own, so under `due` — or any contributed order — it keeps the
 * order it was dragged into.
 */
export const folderOrderOf = (order: ResolvedOrder): CoreDeckSort | null =>
  isCoreOrder(order) && FOLDER_SORTS.has(order) ? order : null

export interface SortableDeck {
  id: string
  name: string
  createdAt: string
}

/** A run of rows the Library prints a heading over, when the order defines one. */
export interface DeckGroup {
  id: string
  /** A key the host resolves — an extension's own namespace, never copy. */
  labelKey: string
}

/**
 * An order an extension contributes. `rank` places a deck it recognises; a deck it does not
 * comes after every ranked one, by name. `group` names the shelf a deck sits on, and every deck
 * gets one — the ones the order does not know share a last group of their own.
 */
export interface DeckOrder {
  id: string
  rank: (deck: SortableDeck) => number | null
  group?: (deck: SortableDeck) => DeckGroup
}

/**
 * A way of narrowing the Library an extension contributes: which decks to keep, by what the
 * extension can read off a deck.
 */
export interface DeckFilter {
  id: string
  keep: (deck: SortableDeck) => boolean
}

/**
 * The read-side twin of the schema step that added the setting: a document pulled from a device
 * that has never heard of it arrives without the field, and replication does not migrate.
 */
export function resolveDeckSort(stored?: unknown): DeckSort {
  return typeof stored === 'string' && stored ? stored : DEFAULT_DECK_SORT
}

/**
 * The stored id as an order the Library can apply right now: a core order by name, a contributed
 * one from the extensions that are on. An id nobody is offering — its extension switched off, or
 * a newer build's — is manual until it is offered again.
 */
export function resolveDeckOrder(sort: DeckSort, contributed: readonly DeckOrder[]): ResolvedOrder {
  if (isCoreDeckSort(sort)) return sort
  return contributed.find((order) => order.id === sort) ?? 'manual'
}

/**
 * The ids of the contributions that apply to at least one of these decks. A contribution that
 * touches nothing on the list cannot change it, so the Library does not offer it — which is how the
 * Bible's orders and book filters leave the menus on a device with no Bible decks, without the
 * extension saying a word about availability.
 */
function idsThatApply<T extends SortableDeck, C extends { id: string }>(
  decks: readonly T[],
  contributed: readonly C[],
  applies: (contribution: C, deck: T) => boolean,
): ReadonlySet<string> {
  const ids = new Set<string>()
  for (const each of contributed) {
    if (decks.some((deck) => applies(each, deck))) ids.add(each.id)
  }
  return ids
}

/** The contributed orders that place at least one of these decks. `rank` is the whole test. */
export const ordersThatPlace = <T extends SortableDeck>(
  decks: readonly T[],
  contributed: readonly DeckOrder[],
): ReadonlySet<string> =>
  idsThatApply(decks, contributed, (order, deck) => order.rank(deck) !== null)

/** The contributed filters that keep at least one of these decks. `keep` is the whole test. */
export const filtersThatKeep = <T extends SortableDeck>(
  decks: readonly T[],
  contributed: readonly DeckFilter[],
): ReadonlySet<string> => idsThatApply(decks, contributed, (filter, deck) => filter.keep(deck))

export interface SubdeckOrderPreferences {
  deckSort: DeckSort
  /** The Library order reaches every level, not only the top. */
  deckSortSubdecks: boolean
  /** Orders chosen for one deck's subdecks in particular, by that deck's id. */
  subdeckSorts: Readonly<Record<string, DeckSort>>
}

/**
 * Which order the children of `parentId` follow: the one chosen for that deck's subdecks, else
 * the Library order when it reaches down, else the order they were dragged into. The top level
 * (`null`) is always the Library order.
 */
export function orderForChildren(
  parentId: string | null,
  prefs: SubdeckOrderPreferences,
): DeckSort {
  if (parentId === null) return prefs.deckSort
  return prefs.subdeckSorts[parentId] ?? (prefs.deckSortSubdecks ? prefs.deckSort : 'manual')
}

/**
 * `due` counts what is waiting, which only the caller can work out — it needs the cards. Ties fall
 * back to the name so that a shelf of decks with nothing due is still in a readable order rather
 * than whatever order the store happened to hand over.
 */
export function sortDecks<T extends SortableDeck>(
  decks: readonly T[],
  order: ResolvedOrder,
  dueCount: (deck: T) => number = () => 0,
): T[] {
  if (!isCoreOrder(order)) return sortRanked(decks, order)
  switch (order) {
    case 'name':
      return decks.toSorted((a, b) => compareNatural(a.name, b.name))
    case 'recent':
      return decks.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return decks.toSorted((a, b) => dueCount(b) - dueCount(a) || compareNatural(a.name, b.name))
    case 'manual':
      return [...decks]
  }
}

function sortRanked<T extends SortableDeck>(decks: readonly T[], order: DeckOrder): T[] {
  const ranks = new Map(decks.map((deck) => [deck.id, order.rank(deck)]))
  return decks.toSorted((a, b) => {
    const ra = ranks.get(a.id) ?? null
    const rb = ranks.get(b.id) ?? null
    if (ra !== null && rb !== null) return ra - rb || compareNatural(a.name, b.name)
    if (ra !== null) return -1
    if (rb !== null) return 1
    return compareNatural(a.name, b.name)
  })
}

/**
 * The headings to print over an already-sorted list: the first row of each run of one group, by
 * id. Nothing at all under a core order, or when every row shares one group — a single heading
 * would only say what the list already says.
 */
export function headingsFor<T extends SortableDeck>(
  decks: readonly T[],
  order: ResolvedOrder,
): ReadonlyMap<string, DeckGroup> {
  const headings = new Map<string, DeckGroup>()
  if (isCoreOrder(order) || !order.group) return headings
  const groups = new Set<string>()
  let last: string | null = null
  for (const deck of decks) {
    const group = order.group(deck)
    groups.add(group.id)
    if (group.id !== last) headings.set(deck.id, group)
    last = group.id
  }
  return groups.size > 1 ? headings : new Map()
}
