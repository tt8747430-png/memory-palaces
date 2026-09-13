import { nextOrder, orderSiblings } from '@/shared/lib'
import { followedMainSettings } from './settings'
import { type Deck, type DeckChanges, type DeckSettings, withoutMainDeckSettings } from './types'

/** Where a deck stands in the library: under a parent deck, or at the top — in a folder or not. */
export interface DeckPlace {
  parentId: string | null
  folderId: string | null
}

export const LIBRARY_TOP: DeckPlace = { parentId: null, folderId: null }

/** One deck of a batch, and the place it is going to. */
export interface DeckMove {
  id: string
  to: DeckPlace
}

export const isSubdeck = (deck: Pick<Deck, 'parentId'>): boolean => deck.parentId !== null

/** Where a deck stands, as stored — a document written before `folderId` existed reads as unfiled. */
export const placeOf = (deck: Pick<Deck, 'parentId' | 'folderId'>): DeckPlace => ({
  parentId: deck.parentId,
  folderId: deck.folderId ?? null,
})

/** Whether a deck already stands at `place`. Under a parent deck, only the parent decides. */
export const standsAt = (deck: Pick<Deck, 'parentId' | 'folderId'>, place: DeckPlace): boolean => {
  const here = placeOf(deck)
  return (
    here.parentId === place.parentId &&
    (place.parentId !== null || here.folderId === place.folderId)
  )
}

export const isAtLibraryTop = (deck: Pick<Deck, 'parentId' | 'folderId'>): boolean =>
  standsAt(deck, LIBRARY_TOP)

/**
 * Archived decks still standing where they were archived from: filed in a folder, or under a
 * parent deck that did not go into the archive with them. The archive is a place (ADR 0003), so
 * every one of these is a deck written before it was, or replicated from a build that predates it.
 */
export function strandedArchivedIds(decks: readonly Deck[]): string[] {
  const archivedIds = new Set(decks.filter((d) => d.archived).map((d) => d.id))
  return decks
    .filter(
      (d) =>
        d.archived &&
        (placeOf(d).folderId !== null || (d.parentId !== null && !archivedIds.has(d.parentId))),
    )
    .map((d) => d.id)
}

/**
 * A deck arriving at the top keeps the main deck's settings it was following, in place of any it
 * held itself while a subdeck; one arriving under a parent sheds its own in `updateDeck`.
 */
function settingsArriving(decks: readonly Deck[], deck: Deck, to: DeckPlace) {
  if (to.parentId !== null || !isSubdeck(deck)) return deck.settings
  const carried: Partial<DeckSettings> = {
    ...withoutMainDeckSettings(deck.settings),
    ...followedMainSettings(decks, deck.id),
  }
  return carried
}

/**
 * The changes that stand every deck of a batch at its place, read against one snapshot. Decks
 * landing in the same row take consecutive orders after what is already there — computed one
 * write at a time, each would read the order the last write had not yet published and they would
 * all land on it. Ids not in `decks` are skipped.
 */
export function placeDecks(
  decks: readonly Deck[],
  moves: readonly DeckMove[],
): Map<string, DeckChanges> {
  const byId = new Map(decks.map((d) => [d.id, d]))
  const moving = new Set(moves.map((m) => m.id))
  const nextInRow = new Map<string, number>()
  const placed = new Map<string, DeckChanges>()
  for (const { id, to } of moves) {
    const deck = byId.get(id)
    if (!deck) continue
    const folderId = to.parentId === null ? to.folderId : null
    const row = JSON.stringify([to.parentId, folderId])
    const order =
      nextInRow.get(row) ?? nextOrder(orderSiblings(decks, to.parentId, folderId, moving))
    nextInRow.set(row, order + 1)
    placed.set(id, {
      parentId: to.parentId,
      folderId,
      order,
      settings: settingsArriving(decks, deck, to),
    })
  }
  return placed
}
