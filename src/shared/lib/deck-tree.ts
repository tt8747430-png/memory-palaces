import type { FastOutcome } from './fast-outcome'
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
  fastReview?: FastOutcome
}

/** What a deck counts as waiting depends on how it is studied; the caller resolves the settings. */
export type DeckAlgorithm = 'fast' | 'spaced'

const byOrder = (a: TreeDeck, b: TreeDeck): number =>
  (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id)

export function childDecks<T extends TreeDeck>(decks: readonly T[], parentId: string): T[] {
  return decks.filter((d) => d.parentId === parentId).sort(byOrder)
}

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

export function orderSiblings<T extends TreeDeck>(
  decks: readonly T[],
  parentId: string | null,
  folderId: string | null = null,
  exceptIds: ReadonlySet<string> = new Set(),
): T[] {
  return decks.filter(
    (d) =>
      !exceptIds.has(d.id) &&
      d.parentId === parentId &&
      (parentId !== null || (d.folderId ?? null) === folderId),
  )
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

export function idsWithoutDescendants(
  decks: readonly TreeDeck[],
  ids: readonly string[],
): string[] {
  const batch = new Set(ids)
  return ids.filter(
    (id) =>
      !deckPath(decks, id)
        .slice(0, -1)
        .some((ancestor) => batch.has(ancestor.id)),
  )
}

export function inheritSettings<S extends object>(
  decks: readonly { id: string; parentId: string | null; settings: Partial<S> }[],
  deckId: string,
  base: S,
  mainOnly: readonly (keyof S)[] = [],
): S {
  const resolved: S = { ...base }
  const pinned = new Set(mainOnly)
  deckPath(decks, deckId).forEach(({ settings }, depth) => {
    for (const key of Object.keys(settings) as (keyof S)[]) {
      const value = settings[key]
      if (value === undefined || (depth > 0 && pinned.has(key))) continue
      resolved[key] = value as S[keyof S]
    }
  })
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

/**
 * What each deck has waiting, rolled up to its ancestors. A fast deck counts the cards it has not
 * got right yet and a spaced one counts what is due, because that is what each deck's own page
 * says — a badge that counted due dates under fast review contradicted the page it opens.
 */
export function dueCountsPerDeck(
  decks: readonly TreeDeck[],
  cards: readonly TreeCard[],
  now: number,
  algorithmOf: (deckId: string) => DeckAlgorithm,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const card of cards) {
    const waiting =
      algorithmOf(card.deckId) === 'fast' ? card.fastReview !== 'gotIt' : isDue(card.srs, now)
    if (!waiting) continue
    const chain = deckPath(decks, card.deckId)
    if (chain.some((deck) => deck.archived)) continue
    for (const deck of chain) counts.set(deck.id, (counts.get(deck.id) ?? 0) + 1)
  }
  return counts
}
