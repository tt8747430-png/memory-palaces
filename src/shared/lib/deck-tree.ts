import { isDue, type SrsState } from './srs'

export interface TreeDeck {
  id: string
  parentId: string | null
  folderId?: string | null
  order?: number
  archived?: boolean
}

export interface TreeCard {
  deckId: string
  srs?: SrsState
}

const byOrder = (a: TreeDeck, b: TreeDeck): number =>
  (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id)

export function childDecks<T extends TreeDeck>(decks: readonly T[], parentId: string): T[] {
  return decks.filter((d) => d.parentId === parentId).sort(byOrder)
}

/**
 * One sibling group of the tree, in manual order: the children of `parentId`,
 * or — when `parentId` is null — the top-level decks of `folderId` (null being
 * the unfiled root). This is the unit a drag reorders, so the tree, the drop
 * handler and the persisted order all read the group through here. Archived
 * decks live in the Archive, never in the tree.
 */
export function siblingDecks<T extends TreeDeck>(
  decks: readonly T[],
  parentId: string | null,
  folderId: string | null = null,
): T[] {
  return decks
    .filter(
      (d) =>
        !d.archived &&
        d.parentId === parentId &&
        (parentId !== null || (d.folderId ?? null) === folderId),
    )
    .sort(byOrder)
}

export function rootDecks<T extends TreeDeck>(decks: readonly T[]): T[] {
  return decks.filter((d) => d.parentId === null && (d.folderId ?? null) === null).sort(byOrder)
}

export function decksInFolder<T extends TreeDeck>(decks: readonly T[], folderId: string): T[] {
  return decks.filter((d) => d.parentId === null && d.folderId === folderId).sort(byOrder)
}

export function subtreeDeckIds(decks: readonly TreeDeck[], rootId: string): string[] {
  const childrenByParent = new Map<string, TreeDeck[]>()
  for (const d of decks) {
    if (d.parentId === null) continue
    const bucket = childrenByParent.get(d.parentId)
    if (bucket) bucket.push(d)
    else childrenByParent.set(d.parentId, [d])
  }
  const ids: string[] = []
  const seen = new Set<string>()
  const walk = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    ids.push(id)
    for (const child of (childrenByParent.get(id) ?? []).slice().sort(byOrder)) walk(child.id)
  }
  walk(rootId)
  return ids
}

export function subtreeDecks<T extends TreeDeck>(decks: readonly T[], rootId: string): T[] {
  const byId = new Map(decks.map((d) => [d.id, d]))
  return subtreeDeckIds(decks, rootId)
    .map((id) => byId.get(id))
    .filter((d): d is T => d !== undefined)
}

/**
 * The top-most selected decks — those with no selected ancestor — in pre-order (root-first,
 * matching the tree top-to-bottom). These are the decks a multi-select drag actually moves:
 * their descendants ride along, so also moving a selected child would tear it out of the parent
 * that is already on its way. Archived decks are ignored.
 */
export function selectionRoots(
  decks: readonly TreeDeck[],
  selectedIds: ReadonlySet<string>,
): string[] {
  const active = decks.filter((d) => !d.archived)
  const byId = new Map(active.map((d) => [d.id, d]))
  const hasSelectedAncestor = (deck: TreeDeck): boolean => {
    const seen = new Set<string>()
    let cur = deck.parentId ? byId.get(deck.parentId) : undefined
    while (cur && !seen.has(cur.id)) {
      if (selectedIds.has(cur.id)) return true
      seen.add(cur.id)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    return false
  }
  const rootIds = new Set(
    active.filter((d) => selectedIds.has(d.id) && !hasSelectedAncestor(d)).map((d) => d.id),
  )

  // Pre-order across every top-level group (unfiled root + each folder) gives a stable
  // top-to-bottom order for the roots we keep.
  const ordered: string[] = []
  const folderIds = new Set<string | null>([null])
  for (const d of active) if (d.parentId === null && d.folderId != null) folderIds.add(d.folderId)
  const walk = (parentId: string | null, folderId: string | null) => {
    for (const d of siblingDecks(active, parentId, folderId)) {
      if (rootIds.has(d.id)) ordered.push(d.id)
      walk(d.id, null)
    }
  }
  for (const fid of folderIds) walk(null, fid)
  return ordered
}

/**
 * Tri-state of a select checkbox: none, all, or a partial mix. The library's select mode is flat
 * — a deck's subdecks travel with it and are never shown — so its rows are only ever fully on or
 * off; the middle state is for lists that select a subset of something.
 */
export type SelectState = 'unchecked' | 'checked' | 'indeterminate'

export function deckPath<T extends TreeDeck>(decks: readonly T[], deckId: string): T[] {
  const byId = new Map(decks.map((d) => [d.id, d]))
  const chain: T[] = []
  const seen = new Set<string>()
  let cur = byId.get(deckId)
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    chain.unshift(cur)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return chain
}

export function isDescendantOrSelf(
  decks: readonly TreeDeck[],
  deckId: string,
  candidateId: string,
): boolean {
  return subtreeDeckIds(decks, deckId).includes(candidateId)
}

export function canReparent(
  decks: readonly TreeDeck[],
  deckId: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return true
  if (newParentId === deckId) return false
  return !isDescendantOrSelf(decks, deckId, newParentId)
}

export function resolveDeckSettings<S extends object>(
  decks: readonly { id: string; parentId: string | null; settings: Partial<S> }[],
  deckId: string,
  base: S,
): S {
  const byId = new Map(decks.map((d) => [d.id, d]))
  const chain: Partial<S>[] = []
  const seen = new Set<string>()
  let cur = byId.get(deckId)
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    chain.unshift(cur.settings)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  const resolved: S = { ...base }
  for (const overrides of chain) {
    for (const key of Object.keys(overrides) as (keyof S)[]) {
      const value = overrides[key]
      if (value !== undefined) resolved[key] = value as S[keyof S]
    }
  }
  return resolved
}

export function cardsInSubtree<C extends TreeCard>(
  decks: readonly TreeDeck[],
  cards: readonly C[],
  rootId: string,
): C[] {
  const ids = new Set(subtreeDeckIds(decks, rootId))
  return cards.filter((c) => ids.has(c.deckId))
}

export function countDueInSubtree(
  decks: readonly TreeDeck[],
  cards: readonly TreeCard[],
  rootId: string,
  now: number,
): number {
  return cardsInSubtree(decks, cards, rootId).reduce(
    (n, card) => (isDue(card.srs, now) ? n + 1 : n),
    0,
  )
}

export function dueCountsPerDeck(
  decks: readonly TreeDeck[],
  cards: readonly TreeCard[],
  now: number,
): Map<string, number> {
  const byId = new Map(decks.map((d) => [d.id, d]))
  const counts = new Map<string, number>()
  for (const card of cards) {
    if (!isDue(card.srs, now)) continue
    const chain: string[] = []
    const seen = new Set<string>()
    let cur = byId.get(card.deckId)
    let archived = false
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      if (cur.archived) {
        archived = true
        break
      }
      chain.push(cur.id)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    if (archived) continue
    for (const id of chain) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}
