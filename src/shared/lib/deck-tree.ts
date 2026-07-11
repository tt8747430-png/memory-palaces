import { isDue, type SrsState } from './srs'

/**
 * Pure helpers for the deck tree: a self-referential forest where a deck's `parentId`
 * points at another deck (a subdeck) or is `null` (a top-level deck, optionally filed in a
 * folder via `folderId`). Studying and counting a deck spans its whole **subtree** — its own
 * cards plus every descendant's (ADR-0003). Settings inherit down the chain, override-first
 * (ADR-0002).
 *
 * Takes minimal structural shapes (not entity types) so `shared/lib` stays below the entity
 * layer; the real `Deck`/`Card` satisfy them structurally. `now` is injected for determinism.
 */
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

/** Direct subdecks of `parentId`, ordered. */
export function childDecks<T extends TreeDeck>(decks: readonly T[], parentId: string): T[] {
  return decks.filter((d) => d.parentId === parentId).sort(byOrder)
}

/** Top-level decks at the library root (no parent, no folder), ordered. */
export function rootDecks<T extends TreeDeck>(decks: readonly T[]): T[] {
  return decks.filter((d) => d.parentId === null && (d.folderId ?? null) === null).sort(byOrder)
}

/** Top-level decks filed in one folder, ordered. */
export function decksInFolder<T extends TreeDeck>(decks: readonly T[], folderId: string): T[] {
  return decks.filter((d) => d.parentId === null && d.folderId === folderId).sort(byOrder)
}

/** Ids of a deck and every descendant (the subtree), root first. Cycle-safe. */
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

/** A deck and every descendant deck (the subtree), root first. */
export function subtreeDecks<T extends TreeDeck>(decks: readonly T[], rootId: string): T[] {
  const byId = new Map(decks.map((d) => [d.id, d]))
  return subtreeDeckIds(decks, rootId)
    .map((id) => byId.get(id))
    .filter((d): d is T => d !== undefined)
}

/** The chain from the root ancestor down to `deckId` (breadcrumbs), inclusive. Cycle-safe. */
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

/** True when `candidateId` is `deckId` itself or lives inside `deckId`'s subtree. */
export function isDescendantOrSelf(
  decks: readonly TreeDeck[],
  deckId: string,
  candidateId: string,
): boolean {
  return subtreeDeckIds(decks, deckId).includes(candidateId)
}

/**
 * Whether `deckId` may be re-parented under `newParentId`. Disallows making a deck its own
 * ancestor (which would create a cycle). `null` (move to root) is always allowed.
 */
export function canReparent(
  decks: readonly TreeDeck[],
  deckId: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return true
  if (newParentId === deckId) return false
  return !isDescendantOrSelf(decks, deckId, newParentId)
}

/**
 * Resolve a deck's effective settings by merging overrides down the `parentId` chain, from the
 * root ancestor to the deck, over `base`. Only defined override fields win, so an unset field
 * inherits (ADR-0002). Generic over the settings shape so `shared/lib` needs no entity import.
 */
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

/** Cards attached anywhere in a deck's subtree (own cards + descendants'). */
export function cardsInSubtree<C extends TreeCard>(
  decks: readonly TreeDeck[],
  cards: readonly C[],
  rootId: string,
): C[] {
  const ids = new Set(subtreeDeckIds(decks, rootId))
  return cards.filter((c) => ids.has(c.deckId))
}

/** Count of cards due now within a deck's subtree. New (no SRS) cards count as due. */
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

/**
 * Due counts for every deck, each tallying its whole subtree — so a parent's badge includes
 * its descendants' (intended, not double counting; ADR-0003). One pass: each due card walks up
 * to the root, incrementing every ancestor. Cards under an archived deck (or archived ancestor)
 * are skipped — an archived branch owes nothing today.
 */
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
