import { nextOrder, orderSiblings } from '@/shared/lib'
import { followedMainSettings } from './settings'
import { type Deck, type DeckChanges, type DeckSettings, withoutMainDeckSettings } from './types'

export interface DeckPlace {
  parentId: string | null
  folderId: string | null
}

export const LIBRARY_TOP: DeckPlace = { parentId: null, folderId: null }

export interface DeckMove {
  id: string
  to: DeckPlace
}

export const isSubdeck = (deck: Pick<Deck, 'parentId'>): boolean => deck.parentId !== null

export const placeOf = (deck: Pick<Deck, 'parentId' | 'folderId'>): DeckPlace => ({
  parentId: deck.parentId,
  folderId: deck.folderId ?? null,
})

export const standsAt = (deck: Pick<Deck, 'parentId' | 'folderId'>, place: DeckPlace): boolean => {
  const here = placeOf(deck)
  return (
    here.parentId === place.parentId &&
    (place.parentId !== null || here.folderId === place.folderId)
  )
}

export const isAtLibraryTop = (deck: Pick<Deck, 'parentId' | 'folderId'>): boolean =>
  standsAt(deck, LIBRARY_TOP)

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

function settingsArriving(decks: readonly Deck[], deck: Deck, to: DeckPlace) {
  if (to.parentId !== null || !isSubdeck(deck)) return deck.settings
  const carried: Partial<DeckSettings> = {
    ...withoutMainDeckSettings(deck.settings),
    ...followedMainSettings(decks, deck.id),
  }
  return carried
}

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
